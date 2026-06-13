import type { PlanDay, PlanStop, SavedPlan, SavedPlanLike } from '../types/app'

export const savedPlansApiEndpoints = {
  list: '/api/v1/me/itineraries',
  create: '/api/v1/me/itineraries',
  detail: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}`,
  delete: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}`,
  like: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}/reactions/like`,
  unlike: (itineraryId: string) => `/api/v1/me/itineraries/${encodeURIComponent(itineraryId)}/reactions/like`,
} as const

export type SavedPlanApiRecord = {
  id?: string
  itineraryId?: string
  itinerary_id?: string
  sourceRecommendationId?: string
  source_recommendation_id?: string
  ownerId?: string
  userId?: string
  user_id?: string
  title?: string
  cityPair?: string
  city_pair?: string
  destination?: {
    name?: string
    nameKo?: string
    destinationName?: string
    cityName?: string
  }
  themeTag?: string
  theme_tag?: string
  themeLabels?: string[]
  theme_labels?: string[]
  themes?: string[]
  conditionSummary?: string
  condition_summary?: string
  durationLabel?: string
  duration_label?: string
  festivalThemeLabel?: string
  festival_theme_label?: string
  intensityLabel?: string
  intensity_label?: string
  summary?: string
  itinerary?: {
    days?: PlanDay[]
  }
  days?: PlanDay[]
  stops?: PlanStop[]
  isLiked?: boolean
  is_liked?: boolean | 0 | 1
  createdAt?: string
  created_at?: string
  savedAt?: string
  saved_at?: string
}

export type SavedPlanApiListResponse = {
  data?: SavedPlanApiRecord[]
  items?: SavedPlanApiRecord[]
  savedPlans?: SavedPlanApiRecord[]
  page?: {
    page?: number
    pageSize?: number
    total?: number
    hasNext?: boolean
  }
}

export type SavedPlanApiAdapterResult = {
  savedPlans: SavedPlan[]
  likes: Record<string, Exclude<SavedPlanLike, null>>
}

export type SavedPlansApiFetchResponse = {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
}

export type SavedPlansApiFetch = (input: string, init: RequestInit) => Promise<SavedPlansApiFetchResponse>

export type SavedPlansApiRequestOptions = {
  baseUrl?: string
  accessToken?: string | null
  fetchImpl?: SavedPlansApiFetch
}

export type SavedPlanApiDestination = {
  destinationId: string
  name: string
  country?: string
  region?: string
}

export type SavedPlanApiCreatePayload = {
  sourceRecommendationId: string
  idempotencyKey?: string
  title: string
  summary?: string
  destination: SavedPlanApiDestination
  tripType?: string
  durationLabel: string
  themes?: string[]
  festivalChoice?: string
  intensityLabel?: string
  preferenceSnapshot?: Record<string, unknown>
  conditionsSnapshot?: Record<string, unknown>
  requestSummary?: string
  itinerary: {
    days: PlanDay[]
  }
  alternativeItinerary?: unknown
}

export type SavedPlanApiCreateResponse = {
  itineraryId?: unknown
  itinerary_id?: unknown
  sourceRecommendationId?: unknown
  source_recommendation_id?: unknown
  savedAt?: unknown
  saved_at?: unknown
  duplicate?: unknown
}

export type SavedPlanApiCreateResult = {
  itineraryId: string
  sourceRecommendationId: string
  savedAt: string
  duplicate: boolean
}

export type SavedPlanApiReactionResponse = {
  itineraryId?: unknown
  reactionType?: unknown
  isLiked?: unknown
  changed?: unknown
  updatedAt?: unknown
}

export class SavedPlansApiRequestError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'SavedPlansApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

const readStringArray = (...values: unknown[]) => {
  const value = values.find(Array.isArray)

  return value ? value.filter((item): item is string => typeof item === 'string') : []
}

const readBoolean = (...values: unknown[]) =>
  values.find((value): value is boolean => typeof value === 'boolean') ?? false

const readIsLiked = (record: SavedPlanApiRecord) => {
  if (typeof record.isLiked === 'boolean') {
    return record.isLiked
  }

  if (typeof record.is_liked === 'boolean') {
    return record.is_liked
  }

  return record.is_liked === 1
}

const defaultSavedPlansApiBaseUrl = import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ?? ''

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const buildSavedPlansApiUrl = (endpoint: string, baseUrl = defaultSavedPlansApiBaseUrl) => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  return normalizedBaseUrl ? `${normalizedBaseUrl}${endpoint}` : endpoint
}

const createSavedPlansHeaders = (options: SavedPlansApiRequestOptions, hasJsonBody = false) => {
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

const readResponseJson = async (response: SavedPlansApiFetchResponse) => {
  if (!response.json) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

const createSavedPlansApiRequestError = async (response: SavedPlansApiFetchResponse) => {
  const payload = await readResponseJson(response)
  const errorPayload = isRecord(payload) && isRecord(payload.error) ? payload.error : null
  const code = readString(errorPayload?.code, isRecord(payload) ? payload.code : null) || `HTTP_${response.status}`
  const message =
    readString(errorPayload?.message, isRecord(payload) ? payload.message : null) ||
    'Saved plans API request failed'

  return new SavedPlansApiRequestError(response.status, code, message)
}

const requestSavedPlansApi = async (
  endpoint: string,
  init: RequestInit,
  options: SavedPlansApiRequestOptions,
) => {
  const fetchImpl = options.fetchImpl ?? fetch
  const response = await fetchImpl(buildSavedPlansApiUrl(endpoint, options.baseUrl), {
    ...init,
    credentials: 'include',
  })

  if (!response.ok) {
    throw await createSavedPlansApiRequestError(response)
  }

  return response
}

const requestSavedPlansApiJson = async <T extends Record<string, unknown>>(
  endpoint: string,
  init: RequestInit,
  options: SavedPlansApiRequestOptions,
) => {
  const response = await requestSavedPlansApi(endpoint, init, options)
  const payload = await readResponseJson(response)

  return isRecord(payload) ? (payload as T) : ({} as T)
}

export const adaptSavedPlanCreateResponse = (
  response: SavedPlanApiCreateResponse,
  fallbackSourceRecommendationId = '',
): SavedPlanApiCreateResult => {
  const itineraryId = readString(response.itineraryId, response.itinerary_id)

  return {
    itineraryId,
    sourceRecommendationId:
      readString(response.sourceRecommendationId, response.source_recommendation_id) ||
      fallbackSourceRecommendationId,
    savedAt: readString(response.savedAt, response.saved_at),
    duplicate: readBoolean(response.duplicate),
  }
}

export const requestCreateSavedPlan = async (
  payload: SavedPlanApiCreatePayload,
  options: SavedPlansApiRequestOptions = {},
) => {
  const response = await requestSavedPlansApiJson<SavedPlanApiCreateResponse>(
    savedPlansApiEndpoints.create,
    {
      method: 'POST',
      headers: createSavedPlansHeaders(options, true),
      body: JSON.stringify(payload),
    },
    options,
  )
  const result = adaptSavedPlanCreateResponse(response, payload.sourceRecommendationId)

  if (!result.itineraryId) {
    throw new SavedPlansApiRequestError(200, 'INVALID_SAVE_RESPONSE', 'Saved plan response is missing itineraryId')
  }

  return result
}

export const requestDeleteSavedPlan = async (
  itineraryId: string,
  options: SavedPlansApiRequestOptions = {},
) => {
  await requestSavedPlansApi(
    savedPlansApiEndpoints.delete(itineraryId),
    {
      method: 'DELETE',
      headers: createSavedPlansHeaders(options),
    },
    options,
  )

  return true
}

export const requestListSavedPlans = async (options: SavedPlansApiRequestOptions = {}) => {
  const response = await requestSavedPlansApiJson<SavedPlanApiListResponse>(
    savedPlansApiEndpoints.list,
    {
      method: 'GET',
      headers: createSavedPlansHeaders(options),
    },
    options,
  )

  return adaptSavedPlanApiListResponse(response)
}

export const requestGetSavedPlan = async (
  itineraryId: string,
  options: SavedPlansApiRequestOptions = {},
) => {
  const response = await requestSavedPlansApiJson<SavedPlanApiRecord>(
    savedPlansApiEndpoints.detail(itineraryId),
    {
      method: 'GET',
      headers: createSavedPlansHeaders(options),
    },
    options,
  )
  const savedPlan = adaptSavedPlanApiRecord(response)

  if (!savedPlan) {
    throw new SavedPlansApiRequestError(
      200,
      'INVALID_SAVED_PLAN_DETAIL_RESPONSE',
      'Saved plan detail response is missing required fields',
    )
  }

  return savedPlan
}

export const requestLikeSavedPlan = async (
  itineraryId: string,
  options: SavedPlansApiRequestOptions = {},
) => {
  await requestSavedPlansApiJson<SavedPlanApiReactionResponse>(
    savedPlansApiEndpoints.like(itineraryId),
    {
      method: 'PUT',
      headers: createSavedPlansHeaders(options),
    },
    options,
  )

  return true
}

export const requestUnlikeSavedPlan = async (
  itineraryId: string,
  options: SavedPlansApiRequestOptions = {},
) => {
  await requestSavedPlansApi(
    savedPlansApiEndpoints.unlike(itineraryId),
    {
      method: 'DELETE',
      headers: createSavedPlansHeaders(options),
    },
    options,
  )

  return true
}

export const adaptSavedPlanApiRecord = (record: SavedPlanApiRecord): SavedPlan | null => {
  const id = readString(record.id, record.itineraryId, record.itinerary_id)
  const title = readString(record.title)
  const durationLabel = readString(record.durationLabel, record.duration_label)
  const days = Array.isArray(record.days) ? record.days : Array.isArray(record.itinerary?.days) ? record.itinerary.days : undefined
  const stops = Array.isArray(record.stops) ? record.stops : days?.flatMap((day) => day.stops) ?? []

  if (!id || !title || !durationLabel || stops.length === 0) {
    return null
  }

  const themeLabels = readStringArray(record.themeLabels, record.theme_labels, record.themes)
  const destinationName = readString(
    record.cityPair,
    record.city_pair,
    record.destination?.nameKo,
    record.destination?.destinationName,
    record.destination?.cityName,
    record.destination?.name,
  )

  return {
    id,
    sourceRecommendationId: readString(record.sourceRecommendationId, record.source_recommendation_id),
    ownerId: readString(record.ownerId, record.userId, record.user_id),
    title,
    cityPair: destinationName,
    themeTag: readString(record.themeTag, record.theme_tag, themeLabels[0]),
    themeLabels,
    conditionSummary: readString(record.conditionSummary, record.condition_summary),
    durationLabel,
    festivalThemeLabel: readString(record.festivalThemeLabel, record.festival_theme_label),
    intensityLabel: readString(record.intensityLabel, record.intensity_label),
    summary: readString(record.summary),
    days,
    stops,
    isLiked: readIsLiked(record),
    createdAt: readString(record.createdAt, record.created_at),
    savedAt: readString(record.savedAt, record.saved_at),
  }
}

export const adaptSavedPlanApiListResponse = (
  response: SavedPlanApiListResponse,
): SavedPlanApiAdapterResult => {
  const records = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.items)
      ? response.items
      : response.savedPlans ?? []
  const savedPlans = records.map(adaptSavedPlanApiRecord).filter((plan): plan is SavedPlan => Boolean(plan))
  const likes = savedPlans.reduce<Record<string, Exclude<SavedPlanLike, null>>>((likeMap, plan) => {
    if (plan.isLiked) {
      likeMap[plan.id] = 'like'
    }

    return likeMap
  }, {})

  return { savedPlans, likes }
}
