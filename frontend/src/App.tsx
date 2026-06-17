/**
 * @file App.tsx
 * @description Main Lovv frontend route and state coordinator.
 * @lastModified 2026-06-13
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthView } from './features/auth/AuthView'
import {
  authStorageKey,
  clearStoredSocialAuthProvider,
  readStoredSocialAuthProvider,
  readStoredUser,
  storeSocialAuthProvider,
} from './features/auth/authModel'
import {
  adaptApiAuthSessionSnapshot,
  createMockAuthSessionSnapshot,
  getDefaultAuthRuntimeMode,
} from './features/auth/authFlow'
import { getAuthExceptionNotice, type AuthExceptionNotice } from './features/auth/authException'
import {
  clearPendingOAuthLogins,
  createAuthLoginRequestFromCallback,
  createCognitoAuthorizationRequest,
  createCognitoLogoutUrl,
  createCognitoTokenRequestFromCallback,
  createOAuthAuthorizationRequest,
  getAuthCallbackProvider,
  isCognitoAuthCallbackPath,
} from './features/auth/authRedirect'
import { requestCognitoToken } from './features/auth/cognitoAuth'
import { heroRotationIntervalMs, heroThemes, monthlyRecommendations } from './features/home/homeContent'
import { HomeView } from './features/home/HomeView'
import { ThemeDetailView } from './features/home/ThemeDetailView'
import { CityMapDiscoverySection } from './features/map-city/CityMapDiscoverySection'
import {
  createSmallCityMapMarkers,
  createPlannerCityContext,
  filterSmallCities,
  type PlannerCityContext,
  type SmallCity,
  type SmallCityCountry,
  type SmallCityMapMarker,
  type SmallCityTheme,
} from './features/map-city/smallCities'
import {
  createSmallCityCatalogStateFromQueryResult,
  createSmallCityDetailEmptyState,
  createStaticSmallCityDetailState,
} from './features/map-city/smallCityDataSource'
import { MyPageView } from './features/my-page/MyPageView'
import {
  OnboardingPreferenceView,
} from './features/onboarding/OnboardingPreferenceView'
import {
  createPreferenceProfile,
  getDefaultPreferenceProfile,
  getPreferenceByThemeId,
  getPreferencesForProfile,
  getPrimaryPreference,
  getThemeLabels,
  preferences,
  readStoredPreferenceProfile,
  storePreferenceProfile,
} from './features/onboarding/preferenceModel'
import {
  createAssistantReply,
  createInitialChatMessages,
  createMessageId,
  createMockConditionExtraction,
  createPlanDraft,
  createPlanId,
  formatThemeList,
  getExplicitDurationLabel,
  getExplicitTravelMonth,
  getFestivalThemeLabel,
  getPlannerBaselineThemeIds,
  getPlannerCitySeedText,
  getPreferenceProfileLabel,
  getRecommendationBasisHashtags,
  getThemeHashtags,
  getTravelMonthLabel,
  resolveFestivalThemeChoice,
  shouldAskFestivalForCity,
  shouldAskTravelMonthForCity,
} from './features/planner/plannerModel'
import { PlannerWorkspace, type PlannerStateStep } from './features/planner/PlannerWorkspace'
import { PlanDetailView } from './features/planner/PlanDetailView'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import {
  clearStoredSavedPlanState,
  getNextSavedPlanLike,
  readStoredSavedPlanLikes,
  readStoredSavedPlans,
  writeStoredSavedPlanLikes,
  writeStoredSavedPlans,
  type SavedPlanLikeMap,
} from './features/saved-plans/savedPlansStorage'
import { AppHeader } from './shared/components/AppHeader'
import { Footer } from './shared/components/Footer'
import { LegalNoticeDialog } from './shared/components/LegalNoticeDialog'
import { useUiToggleStore } from './shared/store/uiToggleStore'
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
} from './shared/api/authApi'
import {
  requestCreateSavedPlan,
  requestDeleteSavedPlan,
  requestGetSavedPlan,
  requestLikeSavedPlan,
  requestListSavedPlans,
  requestUnlikeSavedPlan,
  type SavedPlanApiCreatePayload,
} from './shared/api/savedPlansApi'
import { requestUpdatePreference } from './shared/api/preferencesApi'
import { createSmallCityApiQuery, defaultSmallCityApiPageSize, requestListSmallCities } from './shared/api/smallCityApi'
import {
  requestCreateRecommendation,
  mapRecommendationToDraft,
} from './shared/api/recommendationsApi'
import {
  getCanonicalViewFromPath,
  getGuardRedirectPath,
  getLegacyViewRedirectPath,
  getPathForView,
  getPlanDetailRouteId,
} from './shared/components/viewRouting'
import type {
  ChatMessage,
  CountryTrack,
  FestivalThemeChoice,
  MockConditionExtraction,
  MonthlyRecommendation,
  PlanDraft,
  SavedPlanLike,
  Preference,
  PreferenceProfile,
  PreferenceProfileSource,
  SavedPlan,
  SocialAuthProvider,
  ThemeId,
  View,
  LovvUser,
} from './shared/types/app'

type PreparedAuthRedirectUrls = Partial<Record<SocialAuthProvider, string>>

const providerLabels: Record<SocialAuthProvider, string> = {
  google: 'Google',
  kakao: 'Kakao',
}

const resolveSocialAuthProvider = (
  user: LovvUser | null,
  fallbackProvider: SocialAuthProvider | null,
): SocialAuthProvider | null => {
  if (user?.provider === 'google' || user?.provider === 'kakao') {
    return user.provider
  }

  return fallbackProvider
}

function AuthLoadingView() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-labelledby="auth-loading-title"
      className="grid min-h-dvh place-items-center px-6 py-16 text-center"
    >
      <div className="w-full max-w-[420px] rounded-[24px] border border-[#F3B489]/45 bg-[#fffffa]/90 px-8 py-8 shadow-[0_24px_60px_-42px_rgba(51,39,30,0.45)] backdrop-blur">
        <span
          aria-hidden="true"
          className="mx-auto block size-9 animate-spin rounded-full border-4 border-[#F3B489]/45 border-t-[#F36B12]"
        />
        <h1
          id="auth-loading-title"
          className="mt-6 break-keep text-2xl font-black leading-8 text-[#33271E]"
        >
          로그인 정보를 확인하고 있어요
        </h1>
        <p className="mt-3 break-keep text-sm font-bold leading-6 text-[#6E5A50]">
          잠시만 기다려주세요
        </p>
      </div>
    </section>
  )
}

// Grace period before the callback page falls back to re-reading the session from the bridge
// cookie. Kept far longer than a normal token+bridge exchange (~sub-second) so it never races the
// happy path; it only fires when the in-tab exchange continuation was dropped and the tab would
// otherwise spin forever.
const authCallbackRecoveryDelayMs = 5000

function App() {
  const cityMapDetailPanelRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // A plain lazy-initialized useState (rather than a ref) because authSessionQuery's `enabled`
  // needs to read this during render, and reading ref.current during render is disallowed
  // (react-hooks/refs). The value itself is fixed at mount and never changes after, so the
  // missing setter is intentional — this is a one-time snapshot, not reactive state.
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
  const [authAccessToken, setAuthAccessToken] = useState<string | null>(null)
  const [isAuthSessionRestoring, setIsAuthSessionRestoring] = useState(isBackendAuthMode)
  // Stable for the component's lifetime (isBackendAuthMode and isInitialAuthCallback are both
  // fixed at mount) — this also doubles as authSessionQuery's `enabled`.
  const isInitialAuthSessionQueryEnabled = isBackendAuthMode && !isInitialAuthCallback
  // API mode restores the Lovv session from the HttpOnly refresh cookie. isAuthSessionRestoring
  // itself stays a plain useState (rather than being derived from this query, the way the
  // saved-plans loading flag was) because it must flip to false in the SAME effect/commit that
  // commits currentUser/authAccessToken — deriving it separately would let the route guard observe
  // isAuthSessionRestoring=false with currentUser still null for one render, mis-redirecting to
  // /auth. The OAuth-callback exchange flows elsewhere in this file also set it directly, outside
  // of this query's lifecycle.
  const authSessionQuery = useQuery({
    queryKey: ['authSession', authRuntimeMode],
    queryFn: async () => {
      const state = await requestAuthSession()
      // isInitialAuthSessionQueryEnabled guarantees authRuntimeMode is 'api' or 'cognito' whenever
      // this runs, but that guarantee lives outside this closure so TS can't narrow authRuntimeMode
      // itself here (unlike the OAuth callback effects below, which guard with
      // `if (!isApiAuthMode) return` in-body, letting TS narrow via aliased-condition analysis).
      return adaptApiAuthSessionSnapshot(state, isCognitoAuthMode ? 'cognito' : 'api')
    },
    enabled: isInitialAuthSessionQueryEnabled,
    // A 401 here means "no refresh cookie / not logged in" — a definitive, non-transient result,
    // not a flaky network failure. React Query's default retry (3 attempts, ~7s of backoff) was
    // leaving isAuthSessionRestoring (and therefore the sign-in buttons) stuck disabled on every
    // first visit while it retried a request that was never going to succeed.
    retry: false,
  })
  const [pendingAuthRedirectPath, setPendingAuthRedirectPath] = useState<string | null>(null)
  const [selectedPreferenceProfile, setSelectedPreferenceProfile] = useState(
    () => (isBackendAuthMode ? null : readStoredPreferenceProfile()) ?? getDefaultPreferenceProfile(),
  )
  const [hasCompletedPreference, setHasCompletedPreference] = useState(
    () => !isBackendAuthMode && Boolean(readStoredPreferenceProfile()),
  )
  const selectedPreferences = useMemo(
    () => getPreferencesForProfile(selectedPreferenceProfile),
    [selectedPreferenceProfile],
  )
  const selectedPreference = selectedPreferences[0] ?? preferences[0]
  const selectedPreferenceLabel = getPreferenceProfileLabel(selectedPreferenceProfile)
  const [activeMonthlyRecommendation, setActiveMonthlyRecommendation] = useState(monthlyRecommendations[0])
  const [activeViewOverride, setActiveViewOverride] = useState<View | null>(null)
  const routedView = getCanonicalViewFromPath(location.pathname) ?? 'auth'
  const activeView =
    activeViewOverride && location.pathname === getPathForView(activeViewOverride)
      ? activeViewOverride
      : routedView
  const authCallbackProvider = getAuthCallbackProvider(location.pathname)
  const shouldHandleCognitoAuthCallback = isCognitoAuthMode && isCognitoAuthCallbackPath(location.pathname)
  const shouldHandleAuthCallback =
    (isApiAuthMode && Boolean(authCallbackProvider)) || shouldHandleCognitoAuthCallback
  const [pendingPreferenceProfile, setPendingPreferenceProfile] = useState(() => selectedPreferenceProfile)
  const [selectedPreviewImageKey, setSelectedPreviewImageKey] = useState<string | null>(null)
  const [isPreviewTrayOpen, setIsPreviewTrayOpen] = useState(false)
  const [hasSelectedCover, setHasSelectedCover] = useState(false)
  // 축제 질문 비활성화로 기본값을 'exclude'로 설정 (shouldAskFestivalTheme = false)
  const [festivalThemeChoice, setFestivalThemeChoice] = useState<FestivalThemeChoice>('exclude')
  const [selectedDurationLabel, setSelectedDurationLabel] = useState<string | null>(null)
  const [selectedTravelMonth, setSelectedTravelMonth] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState('')
  const closeQuickActions = useUiToggleStore((state) => state.closeQuickActions)
  const closeSessionMenu = useUiToggleStore((state) => state.closeSessionMenu)
  const [savedPlanNotice, setSavedPlanNotice] = useState<string | null>(null)
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null)
  const [themeSelectionNotice, setThemeSelectionNotice] = useState<string | null>(null)
  const [isPreferenceSaving, setIsPreferenceSaving] = useState(false)
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
  const [pendingSavedPlanLikeIds, setPendingSavedPlanLikeIds] = useState<string[]>([])
  const [pendingSavedPlanDeleteIds, setPendingSavedPlanDeleteIds] = useState<string[]>([])
  const [savedPlanLikeErrors, setSavedPlanLikeErrors] = useState<Record<string, string>>({})
  const clearSavedPlanUiState = useCallback((clearStorage = false) => {
    setSavedPlans([])
    setSavedPlanLikes({})
    setPendingSavedPlanLikeIds([])
    setPendingSavedPlanDeleteIds([])
    setSavedPlanLikeErrors({})
    if (clearStorage) {
      clearStoredSavedPlanState()
    }
  }, [])
  // Declared early (rather than alongside the other saved-plans effects below) because the
  // route-detail redirect guard's `hasRoutePlan`/`isBackendRoutePlanLoading` computation needs
  // this query's live isFetching/isPending flags in the SAME render they change in. Computing
  // "is restoring" via a separate useState+useEffect mirror introduced a one-render lag (the
  // effect hadn't committed yet when the guard effect read the old state), which raced the
  // guard into redirecting away before the fetch had a chance to start or finish. Deriving the
  // flags directly from the query object during render removes that lag entirely.
  const routePlanId = getPlanDetailRouteId(location.pathname)
  const shouldLoadSavedPlans =
    isBackendAuthMode && !isAuthSessionRestoring && !shouldHandleAuthCallback && Boolean(currentUser) && Boolean(authAccessToken)
  const savedPlansQuery = useQuery({
    // Deliberately NOT keyed on currentPlanId/isPlannerReady: those are read fresh from the
    // closure whenever a fetch actually runs, but including them here would cause spurious
    // refetches (and a transient empty `data`) on every unrelated planner-state render, which
    // raced with the route-detail redirect guard below.
    queryKey: ['savedPlans', authAccessToken, routePlanId],
    queryFn: async () => {
      const result = await requestListSavedPlans({ accessToken: authAccessToken as string })
      let nextSavedPlans = result.savedPlans
      let nextSavedPlanLikes = result.likes
      let routePlanLoadFailed = false

      const shouldLoadRoutePlanDetail =
        Boolean(routePlanId) && !(routePlanId === currentPlanId && isPlannerReady)

      if (
        shouldLoadRoutePlanDetail &&
        routePlanId &&
        !nextSavedPlans.some((plan) => plan.id === routePlanId)
      ) {
        try {
          const routeSavedPlan = await requestGetSavedPlan(routePlanId, {
            accessToken: authAccessToken as string,
          })

          nextSavedPlans = [routeSavedPlan, ...nextSavedPlans]
          if (routeSavedPlan.isLiked) {
            nextSavedPlanLikes = {
              ...nextSavedPlanLikes,
              [routeSavedPlan.id]: 'like',
            }
          }
        } catch {
          routePlanLoadFailed = true
        }
      }

      writeStoredSavedPlans(nextSavedPlans)
      writeStoredSavedPlanLikes(nextSavedPlanLikes)

      return { savedPlans: nextSavedPlans, savedPlanLikes: nextSavedPlanLikes, routePlanLoadFailed }
    },
    enabled: shouldLoadSavedPlans,
  })
  // Derived directly from the query's live state every render (no useState/useEffect mirror —
  // see comment above `routePlanId` for why). isPending (no data yet) is included alongside
  // isFetching because right when `enabled` flips true there's one render where the query
  // hasn't started fetching yet (isFetching still false) but also has no data (isPending true);
  // isFetching alone would report "not loading" for that one render.
  const isSavedPlansRestoring =
    shouldLoadSavedPlans && (savedPlansQuery.isFetching || savedPlansQuery.isPending)
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
  const [plannerPreferenceProfile, setPlannerPreferenceProfile] = useState(() => selectedPreferenceProfile)

  // Keep plannerPreferenceProfile in sync when the global profile changes (e.g. after session restore).
  // Only sync when the planner is idle (no city context and no stops generated yet).
  useEffect(() => {
    if (!plannerCityContext && planDraft.stops.length === 0) {
      setPlannerPreferenceProfile(selectedPreferenceProfile)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreferenceProfile])

  const plannerPreferences = useMemo(
    () => getPreferencesForProfile(plannerPreferenceProfile),
    [plannerPreferenceProfile],
  )
  const plannerPreference = plannerPreferences[0] ?? selectedPreference
  const plannerPreferenceLabel = getPreferenceProfileLabel(plannerPreferenceProfile)
  const plannerThemeHashtags = getThemeHashtags(plannerPreferenceProfile)
  const [plannerConditionExtraction, setPlannerConditionExtraction] =
    useState<MockConditionExtraction | null>(null)
  const [plannerContextText, setPlannerContextText] = useState('')
  const [plannerCityContext, setPlannerCityContext] = useState<PlannerCityContext | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    createInitialChatMessages(selectedPreferenceLabel),
  )
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => createPlanDraft(selectedPreference))
  const [generatedPlanDestinationName, setGeneratedPlanDestinationName] = useState<string | null>(null)
  const [isPlannerLoading, setIsPlannerLoading] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const smallCityCatalogQueryKey = createSmallCityApiQuery({ pageSize: defaultSmallCityApiPageSize })
  const smallCityCatalogQuery = useQuery({
    queryKey: ['smallCityCatalog', smallCityCatalogQueryKey],
    queryFn: () => requestListSmallCities({ pageSize: defaultSmallCityApiPageSize }),
  })
  const smallCityCatalogState = createSmallCityCatalogStateFromQueryResult(
    smallCityCatalogQuery,
    smallCityCatalogQueryKey,
  )
  const [cityMapCountry, setCityMapCountry] = useState<SmallCityCountry>('KR')
  const [cityMapQuery, setCityMapQuery] = useState('')
  const [selectedSmallCityThemes, setSelectedSmallCityThemes] = useState<SmallCityTheme[]>([])
  const [cityMapPanelMode, setCityMapPanelMode] = useState<'list' | 'detail'>('list')
  const [selectedSmallCityId, setSelectedSmallCityId] = useState('')
  const [currentHeroThemeIndex, setCurrentHeroThemeIndex] = useState(0)
  const isPreferenceEditView = activeView === 'preferences' || activeView === 'preferenceEdit'
  const pendingPreferences = useMemo(
    () => getPreferencesForProfile(pendingPreferenceProfile),
    [pendingPreferenceProfile],
  )
  const activePreferenceProfile = isPreferenceEditView ? pendingPreferenceProfile : selectedPreferenceProfile
  const activeCountryTrack = activePreferenceProfile.countryTrack
  const activeThemeIds =
    isPreferenceEditView || hasSelectedCover ? activePreferenceProfile.selectedThemeIds : []
  const activeThemeLabels = getThemeLabels(activeThemeIds)
  const activeThemePreferences = activeThemeIds.map(getPreferenceByThemeId)
  const hasValidThemeSelection = activeThemeIds.length > 0 && activeThemeIds.length <= 3
  const fallbackPreferenceSelection = isPreferenceEditView
    ? pendingPreferences[0] ?? preferences[0]
    : selectedPreference
  const selectedPreviewImages = (
    activeThemePreferences.length > 0 ? activeThemePreferences : [fallbackPreferenceSelection]
  ).flatMap((preference, preferenceIndex) =>
    preference.coverImages.map((coverImage, coverImageIndex) => ({
      ...coverImage,
      key: `${preference.themeId}-${coverImageIndex}-${coverImage.city}`,
      tag: preference.tag,
      themeIndex: preferenceIndex,
    })),
  )
  const selectedPreviewPrimaryImage =
    selectedPreviewImages.find((previewImage) => previewImage.key === selectedPreviewImageKey) ??
    selectedPreviewImages[0] ??
    {
      ...fallbackPreferenceSelection.coverImages[0],
      key: `${fallbackPreferenceSelection.themeId}-0-fallback`,
      tag: fallbackPreferenceSelection.tag,
      themeIndex: 0,
    }
  const selectedPreviewPreference =
    activeThemePreferences[selectedPreviewPrimaryImage.themeIndex] ?? activeThemePreferences[0] ?? fallbackPreferenceSelection
  const selectedPreviewImageIndex = Math.max(
    selectedPreviewImages.findIndex((previewImage) => previewImage.key === selectedPreviewPrimaryImage.key),
    0,
  )
  const selectedPreviewThumbnails = selectedPreviewImages.filter(
    (previewImage) => previewImage.key !== selectedPreviewPrimaryImage.key,
  )
  const selectedPreviewTrayCover = selectedPreviewThumbnails[0]
  const selectedPreviewThemePosition =
    selectedPreviewImages.length > 0 ? `${selectedPreviewImageIndex + 1} / ${selectedPreviewImages.length}` : '1 / 1'
  const selectedThemeHashtags = getThemeHashtags(selectedPreferenceProfile)
  const recommendationBasisHashtags = getRecommendationBasisHashtags(selectedPreferenceProfile)
  const currentHeroTheme = heroThemes[currentHeroThemeIndex]
  const shouldAskFestivalTheme = false  // 축제 질문 비활성화 - 여행 월 선택으로 대체
  const shouldShowFestivalPrompt = false
  const shouldShowDurationPrompt = selectedDurationLabel === null
  const shouldShowTravelMonthPrompt =
    shouldAskTravelMonthForCity(plannerCityContext, festivalThemeChoice) &&
    selectedDurationLabel !== null &&
    selectedTravelMonth === null
  const hasSettledFestivalChoice = true
  const hasGuidedPlannerChoices =
    selectedDurationLabel !== null && !shouldShowTravelMonthPrompt
  const isPlannerReady = hasGuidedPlannerChoices && plannerConditionExtraction !== null
  const canSubmitChatInput = hasGuidedPlannerChoices && chatInput.trim().length > 0 && !isPlannerLoading
  const plannerBasisLabel = plannerCityContext
    ? `${plannerCityContext.cityName} · ${plannerCityContext.region}`
    : plannerPreferenceLabel
  const currentPlanId = createPlanId(
    plannerBasisLabel,
    planDraft,
    festivalThemeChoice,
    plannerCityContext,
    plannerConditionExtraction,
  )
  const currentPlanTitle = plannerCityContext
    ? `${plannerBasisLabel} ${planDraft.durationLabel} 초안`
    : `${plannerBasisLabel} ${planDraft.durationLabel} 초안`
  const savedPlanForRoute = useMemo(
    () => (routePlanId ? savedPlans.find((plan) => plan.id === routePlanId) ?? null : null),
    [routePlanId, savedPlans],
  )
  const getSavedPlanLike = (planId: string): SavedPlanLike => savedPlanLikes[planId] ?? null
  const isSavedPlanLikePending = (planId: string) => pendingSavedPlanLikeIds.includes(planId)
  const isSavedPlanDeletePending = (planId: string) => pendingSavedPlanDeleteIds.includes(planId)
  const getSavedPlanLikeError = (planId: string) => savedPlanLikeErrors[planId] ?? null
  const savedCurrentPlan = savedPlans.find(
    (plan) => plan.id === currentPlanId || plan.sourceRecommendationId === currentPlanId,
  )
  const isCurrentPlanSaved = Boolean(savedCurrentPlan)
  const isCurrentPlanLiked = getSavedPlanLike(currentPlanId) === 'like'
  const isRouteCurrentGeneratedPlan = routePlanId === currentPlanId && isPlannerReady
  const isBackendRoutePlanLoading =
    isBackendAuthMode && Boolean(routePlanId) && isSavedPlansRestoring
  // Falls back to the query's own (fresher) data when the route plan isn't in local `savedPlans`
  // yet. The instant the query reaches `status: 'success'`, `isSavedPlansRestoring` correctly
  // flips to false in the same render — but the data-sync effect that copies
  // `savedPlansQuery.data` into local `savedPlans` state hasn't committed yet (effects run after
  // render), so `savedPlanForRoute` (derived from local state) is still stale/null for that one
  // render. Without this fallback, that gap render computes `hasRoutePlan: false` and the
  // redirect guard (which also runs as an effect, but is declared earlier and so runs first)
  // navigates away before the sync effect gets a chance to update local state.
  const savedPlanForRouteFromQuery = routePlanId
    ? savedPlansQuery.data?.savedPlans.find((plan) => plan.id === routePlanId) ?? null
    : null
  const hasRoutePlan = Boolean(
    routePlanId &&
      (isRouteCurrentGeneratedPlan ||
        savedPlanForRoute ||
        savedPlanForRouteFromQuery ||
        isBackendRoutePlanLoading),
  )
  const savedRoutePlanDraft = useMemo<PlanDraft | null>(() => {
    if (!savedPlanForRoute) {
      return null
    }

    const days =
      savedPlanForRoute.days && savedPlanForRoute.days.length > 0
        ? savedPlanForRoute.days
        : [
            {
              day: 1,
              title: '저장된 일정',
              summary: savedPlanForRoute.summary,
              stops: savedPlanForRoute.stops,
            },
          ]

    return {
      durationLabel: savedPlanForRoute.durationLabel,
      dayCount: days.length,
      intensityLabel: savedPlanForRoute.intensityLabel,
      festivalThemeLabel: savedPlanForRoute.festivalThemeLabel,
      summary: savedPlanForRoute.summary,
      days,
      stops: savedPlanForRoute.stops,
    }
  }, [savedPlanForRoute])
  const activePlanDetailId = isRouteCurrentGeneratedPlan ? currentPlanId : savedPlanForRoute?.id ?? currentPlanId
  const activePlanDetailDraft = isRouteCurrentGeneratedPlan ? planDraft : savedRoutePlanDraft ?? planDraft
  const activePlanDetailTitle = isRouteCurrentGeneratedPlan
    ? currentPlanTitle
    : savedPlanForRoute?.title ?? currentPlanTitle
  const activePlanDetailBasisLabel = isRouteCurrentGeneratedPlan
    ? plannerBasisLabel
    : savedPlanForRoute?.cityPair ?? plannerBasisLabel
  const isActivePlanDetailReady = isRouteCurrentGeneratedPlan || Boolean(savedPlanForRoute)
  const activeSavedPlanDetailLike = getSavedPlanLike(activePlanDetailId)
  const isActivePlanDetailSaved = isRouteCurrentGeneratedPlan ? isCurrentPlanSaved : Boolean(savedPlanForRoute)
  const activeCountrySmallCities = useMemo(
    () => smallCityCatalogState.cities.filter((city) => city.country === cityMapCountry),
    [cityMapCountry, smallCityCatalogState.cities],
  )
  const filteredSmallCities = useMemo(
    () =>
      filterSmallCities(activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes, {
        includeDiscoveryText: false,
      }),
    [activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes],
  )
  const visibleSmallCityMapMarkers = useMemo(
    () => createSmallCityMapMarkers(filteredSmallCities),
    [filteredSmallCities],
  )
  const selectedSmallCity = useMemo(() => {
    if (!selectedSmallCityId || filteredSmallCities.length === 0) {
      return null
    }

    return filteredSmallCities.find((city) => city.id === selectedSmallCityId) ?? null
  }, [filteredSmallCities, selectedSmallCityId])
  const selectedSmallCityDetailState = useMemo(() => {
    if (!selectedSmallCity) {
      return createSmallCityDetailEmptyState(selectedSmallCityId)
    }

    return createStaticSmallCityDetailState(selectedSmallCity.id, smallCityCatalogState.cities)
  }, [selectedSmallCity, selectedSmallCityId, smallCityCatalogState.cities])
  const plannerStateCityChips = plannerCityContext
    ? [plannerCityContext.cityName, plannerCityContext.region]
    : getThemeLabels(plannerPreferenceProfile.selectedThemeIds)
  const plannerConditionSummary = plannerConditionExtraction
    ? [
        shouldAskFestivalTheme ? getFestivalThemeLabel(festivalThemeChoice) : null,
        selectedDurationLabel ?? planDraft.durationLabel,
        selectedTravelMonth ? getTravelMonthLabel(selectedTravelMonth) : null,
        formatThemeList(plannerConditionExtraction.activeRequiredThemes),
        ...plannerConditionExtraction.softPreferences.slice(0, 2),
      ]
        .filter(Boolean)
        .join(' · ')
    : [
        shouldAskFestivalTheme ? getFestivalThemeLabel(festivalThemeChoice) : null,
        selectedDurationLabel ?? '기간 미정',
        selectedTravelMonth ? getTravelMonthLabel(selectedTravelMonth) : null,
      ]
        .filter(Boolean)
        .join(' · ')
  const plannerStateSteps: PlannerStateStep[] = [
    {
      id: 'preference',
      label: '취향 반영',
      status: 'completed',
      statusLabel: '완료',
      body: plannerCityContext
        ? `${plannerPreferenceLabel} 취향은 유지하고 선택한 소도시를 일정 출발점으로 사용합니다.`
        : `${plannerPreferenceLabel} 기준 테마로 시작합니다.`,
      chips: plannerThemeHashtags,
    },
    {
      id: 'candidates',
      label: '후보 탐색',
      status: hasSettledFestivalChoice ? 'completed' : 'active',
      statusLabel: hasSettledFestivalChoice ? '완료' : '진행 중',
      body: plannerCityContext
        ? `${plannerCityContext.countryLabel} ${plannerCityContext.region}의 ${plannerCityContext.cityName} 상세 정보를 기준 후보로 고정했습니다.`
        : '선택한 분위기와 가까운 한국·일본 소도시 후보를 좁히고 있어요.',
      chips: plannerStateCityChips,
    },
    {
      id: 'schedule',
      label: '일정 구성',
      status: isPlannerReady ? 'completed' : hasSettledFestivalChoice ? 'active' : 'pending',
      statusLabel: isPlannerReady ? '완료' : hasSettledFestivalChoice ? '진행 중' : '대기',
      body: isPlannerReady
        ? `${plannerConditionSummary} 조건으로 구성 중입니다.`
          : hasGuidedPlannerChoices
            ? '동행, 관심사, 걷는 정도를 자연어로 입력하면 초안이 완성됩니다.'
          : shouldShowDurationPrompt
            ? '여행 기간을 선택해 주세요.'
            : shouldShowTravelMonthPrompt
              ? '여행 예정 월을 선택해 주세요.'
              : '여행 기간과 월을 먼저 선택해 주세요.',
      chips: isPlannerReady
        ? ['초안 준비', planDraft.intensityLabel]
        : hasGuidedPlannerChoices
          ? ['조건 입력 대기', selectedDurationLabel ?? '기간 선택됨']
          : ['대기중'],
    },
  ]

  const navigateToView = (view: View, options: { replace?: boolean } = {}) => {
    const nextView: View =
      view === 'chat' ? 'planner' : view === 'preferenceEdit' ? 'preferences' : view
    const nextPath = getPathForView(nextView, nextView === 'planDetail' ? currentPlanId : undefined)

    setActiveViewOverride(nextView === 'themeDetail' ? nextView : null)

    if (nextView === 'themeDetail' && location.pathname === nextPath) {
      return
    }

    navigate(nextPath, { replace: options.replace })
  }

  useEffect(() => {
    if (!pendingAuthRedirectPath || isAuthSessionRestoring || !currentUser) {
      return
    }

    if (location.pathname !== pendingAuthRedirectPath) {
      navigate(pendingAuthRedirectPath, { replace: true })
    }

    queueMicrotask(() => {
      setPendingAuthRedirectPath(null)
    })
  }, [currentUser, isAuthSessionRestoring, location.pathname, navigate, pendingAuthRedirectPath])

  useEffect(() => {
    if (isAuthSessionRestoring || shouldHandleAuthCallback || pendingAuthRedirectPath) {
      return
    }

    const legacyRedirectPath = getLegacyViewRedirectPath(
      location.search,
      isPlannerReady ? currentPlanId : null,
    )

    if (legacyRedirectPath) {
      navigate(legacyRedirectPath, { replace: true })
      return
    }

    const guardRedirectPath = getGuardRedirectPath({
      pathname: location.pathname,
      isAuthenticated: Boolean(currentUser),
      hasCompletedPreference,
      hasRoutePlan,
    })

    if (guardRedirectPath && guardRedirectPath !== location.pathname) {
      navigate(guardRedirectPath, { replace: true })
      return
    }

  }, [
    currentPlanId,
    currentUser,
    hasCompletedPreference,
    hasRoutePlan,
    isAuthSessionRestoring,
    isSavedPlansRestoring,
    isPlannerReady,
    location.pathname,
    location.search,
    navigate,
    pendingAuthRedirectPath,
    shouldHandleAuthCallback,
  ])


  // All state from a settled session-restore attempt is applied in a single effect (rather than
  // splitting into separate then/catch/finally microtask continuations the way the original code
  // did) so currentUser/authAccessToken/hasCompletedPreference/isAuthSessionRestoring always
  // commit together in the same render.
  useEffect(() => {
    if (authSessionQuery.status === 'success') {
      const session = authSessionQuery.data

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthAccessToken(session.accessToken)
      commitCurrentUser(session.user, readStoredSocialAuthProvider())
      setHasCompletedPreference(session.onboardingCompleted)

      if (session.preferenceProfile) {
        setSelectedPreferenceProfile(session.preferenceProfile)
        storePreferenceProfile(session.preferenceProfile)
      } else if (session.onboardingCompleted) {
        // Backend confirmed onboarding done but returned no preference
        // (e.g. empty mappedThemes or SameSite cookie issue on prior request).
        // Fall back to locally cached preference to avoid defaulting to 온천·휴양.
        const localProfile = readStoredPreferenceProfile()
        if (localProfile) {
          setSelectedPreferenceProfile(localProfile)
        }
      }
      setIsAuthSessionRestoring(false)
    } else if (authSessionQuery.status === 'error') {
      setAuthAccessToken(null)
      commitCurrentUser(null)
      setHasCompletedPreference(false)
      clearSavedPlanUiState(true)
      setIsAuthSessionRestoring(false)
    }
  }, [
    authSessionQuery.status,
    authSessionQuery.data,
    clearSavedPlanUiState,
    commitCurrentUser,
  ])

  useEffect(() => {
    const isAuthEntryPath = location.pathname === '/' || location.pathname === getPathForView('auth')

    if (
      !isBackendAuthMode ||
      activeView !== 'auth' ||
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
    activeView,
    currentUser,
    isAuthSessionRestoring,
    isBackendAuthMode,
    isCognitoAuthMode,
    location.pathname,
    shouldHandleAuthCallback,
  ])

  // Clears saved-plan UI state when the user is signed out / has no access token. The query's
  // own `enabled: shouldLoadSavedPlans` guard already prevents fetching in this case; this just
  // resets locally-held state (the query has no data to mirror once it's disabled).
  useEffect(() => {
    if (!isBackendAuthMode || isAuthSessionRestoring || shouldHandleAuthCallback) {
      return
    }

    if (!currentUser || !authAccessToken) {
      // Resets locally-mutable saved plan UI state in response to auth state changing; this
      // state can't be derived directly during render since other call sites
      // (like/unlike/delete/create) mutate it independently.
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

  // Sync successful query results into local state. savedPlans/savedPlanLikes remain plain
  // useState (rather than reading savedPlansQuery.data directly) because other mutations
  // elsewhere in this file (like/unlike/delete/create) still update them optimistically —
  // those call sites migrate in a later step.
  useEffect(() => {
    if (!savedPlansQuery.data) {
      return
    }

    // savedPlans/savedPlanLikes intentionally remain plain useState (rather than reading
    // savedPlansQuery.data directly in render) because other mutations elsewhere in this file
    // (like/unlike/delete/create) still update them optimistically; those call sites migrate to
    // React Query in a later step.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedPlans(savedPlansQuery.data.savedPlans)
    setSavedPlanLikes(savedPlansQuery.data.savedPlanLikes)

    if (savedPlansQuery.data.routePlanLoadFailed) {
      setSavedPlanNotice('저장 일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [savedPlansQuery.data])

  useEffect(() => {
    if (savedPlansQuery.isError) {
      // Mirrors a query-level error into the existing UI notice state; no direct render-time
      // equivalent without duplicating this same notice logic at every other failure call site.
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

      window.location.assign(authorizationUrl)
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
    // OAuth callback exchanges provider code through the backend and then resumes app routing.
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
    // Gate result-commit on the ref (set above, only overwritten by a *different* callbackKey)
    // rather than a per-effect-instance `isActive` flag tied to this closure's cleanup. This effect
    // has several dependencies (mutation objects, callbacks) that can get new references on a
    // render unrelated to this OAuth attempt; when that happens React tears down and re-runs this
    // effect, which previously flipped a closure-local `isActive` to false via cleanup *before* the
    // in-flight mutateAsync() promise resolved. The exchange would still succeed on the backend, but
    // the success branch's state updates were silently skipped — leaving the UI stuck on the loading
    // screen forever even though the session cookie was already set (visible only after closing the
    // tab and revisiting the app fresh). Checking the ref instead correctly tells the difference
    // between "a harmless re-render re-ran this effect" (ref still matches, commit the result) and
    // "a genuinely new callback superseded this one" (ref now holds a different key, skip).
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
        setAuthAccessToken(session.accessToken)
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
    commitCurrentUser,
    getAccountLinkErrorNotice,
    isApiAuthMode,
    linkProviderMutation,
    location.search,
    navigate,
    queryClient,
  ])

  // Combines both steps of the Cognito exchange into one mutation, since they're always invoked
  // together (token exchange immediately followed by bridging the resulting JWT to a Lovv session).
  const cognitoBridgeMutation = useMutation({
    mutationFn: (request: Parameters<typeof requestCognitoToken>[0]) =>
      requestCognitoToken(request).then((token) => requestCognitoBridgeSession(token.idToken ?? token.accessToken)),
  })

  useEffect(() => {
    // Cognito mode exchanges the Hosted UI authorization code first, then bridges the Cognito JWT to Lovv.
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
    // See the matching comment in the api-mode OAuth callback effect above: gate on the ref (only
    // overwritten by a genuinely different callbackKey) rather than a per-effect-instance `isActive`
    // flag, so a harmless re-render that re-runs this effect mid-exchange doesn't cause the
    // already-in-flight token/session exchange's result to be silently dropped on arrival.
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
        setAuthAccessToken(session.accessToken)
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
    commitCurrentUser,
    location.search,
    navigate,
    shouldHandleCognitoAuthCallback,
  ])

  // Recovery fallback for a dropped callback continuation.
  //
  // The Cognito callback effect above creates the Lovv session cookie server-side, then drives the
  // exit off the callback URL purely through its in-tab promise continuation. If that continuation
  // is ever lost — e.g. a remount after `lovv.auth.processed_callback` was already set, so the
  // effect early-returns without re-driving navigation — the cookie exists but this tab stays on
  // `/auth/callback/cognito` showing AuthLoadingView forever. (A fresh tab opened at `/` recovers
  // via the session query, which is why reopening the app then looks logged in.) The session query
  // is disabled on the callback path, so nothing else re-checks. This timeout re-reads the session
  // from the cookie and resumes routing if we're still stuck after the grace period.
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
      // Still on the callback page with no authenticated user => the continuation was dropped.
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
          setAuthAccessToken(session.accessToken)
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
    commitCurrentUser,
    currentUser,
    location.search,
    navigate,
    shouldHandleCognitoAuthCallback,
  ])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setCurrentHeroThemeIndex((themeIndex) => (themeIndex + 1) % heroThemes.length)
    }, heroRotationIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const resetPlannerFlow = (
    preference = selectedPreference,
    cityContext: PlannerCityContext | null = plannerCityContext,
    profile: PreferenceProfile = selectedPreferenceProfile,
  ) => {
    const nextPlannerContextText = getPlannerCitySeedText(cityContext)
    const nextPlannerLabel = getPreferenceProfileLabel(profile)
    const shouldAskFestival = shouldAskFestivalForCity(cityContext)
    const nextFestivalThemeChoice: FestivalThemeChoice = shouldAskFestival ? 'undecided' : 'exclude'

    setChatInput('')
    setFestivalThemeChoice(nextFestivalThemeChoice)
    setSelectedDurationLabel(null)
    setSelectedTravelMonth(null)
    setPlannerPreferenceProfile(profile)
    setPlannerConditionExtraction(null)
    setPlannerCityContext(cityContext)
    setPlannerContextText(nextPlannerContextText)
    setChatMessages(createInitialChatMessages(nextPlannerLabel, cityContext, shouldAskFestival))
    setPlanDraft(createPlanDraft(preference, nextPlannerContextText, nextFestivalThemeChoice, cityContext))
    setSavedPlanNotice(null)
    setGeneratedPlanDestinationName(null)
  }

  const createGeneratedPlanSavePayload = (
    plan: SavedPlan,
    sourceRecommendationId: string,
  ): SavedPlanApiCreatePayload => ({
    sourceRecommendationId,
    idempotencyKey: sourceRecommendationId,
    title: plan.title,
    summary: plan.summary,
    destination: {
      destinationId: plannerCityContext?.agentCoreId ?? plannerCityContext?.cityId ?? sourceRecommendationId,
      name: plannerCityContext?.cityName ?? plannerBasisLabel,
      country: plannerCityContext?.country ?? 'KR',
      region: plannerCityContext?.region ?? plannerBasisLabel,
    },
    tripType: plan.durationLabel.replace(/\s+/g, '-'),
    durationLabel: plan.durationLabel,
    themes: plannerCityContext ? plannerCityContext.themes : plannerPreferenceProfile.selectedThemeIds,
    festivalChoice: festivalThemeChoice,
    intensityLabel: plan.intensityLabel,
    preferenceSnapshot: {
      selectedThemeIds: plannerPreferenceProfile.selectedThemeIds,
      source: plannerPreferenceProfile.source,
      updatedAt: plannerPreferenceProfile.updatedAt,
    },
    conditionsSnapshot: {
      festivalThemeChoice,
      selectedTravelMonth,
      activeRequiredThemes: plannerConditionExtraction?.activeRequiredThemes ?? [],
      softPreferences: plannerConditionExtraction?.softPreferences ?? [],
      unsupportedConditions: plannerConditionExtraction?.unsupportedConditions ?? [],
      cityId: plannerCityContext?.cityId ?? null,
    },
    requestSummary: plan.conditionSummary,
    itinerary: {
      days: plan.days ?? [],
    },
  })

  const createSavedPlanMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof createGeneratedPlanSavePayload>) =>
      requestCreateSavedPlan(payload, { accessToken: authAccessToken }),
  })

  const saveGeneratedPlan = async () => {
    if (!isPlannerReady) {
      return
    }

    setSavedPlanNotice(null)
    setIsSavingPlan(true)

    const themeLabels = plannerCityContext
      ? plannerCityContext.themes
      : getThemeLabels(plannerPreferenceProfile.selectedThemeIds)
    const savedAt = new Date().toISOString()
    const sourceRecommendationId = currentPlanId
    const draftPlan: SavedPlan = {
      id: currentPlanId,
      sourceRecommendationId,
      ownerId: currentUser?.id ?? 'mock-user',
      title: currentPlanTitle,
      cityPair: plannerBasisLabel,
      themeTag: themeLabels.join('·'),
      themeLabels,
      conditionSummary: plannerConditionSummary,
      durationLabel: planDraft.durationLabel,
      festivalThemeLabel: planDraft.festivalThemeLabel,
      intensityLabel: planDraft.intensityLabel,
      summary: planDraft.summary,
      days: planDraft.days,
      stops: planDraft.stops,
      createdAt: savedAt,
      savedAt,
    }
    let nextPlan = draftPlan

    if (isBackendAuthMode) {
      try {
        const savedPlanResult = await createSavedPlanMutation.mutateAsync(
          createGeneratedPlanSavePayload(draftPlan, sourceRecommendationId),
        )

        nextPlan = {
          ...draftPlan,
          id: savedPlanResult.itineraryId,
          sourceRecommendationId: savedPlanResult.sourceRecommendationId || sourceRecommendationId,
          savedAt: savedPlanResult.savedAt || savedAt,
          createdAt: savedPlanResult.savedAt || savedAt,
        }
      } catch {
        setSavedPlanNotice('일정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
        setIsSavingPlan(false)
        return
      }
    }

    setSavedPlans((currentPlans) => {
      const existingPlan = currentPlans.find(
        (plan) => plan.id === currentPlanId || plan.sourceRecommendationId === sourceRecommendationId,
      )
      const updatedPlan = existingPlan
        ? {
            ...nextPlan,
            createdAt: existingPlan.createdAt,
          }
        : nextPlan
      const nextPlans = [
        updatedPlan,
        ...currentPlans.filter(
          (plan) => plan.id !== currentPlanId && plan.sourceRecommendationId !== sourceRecommendationId,
        ),
      ]

      writeStoredSavedPlans(nextPlans)

      return nextPlans
    })
    if (nextPlan.id !== currentPlanId && getSavedPlanLike(currentPlanId)) {
      setSavedPlanLikes((currentLikes) => {
        const nextLikes = {
          ...currentLikes,
          [nextPlan.id]: currentLikes[currentPlanId],
        }

        writeStoredSavedPlanLikes(nextLikes)

        return nextLikes
      })
    }
    setSavedPlanNotice('마이페이지에서 다시 확인할 수 있어요.')
    setIsSavingPlan(false)
  }

  const removeSavedPlanFromLocalState = (planId: string) => {
    const matchedPlan = savedPlans.find((plan) => plan.id === planId || plan.sourceRecommendationId === planId)
    const sourceRecommendationId = matchedPlan?.sourceRecommendationId
    const savedPlanIdsToRemove = [planId, matchedPlan?.id, sourceRecommendationId].filter(
      (savedPlanId): savedPlanId is string => Boolean(savedPlanId),
    )

    setSavedPlans((currentPlans) => {
      const nextPlans = currentPlans.filter(
        (plan) => plan.id !== planId && plan.sourceRecommendationId !== planId,
      )

      writeStoredSavedPlans(nextPlans)

      return nextPlans
    })
    setSavedPlanLikes((currentLikes) => {
      const nextLikes = { ...currentLikes }

      delete nextLikes[planId]
      if (matchedPlan?.id) {
        delete nextLikes[matchedPlan.id]
      }
      if (sourceRecommendationId) {
        delete nextLikes[sourceRecommendationId]
      }
      writeStoredSavedPlanLikes(nextLikes)

      return nextLikes
    })
    setPendingSavedPlanLikeIds((currentPlanIds) =>
      currentPlanIds.filter((currentPlanId) => !savedPlanIdsToRemove.includes(currentPlanId)),
    )
    setPendingSavedPlanDeleteIds((currentPlanIds) =>
      currentPlanIds.filter((currentPlanId) => !savedPlanIdsToRemove.includes(currentPlanId)),
    )
    setSavedPlanLikeErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      delete nextErrors[planId]
      if (matchedPlan?.id) {
        delete nextErrors[matchedPlan.id]
      }
      if (sourceRecommendationId) {
        delete nextErrors[sourceRecommendationId]
      }

      return nextErrors
    })
  }

  const deleteSavedPlanMutation = useMutation({
    mutationFn: (backendPlanId: string) =>
      requestDeleteSavedPlan(backendPlanId, { accessToken: authAccessToken }),
  })

  const deleteSavedPlan = async (planId: string, options: { navigateToMyPage?: boolean } = {}) => {
    const matchedPlan = savedPlans.find((plan) => plan.id === planId || plan.sourceRecommendationId === planId)
    const pendingPlanIds = getSavedPlanLikeIds(planId, matchedPlan)

    if (pendingPlanIds.some((pendingPlanId) => pendingSavedPlanDeleteIds.includes(pendingPlanId))) {
      return
    }

    const deleteTargetTitle = matchedPlan?.title ?? '이 저장 일정'
    const shouldDelete =
      typeof window.confirm !== 'function' ||
      window.confirm(`${deleteTargetTitle}을 삭제할까요? 삭제 후에는 복구할 수 없어요.`)

    if (!shouldDelete) {
      return
    }

    setSavedPlanNotice(null)
    setPendingSavedPlanDeleteIds((currentPlanIds) =>
      Array.from(new Set([...currentPlanIds, ...pendingPlanIds])),
    )

    if (isBackendAuthMode) {
      const backendPlanId = matchedPlan?.id ?? planId

      try {
        await deleteSavedPlanMutation.mutateAsync(backendPlanId)
      } catch {
        setSavedPlanNotice('저장 일정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
        setPendingSavedPlanDeleteIds((currentPlanIds) =>
          currentPlanIds.filter((currentPlanId) => !pendingPlanIds.includes(currentPlanId)),
        )
        return
      }
    }

    removeSavedPlanFromLocalState(planId)
    setSavedPlanNotice('저장한 일정이 삭제됐어요.')

    if (options.navigateToMyPage) {
      navigate('/mypage', { replace: true })
    }
  }

  const getSavedPlanLikeIds = (planId: string, plan?: SavedPlan) =>
    Array.from(
      new Set(
        [planId, plan?.id, plan?.sourceRecommendationId].filter(
          (savedPlanId): savedPlanId is string => Boolean(savedPlanId),
        ),
      ),
    )

  const commitSavedPlanLikeState = (
    planId: string,
    nextLike: SavedPlanLike,
    matchedPlan?: SavedPlan,
  ) => {
    const likeIds = getSavedPlanLikeIds(planId, matchedPlan)

    setSavedPlanLikes((currentLikes) => {
      const nextLikes = { ...currentLikes }

      likeIds.forEach((likeId) => {
        if (nextLike) {
          nextLikes[likeId] = nextLike
        } else {
          delete nextLikes[likeId]
        }
      })
      writeStoredSavedPlanLikes(nextLikes)

      return nextLikes
    })
    setSavedPlans((currentPlans) => {
      const nextPlans = currentPlans.map((plan) =>
        likeIds.includes(plan.id) || (plan.sourceRecommendationId && likeIds.includes(plan.sourceRecommendationId))
          ? {
              ...plan,
              isLiked: Boolean(nextLike),
            }
          : plan,
      )

      writeStoredSavedPlans(nextPlans)

      return nextPlans
    })
  }

  // pendingSavedPlanLikeIds/savedPlanLikeErrors stay plain useState (keyed maps tracking multiple
  // concurrent plan ids) rather than being derived from this mutation, which only tracks one
  // in-flight call at a time.
  const savedPlanLikeMutation = useMutation({
    mutationFn: ({ planId, like }: { planId: string; like: SavedPlanLike }) =>
      like
        ? requestLikeSavedPlan(planId, { accessToken: authAccessToken })
        : requestUnlikeSavedPlan(planId, { accessToken: authAccessToken }),
  })

  const selectSavedPlanLike = async (planId: string, like: Exclude<SavedPlanLike, null>) => {
    const matchedPlan = savedPlans.find((plan) => plan.id === planId || plan.sourceRecommendationId === planId)
    const nextLike = getNextSavedPlanLike(getSavedPlanLike(planId), like)

    setPendingSavedPlanLikeIds((currentPlanIds) =>
      currentPlanIds.includes(planId) ? currentPlanIds : [...currentPlanIds, planId],
    )
    setSavedPlanLikeErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      getSavedPlanLikeIds(planId, matchedPlan).forEach((likeId) => {
        delete nextErrors[likeId]
      })

      return nextErrors
    })

    if (isBackendAuthMode && matchedPlan?.id) {
      try {
        await savedPlanLikeMutation.mutateAsync({ planId: matchedPlan.id, like: nextLike })

        commitSavedPlanLikeState(planId, nextLike, matchedPlan)
      } catch {
        setSavedPlanLikeErrors((currentErrors) => ({
          ...currentErrors,
          [planId]: '좋아요를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
        }))
      } finally {
        setPendingSavedPlanLikeIds((currentPlanIds) =>
          currentPlanIds.filter((currentPlanId) => currentPlanId !== planId),
        )
      }

      return
    }

    try {
      commitSavedPlanLikeState(planId, nextLike, matchedPlan)
    } catch {
      setSavedPlanLikeErrors((currentErrors) => ({
        ...currentErrors,
        [planId]: '좋아요를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      }))
    } finally {
      setPendingSavedPlanLikeIds((currentPlanIds) =>
        currentPlanIds.filter((currentPlanId) => currentPlanId !== planId),
      )
    }
  }

  const toggleGeneratedPlanLike = () => {
    if (!isPlannerReady) {
      return
    }

    selectSavedPlanLike(currentPlanId, 'like')
  }

  const openPlanDetailView = () => {
    if (!isPlannerReady) {
      return
    }

    setSavedPlanNotice(null)
    navigateToView('planDetail')
  }

  const openSavedPlanDetail = (planId: string) => {
    setSavedPlanNotice(null)
    navigate(`/plans/${encodeURIComponent(planId)}`)
  }

  const returnToChatWorkspace = () => {
    navigateToView('planner', { replace: true })
  }

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
    navigateToView(hasStoredPreference ? 'home' : 'onboarding', { replace: true })
  }

  const startPreparedOAuthSignIn = (provider: SocialAuthProvider) => {
    const preparedAuthorizationUrl = preparedAuthRedirectUrls[provider]

    if (!preparedAuthorizationUrl) {
      return false
    }

    setAuthFlowNotice(null)
    setSignInPendingProvider(provider)
    window.location.assign(preparedAuthorizationUrl)

    return true
  }

  const startApiOAuthSignIn = async (provider: SocialAuthProvider) => {
    if (startPreparedOAuthSignIn(provider)) {
      return
    }

    try {
      setAuthFlowNotice(null)
      setSignInPendingProvider(provider)
      // Provider secrets stay server-side; frontend only starts the public authorization request.
      const authorizationRequest = await createOAuthAuthorizationRequest(provider, {
        origin: window.location.origin,
        storage: window.sessionStorage,
      })

      window.location.assign(authorizationRequest.authorizationUrl)
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

      window.location.assign(authorizationRequest.authorizationUrl)
    } catch (error) {
      setSignInPendingProvider(null)
      setAuthFlowNotice(getAuthExceptionNotice(error))
    }
  }

  const authLogoutMutation = useMutation({
    mutationFn: () => requestAuthLogout({ accessToken: authAccessToken }),
  })

  const signOut = async () => {
    closeSessionMenu()

    if (isBackendAuthMode) {
      try {
        await authLogoutMutation.mutateAsync()
      } catch {
        // Keep the UI from remaining on authenticated screens after a local sign-out action.
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
        window.location.assign(createCognitoLogoutUrl({ origin: window.location.origin }))
        return
      } catch (error) {
        setAuthFlowNotice(getAuthExceptionNotice(error))
      }
    }

    navigateToView('auth', { replace: true })
  }

  const goHome = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    closeSessionMenu()
    navigateToView('home')
  }

  const openMap = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    closeSessionMenu()
    closeQuickActions()
    navigateToView('map')
  }

  const openMyPage = () => {
    closeSessionMenu()
    navigateToView('mypage')
  }

  const openPreferenceEdit = () => {
    setPendingPreferenceProfile(selectedPreferenceProfile)
    setSelectedPreviewImageKey(null)
    setIsPreviewTrayOpen(false)
    setHasSelectedCover(true)
    setPreferenceNotice(null)
    setThemeSelectionNotice(null)
    navigateToView('preferences')
  }

  const cancelPreferenceEdit = () => {
    setPendingPreferenceProfile(selectedPreferenceProfile)
    setSelectedPreviewImageKey(null)
    setIsPreviewTrayOpen(false)
    setHasSelectedCover(false)
    setThemeSelectionNotice(null)
    navigateToView('mypage', { replace: true })
  }

  const currentSocialProviderForDisplay = resolveSocialAuthProvider(currentUser, currentSocialAuthProvider)
  const currentProviderLabel = currentUser
    ? currentSocialProviderForDisplay
      ? providerLabels[currentSocialProviderForDisplay]
      : '소셜 로그인'
    : '로그인 세션'

  const authNotice = isBackendAuthMode
    ? isCognitoAuthMode
      ? 'Google 또는 Kakao 계정으로 안전하게 로그인합니다.'
      : 'API auth mode입니다. OAuth authorization_code callback으로 로그인합니다.'
    : undefined

  const openChat = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    closeSessionMenu()
    resetPlannerFlow(selectedPreference, null, selectedPreferenceProfile)
    navigateToView('planner')
  }

  const openChatFromQuickAction = () => {
    closeQuickActions()
    openChat()
  }

  const scrollToTop = () => {
    closeQuickActions()
    navigateToView('home')
    window.scrollTo?.({ behavior: 'smooth', top: 0 })
  }

  const createSinglePreferenceProfile = (
    preference: Preference,
    source: PreferenceProfileSource,
  ) => createPreferenceProfile([preference.themeId], source, selectedPreferenceProfile.countryTrack)

  const openMonthlyRecommendationDetail = (recommendation: MonthlyRecommendation) => {
    setActiveMonthlyRecommendation(recommendation)
    closeQuickActions()
    navigateToView('themeDetail')
  }

  const openMonthlyRecommendationPlan = (preference: Preference) => {
    const nextProfile = createSinglePreferenceProfile(preference, 'preference_edit')

    resetPlannerFlow(preference, null, nextProfile)
    closeQuickActions()
    navigateToView('planner')
  }

  const selectCityMapCountry = (country: SmallCityCountry) => {
    setCityMapCountry(country)
    setSelectedSmallCityId('')
    setCityMapPanelMode('list')
  }

  const toggleSmallCityThemeFilter = (theme: SmallCityTheme) => {
    setSelectedSmallCityThemes((currentThemes) =>
      currentThemes.includes(theme)
        ? currentThemes.filter((currentTheme) => currentTheme !== theme)
        : [...currentThemes, theme],
    )
    setCityMapPanelMode('list')
  }

  const clearSmallCityFilters = () => {
    setCityMapQuery('')
    setSelectedSmallCityThemes([])
    setSelectedSmallCityId('')
    setCityMapPanelMode('list')
  }

  const selectSmallCityFromList = (city: SmallCity) => {
    if (selectedSmallCityId === city.id) {
      setSelectedSmallCityId('')
      setCityMapPanelMode('list')
      return
    }

    setSelectedSmallCityId(city.id)
    setCityMapPanelMode('detail')

    window.setTimeout(() => {
      if (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 1279px)').matches
      ) {
        cityMapDetailPanelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 0)
  }

  const selectSmallCityMapMarker = (marker: SmallCityMapMarker) => {
    if (selectedSmallCityId === marker.cityId) {
      setSelectedSmallCityId('')
      setCityMapPanelMode('list')
      return
    }

    setSelectedSmallCityId(marker.cityId)
    setCityMapPanelMode('detail')
  }

  const openSmallCityPlanner = (city: SmallCity) => {
    const selectedDetail =
      selectedSmallCityDetailState.status === 'success' && selectedSmallCityDetailState.detail.city.id === city.id
        ? selectedSmallCityDetailState.detail
        : null
    const cityContext = createPlannerCityContext(city, selectedDetail)

    resetPlannerFlow(selectedPreference, cityContext, selectedPreferenceProfile)
    closeQuickActions()
    navigateToView('planner')
  }

  // Shared by both preference-save flows below (onboarding entry and My Page preference edit).
  // isPreferenceSaving stays a plain useState (set explicitly in each flow's try/finally) rather
  // than being derived from this mutation's isPending, since only the onboarding flow's button
  // actually reads it — keeping the existing explicit set calls avoids any behavior change there.
  const updatePreferenceMutation = useMutation({
    mutationFn: (profile: PreferenceProfile) =>
      requestUpdatePreference(profile, { accessToken: authAccessToken }),
  })

  const enterMainWithPreference = async () => {
    if (!hasValidThemeSelection) {
      setThemeSelectionNotice('원하는 테마를 1개 이상 선택해 주세요.')
      return
    }

    setIsPreferenceSaving(true)
    setThemeSelectionNotice(null)

    try {
      const preferenceProfile = isBackendAuthMode
        ? await updatePreferenceMutation.mutateAsync(selectedPreferenceProfile)
        : selectedPreferenceProfile

      storePreferenceProfile(preferenceProfile)
      setSelectedPreferenceProfile(preferenceProfile)
      setHasCompletedPreference(true)
      navigateToView('home', { replace: true })
    } catch {
      setThemeSelectionNotice('취향 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsPreferenceSaving(false)
    }
  }

  const savePreferenceEdit = async () => {
    if (!hasValidThemeSelection) {
      setThemeSelectionNotice('원하는 테마를 1개 이상 선택해 주세요.')
      return
    }

    setIsPreferenceSaving(true)
    setThemeSelectionNotice(null)

    try {
      const preferenceProfile = isBackendAuthMode
        ? await updatePreferenceMutation.mutateAsync(pendingPreferenceProfile)
        : pendingPreferenceProfile

      storePreferenceProfile(preferenceProfile)
      setSelectedPreferenceProfile(preferenceProfile)
      setHasCompletedPreference(true)
      resetPlannerFlow(getPrimaryPreference(preferenceProfile), null, preferenceProfile)
      setSelectedPreviewImageKey(null)
      setIsPreviewTrayOpen(false)
      setHasSelectedCover(false)
      setPreferenceNotice('취향이 변경됐어요. 다음 AI 일정부터 반영됩니다.')
      navigateToView('mypage', { replace: true })
    } catch {
      setThemeSelectionNotice('취향 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsPreferenceSaving(false)
    }
  }

  const selectPreferenceCountryTrack = (countryTrack: CountryTrack) => {
    const nextProfile = {
      ...activePreferenceProfile,
      countryTrack,
      updatedAt: new Date().toISOString(),
    }

    if (isPreferenceEditView) {
      setPendingPreferenceProfile(nextProfile)
    } else {
      setSelectedPreferenceProfile(nextProfile)
    }
  }

  const togglePreferenceTheme = (themeId: ThemeId) => {
    const source = isPreferenceEditView ? 'preference_edit' : 'onboarding'
    const currentThemeIds = activeThemeIds
    const isSelected = currentThemeIds.includes(themeId)
    const nextThemeIds = isSelected
      ? currentThemeIds.filter((currentThemeId) => currentThemeId !== themeId)
      : currentThemeIds.length >= 3
        ? currentThemeIds
        : [...currentThemeIds, themeId]

    if (!isSelected && currentThemeIds.length >= 3) {
      setThemeSelectionNotice('기준 테마는 최대 3개까지 선택할 수 있어요.')
      return
    }

    const nextProfile = createPreferenceProfile(nextThemeIds, source, activePreferenceProfile.countryTrack)

    if (isPreferenceEditView) {
      setPendingPreferenceProfile(nextProfile)
    } else {
      setSelectedPreferenceProfile(nextProfile)
    }

    setSelectedPreviewImageKey(null)
    setIsPreviewTrayOpen(false)
    setHasSelectedCover(nextThemeIds.length > 0)
    setThemeSelectionNotice(
      nextThemeIds.length > 0
        ? `${nextThemeIds.length}/3개 기준 테마가 선택됐어요.`
        : '원하는 테마를 1개 이상 선택해 주세요.',
    )
  }

  const selectPreviewImage = (imageKey: string) => {
    setSelectedPreviewImageKey(imageKey)
    setIsPreviewTrayOpen(false)
  }

  const createRecommendationMutation = useMutation({
    mutationFn: (payload: Parameters<typeof requestCreateRecommendation>[0]) =>
      requestCreateRecommendation(payload),
  })

  const submitChatMessage = async (message: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return
    }

    if (shouldShowFestivalPrompt) {
      const nextFestivalThemeChoice = resolveFestivalThemeChoice(trimmedMessage, festivalThemeChoice)

      if (nextFestivalThemeChoice === 'undecided') {
        return
      }

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('user', currentMessages.length),
          role: 'user',
          content: trimmedMessage,
        },
        {
          id: createMessageId('assistant', currentMessages.length + 1),
          role: 'assistant',
          content: `${getFestivalThemeLabel(nextFestivalThemeChoice)} 기준으로 볼게요. 이제 여행 기간을 먼저 골라주세요.`,
        },
      ])
      setFestivalThemeChoice(nextFestivalThemeChoice)
      setSavedPlanNotice(null)
      setChatInput('')

      return
    }

    if (selectedDurationLabel === null) {
      const nextSelectedDurationLabel = getExplicitDurationLabel(trimmedMessage)

      if (!nextSelectedDurationLabel) {
        return
      }

      const nextDraft = createPlanDraft(
        plannerPreference,
        `${nextSelectedDurationLabel} ${plannerContextText}`.trim(),
        festivalThemeChoice,
        plannerCityContext,
        selectedTravelMonth,
      )
      const shouldAskTravelMonth = shouldAskTravelMonthForCity(plannerCityContext, festivalThemeChoice)
      const nextExtraction = plannerCityContext
        ? createMockConditionExtraction(
            '',
            getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
          )
        : null
      const assistantContent = shouldAskTravelMonth
        ? '선택한 축제 데이터가 월별로 달라요. 여행 예정 월을 골라주세요.'
        : nextExtraction
          ? createAssistantReply(plannerBasisLabel, nextDraft, nextExtraction, plannerCityContext)
        : `${nextSelectedDurationLabel}로 잡아둘게요. 여행하는 달을 알려주세요.`

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('user', currentMessages.length),
          role: 'user',
          content: trimmedMessage,
        },
        {
          id: createMessageId('assistant', currentMessages.length + 1),
          role: 'assistant',
          content: assistantContent,
        },
      ])
      setSelectedDurationLabel(nextSelectedDurationLabel)
      setSelectedTravelMonth(null)
      setPlannerConditionExtraction(shouldAskTravelMonth ? null : nextExtraction)
      setPlanDraft(nextDraft)
      setSavedPlanNotice(null)
      setChatInput('')

      return
    }

    if (shouldShowTravelMonthPrompt) {
      const nextTravelMonth = getExplicitTravelMonth(trimmedMessage)

      if (!nextTravelMonth) {
        return
      }

      const nextPlannerContextText = `${plannerContextText} ${getTravelMonthLabel(nextTravelMonth)}`.trim()
      const nextDraft = createPlanDraft(
        plannerPreference,
        `${selectedDurationLabel} ${nextPlannerContextText}`,
        festivalThemeChoice,
        plannerCityContext,
        nextTravelMonth,
      )
      const nextExtraction = createMockConditionExtraction(
        '',
        getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
      )

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('user', currentMessages.length),
          role: 'user',
          content: getTravelMonthLabel(nextTravelMonth),
        },
        {
          id: createMessageId('assistant', currentMessages.length + 1),
          role: 'assistant',
          content: createAssistantReply(plannerBasisLabel, nextDraft, nextExtraction, plannerCityContext),
        },
      ])
      setSelectedTravelMonth(nextTravelMonth)
      setPlannerContextText(nextPlannerContextText)
      // plannerConditionExtraction은 NL 입력 후 API 호출 완료 시점에 설정 (즉시 draft 표시 방지)
      setPlannerConditionExtraction(null)
      setPlanDraft(nextDraft)
      setSavedPlanNotice(null)
      setChatInput('')

      return
    }

    const nextPlannerContextText = `${plannerContextText} ${trimmedMessage}`.trim()
    const nextExtraction = createMockConditionExtraction(
      trimmedMessage,
      getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
    )

    // Add user message immediately and loading placeholder message
    const userMessageId = createMessageId('user', chatMessages.length)
    const assistantLoadingMessageId = 'loading-assistant'

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        role: 'user',
        content: trimmedMessage,
      },
      {
        id: assistantLoadingMessageId,
        role: 'assistant',
        content: trimmedMessage,
      },
    ])

    setChatInput('')
    setIsPlannerLoading(true)

    try {
      const tripTypeMap: Record<string, 'daytrip' | '2d1n' | '3d2n' | '4d3n' | '5d4n'> = {
        '당일치기': 'daytrip',
        '1박 2일': '2d1n',
        '2박 3일': '3d2n',
        '3박 4일': '4d3n',
        '4박 5일': '5d4n',
      }
      
      const mappedTripType = tripTypeMap[selectedDurationLabel || ''] || '2d1n'
      const response = await createRecommendationMutation.mutateAsync({
        entryType: 'chat',
        country: plannerCityContext?.country || 'KR',
        tripType: mappedTripType,
        themes: getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
        includeFestivals: false,
        destinationId: plannerCityContext?.agentCoreId ?? plannerCityContext?.cityId,
        naturalLanguageQuery: trimmedMessage,
        travelYear: new Date().getFullYear(),
        travelMonth: selectedTravelMonth ?? new Date().getMonth() + 1,
      })

      const realDraft = mapRecommendationToDraft(response)

      // 백엔드가 준 userNotice가 itinerary.summary와 겹치는 경우 중복 표시 방지
      const filteredNotices = (realDraft.userNotice || []).filter(
        (notice) => notice !== response.itinerary?.summary
      )

      const userNoticeText =
        filteredNotices.length > 0
          ? '\n\n' + filteredNotices.join('\n')
          : ''

      setChatMessages((currentMessages) => [
        ...currentMessages.filter((m) => m.id !== assistantLoadingMessageId),
        {
          id: createMessageId('assistant', currentMessages.length),
          role: 'assistant',
          content: `${response.itinerary?.summary || '일정이 성공적으로 생성되었습니다.'} 우측에 생성된 일정을 둘러보세요.${userNoticeText}`,
        },
      ])

      setPlannerContextText(nextPlannerContextText)
      setPlannerConditionExtraction(nextExtraction)
      setPlanDraft(realDraft)
      setSavedPlanNotice(null)
      const destName = response.destination?.name
      if (destName && !String(destName).toLowerCase().includes('mock')) {
        setGeneratedPlanDestinationName(destName)
      }
    } catch (err) {
      console.error('API integration failed, falling back to mock logic:', err)
      
      // Resilient fallback to local mock generation
      const fallbackDraft = createPlanDraft(
        plannerPreference,
        `${selectedDurationLabel} ${nextPlannerContextText}`,
        festivalThemeChoice,
        plannerCityContext,
        selectedTravelMonth,
      )

      setChatMessages((currentMessages) => [
        ...currentMessages.filter((m) => m.id !== assistantLoadingMessageId),
        {
          id: createMessageId('assistant', currentMessages.length),
          role: 'assistant',
          content: '추천 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.',
        },
      ])

      setPlannerContextText(nextPlannerContextText)
      setPlannerConditionExtraction(nextExtraction)
      setPlanDraft(fallbackDraft)
      setSavedPlanNotice(null)
    } finally {
      setIsPlannerLoading(false)
    }
  }

  const submitChatForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitChatMessage(chatInput)
  }


  const renderCityMapDiscoverySection = () => (
    <CityMapDiscoverySection
      cityMapDetailPanelRef={cityMapDetailPanelRef}
      cityMapCountry={cityMapCountry}
      cityMapQuery={cityMapQuery}
      selectedSmallCityThemes={selectedSmallCityThemes}
      selectedPreferenceProfile={selectedPreferenceProfile}
      smallCityCatalogState={smallCityCatalogState}
      activeCountrySmallCities={activeCountrySmallCities}
      filteredSmallCities={filteredSmallCities}
      visibleSmallCityMapMarkers={visibleSmallCityMapMarkers}
      selectedSmallCity={selectedSmallCity}
      selectedSmallCityDetailState={selectedSmallCityDetailState}
      cityMapPanelMode={cityMapPanelMode}
      onSelectCountry={selectCityMapCountry}
      onQueryChange={(query) => {
        setCityMapQuery(query)
        setCityMapPanelMode('list')
      }}
      onClearFilters={clearSmallCityFilters}
      onToggleThemeFilter={toggleSmallCityThemeFilter}
      onSelectCityFromList={selectSmallCityFromList}
      onSelectMapMarker={selectSmallCityMapMarker}
      onSetPanelMode={setCityMapPanelMode}
      onOpenPlanner={openSmallCityPlanner}
    />
  )




  const isAuthCallbackLoading = isBackendAuthMode && shouldHandleAuthCallback
  const isProtectedRouteAuthSessionLoading =
    isBackendAuthMode && isAuthSessionRestoring && activeView !== 'auth'
  const shouldShowAuthLoadingView = isAuthCallbackLoading || isProtectedRouteAuthSessionLoading

  return (
    <main className="lovv-app-shell lovv-warm-pattern lovv-ambient-background min-h-dvh bg-[#fff8ee] text-[#33271E]">
      <div className="lovv-app-content">
        {shouldShowAuthLoadingView ? (
          <AuthLoadingView />
        ) : activeView === 'auth' ? (
        <AuthView
          authExceptionNotice={authFlowNotice}
          authNotice={authNotice}
          isSignInDisabled={isAuthSessionRestoring || shouldHandleAuthCallback}
          signInPendingProvider={signInPendingProvider}
          onSignIn={
            isCognitoAuthMode
              ? startCognitoOAuthSignIn
              : isApiAuthMode
                ? startApiOAuthSignIn
                : signInWithMockProvider
          }
        />
      ) : activeView === 'onboarding' || isPreferenceEditView ? (
        <OnboardingPreferenceView
          isPreferenceEditView={isPreferenceEditView}
          hasSelectedCover={hasSelectedCover}
          activeThemeIds={activeThemeIds}
          activeThemeLabels={activeThemeLabels}
          activeThemePreferences={activeThemePreferences}
          activeCountryTrack={activeCountryTrack}
          hasValidThemeSelection={hasValidThemeSelection}
          themeSelectionNotice={themeSelectionNotice}
          isPreferenceSaving={isPreferenceSaving}
          selectedPreviewThemePosition={selectedPreviewThemePosition}
          selectedPreviewPreference={selectedPreviewPreference}
          selectedPreviewPrimaryImage={selectedPreviewPrimaryImage}
          selectedPreviewTrayCover={selectedPreviewTrayCover}
          selectedPreviewThumbnails={selectedPreviewThumbnails}
          isPreviewTrayOpen={isPreviewTrayOpen}
          onToggleTheme={togglePreferenceTheme}
          onSelectCountryTrack={selectPreferenceCountryTrack}
          onCancelPreferenceEdit={cancelPreferenceEdit}
          onSavePreferenceEdit={savePreferenceEdit}
          onEnterMainWithPreference={enterMainWithPreference}
          onPreviewTrayOpenChange={setIsPreviewTrayOpen}
          onSelectPreviewImage={selectPreviewImage}
        />
      ) : (
        <>
          <AppHeader
            goHome={goHome}
            currentProviderLabel={currentProviderLabel}
            currentUser={currentUser}
            openMyPage={openMyPage}
            signOut={signOut}
          />

          {activeView === 'home' ? (
            <HomeView
              currentHeroTheme={currentHeroTheme}
              selectedPreferenceProfile={selectedPreferenceProfile}
              selectedThemeHashtags={selectedThemeHashtags}
              recommendationBasisHashtags={recommendationBasisHashtags}
              openChat={openChat}
              openMap={openMap}
              onOpenMonthlyRecommendationDetail={openMonthlyRecommendationDetail}
              onOpenChatFromQuickAction={openChatFromQuickAction}
              onScrollToTop={scrollToTop}
            />
          ) : activeView === 'map' ? (
            <div className="pt-[72px]">
              {renderCityMapDiscoverySection()}
            </div>
          ) : activeView === 'themeDetail' ? (
            <ThemeDetailView recommendation={activeMonthlyRecommendation} goHome={goHome} openMonthlyRecommendationPlan={openMonthlyRecommendationPlan} />
          ) : activeView === 'planDetail' ? (
            <ErrorBoundary>
              <PlanDetailView
                isPlannerReady={isActivePlanDetailReady}
                shouldAskFestivalTheme={shouldAskFestivalTheme}
                returnToChatWorkspace={returnToChatWorkspace}
                currentPlanTitle={activePlanDetailTitle}
                planDraft={activePlanDetailDraft}
                plannerBasisLabel={activePlanDetailBasisLabel}
                cityImageUrl={plannerCityContext?.imageUrl ?? undefined}
                destinationName={plannerCityContext?.cityName ?? generatedPlanDestinationName ?? undefined}
                planId={activePlanDetailId}
                planLike={activeSavedPlanDetailLike}
                onSelectSavedPlanLike={selectSavedPlanLike}
                savedPlanLikePending={isSavedPlanLikePending(activePlanDetailId)}
                savedPlanLikeError={getSavedPlanLikeError(activePlanDetailId)}
                isSavedPlanDetailLoading={isBackendRoutePlanLoading}
                saveGeneratedPlan={saveGeneratedPlan}
                isPlanSaving={isSavingPlan}
                isCurrentPlanSaved={isActivePlanDetailSaved}
                savedPlanDeletePending={isSavedPlanDeletePending(activePlanDetailId)}
                onDeleteSavedPlan={deleteSavedPlan}
                openMyPage={openMyPage}
                savedPlanNotice={savedPlanNotice}
              />
            </ErrorBoundary>
          ) : activeView === 'mypage' ? (
            <MyPageView
              goHome={goHome}
              currentProviderLabel={currentProviderLabel}
              selectedPreferenceLabel={selectedPreferenceLabel}
              savedPlanNotice={savedPlanNotice}
              preferenceNotice={preferenceNotice}
              currentUser={currentUser}
              savedPlans={savedPlans}
              getSavedPlanLike={getSavedPlanLike}
              onSelectSavedPlanLike={selectSavedPlanLike}
              getSavedPlanLikeError={getSavedPlanLikeError}
              isSavedPlanLikePending={isSavedPlanLikePending}
              isSavedPlanDeletePending={isSavedPlanDeletePending}
              openSavedPlanDetail={openSavedPlanDetail}
              onDeleteSavedPlan={deleteSavedPlan}
              openPreferenceEdit={openPreferenceEdit}
              signOut={signOut}
              canLinkSocialAccounts={isApiAuthMode}
              socialAccounts={socialAccountsQuery.data ?? []}
              linkingProvider={linkingProvider}
              accountLinkNotice={accountLinkNotice}
              onLinkProvider={startLinkProvider}
              onUpdateProfile={updateProfile}
              isUpdatingProfile={isUpdatingProfile}
              profileUpdateError={profileUpdateError}
            />
          ) : (
            <ErrorBoundary>
              <PlannerWorkspace
                goHome={goHome}
                plannerCityContext={plannerCityContext}
                shouldAskFestivalTheme={shouldAskFestivalTheme}
                plannerPreferenceLabel={plannerPreferenceLabel}
                plannerStateSteps={plannerStateSteps}
                chatMessages={chatMessages}
                shouldShowFestivalPrompt={shouldShowFestivalPrompt}
                festivalThemeChoice={festivalThemeChoice}
                submitChatMessage={submitChatMessage}
                shouldShowDurationPrompt={shouldShowDurationPrompt}
                shouldShowTravelMonthPrompt={shouldShowTravelMonthPrompt}
                isPlannerReady={isPlannerReady}
                planDraft={planDraft}
                plannerConditionExtraction={plannerConditionExtraction}
                chatInput={chatInput}
                setChatInput={setChatInput}
                selectedTravelMonth={selectedTravelMonth}
                hasGuidedPlannerChoices={hasGuidedPlannerChoices}
                canSubmitChatInput={canSubmitChatInput}
                submitChatForm={submitChatForm}
                currentPlanTitle={currentPlanTitle}
                plannerPreferenceProfile={plannerPreferenceProfile}
                openPlanDetailView={openPlanDetailView}
                isCurrentPlanLiked={isCurrentPlanLiked}
                toggleGeneratedPlanLike={toggleGeneratedPlanLike}
                resetPlannerFlow={() => resetPlannerFlow()}
                saveGeneratedPlan={saveGeneratedPlan}
                isPlanSaving={isSavingPlan}
                isCurrentPlanSaved={isCurrentPlanSaved}
                openMyPage={openMyPage}
                savedPlanNotice={savedPlanNotice}
                isPlannerLoading={isPlannerLoading}
                planDestinationName={plannerCityContext?.cityName ?? generatedPlanDestinationName ?? undefined}
              />
            </ErrorBoundary>
          )}

          <Footer />
        </>
        )}
        <LegalNoticeDialog />
      </div>
    </main>
  )
}

export default App

// EOF: App.tsx
