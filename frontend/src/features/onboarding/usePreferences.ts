import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  createPreferenceProfile,
  getPreferencesForProfile,
  getPrimaryPreference,
  preferences,
  storePreferenceProfile,
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

export interface UsePreferencesOptions {
  authAccessToken: string | null
  isBackendAuthMode: boolean
  selectedPreferenceProfile: PreferenceProfile
  setSelectedPreferenceProfile: React.Dispatch<React.SetStateAction<PreferenceProfile>>
  hasCompletedPreference: boolean
  setHasCompletedPreference: React.Dispatch<React.SetStateAction<boolean>>
  resetPlannerFlow: (preference: Preference, cityContext: PlannerCityContext | null, profile: PreferenceProfile) => void
  navigateToView: (view: View, options?: { replace?: boolean }) => void
}

export function usePreferences({
  authAccessToken,
  isBackendAuthMode,
  selectedPreferenceProfile,
  setSelectedPreferenceProfile,
  hasCompletedPreference,
  setHasCompletedPreference,
  resetPlannerFlow,
  navigateToView,
}: UsePreferencesOptions) {
  const [pendingPreferenceProfile, setPendingPreferenceProfile] = useState(() => selectedPreferenceProfile)
  const [selectedPreviewImageKey, setSelectedPreviewImageKey] = useState<string | null>(null)
  const [isPreviewTrayOpen, setIsPreviewTrayOpen] = useState(false)
  const [hasSelectedCover, setHasSelectedCover] = useState(false)
  
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null)
  const [themeSelectionNotice, setThemeSelectionNotice] = useState<string | null>(null)
  const [isPreferenceSaving, setIsPreferenceSaving] = useState(false)

  const selectedPreferences = useMemo(
    () => getPreferencesForProfile(selectedPreferenceProfile),
    [selectedPreferenceProfile],
  )
  const selectedPreference = selectedPreferences[0] ?? preferences[0]

  const pendingPreferences = useMemo(
    () => getPreferencesForProfile(pendingPreferenceProfile),
    [pendingPreferenceProfile],
  )

  const isPreferenceEditView = (activeView: View) => activeView === 'preferences' || activeView === 'preferenceEdit'

  const updatePreferenceMutation = useMutation({
    mutationFn: (profile: PreferenceProfile) =>
      requestUpdatePreference(profile, { accessToken: authAccessToken }),
  })

  const getActiveThemeIds = (activeView: View) => {
    const isEdit = isPreferenceEditView(activeView)
    const activeProfile = isEdit ? pendingPreferenceProfile : selectedPreferenceProfile
    return isEdit || hasSelectedCover ? activeProfile.selectedThemeIds : []
  }

  const hasValidThemeSelection = (activeView: View) => {
    const themeIds = getActiveThemeIds(activeView)
    return themeIds.length > 0 && themeIds.length <= 3
  }

  const enterMainWithPreference = async (activeView: View) => {
    if (!hasValidThemeSelection(activeView)) {
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

  const savePreferenceEdit = async (activeView: View) => {
    if (!hasValidThemeSelection(activeView)) {
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

  const selectPreferenceCountryTrack = (countryTrack: CountryTrack, activeView: View) => {
    const isEdit = isPreferenceEditView(activeView)
    const activeProfile = isEdit ? pendingPreferenceProfile : selectedPreferenceProfile
    const nextProfile = {
      ...activeProfile,
      countryTrack,
      updatedAt: new Date().toISOString(),
    }

    if (isEdit) {
      setPendingPreferenceProfile(nextProfile)
    } else {
      setSelectedPreferenceProfile(nextProfile)
    }
  }

  const togglePreferenceTheme = (themeId: ThemeId, activeView: View) => {
    const isEdit = isPreferenceEditView(activeView)
    const source = isEdit ? 'preference_edit' : 'onboarding'
    const themeIds = getActiveThemeIds(activeView)
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

    const activeProfile = isEdit ? pendingPreferenceProfile : selectedPreferenceProfile
    const nextProfile = createPreferenceProfile(nextThemeIds, source, activeProfile.countryTrack)

    if (isEdit) {
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
  }
}
