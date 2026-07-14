/**
 * @file useAuth.ts
 * @description Custom hook for managing authentication state, session restoring, Cognito configuration, and saved itineraries.
 * @lastModified 2026-06-23
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  authStorageKey,
  clearStoredSocialAuthProvider,
  readStoredSocialAuthProvider,
  readStoredUser,
  storeSocialAuthProvider,
} from './authModel'
import {
  adaptApiAuthSessionSnapshot,
  createMockAuthSessionSnapshot,
  getAuthSessionRefreshDelayMs,
  getAuthTokenExpiresAtMs,
  getDefaultAuthRuntimeMode,
  isAuthSessionRefreshDue,
  type AuthSessionSnapshot,
} from './authFlow'
import { getAuthExceptionNotice, type AuthExceptionNotice } from './authException'
import {
  clearPendingOAuthLogins,
  createAuthLoginRequestFromCallback,
  createCognitoAuthorizationRequest,
  createCognitoLogoutUrl,
  createCognitoTokenRequestFromCallback,
  createOAuthAuthorizationRequest,
  getAuthCallbackProvider,
  isCognitoAuthCallbackPath,
} from './authRedirect'
import { requestCognitoToken } from './cognitoAuth'
import {
  clearStoredSavedPlanState,
  readStoredSavedPlanLikes,
  readStoredSavedPlans,
  writeStoredSavedPlanLikes,
  writeStoredSavedPlans,
  type SavedPlanLikeMap,
} from '../saved-plans/savedPlansStorage'
import {
  getDefaultPreferenceProfile,
  readStoredPreferenceProfile,
  storePreferenceProfile,
  validatePreferenceProfile,
} from '../onboarding/preferenceModel'
import { useUiToggleStore } from '../../shared/store/uiToggleStore'
import {
  AuthApiRequestError,
  requestAuthLogin,
  requestAuthLogout,
  requestAuthSession,
  requestCognitoBridgeSession,
  requestLinkProvider,
  requestListSocialAccounts,
  requestUpdateProfile,
  type ProfileUpdateRequest,
} from '../../shared/api/authApi'
import {
  requestGetSavedPlan,
  requestListSavedPlans,
} from '../../shared/api/savedPlansApi'
import { getPlanDetailRouteId } from '../../shared/components/viewRouting'
import { log } from '../../shared/logger'
import type {
  LovvUser,
  SocialAuthProvider,
  SavedPlan,
  PreferenceProfile,
  SavedPlanLike,
} from '../../shared/types/app'

type PreparedAuthRedirectUrls = Partial<Record<SocialAuthProvider, string>>
type AuthSessionRefreshResult = 'refreshed' | 'failed' | 'stale'

const providerLabels: Record<SocialAuthProvider, string> = {
  google: 'Google',
  kakao: 'Kakao',
}

const isSameSavedPlanIdentity = (left: SavedPlan, right: SavedPlan) =>
  left.id === right.id ||
  Boolean(left.sourceRecommendationId && left.sourceRecommendationId === right.sourceRecommendationId) ||
  Boolean(right.sourceRecommendationId && right.sourceRecommendationId === left.id) ||
  Boolean(left.sourceRecommendationId && left.sourceRecommendationId === right.id)

const isPendingGeneratedSavedPlan = (
  plan: SavedPlan,
  activeGeneratedPlanId: string | null,
  serverPlans: SavedPlan[],
) =>
  Boolean(activeGeneratedPlanId && (plan.id === activeGeneratedPlanId || plan.sourceRecommendationId === activeGeneratedPlanId)) &&
  !serverPlans.some((serverPlan) => isSameSavedPlanIdentity(plan, serverPlan))

const isLocalGeneratedPlanRouteId = (routePlanId: string | null) =>
  Boolean(
    routePlanId &&
      (
        routePlanId.includes('AI-추천-여행-코스') ||
        routePlanId.includes('동선이-느슨한-일정') ||
        routePlanId.includes('덜-걷는-일정')
      ),
  )

const resolveSocialAuthProvider = (
  user: LovvUser | null,
  fallbackProvider: SocialAuthProvider | null,
): SocialAuthProvider | null => {
  if (user?.provider === 'google' || user?.provider === 'kakao') {
    return user.provider
  }

  return fallbackProvider
}

const isValidRedirectUrl = (url: string): boolean => {
  if (!url) return false
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }
  try {
    const parsed = new URL(url)
    const allowedDomains = [
      'amazoncognito.com',
      'google.com',
      'kakao.com',
      window.location.hostname
    ]
    return allowedDomains.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    )
  } catch {
    return false
  }
}

const safeAssignLocation = (url: string) => {
  if (isValidRedirectUrl(url)) {
    window.location.assign(url)
  } else {
    log.error('AUTH', 'Blocked unsafe open redirection attempt', { url })
  }
}

const authCallbackRecoveryDelayMs = 5000

export interface UseAuthOptions {
  plannerRef?: React.MutableRefObject<{ currentPlanId: string | null; isPlannerReady: boolean }>
}

export function useAuth({ plannerRef }: UseAuthOptions = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isInitialAuthCallback] = useState(
    () =>
      Boolean(getAuthCallbackProvider(window.location.pathname)) ||
      isCognitoAuthCallbackPath(window.location.pathname),
  )
  const processedOAuthCallbackKeyRef = useRef('')
  const recoveredOAuthCallbackKeyRef = useRef('')
  const authRuntimeMode = useMemo(() => getDefaultAuthRuntimeMode(), [])
  const isApiAuthMode = authRuntimeMode === 'api'
  const isCognitoAuthMode = authRuntimeMode === 'cognito'
  const isBackendAuthMode = isApiAuthMode || isCognitoAuthMode

  const [currentUser, setCurrentUser] = useState<LovvUser | null>(() =>
    isBackendAuthMode ? null : readStoredUser(),
  )
  const [currentSocialAuthProvider, setCurrentSocialAuthProvider] =
    useState<SocialAuthProvider | null>(() => (isBackendAuthMode ? readStoredSocialAuthProvider() : null))
  const [authAccessToken, setAuthAccessTokenState] = useState<string | null>(null)
  const [authAccessTokenExpiresAtMs, setAuthAccessTokenExpiresAtMs] = useState<number | null>(null)
  const authAccessTokenRef = useRef<string | null>(null)
  const authAccessTokenExpiresAtMsRef = useRef<number | null>(null)
  const authSessionRefreshPromiseRef = useRef<Promise<AuthSessionRefreshResult> | null>(null)
  const authLifecycleGenerationRef = useRef(0)
  const isAuthMountedRef = useRef(true)
  const [isAuthSessionRestoring, setIsAuthSessionRestoring] = useState(isBackendAuthMode)

  const setAuthAccessToken = useCallback((accessToken: string | null) => {
    authAccessTokenRef.current = accessToken
    authAccessTokenExpiresAtMsRef.current = null
    setAuthAccessTokenState(accessToken)
    setAuthAccessTokenExpiresAtMs(null)
  }, [])

  const commitAuthAccessToken = useCallback(
    (accessToken: string | null, expiresInSeconds: number | null) => {
      const expiresAtMs = accessToken
        ? getAuthTokenExpiresAtMs(expiresInSeconds, Date.now())
        : null

      authAccessTokenRef.current = accessToken
      authAccessTokenExpiresAtMsRef.current = expiresAtMs
      setAuthAccessTokenState(accessToken)
      setAuthAccessTokenExpiresAtMs(expiresAtMs)
    },
    [],
  )

  useEffect(() => {
    isAuthMountedRef.current = true

    return () => {
      isAuthMountedRef.current = false
      authLifecycleGenerationRef.current += 1
    }
  }, [])

  const [selectedPreferenceProfile, setSelectedPreferenceProfile] = useState<PreferenceProfile>(
    () => (isBackendAuthMode ? null : readStoredPreferenceProfile()) ?? getDefaultPreferenceProfile(),
  )
  const [hasCompletedPreference, setHasCompletedPreference] = useState(
    () => !isBackendAuthMode && Boolean(readStoredPreferenceProfile()),
  )
  const [plannerPreferenceProfile, setPlannerPreferenceProfile] = useState<PreferenceProfile>(() => {
    try {
      const stored = sessionStorage.getItem('lovv.planner_active_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (validatePreferenceProfile(parsed)) {
          return parsed
        } else {
          sessionStorage.removeItem('lovv.planner_active_profile')
        }
      }
    } catch (err) {
      log.error('SYSTEM', 'Failed to parse stored planner preference profile', err)
    }
    return selectedPreferenceProfile ?? getDefaultPreferenceProfile()
  })
  
  const isInitialAuthSessionQueryEnabled = isBackendAuthMode && !isInitialAuthCallback

  const authSessionQuery = useQuery({
    queryKey: ['authSession', authRuntimeMode],
    queryFn: async () => {
      const state = await requestAuthSession()
      return adaptApiAuthSessionSnapshot(state, isCognitoAuthMode ? 'cognito' : 'api')
    },
    enabled: isInitialAuthSessionQueryEnabled,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const [pendingAuthRedirectPath, setPendingAuthRedirectPath] = useState<string | null>(null)
  const [authFlowNotice, setAuthFlowNotice] = useState<AuthExceptionNotice | null>(null)
  const [signInPendingProvider, setSignInPendingProvider] = useState<SocialAuthProvider | null>(null)
  const [preparedAuthRedirectUrls, setPreparedAuthRedirectUrls] =
    useState<PreparedAuthRedirectUrls>({})
  const [accountLinkNotice, setAccountLinkNotice] = useState<string | null>(null)
  const [linkingProvider, setLinkingProvider] = useState<SocialAuthProvider | null>(null)
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() =>
    isBackendAuthMode ? [] : readStoredSavedPlans(),
  )
  const [savedPlanLikes, setSavedPlanLikes] = useState<SavedPlanLikeMap>(() =>
    isBackendAuthMode ? {} : readStoredSavedPlanLikes(),
  )
  const savedPlansRef = useRef(savedPlans)
  const savedPlanLikesRef = useRef(savedPlanLikes)
  const [pendingSavedPlanLikeIds, setPendingSavedPlanLikeIds] = useState<string[]>([])
  const [pendingSavedPlanDeleteIds, setPendingSavedPlanDeleteIds] = useState<string[]>([])
  const [savedPlanLikeErrors, setSavedPlanLikeErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    savedPlansRef.current = savedPlans
  }, [savedPlans])

  useEffect(() => {
    savedPlanLikesRef.current = savedPlanLikes
  }, [savedPlanLikes])
  const [savedPlanNotice, setSavedPlanNotice] = useState<string | null>(null)

  const clearSavedPlanUiState = useCallback((clearStorage = false) => {
    setSavedPlans([])
    setSavedPlanLikes({})
    setPendingSavedPlanLikeIds([])
    setPendingSavedPlanDeleteIds([])
    setSavedPlanLikeErrors({})
    if (clearStorage) {
      clearStoredSavedPlanState()
      sessionStorage.removeItem('lovv.planner_active_profile')
    }
  }, [])

  const routePlanId = getPlanDetailRouteId(location.pathname)
  
  const authCallbackProvider = getAuthCallbackProvider(location.pathname)
  const shouldHandleCognitoAuthCallback = isCognitoAuthMode && isCognitoAuthCallbackPath(location.pathname)
  const shouldHandleAuthCallback =
    (isApiAuthMode && Boolean(authCallbackProvider)) || shouldHandleCognitoAuthCallback

  const shouldLoadSavedPlans =
    isBackendAuthMode &&
    !isAuthSessionRestoring &&
    !shouldHandleAuthCallback &&
    (Boolean(currentUser) || Boolean(routePlanId))

  const savedPlansQuery = useQuery({
    queryKey: ['savedPlans', authAccessToken, routePlanId],
    queryFn: async () => {
      let nextSavedPlans: SavedPlan[] = []
      let nextSavedPlanLikes: Record<string, Exclude<SavedPlanLike, null>> = {}
      let routePlanLoadFailed = false

      if (currentUser && authAccessToken) {
        try {
          const result = await requestListSavedPlans({ accessToken: authAccessToken as string })
          nextSavedPlans = result.savedPlans
          nextSavedPlanLikes = result.likes
        } catch (e) {
          log.error('AUTH', 'Failed to load user saved plans list', e)
        }
      }

      const currentPlanId = plannerRef?.current?.currentPlanId ?? null
      const isPlannerReady = plannerRef?.current?.isPlannerReady ?? false
      const shouldLoadRoutePlanDetail =
        Boolean(routePlanId) &&
        !isLocalGeneratedPlanRouteId(routePlanId) &&
        !(routePlanId === currentPlanId && isPlannerReady)

      if (
        shouldLoadRoutePlanDetail &&
        routePlanId &&
        !nextSavedPlans.some((plan) => plan.id === routePlanId)
      ) {
        try {
          const routeSavedPlan = await requestGetSavedPlan(routePlanId, {
            accessToken: authAccessToken ?? undefined,
          })

          nextSavedPlans = [routeSavedPlan, ...nextSavedPlans]
          if (routeSavedPlan.isLiked) {
            nextSavedPlanLikes = {
              ...nextSavedPlanLikes,
              [routeSavedPlan.id]: 'like',
            }
          }
        } catch (e) {
          log.error('AUTH', 'Failed to load route plan', e)
          routePlanLoadFailed = true
        }
      }

      return { savedPlans: nextSavedPlans, savedPlanLikes: nextSavedPlanLikes, routePlanLoadFailed }
    },
    enabled: shouldLoadSavedPlans,
    refetchOnWindowFocus: false,
  })

  const isSavedPlansRestoring =
    shouldLoadSavedPlans && savedPlansQuery.isPending

  const commitCurrentUser = useCallback(
    (user: LovvUser | null, fallbackProvider: SocialAuthProvider | null = null) => {
      setCurrentUser(user)

      if (!user) {
        setCurrentSocialAuthProvider(null)
        clearStoredSocialAuthProvider()
        return
      }

      const socialProvider = resolveSocialAuthProvider(user, fallbackProvider)

      if (socialProvider) {
        setCurrentSocialAuthProvider(socialProvider)
        storeSocialAuthProvider(socialProvider)
      }
    },
    [],
  )

  const clearUnusableBackendAuth = useCallback(() => {
    setAuthAccessToken(null)
    commitCurrentUser(null)
    setHasCompletedPreference(false)
    clearSavedPlanUiState(true)
  }, [clearSavedPlanUiState, commitCurrentUser, setAuthAccessToken])

  const applyRefreshedAuthSession = useCallback(
    (session: AuthSessionSnapshot) => {
      commitAuthAccessToken(session.accessToken, session.expiresIn)
      commitCurrentUser(session.user, readStoredSocialAuthProvider())
      setHasCompletedPreference(session.onboardingCompleted)

      if (session.preferenceProfile) {
        setSelectedPreferenceProfile(session.preferenceProfile)
        storePreferenceProfile(session.preferenceProfile)
        setPlannerPreferenceProfile(session.preferenceProfile)
        sessionStorage.setItem('lovv.planner_active_profile', JSON.stringify(session.preferenceProfile))
      } else if (session.onboardingCompleted) {
        const localProfile = readStoredPreferenceProfile()
        if (localProfile) {
          setSelectedPreferenceProfile(localProfile)
          setPlannerPreferenceProfile(localProfile)
          sessionStorage.setItem('lovv.planner_active_profile', JSON.stringify(localProfile))
        }
      }
    },
    [commitAuthAccessToken, commitCurrentUser],
  )

  const refreshAuthSession = useCallback((): Promise<AuthSessionRefreshResult> => {
    if (authSessionRefreshPromiseRef.current) {
      return authSessionRefreshPromiseRef.current
    }

    if (
      !isBackendAuthMode ||
      !authAccessTokenRef.current ||
      authAccessTokenExpiresAtMsRef.current === null
    ) {
      return Promise.resolve('stale')
    }

    const lifecycleGeneration = authLifecycleGenerationRef.current
    const refreshPromise: Promise<AuthSessionRefreshResult> = requestAuthSession()
      .then((state) => {
        if (
          !isAuthMountedRef.current ||
          authLifecycleGenerationRef.current !== lifecycleGeneration
        ) {
          return 'stale' as const
        }

        const session = adaptApiAuthSessionSnapshot(
          state,
          isCognitoAuthMode ? 'cognito' : 'api',
        )
        const refreshedExpiresAtMs = session.accessToken
          ? getAuthTokenExpiresAtMs(session.expiresIn, Date.now())
          : null

        if (
          !session.user ||
          !session.accessToken ||
          refreshedExpiresAtMs === null ||
          refreshedExpiresAtMs <= Date.now()
        ) {
          log.info('AUTH', 'Session refresh returned no usable authentication')
          clearUnusableBackendAuth()
          return 'failed' as const
        }

        applyRefreshedAuthSession(session)
        log.info('AUTH', 'Session refreshed', { userId: session.user.id })
        return 'refreshed' as const
      })
      .catch((error) => {
        if (
          !isAuthMountedRef.current ||
          authLifecycleGenerationRef.current !== lifecycleGeneration
        ) {
          return 'stale' as const
        }

        const expiresAtMs = authAccessTokenExpiresAtMsRef.current
        const isTerminalRefreshFailure =
          error instanceof AuthApiRequestError &&
          (error.statusCode === 401 || error.statusCode === 403)

        if (isTerminalRefreshFailure || (expiresAtMs !== null && Date.now() >= expiresAtMs)) {
          log.info('AUTH', 'Session refresh failed with no usable authentication')
          clearUnusableBackendAuth()
        } else {
          log.info('AUTH', 'Session refresh failed before access token expiry')
        }

        return 'failed' as const
      })
      .finally(() => {
        if (authSessionRefreshPromiseRef.current === refreshPromise) {
          authSessionRefreshPromiseRef.current = null
        }
      })

    authSessionRefreshPromiseRef.current = refreshPromise
    return refreshPromise
  }, [
    applyRefreshedAuthSession,
    clearUnusableBackendAuth,
    isBackendAuthMode,
    isCognitoAuthMode,
  ])

  useEffect(() => {
    if (
      !isBackendAuthMode ||
      isAuthSessionRestoring ||
      shouldHandleAuthCallback ||
      !currentUser ||
      !authAccessToken ||
      authAccessTokenExpiresAtMs === null
    ) {
      return undefined
    }

    let isActive = true
    let refreshTimeoutId: number | null = null

    function scheduleRefresh(delayMs: number) {
      if (refreshTimeoutId !== null) {
        window.clearTimeout(refreshTimeoutId)
      }
      refreshTimeoutId = window.setTimeout(refreshWhenDue, delayMs)
    }

    async function refreshWhenDue() {
      if (!isActive || document.visibilityState === 'hidden') {
        return
      }

      const expiresAtMs = authAccessTokenExpiresAtMsRef.current
      if (!isAuthSessionRefreshDue(expiresAtMs, Date.now())) {
        return
      }

      const accessTokenAtStart = authAccessTokenRef.current
      const expiresAtMsAtStart = expiresAtMs
      const result = await refreshAuthSession()

      if (
        isActive &&
        result === 'failed' &&
        authAccessTokenRef.current === accessTokenAtStart &&
        authAccessTokenExpiresAtMsRef.current === expiresAtMsAtStart &&
        expiresAtMsAtStart !== null
      ) {
        scheduleRefresh(Math.max(0, expiresAtMsAtStart - Date.now()))
      }
    }

    const refreshIfVisibleAndDue = () => {
      if (document.visibilityState !== 'hidden') {
        void refreshWhenDue()
      }
    }

    const refreshDelayMs = getAuthSessionRefreshDelayMs(authAccessTokenExpiresAtMs, Date.now())
    if (refreshDelayMs !== null) {
      scheduleRefresh(refreshDelayMs)
    }

    document.addEventListener('visibilitychange', refreshIfVisibleAndDue)
    window.addEventListener('pageshow', refreshIfVisibleAndDue)

    return () => {
      isActive = false
      if (refreshTimeoutId !== null) {
        window.clearTimeout(refreshTimeoutId)
      }
      document.removeEventListener('visibilitychange', refreshIfVisibleAndDue)
      window.removeEventListener('pageshow', refreshIfVisibleAndDue)
    }
  }, [
    authAccessToken,
    authAccessTokenExpiresAtMs,
    currentUser,
    isAuthSessionRestoring,
    isBackendAuthMode,
    refreshAuthSession,
    shouldHandleAuthCallback,
  ])

  useEffect(() => {
    if (authSessionQuery.status === 'success') {
      const session = authSessionQuery.data

      log.info('AUTH', 'Session restored', {
        userId: session.user?.id,
        onboardingCompleted: session.onboardingCompleted,
      })
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      commitAuthAccessToken(session.accessToken, session.expiresIn)
      commitCurrentUser(session.user, readStoredSocialAuthProvider())
      setHasCompletedPreference(session.onboardingCompleted)

      if (session.preferenceProfile) {
        setSelectedPreferenceProfile(session.preferenceProfile)
        storePreferenceProfile(session.preferenceProfile)
        setPlannerPreferenceProfile(session.preferenceProfile)
        sessionStorage.setItem('lovv.planner_active_profile', JSON.stringify(session.preferenceProfile))
      } else if (session.onboardingCompleted) {
        const localProfile = readStoredPreferenceProfile()
        if (localProfile) {
          setSelectedPreferenceProfile(localProfile)
          setPlannerPreferenceProfile(localProfile)
          sessionStorage.setItem('lovv.planner_active_profile', JSON.stringify(localProfile))
        }
      } else {
        sessionStorage.removeItem('lovv.planner_active_profile')
      }
      setIsAuthSessionRestoring(false)
    } else if (authSessionQuery.status === 'error') {
      log.info('AUTH', 'No active session to restore (signed out)')
      setAuthAccessToken(null)
      commitCurrentUser(null)
      setHasCompletedPreference(false)
      clearSavedPlanUiState(true)

      const localProfile = readStoredPreferenceProfile()
      const finalProfile = localProfile ?? getDefaultPreferenceProfile()
      setSelectedPreferenceProfile(finalProfile)
      setPlannerPreferenceProfile(finalProfile)
      sessionStorage.setItem('lovv.planner_active_profile', JSON.stringify(finalProfile))

      setIsAuthSessionRestoring(false)
    }
  }, [
    authSessionQuery.status,
    authSessionQuery.data,
    clearSavedPlanUiState,
    commitAuthAccessToken,
    commitCurrentUser,
    setAuthAccessToken,
  ])

  useEffect(() => {
    const isAuthEntryPath = location.pathname === '/' || location.pathname === '/auth'

    if (
      !isBackendAuthMode ||
      !isAuthEntryPath ||
      isAuthSessionRestoring ||
      currentUser ||
      shouldHandleAuthCallback
    ) {
      let isActive = true

      queueMicrotask(() => {
        if (!isActive) {
          return
        }

        setPreparedAuthRedirectUrls((currentUrls) =>
          Object.keys(currentUrls).length > 0 ? {} : currentUrls,
        )
        setSignInPendingProvider(null)
      })

      return () => {
        isActive = false
      }
    }

    let isActive = true
    const createAuthorizationRequest = isCognitoAuthMode
      ? createCognitoAuthorizationRequest
      : createOAuthAuthorizationRequest

    const prepareProviderRedirect = async (provider: SocialAuthProvider) => {
      try {
        const authorizationRequest = await createAuthorizationRequest(provider, {
          origin: window.location.origin,
          storage: window.sessionStorage,
        })

        if (!isActive) {
          return
        }

        setPreparedAuthRedirectUrls((currentUrls) =>
          currentUrls[provider] === authorizationRequest.authorizationUrl
            ? currentUrls
            : {
                ...currentUrls,
                [provider]: authorizationRequest.authorizationUrl,
              },
        )
      } catch {
        if (!isActive) {
          return
        }

        setPreparedAuthRedirectUrls((currentUrls) => {
          if (!currentUrls[provider]) {
            return currentUrls
          }

          const nextUrls = { ...currentUrls }
          delete nextUrls[provider]

          return nextUrls
        })
      }
    }

    prepareProviderRedirect('google')
    prepareProviderRedirect('kakao')

    return () => {
      isActive = false
    }
  }, [
    currentUser,
    isAuthSessionRestoring,
    isBackendAuthMode,
    isCognitoAuthMode,
    location.pathname,
    shouldHandleAuthCallback,
  ])

  useEffect(() => {
    if (!isBackendAuthMode || isAuthSessionRestoring || shouldHandleAuthCallback) {
      return
    }

    if (!currentUser || !authAccessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      clearSavedPlanUiState(true)
    }
  }, [
    authAccessToken,
    clearSavedPlanUiState,
    currentUser,
    isAuthSessionRestoring,
    isBackendAuthMode,
    shouldHandleAuthCallback,
  ])

  useEffect(() => {
    if (!savedPlansQuery.data) {
      return
    }

    log.info('PLAN', `Saved plans loaded (${savedPlansQuery.data.savedPlans.length})`)
    const serverPlans = savedPlansQuery.data.savedPlans
    const activeGeneratedPlanId = plannerRef?.current?.currentPlanId ?? null
    const pendingGeneratedPlans = savedPlansRef.current.filter((plan) =>
      isPendingGeneratedSavedPlan(plan, activeGeneratedPlanId, serverPlans),
    )
    const nextSavedPlans = [...pendingGeneratedPlans, ...serverPlans]
    const pendingGeneratedLikes = pendingGeneratedPlans.reduce<SavedPlanLikeMap>((likes, plan) => {
      const planLike =
        savedPlanLikesRef.current[plan.id] ??
        (plan.sourceRecommendationId ? savedPlanLikesRef.current[plan.sourceRecommendationId] : undefined)

      if (planLike) {
        likes[plan.id] = planLike
        if (plan.sourceRecommendationId) {
          likes[plan.sourceRecommendationId] = planLike
        }
      }

      return likes
    }, {})
    const nextSavedPlanLikes = {
      ...pendingGeneratedLikes,
      ...savedPlansQuery.data.savedPlanLikes,
    }

    setSavedPlans(nextSavedPlans)
    writeStoredSavedPlans(nextSavedPlans)
    setSavedPlanLikes(nextSavedPlanLikes)
    writeStoredSavedPlanLikes(nextSavedPlanLikes)

    if (savedPlansQuery.data.routePlanLoadFailed) {
      setSavedPlanNotice('저장 일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [plannerRef, savedPlansQuery.data])

  useEffect(() => {
    if (savedPlansQuery.isError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedPlanNotice('저장 일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [savedPlansQuery.isError])

  const authLoginMutation = useMutation({
    mutationFn: ({
      provider,
      request,
    }: {
      provider: SocialAuthProvider
      request: Parameters<typeof requestAuthLogin>[1]
    }) => requestAuthLogin(provider, request),
  })

  const shouldLoadSocialAccounts =
    isApiAuthMode && !isAuthSessionRestoring && !shouldHandleAuthCallback && Boolean(currentUser) && Boolean(authAccessToken)
  const socialAccountsQuery = useQuery({
    queryKey: ['socialAccounts', authAccessToken],
    queryFn: () => requestListSocialAccounts({ accessToken: authAccessToken as string }),
    enabled: shouldLoadSocialAccounts,
  })

  const linkProviderMutation = useMutation({
    mutationFn: ({
      provider,
      request,
    }: {
      provider: SocialAuthProvider
      request: Parameters<typeof requestLinkProvider>[1]
    }) => requestLinkProvider(provider, request, { accessToken: authAccessToken }),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (update: ProfileUpdateRequest) => requestUpdateProfile(update, { accessToken: authAccessToken }),
  })

  const getAccountLinkErrorNotice = useCallback((error: unknown) => {
    if (error instanceof AuthApiRequestError) {
      if (error.code === 'SOCIAL_ACCOUNT_ALREADY_LINKED') {
        return '이미 이 계정에 연결되어 있어요.'
      }
      if (error.code === 'SOCIAL_ACCOUNT_LINKED_TO_ANOTHER_USER') {
        return '이미 다른 계정에 연결된 소셜 계정이에요.'
      }
    }

    return '계정 연결에 실패했어요. 잠시 후 다시 시도해 주세요.'
  }, [])

  const getProfileUpdateErrorNotice = useCallback((error: unknown) => {
    if (error instanceof AuthApiRequestError && error.code === 'INVALID_BIRTH_DATE') {
      return '생년월일 형식을 확인해 주세요.'
    }

    return '프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요.'
  }, [])

  const startLinkProvider = useCallback(async (provider: SocialAuthProvider) => {
    setAccountLinkNotice(null)
    setLinkingProvider(provider)

    try {
      const { authorizationUrl } = await createOAuthAuthorizationRequest(provider, {
        origin: window.location.origin,
        storage: window.sessionStorage,
        mode: 'link',
      })

      safeAssignLocation(authorizationUrl)
    } catch {
      setLinkingProvider(null)
      setAccountLinkNotice('계정 연결을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [])

  const updateProfile = useCallback(
    async (update: ProfileUpdateRequest) => {
      setProfileUpdateError(null)
      setIsUpdatingProfile(true)

      try {
        const session = await updateProfileMutation.mutateAsync(update)
        if (session.user) {
          commitCurrentUser(session.user, currentSocialAuthProvider)
        }
        return true
      } catch (error) {
        setProfileUpdateError(getProfileUpdateErrorNotice(error))
        return false
      } finally {
        setIsUpdatingProfile(false)
      }
    },
    [commitCurrentUser, currentSocialAuthProvider, getProfileUpdateErrorNotice, updateProfileMutation],
  )

  useEffect(() => {
    if (!isApiAuthMode || !authCallbackProvider) {
      return undefined
    }

    const callbackKey = `${authCallbackProvider}:${location.search}`
    const isProcessedInSession = window.sessionStorage.getItem('lovv.auth.processed_callback') === callbackKey

    if (processedOAuthCallbackKeyRef.current === callbackKey || isProcessedInSession) {
      return undefined
    }

    processedOAuthCallbackKeyRef.current = callbackKey
    window.sessionStorage.setItem('lovv.auth.processed_callback', callbackKey)
    const loginRequest = createAuthLoginRequestFromCallback(
      authCallbackProvider,
      location.search,
      window.sessionStorage,
    )
    const isCurrentAttempt = () => processedOAuthCallbackKeyRef.current === callbackKey

    if (loginRequest.status === 'success' && loginRequest.mode === 'link') {
      clearPendingOAuthLogins(window.sessionStorage)

      linkProviderMutation
        .mutateAsync({ provider: authCallbackProvider, request: loginRequest.request })
        .then(() => {
          if (!isCurrentAttempt()) {
            return
          }

          queryClient.invalidateQueries({ queryKey: ['socialAccounts'] })
          setAccountLinkNotice(`${providerLabels[authCallbackProvider]} 계정이 연결되었어요.`)
          setLinkingProvider(null)
          navigate('/mypage', { replace: true })
        })
        .catch((error) => {
          if (!isCurrentAttempt()) {
            return
          }

          setAccountLinkNotice(getAccountLinkErrorNotice(error))
          setLinkingProvider(null)
          navigate('/mypage', { replace: true })
        })

      return undefined
    }

    if (loginRequest.status === 'error') {
      queueMicrotask(() => {
        if (!isCurrentAttempt()) {
          return
        }

        clearPendingOAuthLogins(window.sessionStorage)
        setAuthAccessToken(null)
        commitCurrentUser(null)
        setHasCompletedPreference(false)
        setAuthFlowNotice(getAuthExceptionNotice(loginRequest.errorCode))
        setIsAuthSessionRestoring(false)
        navigate('/auth', { replace: true })
      })

      return undefined
    }

    queueMicrotask(() => {
      if (isCurrentAttempt()) {
        setIsAuthSessionRestoring(true)
      }
    })

    authLoginMutation
      .mutateAsync({ provider: authCallbackProvider, request: loginRequest.request })
      .then((state) => {
        if (!isCurrentAttempt()) {
          return
        }

        const session = adaptApiAuthSessionSnapshot(state, authRuntimeMode)

        clearPendingOAuthLogins(window.sessionStorage)

        if (!session.user) {
          setAuthAccessToken(null)
          commitCurrentUser(null)
          setHasCompletedPreference(false)
          setAuthFlowNotice(getAuthExceptionNotice('UNAUTHORIZED'))
          setIsAuthSessionRestoring(false)
          navigate('/auth', { replace: true })
          return
        }

        setAuthFlowNotice(null)
        commitAuthAccessToken(session.accessToken, session.expiresIn)
        commitCurrentUser(session.user, authCallbackProvider)
        setHasCompletedPreference(session.onboardingCompleted)

        if (session.preferenceProfile) {
          setSelectedPreferenceProfile(session.preferenceProfile)
          storePreferenceProfile(session.preferenceProfile)
        } else if (session.onboardingCompleted) {
          const localProfile = readStoredPreferenceProfile()
          if (localProfile) {
            setSelectedPreferenceProfile(localProfile)
          }
        }

        setIsAuthSessionRestoring(false)
        setPendingAuthRedirectPath(session.onboardingCompleted ? '/home' : '/onboarding')
      })
      .catch((error) => {
        if (!isCurrentAttempt()) {
          return
        }

        clearPendingOAuthLogins(window.sessionStorage)
        setAuthAccessToken(null)
        commitCurrentUser(null)
        setHasCompletedPreference(false)
        setAuthFlowNotice(getAuthExceptionNotice(error))
        setIsAuthSessionRestoring(false)
        navigate('/auth', { replace: true })
      })

    return undefined
  }, [
    authCallbackProvider,
    authLoginMutation,
    authRuntimeMode,
    commitAuthAccessToken,
    commitCurrentUser,
    getAccountLinkErrorNotice,
    isApiAuthMode,
    linkProviderMutation,
    location.search,
    navigate,
    queryClient,
    setAuthAccessToken,
  ])

  const cognitoBridgeMutation = useMutation({
    mutationFn: (request: Parameters<typeof requestCognitoToken>[0]) =>
      requestCognitoToken(request).then((token) => requestCognitoBridgeSession(token.idToken ?? token.accessToken)),
  })

  useEffect(() => {
    if (!shouldHandleCognitoAuthCallback) {
      return undefined
    }

    const callbackKey = `cognito:${location.search}`
    const isProcessedInSession = window.sessionStorage.getItem('lovv.auth.processed_callback') === callbackKey

    if (processedOAuthCallbackKeyRef.current === callbackKey || isProcessedInSession) {
      return undefined
    }

    processedOAuthCallbackKeyRef.current = callbackKey
    window.sessionStorage.setItem('lovv.auth.processed_callback', callbackKey)
    const tokenRequest = createCognitoTokenRequestFromCallback(location.search, window.sessionStorage)
    const isCurrentAttempt = () => processedOAuthCallbackKeyRef.current === callbackKey

    if (tokenRequest.status === 'error') {
      queueMicrotask(() => {
        if (!isCurrentAttempt()) {
          return
        }

        clearPendingOAuthLogins(window.sessionStorage)
        setAuthAccessToken(null)
        commitCurrentUser(null)
        setHasCompletedPreference(false)
        setAuthFlowNotice(getAuthExceptionNotice(tokenRequest.errorCode))
        setIsAuthSessionRestoring(false)
        navigate('/auth', { replace: true })
      })

      return undefined
    }

    queueMicrotask(() => {
      if (isCurrentAttempt()) {
        setIsAuthSessionRestoring(true)
      }
    })

    cognitoBridgeMutation
      .mutateAsync(tokenRequest.request)
      .then((state) => {
        if (!isCurrentAttempt()) {
          return
        }

        const user =
          state.user?.provider === 'cognito'
            ? {
                ...state.user,
                provider: tokenRequest.provider,
              }
            : state.user
        const session = adaptApiAuthSessionSnapshot(
          {
            ...state,
            user,
          },
          authRuntimeMode,
        )

        clearPendingOAuthLogins(window.sessionStorage)

        if (!session.user) {
          setAuthAccessToken(null)
          commitCurrentUser(null)
          setHasCompletedPreference(false)
          setAuthFlowNotice(getAuthExceptionNotice('UNAUTHORIZED'))
          setIsAuthSessionRestoring(false)
          navigate('/auth', { replace: true })
          return
        }

        setAuthFlowNotice(null)
        commitAuthAccessToken(session.accessToken, session.expiresIn)
        commitCurrentUser(session.user, tokenRequest.provider)
        setHasCompletedPreference(session.onboardingCompleted)

        if (session.preferenceProfile) {
          setSelectedPreferenceProfile(session.preferenceProfile)
          storePreferenceProfile(session.preferenceProfile)
        } else if (session.onboardingCompleted) {
          const localProfile = readStoredPreferenceProfile()
          if (localProfile) {
            setSelectedPreferenceProfile(localProfile)
          }
        }

        setIsAuthSessionRestoring(false)
        setPendingAuthRedirectPath(session.onboardingCompleted ? '/home' : '/onboarding')
      })
      .catch((error) => {
        if (!isCurrentAttempt()) {
          return
        }

        clearPendingOAuthLogins(window.sessionStorage)
        setAuthAccessToken(null)
        commitCurrentUser(null)
        setHasCompletedPreference(false)
        setAuthFlowNotice(getAuthExceptionNotice(error))
        setIsAuthSessionRestoring(false)
        navigate('/auth', { replace: true })
      })

    return undefined
  }, [
    authRuntimeMode,
    cognitoBridgeMutation,
    commitAuthAccessToken,
    commitCurrentUser,
    location.search,
    navigate,
    setAuthAccessToken,
    shouldHandleCognitoAuthCallback,
  ])

  useEffect(() => {
    if (!shouldHandleCognitoAuthCallback) {
      return undefined
    }

    const callbackKey = `cognito:${location.search}`

    if (recoveredOAuthCallbackKeyRef.current === callbackKey) {
      return undefined
    }

    let isActive = true

    const timeoutId = window.setTimeout(() => {
      if (!isActive || currentUser) {
        return
      }

      recoveredOAuthCallbackKeyRef.current = callbackKey

      requestAuthSession()
        .then((state) => {
          if (!isActive) {
            return
          }

          const session = adaptApiAuthSessionSnapshot(state, authRuntimeMode)
          clearPendingOAuthLogins(window.sessionStorage)

          if (!session.user) {
            setAuthAccessToken(null)
            commitCurrentUser(null)
            setHasCompletedPreference(false)
            setIsAuthSessionRestoring(false)
            navigate('/auth', { replace: true })
            return
          }

          setAuthFlowNotice(null)
          commitAuthAccessToken(session.accessToken, session.expiresIn)
          commitCurrentUser(session.user, readStoredSocialAuthProvider())
          setHasCompletedPreference(session.onboardingCompleted)

          if (session.preferenceProfile) {
            setSelectedPreferenceProfile(session.preferenceProfile)
            storePreferenceProfile(session.preferenceProfile)
          } else if (session.onboardingCompleted) {
            const localProfile = readStoredPreferenceProfile()
            if (localProfile) {
              setSelectedPreferenceProfile(localProfile)
            }
          }

          setIsAuthSessionRestoring(false)
          setPendingAuthRedirectPath(session.onboardingCompleted ? '/home' : '/onboarding')
        })
        .catch(() => {
          if (!isActive) {
            return
          }

          setIsAuthSessionRestoring(false)
          navigate('/auth', { replace: true })
        })
    }, authCallbackRecoveryDelayMs)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [
    authRuntimeMode,
    commitAuthAccessToken,
    commitCurrentUser,
    currentUser,
    location.search,
    navigate,
    setAuthAccessToken,
    shouldHandleCognitoAuthCallback,
  ])

  const signInWithMockProvider = (provider: SocialAuthProvider) => {
    if (isBackendAuthMode) {
      return
    }

    const session = createMockAuthSessionSnapshot(provider, {
      onboardingCompleted: Boolean(readStoredPreferenceProfile()),
    })
    const mockUser = session.user
    const hasStoredPreference = Boolean(readStoredPreferenceProfile())

    localStorage.setItem(authStorageKey, JSON.stringify(mockUser))
    setAuthAccessToken(null)
    commitCurrentUser(mockUser, provider)
    setHasCompletedPreference(hasStoredPreference)
    
    const nextView = hasStoredPreference ? 'home' : 'onboarding'
    navigate(nextView === 'home' ? '/home' : '/onboarding', { replace: true })
  }

  const startPreparedOAuthSignIn = (provider: SocialAuthProvider) => {
    const preparedAuthorizationUrl = preparedAuthRedirectUrls[provider]

    if (!preparedAuthorizationUrl) {
      return false
    }

    setAuthFlowNotice(null)
    setSignInPendingProvider(provider)
    safeAssignLocation(preparedAuthorizationUrl)

    return true
  }

  const startApiOAuthSignIn = async (provider: SocialAuthProvider) => {
    if (startPreparedOAuthSignIn(provider)) {
      return
    }

    try {
      setAuthFlowNotice(null)
      setSignInPendingProvider(provider)
      const authorizationRequest = await createOAuthAuthorizationRequest(provider, {
        origin: window.location.origin,
        storage: window.sessionStorage,
      })

      safeAssignLocation(authorizationRequest.authorizationUrl)
    } catch (error) {
      setSignInPendingProvider(null)
      setAuthFlowNotice(getAuthExceptionNotice(error))
    }
  }

  const startCognitoOAuthSignIn = async (provider: SocialAuthProvider) => {
    if (startPreparedOAuthSignIn(provider)) {
      return
    }

    try {
      setAuthFlowNotice(null)
      setSignInPendingProvider(provider)
      const authorizationRequest = await createCognitoAuthorizationRequest(provider, {
        origin: window.location.origin,
        storage: window.sessionStorage,
      })

      safeAssignLocation(authorizationRequest.authorizationUrl)
    } catch (error) {
      setSignInPendingProvider(null)
      setAuthFlowNotice(getAuthExceptionNotice(error))
    }
  }

  const authLogoutMutation = useMutation({
    mutationFn: () => requestAuthLogout({ accessToken: authAccessToken }),
  })

  const closeSessionMenu = useUiToggleStore((state) => state.closeSessionMenu)

  const signOut = async () => {
    closeSessionMenu()
    authLifecycleGenerationRef.current += 1

    if (isBackendAuthMode) {
      try {
        await authLogoutMutation.mutateAsync()
      } catch {
        // Safe fallback
      }
    }

    localStorage.removeItem(authStorageKey)
    clearPendingOAuthLogins(window.sessionStorage)
    setAuthAccessToken(null)
    commitCurrentUser(null)
    if (isBackendAuthMode) {
      clearSavedPlanUiState(true)
    }

    if (isCognitoAuthMode) {
      try {
        safeAssignLocation(createCognitoLogoutUrl({ origin: window.location.origin }))
        return
      } catch (error) {
        setAuthFlowNotice(getAuthExceptionNotice(error))
      }
    }

    navigate('/auth', { replace: true })
  }

  return {
    isApiAuthMode,
    isCognitoAuthMode,
    isBackendAuthMode,
    currentUser,
    setCurrentUser,
    commitCurrentUser,
    authAccessToken,
    setAuthAccessToken,
    currentSocialAuthProvider,
    isAuthSessionRestoring,
    setIsAuthSessionRestoring,
    pendingAuthRedirectPath,
    setPendingAuthRedirectPath,
    authFlowNotice,
    setAuthFlowNotice,
    signInPendingProvider,
    setSignInPendingProvider,
    preparedAuthRedirectUrls,
    accountLinkNotice,
    setAccountLinkNotice,
    linkingProvider,
    setLinkingProvider,
    profileUpdateError,
    setProfileUpdateError,
    isUpdatingProfile,
    savedPlans,
    setSavedPlans,
    savedPlanLikes,
    setSavedPlanLikes,
    pendingSavedPlanLikeIds,
    setPendingSavedPlanLikeIds,
    pendingSavedPlanDeleteIds,
    setPendingSavedPlanDeleteIds,
    savedPlanLikeErrors,
    setSavedPlanLikeErrors,
    savedPlanNotice,
    setSavedPlanNotice,
    clearSavedPlanUiState,
    savedPlansQuery,
    isSavedPlansRestoring,
    socialAccounts: socialAccountsQuery.data ?? [],
    startLinkProvider,
    updateProfile,
    signInWithMockProvider,
    startApiOAuthSignIn,
    startCognitoOAuthSignIn,
    signOut,
    shouldHandleAuthCallback,
    selectedPreferenceProfile,
    setSelectedPreferenceProfile,
    hasCompletedPreference,
    setHasCompletedPreference,
    plannerPreferenceProfile,
    setPlannerPreferenceProfile,
  }
}

// EOF: useAuth.ts
