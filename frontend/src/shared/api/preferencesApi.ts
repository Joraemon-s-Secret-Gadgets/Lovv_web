import { log } from '../logger'
import type { CountryTrack, PreferenceProfile, PreferenceProfileSource, ThemeId } from '../types/app'

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

export type PreferenceApiResponse = PreferenceApiRecord & {
  preferences?: PreferenceApiRecord | null
}

export type PreferenceApiFetchResponse = {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
}

export type PreferenceApiFetch = (input: string, init: RequestInit) => Promise<PreferenceApiFetchResponse>

export type PreferenceApiRequestOptions = {
  baseUrl?: string
  accessToken?: string | null
  fetchImpl?: PreferenceApiFetch
}

export class PreferenceApiRequestError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'PreferenceApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

const preferenceProfileVersion = 2
const validThemeIds = new Set<ThemeId>([
  'healing_rest',
  'sea_coast',
  'history_tradition',
  'food_local',
  'nature_trekking',
  'art_sense',
])
const validSources = new Set<PreferenceProfileSource>([
  'onboarding',
  'preference_edit',
  'legacy_migration',
])
const validCountryTracks = new Set<CountryTrack>(['KR', 'JP'])

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

const readCountryTrack = (...values: unknown[]): CountryTrack => {
  const countryTrack = values.find(
    (value): value is CountryTrack => typeof value === 'string' && validCountryTracks.has(value as CountryTrack),
  )

  return countryTrack ?? 'KR'
}

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

const readUpdatedAt = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ??
  new Date().toISOString()

const defaultPreferencesApiBaseUrl = import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ?? ''

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const buildPreferencesApiUrl = (endpoint: string, baseUrl = defaultPreferencesApiBaseUrl) => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  return normalizedBaseUrl ? `${normalizedBaseUrl}${endpoint}` : endpoint
}

const createPreferenceHeaders = (options: PreferenceApiRequestOptions, hasJsonBody = false) => {
  const headers: Record<string, string> = {}
  const accessToken = options.accessToken?.trim()

  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers.Authorization = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
  }

  return headers
}

const readResponseJson = async (response: PreferenceApiFetchResponse) => {
  if (!response.json) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

const createPreferenceApiRequestError = async (response: PreferenceApiFetchResponse) => {
  const payload = await readResponseJson(response)
  const errorPayload = isRecord(payload) && isRecord(payload.error) ? payload.error : null
  const code = readString(errorPayload?.code, isRecord(payload) ? payload.code : null) || `HTTP_${response.status}`
  const message =
    readString(errorPayload?.message, isRecord(payload) ? payload.message : null) ||
    'Preferences API request failed'

  return new PreferenceApiRequestError(response.status, code, message)
}

const requestPreferencesApiJson = async (
  endpoint: string,
  init: RequestInit,
  options: PreferenceApiRequestOptions,
) => {
  const fetchImpl = options.fetchImpl ?? fetch
  const method = init.method ?? 'GET'
  log.debug('PREF', `→ ${method} ${endpoint}`)
  const response = await fetchImpl(buildPreferencesApiUrl(endpoint, options.baseUrl), {
    ...init,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await createPreferenceApiRequestError(response)
    log.error('PREF', `✗ ${method} ${endpoint} → ${response.status} ${error.code}`)
    throw error
  }

  log.info('PREF', `✓ ${method} ${endpoint} → ${response.status}`)
  const payload = await readResponseJson(response)

  return isRecord(payload) ? (payload as PreferenceApiResponse) : {}
}

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
    countryTrack: readCountryTrack(record.countryTrack, record.country_track),
    selectedThemeIds,
    source: readSource(record.source),
    updatedAt: readUpdatedAt(record.updatedAt, record.updated_at),
  }
}

export const serializePreferenceProfileForApi = (profile: PreferenceProfile) => ({
  countryTrack: profile.countryTrack,
  selectedThemeIds: profile.selectedThemeIds,
})

export const requestUpdatePreference = async (
  profile: PreferenceProfile,
  options: PreferenceApiRequestOptions = {},
) => {
  const payload = await requestPreferencesApiJson(
    preferencesApiEndpoints.update,
    {
      method: 'PUT',
      headers: createPreferenceHeaders(options, true),
      body: JSON.stringify(serializePreferenceProfileForApi(profile)),
    },
    options,
  )
  const record = payload.preferences ?? payload

  return adaptPreferenceApiRecord(record) ?? profile
}
