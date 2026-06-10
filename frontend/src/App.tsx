import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthView } from './features/auth/AuthView'
import { authStorageKey, mockAuthUsers, readStoredUser } from './features/auth/authModel'
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
  createSmallCityDetailEmptyState,
  createStaticSmallCityCatalogState,
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
import {
  getNextPlanReaction,
  readStoredPlanReactions,
  readStoredSavedPlans,
  savedPlansStorageKey,
  writeStoredPlanReactions,
  type PlanReactionMap,
} from './features/saved-plans/savedPlansStorage'
import { AppHeader } from './shared/components/AppHeader'
import { Footer } from './shared/components/Footer'
import {
  getCanonicalViewFromPath,
  getGuardRedirectPath,
  getLegacyViewRedirectPath,
  getPathForView,
  getPlanDetailRouteId,
} from './shared/components/viewRouting'
import type {
  AuthProvider,
  ChatMessage,
  FestivalThemeChoice,
  MockConditionExtraction,
  MonthlyRecommendation,
  PlanDay,
  PlanDraft,
  PlanReactionType,
  Preference,
  PreferenceProfile,
  PreferenceProfileSource,
  SavedPlan,
  ThemeId,
  View,
  LovvUser,
} from './shared/types/app'
function App() {
  const cityMapDetailPanelRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<LovvUser | null>(() => readStoredUser())
  const [selectedPreferenceProfile, setSelectedPreferenceProfile] = useState(
    () => readStoredPreferenceProfile() ?? getDefaultPreferenceProfile(),
  )
  const [hasCompletedPreference, setHasCompletedPreference] = useState(() => Boolean(readStoredPreferenceProfile()))
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
  const [pendingPreferenceProfile, setPendingPreferenceProfile] = useState(() => selectedPreferenceProfile)
  const [selectedPreviewImageKey, setSelectedPreviewImageKey] = useState<string | null>(null)
  const [isPreviewTrayOpen, setIsPreviewTrayOpen] = useState(false)
  const [hasSelectedCover, setHasSelectedCover] = useState(false)
  const [festivalThemeChoice, setFestivalThemeChoice] = useState<FestivalThemeChoice>('undecided')
  const [selectedDurationLabel, setSelectedDurationLabel] = useState<string | null>(null)
  const [selectedTravelMonth, setSelectedTravelMonth] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false)
  const [savedPlanNotice, setSavedPlanNotice] = useState<string | null>(null)
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null)
  const [themeSelectionNotice, setThemeSelectionNotice] = useState<string | null>(null)
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => readStoredSavedPlans())
  const [planReactions, setPlanReactions] = useState<PlanReactionMap>(() => readStoredPlanReactions())
  const [pendingReactionPlanIds, setPendingReactionPlanIds] = useState<string[]>([])
  const [planReactionErrors, setPlanReactionErrors] = useState<Record<string, string>>({})
  const [plannerPreferenceProfile, setPlannerPreferenceProfile] = useState(() => selectedPreferenceProfile)
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
  const [selectedPlanDayNumber, setSelectedPlanDayNumber] = useState(1)
  const [smallCityCatalogState] = useState(() => createStaticSmallCityCatalogState())
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
  const selectedPreferenceEditorialNotes = selectedPreferences
    .map((preference) => preference.editorialNote)
    .slice(0, 3)
    .join(' ')
  const selectedThemeHashtags = getThemeHashtags(selectedPreferenceProfile)
  const recommendationBasisHashtags = getRecommendationBasisHashtags(selectedPreferenceProfile)
  const currentHeroTheme = heroThemes[currentHeroThemeIndex]
  const shouldAskFestivalTheme = shouldAskFestivalForCity(plannerCityContext)
  const shouldShowFestivalPrompt = shouldAskFestivalTheme && festivalThemeChoice === 'undecided'
  const shouldShowDurationPrompt = !shouldShowFestivalPrompt && selectedDurationLabel === null
  const shouldShowTravelMonthPrompt =
    !shouldShowFestivalPrompt &&
    selectedDurationLabel !== null &&
    selectedTravelMonth === null &&
    shouldAskTravelMonthForCity(plannerCityContext, festivalThemeChoice)
  const hasSettledFestivalChoice = !shouldAskFestivalTheme || festivalThemeChoice !== 'undecided'
  const hasGuidedPlannerChoices =
    hasSettledFestivalChoice && selectedDurationLabel !== null && !shouldShowTravelMonthPrompt
  const isPlannerReady = hasGuidedPlannerChoices && plannerConditionExtraction !== null
  const canSubmitChatInput = hasGuidedPlannerChoices && chatInput.trim().length > 0
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
  const routePlanId = getPlanDetailRouteId(location.pathname)
  const savedPlanForRoute = useMemo(
    () => (routePlanId ? savedPlans.find((plan) => plan.id === routePlanId) ?? null : null),
    [routePlanId, savedPlans],
  )
  const selectedPlanDay = useMemo<PlanDay>(() => {
    const fallbackDay: PlanDay = {
      day: 1,
      title: '1일차 추천 일정',
      summary: '선택한 조건을 바탕으로 일차별 일정을 구성합니다.',
      stops: [],
    }

    return planDraft.days.find((day) => day.day === selectedPlanDayNumber) ?? planDraft.days[0] ?? fallbackDay
  }, [planDraft.days, selectedPlanDayNumber])
  const getPlanReaction = (planId: string): PlanReactionType => planReactions[planId] ?? null
  const isPlanReactionPending = (planId: string) => pendingReactionPlanIds.includes(planId)
  const getPlanReactionError = (planId: string) => planReactionErrors[planId] ?? null
  const isCurrentPlanSaved = savedPlans.some((plan) => plan.id === currentPlanId)
  const isCurrentPlanLiked = getPlanReaction(currentPlanId) === 'like'
  const isRouteCurrentGeneratedPlan = routePlanId === currentPlanId && isPlannerReady
  const hasRoutePlan = Boolean(routePlanId && (isRouteCurrentGeneratedPlan || savedPlanForRoute))
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
  const activePlanDetailReaction = getPlanReaction(activePlanDetailId)
  const isActivePlanDetailSaved = isRouteCurrentGeneratedPlan ? isCurrentPlanSaved : Boolean(savedPlanForRoute)
  const activeCountrySmallCities = useMemo(
    () => smallCityCatalogState.cities.filter((city) => city.country === cityMapCountry),
    [cityMapCountry, smallCityCatalogState.cities],
  )
  const filteredSmallCities = useMemo(
    () => filterSmallCities(activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes),
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
              ? '축제 기간 확인을 위해 여행 예정 월을 선택해 주세요.'
              : '축제 포함 여부를 먼저 골라주세요.',
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
    isPlannerReady,
    location.pathname,
    location.search,
    navigate,
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
    setSelectedPlanDayNumber(1)
    setSavedPlanNotice(null)
  }

  const saveGeneratedPlan = () => {
    if (!isPlannerReady) {
      return
    }

    const themeLabels = plannerCityContext
      ? plannerCityContext.themes
      : getThemeLabels(plannerPreferenceProfile.selectedThemeIds)
    const savedAt = new Date().toISOString()
    const nextPlan: SavedPlan = {
      id: currentPlanId,
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

    setSavedPlans((currentPlans) => {
      const existingPlan = currentPlans.find((plan) => plan.id === currentPlanId)
      const updatedPlan = existingPlan
        ? {
            ...nextPlan,
            createdAt: existingPlan.createdAt,
          }
        : nextPlan
      const nextPlans = [updatedPlan, ...currentPlans.filter((plan) => plan.id !== currentPlanId)]

      localStorage.setItem(savedPlansStorageKey, JSON.stringify(nextPlans))

      return nextPlans
    })
    setSavedPlanNotice('마이페이지에서 다시 확인할 수 있어요.')
  }

  const selectPlanReaction = (planId: string, reaction: Exclude<PlanReactionType, null>) => {
    setPendingReactionPlanIds((currentPlanIds) =>
      currentPlanIds.includes(planId) ? currentPlanIds : [...currentPlanIds, planId],
    )
    setPlanReactionErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      delete nextErrors[planId]

      return nextErrors
    })
    setPlanReactions((currentReactions) => {
      const nextReaction = getNextPlanReaction(currentReactions[planId] ?? null, reaction)
      const nextReactions = { ...currentReactions }

      if (nextReaction) {
        nextReactions[planId] = nextReaction
      } else {
        delete nextReactions[planId]
      }

      try {
        writeStoredPlanReactions(nextReactions)
      } catch {
        setPlanReactionErrors((currentErrors) => ({
          ...currentErrors,
          [planId]: '반응을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
        }))

        return currentReactions
      } finally {
        setPendingReactionPlanIds((currentPlanIds) =>
          currentPlanIds.filter((currentPlanId) => currentPlanId !== planId),
        )
      }

      return nextReactions
    })
  }

  const toggleGeneratedPlanLike = () => {
    if (!isPlannerReady) {
      return
    }

    selectPlanReaction(currentPlanId, 'like')
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

  const signInWithMockProvider = (provider: AuthProvider) => {
    const mockUser = mockAuthUsers[provider]
    const hasStoredPreference = Boolean(readStoredPreferenceProfile())

    localStorage.setItem(authStorageKey, JSON.stringify(mockUser))
    setCurrentUser(mockUser)
    setHasCompletedPreference(hasStoredPreference)
    navigateToView(hasStoredPreference ? 'home' : 'onboarding', { replace: true })
  }

  const signOut = () => {
    setIsSessionMenuOpen(false)
    localStorage.removeItem(authStorageKey)
    setCurrentUser(null)
    navigateToView('auth', { replace: true })
  }

  const goHome = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    setIsSessionMenuOpen(false)
    navigateToView('home')
  }

  const openMap = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    setIsSessionMenuOpen(false)
    setIsQuickActionsOpen(false)
    navigateToView('map')
  }

  const openMyPage = () => {
    setIsSessionMenuOpen(false)
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

  const currentProviderLabel =
    currentUser?.provider === 'kakao'
      ? 'Kakao mock'
      : currentUser?.provider === 'google'
        ? 'Google mock'
        : 'Mock session'

  const openChat = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    setIsSessionMenuOpen(false)
    resetPlannerFlow(selectedPreference, null, selectedPreferenceProfile)
    navigateToView('planner')
  }

  const toggleSessionMenu = () => {
    setIsSessionMenuOpen((isOpen) => !isOpen)
  }

  const openChatFromQuickAction = () => {
    setIsQuickActionsOpen(false)
    openChat()
  }

  const scrollToTop = () => {
    setIsQuickActionsOpen(false)
    navigateToView('home')
    window.scrollTo?.({ behavior: 'smooth', top: 0 })
  }

  const createSinglePreferenceProfile = (
    preference: Preference,
    source: PreferenceProfileSource,
  ) => createPreferenceProfile([preference.themeId], source)

  const openMonthlyRecommendationDetail = (recommendation: MonthlyRecommendation) => {
    setActiveMonthlyRecommendation(recommendation)
    setIsQuickActionsOpen(false)
    navigateToView('themeDetail')
  }

  const openMonthlyRecommendationPlan = (preference: Preference) => {
    const nextProfile = createSinglePreferenceProfile(preference, 'preference_edit')

    resetPlannerFlow(preference, null, nextProfile)
    setIsQuickActionsOpen(false)
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
    setIsQuickActionsOpen(false)
    navigateToView('planner')
  }

  const enterMainWithPreference = () => {
    if (!hasValidThemeSelection) {
      setThemeSelectionNotice('원하는 테마를 1개 이상 선택해 주세요.')
      return
    }

    storePreferenceProfile(selectedPreferenceProfile)
    setHasCompletedPreference(true)
    navigateToView('home', { replace: true })
  }

  const savePreferenceEdit = () => {
    if (!hasValidThemeSelection) {
      setThemeSelectionNotice('원하는 테마를 1개 이상 선택해 주세요.')
      return
    }

    storePreferenceProfile(pendingPreferenceProfile)
    setSelectedPreferenceProfile(pendingPreferenceProfile)
    setHasCompletedPreference(true)
    resetPlannerFlow(getPrimaryPreference(pendingPreferenceProfile), null, pendingPreferenceProfile)
    setSelectedPreviewImageKey(null)
    setIsPreviewTrayOpen(false)
    setHasSelectedCover(false)
    setThemeSelectionNotice(null)
    setPreferenceNotice('취향이 변경됐어요. 다음 AI 일정부터 반영됩니다.')
    navigateToView('mypage', { replace: true })
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

    const nextProfile = createPreferenceProfile(nextThemeIds, source)

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

  const submitChatMessage = (message: string) => {
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
        : `${nextSelectedDurationLabel}로 잡아둘게요. 이제 동행, 관심사, 걷는 정도를 한 문장으로 알려주세요.`

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
      setSelectedPlanDayNumber(1)
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
      setPlannerConditionExtraction(nextExtraction)
      setPlanDraft(nextDraft)
      setSelectedPlanDayNumber(1)
      setSavedPlanNotice(null)
      setChatInput('')

      return
    }

    const nextPlannerContextText = `${plannerContextText} ${trimmedMessage}`.trim()
    const nextExtraction = createMockConditionExtraction(
      trimmedMessage,
      getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
    )
    const nextDraft = createPlanDraft(
      plannerPreference,
      `${selectedDurationLabel} ${nextPlannerContextText}`,
      festivalThemeChoice,
      plannerCityContext,
      selectedTravelMonth,
    )
    const assistantContent = createAssistantReply(
      plannerBasisLabel,
      nextDraft,
      nextExtraction,
      plannerCityContext,
    )

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
    setPlannerContextText(nextPlannerContextText)
    setPlannerConditionExtraction(nextExtraction)
    setPlanDraft(nextDraft)
    setSelectedPlanDayNumber(1)
    setSavedPlanNotice(null)
    setChatInput('')
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




  return (
    <main className="lovv-app-shell lovv-warm-pattern lovv-ambient-background min-h-dvh bg-[#fff8ee] text-[#33271E]">
      <div className="lovv-app-content">
        {activeView === 'auth' ? (
        <AuthView onSignIn={signInWithMockProvider} />
      ) : activeView === 'onboarding' || isPreferenceEditView ? (
        <OnboardingPreferenceView
          isPreferenceEditView={isPreferenceEditView}
          hasSelectedCover={hasSelectedCover}
          activeThemeIds={activeThemeIds}
          activeThemeLabels={activeThemeLabels}
          activeThemePreferences={activeThemePreferences}
          hasValidThemeSelection={hasValidThemeSelection}
          themeSelectionNotice={themeSelectionNotice}
          selectedPreviewThemePosition={selectedPreviewThemePosition}
          selectedPreviewPreference={selectedPreviewPreference}
          selectedPreviewPrimaryImage={selectedPreviewPrimaryImage}
          selectedPreviewTrayCover={selectedPreviewTrayCover}
          selectedPreviewThumbnails={selectedPreviewThumbnails}
          isPreviewTrayOpen={isPreviewTrayOpen}
          onToggleTheme={togglePreferenceTheme}
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
            isSessionMenuOpen={isSessionMenuOpen}
            toggleSessionMenu={toggleSessionMenu}
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
              isQuickActionsOpen={isQuickActionsOpen}
              onOpenChatFromQuickAction={openChatFromQuickAction}
              onScrollToTop={scrollToTop}
              onToggleQuickActions={() => setIsQuickActionsOpen((isOpen) => !isOpen)}
            />
          ) : activeView === 'map' ? (
            <div className="pt-28">
              {renderCityMapDiscoverySection()}
            </div>
          ) : activeView === 'themeDetail' ? (
            <ThemeDetailView recommendation={activeMonthlyRecommendation} goHome={goHome} openMonthlyRecommendationPlan={openMonthlyRecommendationPlan} />
          ) : activeView === 'planDetail' ? (
            <PlanDetailView
              isPlannerReady={isActivePlanDetailReady}
              shouldAskFestivalTheme={shouldAskFestivalTheme}
              returnToChatWorkspace={returnToChatWorkspace}
              currentPlanTitle={activePlanDetailTitle}
              planDraft={activePlanDetailDraft}
              plannerBasisLabel={activePlanDetailBasisLabel}
              planId={activePlanDetailId}
              planReaction={activePlanDetailReaction}
              onSelectPlanReaction={selectPlanReaction}
              planReactionPending={isPlanReactionPending(activePlanDetailId)}
              planReactionError={getPlanReactionError(activePlanDetailId)}
              saveGeneratedPlan={saveGeneratedPlan}
              isCurrentPlanSaved={isActivePlanDetailSaved}
              openMyPage={openMyPage}
              savedPlanNotice={savedPlanNotice}
            />
          ) : activeView === 'mypage' ? (
            <MyPageView
              goHome={goHome}
              currentProviderLabel={currentProviderLabel}
              selectedPreferenceLabel={selectedPreferenceLabel}
              savedPlanNotice={savedPlanNotice}
              preferenceNotice={preferenceNotice}
              selectedPreferenceEditorialNotes={selectedPreferenceEditorialNotes}
              selectedThemeHashtags={selectedThemeHashtags}
              currentUser={currentUser}
              savedPlans={savedPlans}
              getPlanReaction={getPlanReaction}
              onSelectPlanReaction={selectPlanReaction}
              getPlanReactionError={getPlanReactionError}
              isPlanReactionPending={isPlanReactionPending}
              openSavedPlanDetail={openSavedPlanDetail}
              openPreferenceEdit={openPreferenceEdit}
              signOut={signOut}
            />
          ) : (
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
              selectedPlanDay={selectedPlanDay}
              setSelectedPlanDayNumber={setSelectedPlanDayNumber}
              openPlanDetailView={openPlanDetailView}
              isCurrentPlanLiked={isCurrentPlanLiked}
              toggleGeneratedPlanLike={toggleGeneratedPlanLike}
              resetPlannerFlow={() => resetPlannerFlow()}
              saveGeneratedPlan={saveGeneratedPlan}
              isCurrentPlanSaved={isCurrentPlanSaved}
              savedPlanNotice={savedPlanNotice}
            />
          )}

          <Footer onGoHome={goHome} />
        </>
        )}
      </div>
    </main>
  )
}

export default App
