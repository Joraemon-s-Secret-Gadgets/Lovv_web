/**
 * @file usePreferences.ts
 * @description Custom hook for managing global user preference profile, theme selection states, and edit views.
 * @lastModified 2026-06-23
 */

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  createPreferenceProfile,
  getPreferencesForProfile,
  getPrimaryPreference,
  preferences,
  storePreferenceProfile,
  getThemeLabels,
  getPreferenceByThemeId,
} from './preferenceModel'
import { requestUpdatePreference } from '../../shared/api/preferencesApi'
import type {
  CountryTrack,
  PreferenceProfile,
  ThemeId,
  View,
  Preference,
} from '../../shared/types/app'
import type { PlannerCityContext } from '../map-city/smallCities'

import { getThemeHashtags } from '../planner/plannerModel'

export interface UsePreferencesOptions {
  authAccessToken: string | null
  isBackendAuthMode: boolean
  selectedPreferenceProfile: PreferenceProfile
  setSelectedPreferenceProfile: React.Dispatch<React.SetStateAction<PreferenceProfile>>
  hasCompletedPreference: boolean
  setHasCompletedPreference: React.Dispatch<React.SetStateAction<boolean>>
  resetPlannerFlow: (preference: Preference, cityContext: PlannerCityContext | null, profile: PreferenceProfile) => void
  navigateToView: (view: View, options?: { replace?: boolean }) => void
  activeView: View
}

/**
 * Custom hook to manage user onboarding/edit preferences state, operations, and previews.
 */
export function usePreferences({
  authAccessToken,
  isBackendAuthMode,
  selectedPreferenceProfile,
  setSelectedPreferenceProfile,
  hasCompletedPreference,
  setHasCompletedPreference,
  resetPlannerFlow,
  navigateToView,
  activeView,
}: UsePreferencesOptions) {
  // Local states for staging preferences before saving
  const [pendingPreferenceProfile, setPendingPreferenceProfile] = useState(() => selectedPreferenceProfile)
  const [selectedPreviewImageKey, setSelectedPreviewImageKey] = useState<string | null>(null)
  const [isPreviewTrayOpen, setIsPreviewTrayOpen] = useState(false)
  const [hasSelectedCover, setHasSelectedCover] = useState(false)
  
  // UX and notice messages
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null)
  const [themeSelectionNotice, setThemeSelectionNotice] = useState<string | null>(null)
  const [isPreferenceSaving, setIsPreferenceSaving] = useState(false)

  // Memoize resolved preferences from active profile
  const selectedPreferences = useMemo(
    () => getPreferencesForProfile(selectedPreferenceProfile),
    [selectedPreferenceProfile],
  )
  const selectedPreference = selectedPreferences[0] ?? preferences[0]

  // Memoize staging preferences
  const pendingPreferences = useMemo(
    () => getPreferencesForProfile(pendingPreferenceProfile),
    [pendingPreferenceProfile],
  )

  // Check if current view is the onboarding or settings preferences page
  const isPreferenceEditView = activeView === 'preferences' || activeView === 'preferenceEdit'

  // Mutation to persist preferences to backend
  const updatePreferenceMutation = useMutation({
    mutationFn: (profile: PreferenceProfile) =>
      requestUpdatePreference(profile, { accessToken: authAccessToken }),
  })

  // Get selected theme IDs based on active view state
  const getActiveThemeIds = () => {
    const activeProfile = isPreferenceEditView ? pendingPreferenceProfile : selectedPreferenceProfile
    return isPreferenceEditView || hasSelectedCover ? activeProfile.selectedThemeIds : []
  }

  const activeThemeIds = getActiveThemeIds()
  const activeThemeLabels = useMemo(() => getThemeLabels(activeThemeIds), [activeThemeIds])
  const activeThemePreferences = useMemo(() => activeThemeIds.map(getPreferenceByThemeId), [activeThemeIds])
  const activeCountryTrack = (isPreferenceEditView ? pendingPreferenceProfile : selectedPreferenceProfile).countryTrack

  // Validate theme count limits (1 to 3 allowed)
  const hasValidThemeSelection = activeThemeIds.length > 0 && activeThemeIds.length <= 3

  const fallbackPreferenceSelection = isPreferenceEditView
    ? pendingPreferences[0] ?? selectedPreference
    : selectedPreference

  // Generate previews list for selected themes
  const selectedPreviewImages = useMemo(() => {
    const prefs = activeThemePreferences.length > 0 ? activeThemePreferences : [fallbackPreferenceSelection]
    return prefs.flatMap((preference: Preference, preferenceIndex: number) =>
      preference.coverImages.map((coverImage: { city: string; image: string }, coverImageIndex: number) => ({
        ...coverImage,
        key: `${preference.themeId}-${coverImageIndex}-${coverImage.city}`,
        tag: preference.tag,
        themeIndex: preferenceIndex,
      })),
    )
  }, [activeThemePreferences, fallbackPreferenceSelection])

  // Resolve main/featured preview image
  const selectedPreviewPrimaryImage = useMemo(() => {
    return (
      selectedPreviewImages.find((previewImage) => previewImage.key === selectedPreviewImageKey) ??
      selectedPreviewImages[0] ??
      {
        ...fallbackPreferenceSelection.coverImages[0],
        key: `${fallbackPreferenceSelection.themeId}-0-fallback`,
        tag: fallbackPreferenceSelection.tag,
        themeIndex: 0,
      }
    )
  }, [selectedPreviewImages, selectedPreviewImageKey, fallbackPreferenceSelection])

  // Find index of currently selected image
  const selectedPreviewImageIndex = useMemo(() => {
    return Math.max(
      selectedPreviewImages.findIndex((previewImage) => previewImage.key === selectedPreviewPrimaryImage.key),
      0,
    )
  }, [selectedPreviewImages, selectedPreviewPrimaryImage])

  // Get thumbnails list excluding the primary featured image
  const selectedPreviewThumbnails = useMemo(() => {
    return selectedPreviewImages.filter(
      (previewImage) => previewImage.key !== selectedPreviewPrimaryImage.key,
    )
  }, [selectedPreviewImages, selectedPreviewPrimaryImage])

  const selectedPreviewTrayCover = selectedPreviewThumbnails[0]

  // Progress text label e.g., "1 / 4"
  const selectedPreviewThemePosition = useMemo(() => {
    return selectedPreviewImages.length > 0
      ? `${selectedPreviewImageIndex + 1} / ${selectedPreviewImages.length}`
      : '1 / 1'
  }, [selectedPreviewImages, selectedPreviewImageIndex])

  // Determine current active preview card description metadata
  const selectedPreviewPreference = useMemo(() => {
    return activeThemePreferences[selectedPreviewPrimaryImage.themeIndex] ?? activeThemePreferences[0] ?? fallbackPreferenceSelection
  }, [activeThemePreferences, selectedPreviewPrimaryImage.themeIndex, fallbackPreferenceSelection])

  // Resolve hashtags for home dashboard display
  const selectedThemeHashtags = useMemo(() => getThemeHashtags(selectedPreferenceProfile), [selectedPreferenceProfile])

  // Initial Onboarding preference commit handler
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

  // Settings page preference update handler
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

  // Update country track filter (KR vs JP)
  const selectPreferenceCountryTrack = (countryTrack: CountryTrack) => {
    const activeProfile = isPreferenceEditView ? pendingPreferenceProfile : selectedPreferenceProfile
    const nextProfile = {
      ...activeProfile,
      countryTrack,
      updatedAt: new Date().toISOString(),
    }

    if (isPreferenceEditView) {
      setPendingPreferenceProfile(nextProfile)
    } else {
      setSelectedPreferenceProfile(nextProfile)
    }
  }

  // Toggle theme ID selection (min 1, max 3)
  const togglePreferenceTheme = (themeId: ThemeId) => {
    const source = isPreferenceEditView ? 'preference_edit' : 'onboarding'
    const themeIds = activeThemeIds
    const isSelected = themeIds.includes(themeId)
    const nextThemeIds = isSelected
      ? themeIds.filter((currentThemeId) => currentThemeId !== themeId)
      : themeIds.length >= 3
        ? themeIds
        : [...themeIds, themeId]

    if (!isSelected && themeIds.length >= 3) {
      setThemeSelectionNotice('기준 테마는 최대 3개까지 선택할 수 있어요.')
      return
    }

    const activeProfile = isPreferenceEditView ? pendingPreferenceProfile : selectedPreferenceProfile
    const nextProfile = createPreferenceProfile(nextThemeIds, source, activeProfile.countryTrack)

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

  // Preview thumbnail click handler
  const selectPreviewImage = (imageKey: string) => {
    setSelectedPreviewImageKey(imageKey)
    setIsPreviewTrayOpen(false)
  }

  // Enter edit view action
  const enterPreferenceEdit = () => {
    setPreferenceNotice(null)
    setThemeSelectionNotice(null)
    navigateToView('preferences')
  }

  // Revert changes and exit edit view
  const cancelPreferenceEdit = () => {
    setPendingPreferenceProfile(selectedPreferenceProfile)
    setSelectedPreviewImageKey(null)
    setIsPreviewTrayOpen(false)
    setHasSelectedCover(false)
    setThemeSelectionNotice(null)
    navigateToView('mypage', { replace: true })
  }

  return {
    selectedPreferenceProfile,
    setSelectedPreferenceProfile,
    hasCompletedPreference,
    setHasCompletedPreference,
    pendingPreferenceProfile,
    setPendingPreferenceProfile,
    selectedPreviewImageKey,
    setSelectedPreviewImageKey,
    isPreviewTrayOpen,
    setIsPreviewTrayOpen,
    hasSelectedCover,
    setHasSelectedCover,
    preferenceNotice,
    setPreferenceNotice,
    themeSelectionNotice,
    setThemeSelectionNotice,
    isPreferenceSaving,
    setIsPreferenceSaving,
    selectedPreference,
    pendingPreferences,
    enterMainWithPreference,
    savePreferenceEdit,
    selectPreferenceCountryTrack,
    togglePreferenceTheme,
    selectPreviewImage,
    isPreferenceEditView,
    getActiveThemeIds,
    hasValidThemeSelection,
    activeThemeIds,
    activeThemeLabels,
    activeThemePreferences,
    activeCountryTrack,
    selectedPreviewImages,
    selectedPreviewPrimaryImage,
    selectedPreviewImageIndex,
    selectedPreviewThumbnails,
    selectedPreviewTrayCover,
    selectedPreviewThemePosition,
    selectedPreviewPreference,
    selectedThemeHashtags,
    enterPreferenceEdit,
    cancelPreferenceEdit,
  }
}

// EOF: usePreferences.ts
