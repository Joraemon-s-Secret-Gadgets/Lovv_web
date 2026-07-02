/**
 * @file usePlanner.ts
 * @description Custom hook for managing the chatbot-based interactive planner, itineraries drafts, and AI generation state.
 * @lastModified 2026-06-23
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  getDefaultPreferenceProfile,
  getPreferencesForProfile,
  getThemeLabels,
} from '../onboarding/preferenceModel'
import {
  createInitialChatMessages,
  createPlanDraft,
  shouldAskFestivalForCity,
  getPlannerCitySeedText,
  getPreferenceProfileLabel,
  createPlanId,
  getThemeHashtags,
  createMessageId,
  getFestivalThemeLabel,
  getExplicitDurationLabel,
  shouldAskTravelMonthForCity,
  createMockConditionExtraction,
  getPlannerBaselineThemeIds,
  createAssistantReply,
  getExplicitTravelMonth,
  getTravelMonthLabel,
  resolveFestivalThemeChoice,
  formatThemeList,
} from './plannerModel'
import {
  requestCreateSavedPlan,
  requestDeleteSavedPlan,
  requestLikeSavedPlan,
  requestUnlikeSavedPlan,
  requestCloneSavedPlan,
  requestUpdateSavedPlanShareStatus,
  type SavedPlanApiCreatePayload,
} from '../../shared/api/savedPlansApi'
import {
  requestCreateRecommendation,
  mapRecommendationToDraft,
  type RecommendationRequestPayload,
  type RecommendationApiResponse,
} from '../../shared/api/recommendationsApi'
import {
  applyPlanDayReplacement,
  applyPlanStopReplacement,
  applyWishlistSummaryToPlanDraft,
  removeWishlistRestaurantStops,
} from './plannerEditModel'
import {
  writeStoredSavedPlanLikes,
  writeStoredSavedPlans,
  type SavedPlanLikeMap,
} from '../saved-plans/savedPlansStorage'
import { log } from '../../shared/logger'
import type {
  PreferenceProfile,
  ChatMessage,
  PlanDay,
  PlanDraft,
  PlanStop,
  SavedPlan,
  SavedPlanLike,
  FestivalThemeChoice,
  MockConditionExtraction,
  LovvUser,
  Preference,
  SelectedMealPlace,
} from '../../shared/types/app'
import { resolveSmallCityDisplayName, type PlannerCityContext } from '../map-city/smallCities'

const stableStringifyForIdempotency = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringifyForIdempotency).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>

    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringifyForIdempotency(record[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value) ?? String(value)
}

const createIdempotencyFingerprint = (value: unknown) => {
  const source = stableStringifyForIdempotency(value)
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(31, hash) + source.charCodeAt(index)
    hash |= 0
  }

  return (hash >>> 0).toString(36)
}

export interface UsePlannerOptions {
  authAccessToken: string | null
  currentUser: LovvUser | null
  isAuthSessionRestoring: boolean
  isBackendAuthMode: boolean
  selectedPreferenceProfile: PreferenceProfile | null
  selectedPreference: Preference
  selectedPreferenceLabel: string
  plannerPreferenceProfile: PreferenceProfile
  setPlannerPreferenceProfile: React.Dispatch<React.SetStateAction<PreferenceProfile>>
  savedPlans: SavedPlan[]
  setSavedPlans: React.Dispatch<React.SetStateAction<SavedPlan[]>>
  savedPlanLikes: SavedPlanLikeMap
  setSavedPlanLikes: React.Dispatch<React.SetStateAction<SavedPlanLikeMap>>
  pendingSavedPlanLikeIds: string[]
  setPendingSavedPlanLikeIds: React.Dispatch<React.SetStateAction<string[]>>
  pendingSavedPlanDeleteIds: string[]
  setPendingSavedPlanDeleteIds: React.Dispatch<React.SetStateAction<string[]>>
  savedPlanLikeErrors: Record<string, string>
  setSavedPlanLikeErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setSavedPlanNotice: React.Dispatch<React.SetStateAction<string | null>>
}

export function usePlanner({
  authAccessToken,
  currentUser,
  isAuthSessionRestoring,
  isBackendAuthMode,
  selectedPreferenceProfile,
  selectedPreference,
  selectedPreferenceLabel,
  plannerPreferenceProfile,
  setPlannerPreferenceProfile,
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
  setSavedPlanNotice,
}: UsePlannerOptions) {
  const navigate = useNavigate()

  const [festivalThemeChoice, setFestivalThemeChoice] = useState<FestivalThemeChoice>('exclude')
  const [selectedDurationLabel, setSelectedDurationLabel] = useState<string | null>(null)
  const [selectedTravelMonth, setSelectedTravelMonth] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState('')

  const [plannerConditionExtraction, setPlannerConditionExtraction] =
    useState<MockConditionExtraction | null>(null)
  const [plannerContextText, setPlannerContextText] = useState('')
  const [plannerCityContext, setPlannerCityContext] = useState<PlannerCityContext | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    createInitialChatMessages(selectedPreferenceLabel),
  )
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => createPlanDraft(selectedPreference))
  const [generatedPlanDestinationName, setGeneratedPlanDestinationName] = useState<string | null>(null)
  const [generatedPlanDestinationId, setGeneratedPlanDestinationId] = useState<string | null>(null)
  const [isPlannerLoading, setIsPlannerLoading] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isPlanCloning, setIsPlanCloning] = useState(false)
  const [isShareStatusUpdating, setIsShareStatusUpdating] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isAuthSessionRestoring) return
    if (!plannerCityContext && planDraft.stops.length === 0) {
      if (selectedPreferenceProfile) {
        setPlannerPreferenceProfile(selectedPreferenceProfile)
        const nextPlannerLabel = getPreferenceProfileLabel(selectedPreferenceProfile)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setChatMessages(createInitialChatMessages(nextPlannerLabel, null, false))
        setPlanDraft(createPlanDraft(selectedPreference, '', 'exclude', null))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreferenceProfile, isAuthSessionRestoring, selectedPreference])

  // Save active planner preference profile to sessionStorage to persist across page reloads
  useEffect(() => {
    if (isAuthSessionRestoring) return
    if (plannerPreferenceProfile) {
      sessionStorage.setItem('lovv.planner_active_profile', JSON.stringify(plannerPreferenceProfile))
    } else {
      sessionStorage.removeItem('lovv.planner_active_profile')
    }
  }, [plannerPreferenceProfile, isAuthSessionRestoring])

  const plannerPreferences = useMemo(
    () => getPreferencesForProfile(plannerPreferenceProfile),
    [plannerPreferenceProfile],
  )
  const plannerPreference = plannerPreferences[0] ?? selectedPreference
  const plannerPreferenceLabel = getPreferenceProfileLabel(plannerPreferenceProfile)
  const plannerThemeHashtags = getThemeHashtags(plannerPreferenceProfile)

  const shouldAskFestivalTheme = false  // 축제 질문 비활성화 - 여행 월 선택으로 대체
  const shouldShowFestivalPrompt = false
  const shouldShowDurationPrompt = selectedDurationLabel === null
  const shouldShowTravelMonthPrompt =
    selectedDurationLabel !== null &&
    selectedTravelMonth === null &&
    plannerConditionExtraction === null
  const hasSettledFestivalChoice = true
  const hasGuidedPlannerChoices =
    selectedDurationLabel !== null && !shouldShowTravelMonthPrompt
  const isPlannerReady = hasGuidedPlannerChoices && plannerConditionExtraction !== null
  const canSubmitChatInput = hasGuidedPlannerChoices && chatInput.trim().length > 0 && !isPlannerLoading

  const plannerConditionSummary = useMemo(() => {
    if (plannerConditionExtraction) {
      return [
        shouldAskFestivalTheme ? getFestivalThemeLabel(festivalThemeChoice) : null,
        selectedDurationLabel ?? planDraft.durationLabel,
        selectedTravelMonth ? getTravelMonthLabel(selectedTravelMonth) : null,
        formatThemeList(plannerConditionExtraction.activeRequiredThemes),
        ...plannerConditionExtraction.softPreferences.slice(0, 2),
      ]
        .filter(Boolean)
        .join(' · ')
    }
    return [
      shouldAskFestivalTheme ? getFestivalThemeLabel(festivalThemeChoice) : null,
      selectedDurationLabel ?? '기간 미정',
      selectedTravelMonth ? getTravelMonthLabel(selectedTravelMonth) : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }, [
    plannerConditionExtraction,
    shouldAskFestivalTheme,
    festivalThemeChoice,
    selectedDurationLabel,
    planDraft.durationLabel,
    selectedTravelMonth,
  ])

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

  const getSavedPlanLike = (planId: string): SavedPlanLike => savedPlanLikes[planId] ?? null
  const isSavedPlanLikePending = (planId: string) => pendingSavedPlanLikeIds.includes(planId)
  const isSavedPlanDeletePending = (planId: string) => pendingSavedPlanDeleteIds.includes(planId)
  const getSavedPlanLikeError = (planId: string) => savedPlanLikeErrors[planId] ?? null

  const savedCurrentPlan = savedPlans.find(
    (plan) => plan.id === currentPlanId || plan.sourceRecommendationId === currentPlanId,
  )
  const isCurrentPlanSaved = Boolean(savedCurrentPlan)
  const isCurrentPlanLiked = getSavedPlanLike(currentPlanId) === 'like'

  useEffect(() => {
    if (!isPlannerReady || !savedCurrentPlan) {
      return
    }

    const draftSelectedRestaurants = planDraft.selectedRestaurants
    const selectedRestaurants = draftSelectedRestaurants ?? []
    const hasSelectedRestaurantDrift = draftSelectedRestaurants
      ? savedCurrentPlan.selectedRestaurants !== draftSelectedRestaurants
      : (savedCurrentPlan.selectedRestaurants ?? []).length > 0
    const shouldSyncSavedDraft =
      savedCurrentPlan.durationLabel !== planDraft.durationLabel ||
      savedCurrentPlan.festivalThemeLabel !== planDraft.festivalThemeLabel ||
      savedCurrentPlan.intensityLabel !== planDraft.intensityLabel ||
      savedCurrentPlan.summary !== planDraft.summary ||
      savedCurrentPlan.days !== planDraft.days ||
      savedCurrentPlan.stops !== planDraft.stops ||
      hasSelectedRestaurantDrift

    if (!shouldSyncSavedDraft) {
      return
    }

    setSavedPlans((currentPlans) => {
      let didUpdate = false
      const nextPlans = currentPlans.map((plan) => {
        if (plan.id !== savedCurrentPlan.id && plan.sourceRecommendationId !== currentPlanId) {
          return plan
        }

        didUpdate = true
        return {
          ...plan,
          durationLabel: planDraft.durationLabel,
          festivalThemeLabel: planDraft.festivalThemeLabel,
          intensityLabel: planDraft.intensityLabel,
          summary: planDraft.summary,
          days: planDraft.days,
          stops: planDraft.stops,
          selectedRestaurants,
        }
      })

      if (!didUpdate) {
        return currentPlans
      }

      writeStoredSavedPlans(nextPlans)

      return nextPlans
    })
  }, [currentPlanId, isPlannerReady, planDraft, savedCurrentPlan, setSavedPlans])

  const resetPlannerFlow = useCallback((
    preference = selectedPreference,
    cityContext: PlannerCityContext | null = plannerCityContext,
    profile: PreferenceProfile = selectedPreferenceProfile ?? getDefaultPreferenceProfile(),
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
    setGeneratedPlanDestinationId(null)
  }, [
    plannerCityContext,
    selectedPreferenceProfile,
    selectedPreference,
    setSavedPlanNotice,
    setPlannerPreferenceProfile,
  ])

  const createGeneratedPlanSavePayload = (
    plan: SavedPlan,
    sourceRecommendationId: string,
  ): SavedPlanApiCreatePayload => {
    const destinationId =
      plannerCityContext?.agentCoreId ??
      plannerCityContext?.cityId ??
      generatedPlanDestinationId ??
      sourceRecommendationId
    const destinationName = plannerCityContext?.cityName ?? generatedPlanDestinationName ?? plannerBasisLabel

    const payloadWithoutIdempotencyKey: Omit<SavedPlanApiCreatePayload, 'idempotencyKey'> = {
      sourceRecommendationId,
      title: plan.title,
      summary: plan.summary,
      destination: {
        destinationId,
        name: destinationName,
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
        cityId: plannerCityContext?.cityId ?? generatedPlanDestinationId ?? null,
      },
      requestSummary: plan.conditionSummary,
      itinerary: {
        days: plan.days ?? [],
        selectedRestaurants: plan.selectedRestaurants ?? [],
      },
    }

    return {
      ...payloadWithoutIdempotencyKey,
      idempotencyKey: `${sourceRecommendationId}:${createIdempotencyFingerprint(payloadWithoutIdempotencyKey)}`,
    }
  }

  const formatSavedItineraryDestinationName = (destinationName: string) => {
    const compactDestinationName = destinationName.replace(/\s+/g, '')

    if (/^[가-힣]{2,8}$/.test(compactDestinationName) && !/(시|군|구|읍|면)$/.test(compactDestinationName)) {
      return `${destinationName}시`
    }

    return destinationName
  }

  const createSavedItineraryTitle = () => {
    const explicitDestinationName = generatedPlanDestinationName ?? plannerCityContext?.cityName
    const destinationName = explicitDestinationName
      ? formatSavedItineraryDestinationName(explicitDestinationName)
      : (plannerBasisLabel.split('·')[0]?.trim() ?? plannerBasisLabel)

    return `${destinationName} ${planDraft.durationLabel} 일정`
  }

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
    const savedPlanDestinationId =
      plannerCityContext?.agentCoreId ??
      plannerCityContext?.cityId ??
      generatedPlanDestinationId ??
      sourceRecommendationId
    const savedPlanTitle = createSavedItineraryTitle()
    const draftPlan: SavedPlan = {
      id: currentPlanId,
      sourceRecommendationId,
      ownerId: currentUser?.id ?? 'mock-user',
      title: savedPlanTitle,
      cityPair: generatedPlanDestinationName ?? plannerBasisLabel,
      themeTag: themeLabels.join('·'),
      themeLabels,
      conditionSummary: plannerConditionSummary,
      durationLabel: planDraft.durationLabel,
      festivalThemeLabel: planDraft.festivalThemeLabel,
      intensityLabel: planDraft.intensityLabel,
      summary: planDraft.summary,
      days: planDraft.days,
      stops: planDraft.stops,
      selectedRestaurants: planDraft.selectedRestaurants ?? [],
      destinationId: savedPlanDestinationId,
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
          sourceRecommendationId,
          savedAt: savedPlanResult.savedAt || savedAt,
          createdAt: savedPlanResult.savedAt || savedAt,
        }

        if (getSavedPlanLike(currentPlanId)) {
          try {
            await savedPlanLikeMutation.mutateAsync({ planId: nextPlan.id, like: 'like' })
          } catch (likeError) {
            log.error('PLAN', 'Failed to sync draft like to backend during plan save', likeError)
          }
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

  const cloneSavedPlan = async (planId: string) => {
    setSavedPlanNotice(null)
    setIsPlanCloning(true)

    try {
      const clonedPlan = await requestCloneSavedPlan(planId, { accessToken: authAccessToken })
      setSavedPlans((currentPlans) => {
        const nextPlans = [clonedPlan, ...currentPlans.filter((p) => p.id !== clonedPlan.id)]
        writeStoredSavedPlans(nextPlans)
        return nextPlans
      })
      setSavedPlanNotice('일정을 내 마이페이지에 담았어요!')
    } catch (e) {
      log.error('PLAN', 'Failed to clone plan', e)
      setSavedPlanNotice('일정을 내 페이지에 담지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsPlanCloning(false)
    }
  }

  const toggleSavedPlanShareStatus = async (planId: string, isPublic: boolean) => {
    const matchedPlan = savedPlans.find((plan) => plan.id === planId || plan.sourceRecommendationId === planId)
    const backendPlanId = matchedPlan?.id ?? planId
    const pendingPlanIds = getSavedPlanLikeIds(planId, matchedPlan)

    setIsShareStatusUpdating((prev) => (
      pendingPlanIds.reduce(
        (nextState, pendingPlanId) => ({ ...nextState, [pendingPlanId]: true }),
        prev,
      )
    ))
    try {
      const updatedPlan = await requestUpdateSavedPlanShareStatus(
        backendPlanId,
        isPublic,
        { accessToken: authAccessToken },
        matchedPlan,
      )
      setSavedPlans((currentPlans) => {
        const nextPlans = currentPlans.map((p) =>
          p.id === backendPlanId || p.sourceRecommendationId === planId
            ? {
                ...updatedPlan,
                sourceRecommendationId: p.sourceRecommendationId,
              }
            : p,
        )
        writeStoredSavedPlans(nextPlans)
        return nextPlans
      })
      setSavedPlanNotice(isPublic ? '일정이 전체 공개로 전환되었어요.' : '일정이 비공개로 전환되었어요.')
      return true
    } catch (e) {
      log.error('PLAN', 'Failed to update share status', e)
      setSavedPlanNotice('공유 설정 업데이트에 실패했어요.')
      return false
    } finally {
      setIsShareStatusUpdating((prev) => (
        pendingPlanIds.reduce(
          (nextState, pendingPlanId) => ({ ...nextState, [pendingPlanId]: false }),
          prev,
        )
      ))
    }
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

  const getSavedPlanLikeIds = (planId: string, plan?: SavedPlan) =>
    Array.from(
      new Set(
        [planId, plan?.id, plan?.sourceRecommendationId].filter(
          (savedPlanId): savedPlanId is string => Boolean(savedPlanId),
        ),
      ),
    )

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

  const replacePlanStop = useCallback((dayNumber: number, stopIndex: number, replacement: PlanStop) => {
    setPlanDraft((currentDraft) => {
      const nextDays = applyPlanStopReplacement(currentDraft.days, dayNumber, stopIndex, replacement)

      return applyWishlistSummaryToPlanDraft({
        ...currentDraft,
        days: nextDays,
        stops: nextDays.flatMap((day) => day.stops),
      })
    })
    setSavedPlanNotice('선택한 일정 카드만 대체 후보로 바꿨어요. 저장하면 변경 내용이 반영됩니다.')
  }, [setSavedPlanNotice])

  const replacePlanDay = useCallback((dayNumber: number, replacement: PlanDay) => {
    setPlanDraft((currentDraft) => {
      const nextDays = applyPlanDayReplacement(currentDraft.days, dayNumber, replacement)

      return applyWishlistSummaryToPlanDraft({
        ...currentDraft,
        days: nextDays,
        stops: nextDays.flatMap((day) => day.stops),
      })
    })
    setSavedPlanNotice('선택한 일차만 대체 일정으로 바꿨어요. 저장하면 변경 내용이 반영됩니다.')
  }, [setSavedPlanNotice])

  const addWishlistRestaurant = useCallback((restaurant: SelectedMealPlace) => {
    setPlanDraft((currentDraft) => {
      const currentList = currentDraft.selectedRestaurants ?? []
      if (currentList.some((r) => r.id === restaurant.id)) {
        return currentDraft
      }
      return {
        ...currentDraft,
        selectedRestaurants: [...currentList, restaurant],
      }
    })
    setSavedPlanNotice('선택한 맛집을 맛집 위시리스트에 담았어요. 저장하면 반영됩니다.')
  }, [setSavedPlanNotice])

  const removeWishlistRestaurant = useCallback((restaurantId: string) => {
    setPlanDraft((currentDraft) => {
      const currentList = currentDraft.selectedRestaurants ?? []
      const targetRestaurant = currentList.find((restaurant) => restaurant.id === restaurantId)
      const nextDays = targetRestaurant
        ? removeWishlistRestaurantStops(currentDraft.days, targetRestaurant)
        : currentDraft.days

      return applyWishlistSummaryToPlanDraft({
        ...currentDraft,
        selectedRestaurants: currentList.filter((r) => r.id !== restaurantId),
        days: nextDays,
        stops: nextDays.flatMap((day) => day.stops),
      })
    })
    setSavedPlanNotice('맛집 위시리스트와 일정 코스에서 제외했어요.')
  }, [setSavedPlanNotice])

  const getNextSavedPlanLike = (currentLike: SavedPlanLike, selectedLike: SavedPlanLike): SavedPlanLike => {
    return currentLike === selectedLike ? null : selectedLike
  }

  const getRecommendationTripType = (durationLabel: string | null): RecommendationRequestPayload['tripType'] => {
    const tripTypeMap: Record<string, RecommendationRequestPayload['tripType']> = {
      '당일치기': 'daytrip',
      '1박 2일': '2d1n',
      '2박 3일': '3d2n',
      '3박 4일': '4d3n',
      '4박 5일': '5d4n',
    }

    return tripTypeMap[durationLabel || ''] || '2d1n'
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

      if (plannerCityContext && !shouldAskTravelMonth) {
        const assistantLoadingMessageId = 'loading-assistant'
        const defaultTravelMonth = selectedTravelMonth ?? new Date().getMonth() + 1

        setChatMessages((currentMessages) => [
          ...currentMessages,
          {
            id: createMessageId('user', currentMessages.length),
            role: 'user',
            content: trimmedMessage,
          },
          {
            id: assistantLoadingMessageId,
            role: 'assistant',
            content: `${plannerCityContext.cityName} ${nextSelectedDurationLabel} 일정을 생성하고 있어요.`,
          },
        ])
        setSelectedDurationLabel(nextSelectedDurationLabel)
        setSelectedTravelMonth(defaultTravelMonth)
        setPlannerConditionExtraction(null)
        setSavedPlanNotice(null)
        setChatInput('')
        setIsPlannerLoading(true)

        try {
          const response = (await createRecommendationMutation.mutateAsync({
            entryType: 'map_marker',
            country: plannerCityContext.country || 'KR',
            tripType: getRecommendationTripType(nextSelectedDurationLabel),
            themes: getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
            includeFestivals: false,
            destinationId: plannerCityContext.agentCoreId ?? plannerCityContext.cityId,
            naturalLanguageQuery: `${nextSelectedDurationLabel} ${plannerContextText}`.trim(),
            travelYear: new Date().getFullYear(),
            travelMonth: defaultTravelMonth,
          })) as RecommendationApiResponse

          const realDraft = mapRecommendationToDraft(response)
          const filteredNotices = (realDraft.userNotice || []).filter(
            (notice: string) => notice !== response.itinerary?.summary
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
          setPlannerConditionExtraction(nextExtraction)
          setPlanDraft(realDraft)
          setSavedPlanNotice(null)
          const destId = response.destination?.cityId || response.destination?.destinationId
          const destName = resolveSmallCityDisplayName(response.destination?.name, destId, plannerCityContext.cityName)
          setGeneratedPlanDestinationName(destName ?? plannerCityContext.cityName)
          setGeneratedPlanDestinationId(destId || plannerCityContext.cityId)
        } catch (err) {
          log.error('PLAN', 'Recommendation API failed for selected city duration', err)

          setChatMessages((currentMessages) => [
            ...currentMessages.filter((m) => m.id !== assistantLoadingMessageId),
            {
              id: createMessageId('assistant', currentMessages.length),
              role: 'assistant',
              content: '추천 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.',
            },
          ])
          setPlannerConditionExtraction(null)
          setSavedPlanNotice(null)
        } finally {
          setIsPlannerLoading(false)
        }

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
          content: `${getTravelMonthLabel(nextTravelMonth)} 여행으로 잡아둘게요. 이제 동행, 관심사, 걷는 정도 등 원하는 조건을 자유롭게 알려주세요.`,
        },
      ])
      setSelectedTravelMonth(nextTravelMonth)
      setPlannerContextText(nextPlannerContextText)
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
      const response = (await createRecommendationMutation.mutateAsync({
        entryType: 'chat',
        country: plannerCityContext?.country || 'KR',
        tripType: getRecommendationTripType(selectedDurationLabel),
        themes: getPlannerBaselineThemeIds(plannerPreferenceProfile, plannerCityContext),
        includeFestivals: false,
        destinationId: plannerCityContext?.agentCoreId ?? plannerCityContext?.cityId,
        naturalLanguageQuery: trimmedMessage,
        travelYear: new Date().getFullYear(),
        travelMonth: selectedTravelMonth ?? new Date().getMonth() + 1,
      })) as RecommendationApiResponse

      const realDraft = mapRecommendationToDraft(response)

      const filteredNotices = (realDraft.userNotice || []).filter(
        (notice: string) => notice !== response.itinerary?.summary
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
      const destId = response.destination?.cityId || response.destination?.destinationId
      const destName = resolveSmallCityDisplayName(response.destination?.name, destId)

      if (destName && !String(destName).toLowerCase().includes('mock')) {
        setGeneratedPlanDestinationName(destName)
      }
      if (destId) {
        setGeneratedPlanDestinationId(destId)
      }
    } catch (err) {
      log.error('PLAN', 'Recommendation API failed, falling back to mock logic', err)

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
      if (plannerCityContext) {
        setGeneratedPlanDestinationName(plannerCityContext.cityName)
        setGeneratedPlanDestinationId(plannerCityContext.cityId)
      }
    } finally {
      setIsPlannerLoading(false)
    }
  }

  const submitChatForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitChatMessage(chatInput)
  }

  const plannerStateSteps = useMemo(() => {
    const steps = [
      {
        id: 'preference',
        label: '취향 반영',
        status: 'completed' as const,
        statusLabel: '완료',
        body: plannerCityContext
          ? `${selectedPreferenceLabel} 취향은 유지하고 선택한 소도시를 일정 출발점으로 사용합니다.`
          : `${selectedPreferenceLabel} 기준 테마로 시작합니다.`,
        chips: plannerThemeHashtags,
      },
      {
        id: 'candidates',
        label: '후보 탐색',
        status: hasSettledFestivalChoice ? ('completed' as const) : ('active' as const),
        statusLabel: hasSettledFestivalChoice ? '완료' : '진행 중',
        body: plannerCityContext
          ? `${plannerCityContext.countryLabel} ${plannerCityContext.region}의 ${plannerCityContext.cityName} 상세 정보를 기준 후보로 고정했습니다.`
          : '선택한 분위기와 가까운 한국·일본 소도시 후보를 좁히고 있어요.',
        chips: plannerCityContext
          ? [plannerCityContext.cityName, plannerCityContext.region]
          : getThemeLabels(plannerPreferenceProfile.selectedThemeIds),
      },
      {
        id: 'schedule',
        label: '일정 구성',
        status: isPlannerReady ? ('completed' as const) : hasSettledFestivalChoice ? ('active' as const) : ('pending' as const),
        statusLabel: isPlannerReady ? '완료' : hasSettledFestivalChoice ? '진행 중' : '대기',
        body: isPlannerReady
          ? `${[
              shouldAskFestivalTheme ? getFestivalThemeLabel(festivalThemeChoice) : null,
              selectedDurationLabel ?? planDraft.durationLabel,
              selectedTravelMonth ? getTravelMonthLabel(selectedTravelMonth) : null,
              plannerConditionExtraction ? formatThemeList(plannerConditionExtraction.activeRequiredThemes) : null,
              plannerConditionExtraction ? plannerConditionExtraction.softPreferences.slice(0, 2).join(' · ') : null,
            ].filter(Boolean).join(' · ')} 조건으로 구성 중입니다.`
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
    return steps
  }, [
    plannerCityContext,
    selectedPreferenceLabel,
    plannerThemeHashtags,
    hasSettledFestivalChoice,
    plannerPreferenceProfile.selectedThemeIds,
    isPlannerReady,
    shouldAskFestivalTheme,
    festivalThemeChoice,
    selectedDurationLabel,
    planDraft.durationLabel,
    planDraft.intensityLabel,
    selectedTravelMonth,
    plannerConditionExtraction,
    hasGuidedPlannerChoices,
    shouldShowDurationPrompt,
    shouldShowTravelMonthPrompt,
  ])

  return {
    plannerPreferenceProfile,
    setPlannerPreferenceProfile,
    chatMessages,
    setChatMessages,
    planDraft,
    setPlanDraft,
    generatedPlanDestinationName,
    setGeneratedPlanDestinationName,
    generatedPlanDestinationId,
    setGeneratedPlanDestinationId,
    isPlannerLoading,
    setIsPlannerLoading,
    isSavingPlan,
    setIsSavingPlan,
    chatInput,
    setChatInput,
    festivalThemeChoice,
    setFestivalThemeChoice,
    selectedDurationLabel,
    setSelectedDurationLabel,
    selectedTravelMonth,
    setSelectedTravelMonth,
    plannerConditionExtraction,
    setPlannerConditionExtraction,
    plannerContextText,
    setPlannerContextText,
    plannerCityContext,
    setPlannerCityContext,
    plannerPreferences,
    plannerPreference,
    plannerPreferenceLabel,
    plannerThemeHashtags,
    shouldAskFestivalTheme,
    shouldShowFestivalPrompt,
    shouldShowDurationPrompt,
    shouldShowTravelMonthPrompt,
    hasSettledFestivalChoice,
    hasGuidedPlannerChoices,
    isPlannerReady,
    canSubmitChatInput,
    plannerBasisLabel,
    currentPlanId,
    currentPlanTitle,
    isCurrentPlanSaved,
    isCurrentPlanLiked,
    resetPlannerFlow,
    saveGeneratedPlan,
    deleteSavedPlan,
    selectSavedPlanLike,
    toggleGeneratedPlanLike,
    replacePlanStop,
    replacePlanDay,
    addWishlistRestaurant,
    removeWishlistRestaurant,
    submitChatMessage,
    submitChatForm,
    plannerStateSteps,
    getSavedPlanLike,
    isSavedPlanLikePending,
    isSavedPlanDeletePending,
    getSavedPlanLikeError,
    isPlanCloning,
    cloneSavedPlan,
    isShareStatusUpdating,
    toggleSavedPlanShareStatus,
  }
}

// EOF: usePlanner.ts
