import type { PreferenceProfile, PreferenceProfileSource, ThemeId } from '../types/app'

export const preferencesApiEndpoints = {
  get: '/api/v1/me/preferences',
  update: '/api/v1/me/preferences',
} as const

export type PreferenceApiRecord = {
  version?: number
  selectedThemeIds?: unknown
  selected_theme_ids?: unknown
  mappedThemes?: unknown
  mapped_themes?: unknown
  countryTrack?: unknown
  country_track?: unknown
  onboardingCompleted?: unknown
  onboarding_completed?: unknown
  themeIds?: unknown
  theme_ids?: unknown
  source?: unknown
  updatedAt?: unknown
  updated_at?: unknown
}

const preferenceProfileVersion = 2
const validThemeIds = new Set<ThemeId>([
  'hot_spring_rest',
  'sea_coast',
  'history_tradition',
  'food_local',
  'nature_trekking',
  'art_emotion',
])
const validSources = new Set<PreferenceProfileSource>([
  'onboarding',
  'preference_edit',
  'legacy_migration',
])

const readThemeIds = (...values: unknown[]) => {
  const rawThemeIds = values.find((value): value is unknown[] => Array.isArray(value)) ?? []

  return rawThemeIds
    .filter((themeId): themeId is ThemeId => typeof themeId === 'string' && validThemeIds.has(themeId as ThemeId))
    .filter((themeId, index, themeIds) => themeIds.indexOf(themeId) === index)
    .slice(0, 3)
}

const readSource = (source: unknown): PreferenceProfileSource =>
  typeof source === 'string' && validSources.has(source as PreferenceProfileSource)
    ? (source as PreferenceProfileSource)
    : 'onboarding'

const readUpdatedAt = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ??
  new Date().toISOString()

export const adaptPreferenceApiRecord = (record: PreferenceApiRecord): PreferenceProfile | null => {
  const selectedThemeIds = readThemeIds(
    record.selectedThemeIds,
    record.selected_theme_ids,
    record.mappedThemes,
    record.mapped_themes,
    record.themeIds,
    record.theme_ids,
  )

  if (selectedThemeIds.length === 0) {
    return null
  }

  return {
    version: preferenceProfileVersion,
    selectedThemeIds,
    source: readSource(record.source),
    updatedAt: readUpdatedAt(record.updatedAt, record.updated_at),
  }
}

export const serializePreferenceProfileForApi = (profile: PreferenceProfile) => ({
  selectedThemeIds: profile.selectedThemeIds,
})
