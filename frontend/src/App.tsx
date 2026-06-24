/**
 * @file App.tsx
 * @description Main Lovv frontend route and state coordinator.
 * @lastModified 2026-06-23
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './features/auth/useAuth'
import { usePreferences } from './features/onboarding/usePreferences'
import { usePlanner } from './features/planner/usePlanner'
import { useCityMap } from './features/map-city/useCityMap'
import { AuthView } from './features/auth/AuthView'
import { heroRotationIntervalMs, heroThemes, monthlyRecommendations } from './features/home/homeContent'
import { HomeView } from './features/home/HomeView'
import { ThemeDetailView } from './features/home/ThemeDetailView'
import { RecommendationView } from './features/recommendation/RecommendationView'
import { CityMapDiscoverySection } from './features/map-city/CityMapDiscoverySection'
import {
  createPlannerCityContext,
  type SmallCity,
} from './features/map-city/smallCities'
import { MyPageView } from './features/my-page/MyPageView'
import { OnboardingPreferenceView } from './features/onboarding/OnboardingPreferenceView'
import { getRecommendationBasisHashtags, getPreferenceProfileLabel } from './features/planner/plannerModel'
import { PlannerWorkspace } from './features/planner/PlannerWorkspace'
import { PlanDetailView } from './features/planner/PlanDetailView'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { AppHeader } from './shared/components/AppHeader'
import { Footer } from './shared/components/Footer'
import { LegalNoticeDialog } from './shared/components/LegalNoticeDialog'
import { useUiToggleStore } from './shared/store/uiToggleStore'
import {
  getCanonicalViewFromPath,
  getGuardRedirectPath,
  getLegacyViewRedirectPath,
  getPathForView,
  getPlanDetailRouteId,
} from './shared/components/viewRouting'
import type {
  MonthlyRecommendation,
  PlanDraft,
  View,
  SocialAuthProvider,
  LovvUser,
  Preference,
  PreferenceProfile,
  PreferenceProfileSource,
} from './shared/types/app'

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

function App() {
  const cityMapDetailPanelRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const plannerRef = useRef<{ currentPlanId: string | null; isPlannerReady: boolean }>({
    currentPlanId: null,
    isPlannerReady: false,
  })

  // Coordinator state variables
  const [activeMonthlyRecommendation, setActiveMonthlyRecommendation] = useState(monthlyRecommendations[0])
  const [activeViewOverride, setActiveViewOverride] = useState<View | null>(null)

  const routedView = getCanonicalViewFromPath(location.pathname) ?? 'auth'
  const activeView =
    activeViewOverride && location.pathname === getPathForView(activeViewOverride)
      ? activeViewOverride
      : routedView

  // Hook Calls
  const auth = useAuth({ plannerRef })
  const map = useCityMap()

  const navigateToView = (view: View, options: { replace?: boolean } = {}) => {
    const nextView: View =
      view === 'chat' ? 'planner' : view === 'preferenceEdit' ? 'preferences' : view
    const nextPath = getPathForView(nextView, nextView === 'planDetail' ? planner.currentPlanId : undefined)

    setActiveViewOverride(nextView === 'themeDetail' ? nextView : null)

    if (nextView === 'themeDetail' && location.pathname === nextPath) {
      return
    }

    navigate(nextPath, { replace: options.replace })
  }

  const preferences = usePreferences({
    authAccessToken: auth.authAccessToken,
    isBackendAuthMode: auth.isBackendAuthMode,
    selectedPreferenceProfile: auth.selectedPreferenceProfile,
    setSelectedPreferenceProfile: auth.setSelectedPreferenceProfile,
    hasCompletedPreference: auth.hasCompletedPreference,
    setHasCompletedPreference: auth.setHasCompletedPreference,
    resetPlannerFlow: (...args) => planner.resetPlannerFlow(...args),
    navigateToView,
    activeView,
  })

  const planner = usePlanner({
    authAccessToken: auth.authAccessToken,
    currentUser: auth.currentUser,
    isAuthSessionRestoring: auth.isAuthSessionRestoring,
    isBackendAuthMode: auth.isBackendAuthMode,
    selectedPreferenceProfile: auth.selectedPreferenceProfile,
    selectedPreference: preferences.selectedPreference,
    selectedPreferenceLabel: getPreferenceProfileLabel(auth.selectedPreferenceProfile),
    plannerPreferenceProfile: auth.plannerPreferenceProfile,
    setPlannerPreferenceProfile: auth.setPlannerPreferenceProfile,
    savedPlans: auth.savedPlans,
    setSavedPlans: auth.setSavedPlans,
    savedPlanLikes: auth.savedPlanLikes,
    setSavedPlanLikes: auth.setSavedPlanLikes,
    pendingSavedPlanLikeIds: auth.pendingSavedPlanLikeIds,
    setPendingSavedPlanLikeIds: auth.setPendingSavedPlanLikeIds,
    pendingSavedPlanDeleteIds: auth.pendingSavedPlanDeleteIds,
    setPendingSavedPlanDeleteIds: auth.setPendingSavedPlanDeleteIds,
    savedPlanLikeErrors: auth.savedPlanLikeErrors,
    setSavedPlanLikeErrors: auth.setSavedPlanLikeErrors,
    setSavedPlanNotice: auth.setSavedPlanNotice,
  })

  useEffect(() => {
    plannerRef.current = {
      currentPlanId: planner.currentPlanId,
      isPlannerReady: planner.isPlannerReady,
    }
  }, [planner.currentPlanId, planner.isPlannerReady])

  const [currentHeroThemeIndex, setCurrentHeroThemeIndex] = useState(0)
  const currentHeroTheme = heroThemes[currentHeroThemeIndex]
  const recommendationBasisHashtags = getRecommendationBasisHashtags(auth.selectedPreferenceProfile)

  const routePlanId = getPlanDetailRouteId(location.pathname)
  const savedPlanForRoute = useMemo(
    () => (routePlanId ? auth.savedPlans.find((plan) => plan.id === routePlanId) ?? null : null),
    [routePlanId, auth.savedPlans],
  )
  const savedPlanForRouteFromQuery = routePlanId
    ? auth.savedPlansQuery.data?.savedPlans.find((plan) => plan.id === routePlanId) ?? null
    : null
  
  const isRouteCurrentGeneratedPlan = routePlanId === planner.currentPlanId && planner.isPlannerReady
  const isBackendRoutePlanLoading =
    auth.isBackendAuthMode && Boolean(routePlanId) && auth.isSavedPlansRestoring

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

  const activePlanDetailId = isRouteCurrentGeneratedPlan ? planner.currentPlanId : savedPlanForRoute?.id ?? planner.currentPlanId
  const activePlanDetailDraft = isRouteCurrentGeneratedPlan ? planner.planDraft : savedRoutePlanDraft ?? planner.planDraft
  const activePlanDetailTitle = isRouteCurrentGeneratedPlan
    ? planner.currentPlanTitle
    : savedPlanForRoute?.title ?? planner.currentPlanTitle
  const activePlanDetailBasisLabel = isRouteCurrentGeneratedPlan
    ? planner.plannerBasisLabel
    : savedPlanForRoute?.cityPair ?? planner.plannerBasisLabel
  const activePlanDetailDestinationId = isRouteCurrentGeneratedPlan
    ? (planner.plannerCityContext?.cityId ?? undefined)
    : savedPlanForRoute?.destinationId ?? undefined
  const isActivePlanDetailReady = isRouteCurrentGeneratedPlan || Boolean(savedPlanForRoute)
  const activeSavedPlanDetailLike = planner.getSavedPlanLike(activePlanDetailId)
  const isActivePlanDetailSaved = isRouteCurrentGeneratedPlan ? planner.isCurrentPlanSaved : Boolean(savedPlanForRoute)



  // Redirection dependencies destructured for stable dependency tracking
  const {
    currentUser,
    isAuthSessionRestoring,
    pendingAuthRedirectPath,
    setPendingAuthRedirectPath,
    shouldHandleAuthCallback,
    hasCompletedPreference,
    isSavedPlansRestoring,
  } = auth

  // Redirection effects
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
  }, [currentUser, isAuthSessionRestoring, location.pathname, navigate, pendingAuthRedirectPath, setPendingAuthRedirectPath])

  useEffect(() => {
    if (isAuthSessionRestoring || shouldHandleAuthCallback || pendingAuthRedirectPath) {
      return
    }

    const legacyRedirectPath = getLegacyViewRedirectPath(
      location.search,
      planner.isPlannerReady ? planner.currentPlanId : null,
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
    planner.currentPlanId,
    currentUser,
    hasCompletedPreference,
    hasRoutePlan,
    isAuthSessionRestoring,
    isSavedPlansRestoring,
    planner.isPlannerReady,
    location.pathname,
    location.search,
    navigate,
    pendingAuthRedirectPath,
    shouldHandleAuthCallback,
  ])

  // Hero Rotation
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

  // Header & Navigation Handlers
  const goHome = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    useUiToggleStore.getState().closeSessionMenu()
    navigateToView('home')
  }

  const openMap = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    useUiToggleStore.getState().closeSessionMenu()
    useUiToggleStore.getState().closeQuickActions()
    navigateToView('map')
  }

  const openMyPage = () => {
    useUiToggleStore.getState().closeSessionMenu()
    navigateToView('mypage')
  }



  const currentSocialProviderForDisplay = resolveSocialAuthProvider(auth.currentUser, auth.currentSocialAuthProvider)
  const currentProviderLabel = auth.currentUser
    ? currentSocialProviderForDisplay
      ? providerLabels[currentSocialProviderForDisplay]
      : '소셜 로그인'
    : '로그인 세션'

  const authNotice = auth.isBackendAuthMode
    ? auth.isCognitoAuthMode
      ? 'Google 또는 Kakao 계정으로 안전하게 로그인합니다.'
      : 'API auth mode입니다. OAuth authorization_code callback으로 로그인합니다.'
    : undefined

  const openChat = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    useUiToggleStore.getState().closeSessionMenu()
    planner.resetPlannerFlow(preferences.selectedPreference, null, auth.selectedPreferenceProfile)
    navigateToView('planner')
  }

  const openChatFromQuickAction = () => {
    useUiToggleStore.getState().closeQuickActions()
    openChat()
  }

  const scrollToTop = () => {
    useUiToggleStore.getState().closeQuickActions()
    navigateToView('home')
    window.scrollTo?.({ behavior: 'smooth', top: 0 })
  }

  const openRecommendation = () => {
    useUiToggleStore.getState().closeSessionMenu()
    useUiToggleStore.getState().closeQuickActions()
    navigateToView('recommendation')
  }

  const createSinglePreferenceProfile = (
    preference: Preference,
    source: PreferenceProfileSource,
  ): PreferenceProfile => {
    return {
      version: 2,
      selectedThemeIds: [preference.themeId],
      source,
      countryTrack: auth.selectedPreferenceProfile?.countryTrack ?? 'KR',
      updatedAt: new Date().toISOString(),
    }
  }

  const openMonthlyRecommendationDetail = (recommendation: MonthlyRecommendation) => {
    setActiveMonthlyRecommendation(recommendation)
    useUiToggleStore.getState().closeQuickActions()
    navigateToView('themeDetail')
  }

  const openMonthlyRecommendationPlan = (preference: Preference) => {
    const nextProfile = createSinglePreferenceProfile(preference, 'preference_edit')
    planner.resetPlannerFlow(preference, null, nextProfile)
    useUiToggleStore.getState().closeQuickActions()
    navigateToView('planner')
  }

  const openSavedPlanDetail = (planId: string) => {
    auth.setSavedPlanNotice(null)
    navigate(`/plans/${encodeURIComponent(planId)}`)
  }

  const openPlanDetailView = () => {
    if (!planner.isPlannerReady) {
      return
    }

    auth.setSavedPlanNotice(null)
    navigateToView('planDetail')
  }

  const returnToChatWorkspace = () => {
    navigateToView('planner', { replace: true })
  }

  const selectSmallCityFromList = (city: SmallCity) => {
    if (map.selectedSmallCityId === city.id) {
      map.setSelectedSmallCityId('')
      map.setCityMapPanelMode('list')
      return
    }

    map.setSelectedSmallCityId(city.id)
    map.setCityMapPanelMode('detail')

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

  const openSmallCityPlanner = (city: SmallCity) => {
    const selectedDetail =
      map.selectedSmallCityDetailState.status === 'success' && map.selectedSmallCityDetailState.detail.city.id === city.id
        ? map.selectedSmallCityDetailState.detail
        : null
    
    const cityContext = createPlannerCityContext(city, selectedDetail)

    planner.resetPlannerFlow(preferences.selectedPreference, cityContext, auth.selectedPreferenceProfile)
    useUiToggleStore.getState().closeQuickActions()
    navigateToView('planner')
  }

  const renderCityMapDiscoverySection = () => (
    <CityMapDiscoverySection
      cityMapDetailPanelRef={cityMapDetailPanelRef}
      cityMapCountry={map.cityMapCountry}
      cityMapQuery={map.cityMapQuery}
      selectedSmallCityThemes={map.selectedSmallCityThemes}
      selectedPreferenceProfile={auth.selectedPreferenceProfile}
      smallCityCatalogState={map.smallCityCatalogState}
      activeCountrySmallCities={map.activeCountrySmallCities}
      filteredSmallCities={map.filteredSmallCities}
      visibleSmallCityMapMarkers={map.visibleSmallCityMapMarkers}
      selectedSmallCity={map.selectedSmallCity}
      selectedSmallCityDetailState={map.selectedSmallCityDetailState}
      cityMapPanelMode={map.cityMapPanelMode}
      onSelectCountry={map.selectCityMapCountry}
      onQueryChange={(query) => {
        map.setCityMapQuery(query)
        map.setCityMapPanelMode('list')
      }}
      onClearFilters={map.clearSmallCityFilters}
      onToggleThemeFilter={map.toggleSmallCityThemeFilter}
      onSelectCityFromList={selectSmallCityFromList}
      onSelectMapMarker={map.selectSmallCityMapMarker}
      onSetPanelMode={map.setCityMapPanelMode}
      onOpenPlanner={openSmallCityPlanner}
    />
  )

  const isAuthCallbackLoading = auth.isBackendAuthMode && auth.shouldHandleAuthCallback
  const isProtectedRouteAuthSessionLoading =
    auth.isBackendAuthMode && auth.isAuthSessionRestoring && activeView !== 'auth'
  const shouldShowAuthLoadingView = isAuthCallbackLoading || isProtectedRouteAuthSessionLoading

  return (
    <main className="lovv-app-shell lovv-warm-pattern lovv-ambient-background min-h-dvh bg-[#fff8ee] text-[#33271E]">
      <div className="lovv-app-content">
        {shouldShowAuthLoadingView ? (
          <AuthLoadingView />
        ) : activeView === 'auth' ? (
        <AuthView
          authExceptionNotice={auth.authFlowNotice}
          authNotice={authNotice}
          isSignInDisabled={auth.isAuthSessionRestoring || auth.shouldHandleAuthCallback}
          signInPendingProvider={auth.signInPendingProvider}
          onSignIn={
            auth.isCognitoAuthMode
              ? auth.startCognitoOAuthSignIn
              : auth.isApiAuthMode
                ? auth.startApiOAuthSignIn
                : auth.signInWithMockProvider
          }
        />
      ) : activeView === 'onboarding' || preferences.isPreferenceEditView ? (
        <OnboardingPreferenceView
          isPreferenceEditView={preferences.isPreferenceEditView}
          hasSelectedCover={preferences.hasSelectedCover}
          activeThemeIds={preferences.activeThemeIds}
          activeThemeLabels={preferences.activeThemeLabels}
          activeThemePreferences={preferences.activeThemePreferences}
          activeCountryTrack={preferences.activeCountryTrack}
          hasValidThemeSelection={preferences.hasValidThemeSelection}
          themeSelectionNotice={preferences.themeSelectionNotice}
          isPreferenceSaving={preferences.isPreferenceSaving}
          selectedPreviewThemePosition={preferences.selectedPreviewThemePosition}
          selectedPreviewPreference={preferences.selectedPreviewPreference}
          selectedPreviewPrimaryImage={preferences.selectedPreviewPrimaryImage}
          selectedPreviewTrayCover={preferences.selectedPreviewTrayCover}
          selectedPreviewThumbnails={preferences.selectedPreviewThumbnails}
          isPreviewTrayOpen={preferences.isPreviewTrayOpen}
          onToggleTheme={preferences.togglePreferenceTheme}
          onSelectCountryTrack={preferences.selectPreferenceCountryTrack}
          onCancelPreferenceEdit={preferences.cancelPreferenceEdit}
          onSavePreferenceEdit={preferences.savePreferenceEdit}
          onEnterMainWithPreference={preferences.enterMainWithPreference}
          onPreviewTrayOpenChange={preferences.setIsPreviewTrayOpen}
          onSelectPreviewImage={preferences.selectPreviewImage}
        />
      ) : (
        <>
          <AppHeader
            goHome={goHome}
            currentProviderLabel={currentProviderLabel}
            currentUser={auth.currentUser}
            openMyPage={openMyPage}
            signOut={auth.signOut}
            activeView={activeView}
            openMap={openMap}
            openPlanner={openChat}
            openRecommendation={openRecommendation}
          />

          {activeView === 'home' ? (
            <HomeView
              currentHeroTheme={currentHeroTheme}
              selectedPreferenceProfile={auth.selectedPreferenceProfile}
              selectedThemeHashtags={preferences.selectedThemeHashtags}
              recommendationBasisHashtags={recommendationBasisHashtags}
              openChat={openChat}
              openMap={openMap}
              onOpenMonthlyRecommendationDetail={openMonthlyRecommendationDetail}
              onOpenChatFromQuickAction={openChatFromQuickAction}
              onScrollToTop={scrollToTop}
              savedPlansCount={auth.savedPlans.length}
              likedPlansCount={Object.keys(auth.savedPlanLikes).length}
              currentUser={auth.currentUser}
            />
          ) : activeView === 'map' ? (
            <div className="pt-[58px]">
              {renderCityMapDiscoverySection()}
            </div>
          ) : activeView === 'recommendation' ? (
            <div className="pt-[58px]">
              <RecommendationView
                onOpenMonthlyRecommendationDetail={openMonthlyRecommendationDetail}
              />
            </div>
          ) : activeView === 'themeDetail' ? (
            <ThemeDetailView recommendation={activeMonthlyRecommendation} goHome={goHome} openMonthlyRecommendationPlan={openMonthlyRecommendationPlan} />
          ) : activeView === 'planDetail' ? (
            <ErrorBoundary>
              <PlanDetailView
                isPlannerReady={isActivePlanDetailReady}
                shouldAskFestivalTheme={planner.shouldAskFestivalTheme}
                returnToChatWorkspace={returnToChatWorkspace}
                currentPlanTitle={activePlanDetailTitle}
                planDraft={activePlanDetailDraft}
                plannerBasisLabel={activePlanDetailBasisLabel}
                cityImageUrl={planner.plannerCityContext?.imageUrl ?? undefined}
                destinationName={planner.plannerCityContext?.cityName ?? planner.generatedPlanDestinationName ?? undefined}
                destinationId={activePlanDetailDestinationId}
                planId={activePlanDetailId}
                planLike={activeSavedPlanDetailLike}
                onSelectSavedPlanLike={planner.selectSavedPlanLike}
                savedPlanLikePending={planner.isSavedPlanLikePending(activePlanDetailId)}
                savedPlanLikeError={planner.getSavedPlanLikeError(activePlanDetailId)}
                isSavedPlanDetailLoading={isBackendRoutePlanLoading}
                saveGeneratedPlan={planner.saveGeneratedPlan}
                isPlanSaving={planner.isSavingPlan}
                isCurrentPlanSaved={isActivePlanDetailSaved}
                savedPlanDeletePending={planner.isSavedPlanDeletePending(activePlanDetailId)}
                onDeleteSavedPlan={planner.deleteSavedPlan}
                openMyPage={openMyPage}
                savedPlanNotice={auth.savedPlanNotice}
                chatMessages={planner.chatMessages}
                onReplacePlanStop={isRouteCurrentGeneratedPlan ? planner.replacePlanStop : undefined}
                onReplacePlanDay={isRouteCurrentGeneratedPlan ? planner.replacePlanDay : undefined}
              />
            </ErrorBoundary>
          ) : activeView === 'mypage' ? (
            <MyPageView
              goHome={goHome}
              currentProviderLabel={currentProviderLabel}
              selectedPreferenceLabel={getPreferenceProfileLabel(auth.selectedPreferenceProfile)}
              savedPlanNotice={auth.savedPlanNotice}
              preferenceNotice={preferences.preferenceNotice}
              currentUser={auth.currentUser}
              savedPlans={auth.savedPlans}
              getSavedPlanLike={planner.getSavedPlanLike}
              onSelectSavedPlanLike={planner.selectSavedPlanLike}
              getSavedPlanLikeError={planner.getSavedPlanLikeError}
              isSavedPlanLikePending={planner.isSavedPlanLikePending}
              isSavedPlanDeletePending={planner.isSavedPlanDeletePending}
              openSavedPlanDetail={openSavedPlanDetail}
              onDeleteSavedPlan={planner.deleteSavedPlan}
              openPreferenceEdit={preferences.enterPreferenceEdit}
              signOut={auth.signOut}
              canLinkSocialAccounts={auth.isApiAuthMode}
              socialAccounts={auth.socialAccounts}
              linkingProvider={auth.linkingProvider}
              accountLinkNotice={auth.accountLinkNotice}
              onLinkProvider={auth.startLinkProvider}
              onUpdateProfile={auth.updateProfile}
              isUpdatingProfile={auth.isUpdatingProfile}
              profileUpdateError={auth.profileUpdateError}
            />
          ) : (
            <ErrorBoundary>
              <PlannerWorkspace
                goHome={goHome}
                plannerCityContext={planner.plannerCityContext}
                shouldAskFestivalTheme={planner.shouldAskFestivalTheme}
                plannerPreferenceLabel={planner.plannerPreferenceLabel}
                plannerStateSteps={planner.plannerStateSteps}
                chatMessages={planner.chatMessages}
                shouldShowFestivalPrompt={planner.shouldShowFestivalPrompt}
                festivalThemeChoice={planner.festivalThemeChoice}
                submitChatMessage={planner.submitChatMessage}
                shouldShowDurationPrompt={planner.shouldShowDurationPrompt}
                shouldShowTravelMonthPrompt={planner.shouldShowTravelMonthPrompt}
                isPlannerReady={planner.isPlannerReady}
                planDraft={planner.planDraft}
                plannerConditionExtraction={planner.plannerConditionExtraction}
                chatInput={planner.chatInput}
                setChatInput={planner.setChatInput}
                selectedTravelMonth={planner.selectedTravelMonth}
                hasGuidedPlannerChoices={planner.hasGuidedPlannerChoices}
                canSubmitChatInput={planner.canSubmitChatInput}
                submitChatForm={planner.submitChatForm}
                currentPlanTitle={planner.currentPlanTitle}
                plannerPreferenceProfile={planner.plannerPreferenceProfile}
                openPlanDetailView={openPlanDetailView}
                isCurrentPlanLiked={planner.isCurrentPlanLiked}
                toggleGeneratedPlanLike={planner.toggleGeneratedPlanLike}
                resetPlannerFlow={() => planner.resetPlannerFlow()}
                saveGeneratedPlan={planner.saveGeneratedPlan}
                isPlanSaving={planner.isSavingPlan}
                isCurrentPlanSaved={planner.isCurrentPlanSaved}
                openMyPage={openMyPage}
                savedPlanNotice={auth.savedPlanNotice}
                isPlannerLoading={planner.isPlannerLoading}
                planDestinationName={planner.plannerCityContext?.cityName ?? planner.generatedPlanDestinationName ?? undefined}
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
