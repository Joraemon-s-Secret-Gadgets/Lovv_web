/**
 * @file recommendationsApi.ts
 * @description Frontend adapter for calling the recommendation API and mapping the response.
 */

import type { ThemeId, PlanDraft, PlanDay, PlanRoute, PlanStop } from '../types/app'

export const recommendationsApiEndpoints = {
  create: '/api/v1/recommendations',
  popularDestinations: '/api/v1/recommendations/popular-destinations',
  reactionCities: '/api/v1/recommendations/reaction-cities',
} as const

export type RecommendationThemeLabel =
  | '바다·해안'
  | '자연·트레킹'
  | '역사·전통'
  | '예술·감성'
  | '온천·휴양'
  | '미식·노포'

export type RecommendationCreateRequestPayload = {
  entryType: 'create'
  requestId: string
  sessionId?: string
  rawQuery: string
  country: 'KR' | 'JP'
  travelMonth: number
  travelYear: number
  tripType: 'daytrip' | '2d1n' | '3d2n' | '4d3n' | '5d4n'
  themes: ThemeId[]
  activeRequiredThemes: RecommendationThemeLabel[]
  includeFestivals: boolean
  destinationId: string | null
  executionMode: 'city_discovery' | 'anchored_place_search'
  userLocation: null
  softPreferenceQuery?: string
  onboardingProfile?: {
    themes: ThemeId[]
    selectedThemeIds?: ThemeId[]
  }
  feedbackHistory?: Array<Record<string, unknown>>
}

export type RecommendationClarificationRequestPayload = {
  entryType: 'clarify'
  threadId: string
  sessionId?: string
  recommendationId?: string
  selectedOptionId?: string
  rawQuery?: string
  naturalLanguageQuery?: string
}

export type RecommendationCurrentOrderItem = {
  itemId: string
  contentId: string
  itemType: 'attraction' | 'festival' | string
  day: number
  order: number
  title: string
  isSeed?: boolean
  cityId?: string
  theme?: string
  latitude?: number | null
  longitude?: number | null
  indoorOutdoor?: string
}

export type RecommendationModifyRequestPayload = {
  entryType: 'modify'
  requestId?: string
  sessionId: string
  threadId: string
  recommendationId?: string
  actorId?: string
  itineraryRevision?: string
  destinationId?: string
  country?: RecommendationCreateRequestPayload['country']
  travelMonth?: number
  travelYear?: number
  tripType?: RecommendationCreateRequestPayload['tripType']
  themes?: ThemeId[]
  activeRequiredThemes?: RecommendationThemeLabel[]
  includeFestivals?: boolean
  onboardingProfile?: RecommendationCreateRequestPayload['onboardingProfile']
  feedbackHistory?: RecommendationCreateRequestPayload['feedbackHistory']
  rawModifyQuery: string
  currentOrder: RecommendationCurrentOrderItem[]
}

export type RecommendationRequestPayload =
  | RecommendationCreateRequestPayload
  | RecommendationClarificationRequestPayload
  | RecommendationModifyRequestPayload

export type RecommendationClarificationOption = {
  optionId?: string
  label?: string
  title?: string
  description?: string
  helperText?: string | null
  apply?: unknown
  then?: unknown
}

export type RecommendationClarification = {
  reasonCode?: string
  prompt?: string
  question?: string
  message?: string
  options?: RecommendationClarificationOption[]
}

export type RecommendationExplainability = {
  matchedConditions?: string[]
  unsupportedConditions?: string[]
  recommendationReasons?: string[]
  itineraryFlowReason?: string
  confidence?: number | string
  userNotice?: string | string[]
}

export type RecommendationLinks = {
  map?: string
  staySearch?: string
  [key: string]: string | undefined
}

export type RecommendationItinerary = {
  tripType: string
  title: string
  summary: string
  durationLabel: string
  days: Array<{
    day: number
    title: string
    summary: string
    route?: PlanRoute
    items: Array<{
      itemId: string
      contentId?: string
      itemType?: 'attraction' | 'festival' | string
      day?: number
      order?: number
      sortOrder: number
      timeOfDay: 'morning' | 'afternoon' | 'evening' | string
      title: string
      body: string
      reason: string
      isSeed?: boolean
      cityId?: string
      theme?: string
      indoorOutdoor?: string
      moveMinutes: number
      moveDurationSeconds?: number | null
      moveDistanceMeters?: number | null
      latitude?: number | null
      longitude?: number | null
      imageUrl?: string | null
      image_url?: string | null
    }>
  }>
}

const SEQUENTIAL_TIME_LABELS = ['아침', '점심', '저녁'] as const

const normalizeItineraryTimeLabel = (timeOfDay?: string): PlanStop['time'] => {
  const normalized = timeOfDay?.trim().toLowerCase()

  if (
    normalized === 'morning' ||
    normalized === 'breakfast' ||
    normalized === 'am' ||
    normalized === '아침' ||
    normalized === '오전'
  ) {
    return '아침'
  }

  if (
    normalized === 'afternoon' ||
    normalized === 'lunch' ||
    normalized === 'noon' ||
    normalized === 'midday' ||
    normalized === 'pm' ||
    normalized === '점심' ||
    normalized === '오후'
  ) {
    return '점심'
  }

  if (
    normalized === 'evening' ||
    normalized === 'dinner' ||
    normalized === 'night' ||
    normalized === '저녁' ||
    normalized === '밤'
  ) {
    return '저녁'
  }

  return '아침'
}

const shouldUseSequentialTimeLabels = (items: RecommendationItinerary['days'][0]['items']) => {
  if (items.length < SEQUENTIAL_TIME_LABELS.length) {
    return false
  }

  return items
    .slice(0, SEQUENTIAL_TIME_LABELS.length)
    .some((item, index) => normalizeItineraryTimeLabel(item.timeOfDay) !== SEQUENTIAL_TIME_LABELS[index])
}

export type RecommendationApiResponse = {
  status?: string
  state?: string
  threadId?: string
  recommendationId?: string
  sessionId?: string
  generatedAt?: string
  fallback?: boolean
  error?: string
  destination?: {
    destinationId?: string
    cityId?: string
    name?: string
    country?: string
    region?: string
  }
  explanations?: {
    userNotice?: string | string[]
    confidence?: number | string
    recommendationReasons?: string[]
  }
  explainability?: RecommendationExplainability
  links?: RecommendationLinks
  festivalDateVerifications?: unknown
  alternativeItinerary?: unknown
  expiresAt?: string
  clarification?: RecommendationClarification
  itinerary?: RecommendationItinerary
}

const isRecommendationItineraryLike = (value: unknown): value is RecommendationItinerary => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Partial<RecommendationItinerary>

  return Array.isArray(record.days)
}

const resolveMappableItinerary = (
  apiResponse: RecommendationApiResponse,
  preferAlternativeItinerary = false,
): RecommendationItinerary | undefined => {
  if (
    preferAlternativeItinerary &&
    isRecommendationItineraryLike(apiResponse.alternativeItinerary) &&
    apiResponse.alternativeItinerary.days.length > 0
  ) {
    const alternative = apiResponse.alternativeItinerary
    const original = apiResponse.itinerary

    return {
      tripType: alternative.tripType || original?.tripType || 'daytrip',
      title: alternative.title || original?.title || '날씨 대체 일정',
      summary: alternative.summary || original?.summary || '날씨 영향을 줄인 대체 일정입니다.',
      durationLabel: alternative.durationLabel || original?.durationLabel || '당일치기',
      days: alternative.days,
    }
  }

  if (isRecommendationItineraryLike(apiResponse.itinerary) && apiResponse.itinerary.days.length > 0) {
    return apiResponse.itinerary
  }

  if (isRecommendationItineraryLike(apiResponse.alternativeItinerary) && apiResponse.alternativeItinerary.days.length > 0) {
    const alternative = apiResponse.alternativeItinerary
    const original = apiResponse.itinerary

    return {
      tripType: alternative.tripType || original?.tripType || 'daytrip',
      title: alternative.title || original?.title || '날씨 대체 일정',
      summary: alternative.summary || original?.summary || '날씨 영향을 줄인 대체 일정입니다.',
      durationLabel: alternative.durationLabel || original?.durationLabel || '당일치기',
      days: alternative.days,
    }
  }

  return apiResponse.itinerary
}

export type PopularDestinationApiItem = {
  cityId?: string
  name?: string
  region?: string
  country?: 'KR' | 'JP' | string
  countryLabel?: string
  themeIds?: ThemeId[] | string[]
  themes?: string[]
  imageUrl?: string | null
  image_url?: string | null
  reactionCount?: number
  reaction_count?: number
  savedPlanCount?: number
  saved_plan_count?: number
  title?: string
  summary?: string
  recommendationReason?: string
  recommendation_reason?: string
  priority?: number
  sourceReaction?: Record<string, unknown>
  source_reaction?: Record<string, unknown>
}

export type PopularDestinationsApiResponse = {
  items?: PopularDestinationApiItem[]
  ageGroups?: Array<{
    ageGroup?: string
    label?: string
    items?: PopularDestinationApiItem[]
  }>
}

type RecommendationsApiFetch = typeof fetch

type RecommendationsApiRequestOptions = {
  baseUrl?: string
  accessToken?: string | null
  fetchImpl?: RecommendationsApiFetch
  retryDelayMs?: number
}

export class RecommendationApiRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message)
    this.name = 'RecommendationApiRequestError'
    this.status = status
    this.code = code
  }
}

const defaultRecommendationCreateApiBaseUrl =
  (import.meta.env.VITE_LOVV_AGENT_API_URL?.trim() || import.meta.env.VITE_LOVV_API_BASE_URL?.trim()) ?? ''
const defaultLovvApiBaseUrl = import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ?? ''

const resolveRecommendationsApiOptions = (
  baseUrlOrOptions?: string | RecommendationsApiRequestOptions,
): RecommendationsApiRequestOptions => (
  typeof baseUrlOrOptions === 'string' ? { baseUrl: baseUrlOrOptions } : baseUrlOrOptions ?? {}
)

const buildRecommendationsApiUrl = (endpoint: string, baseUrl = defaultLovvApiBaseUrl) => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  return normalizedBaseUrl ? `${normalizedBaseUrl}${endpoint}` : endpoint
}

const createRecommendationsHeaders = (
  options: RecommendationsApiRequestOptions,
  hasJsonBody = false,
) => {
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

const createRecommendationApiRequestError = async (response: Response) => {
  let code = 'RECOMMENDATION_REQUEST_FAILED'
  let message = `Recommendation API request failed with status ${response.status}`

  try {
    const body = await response.json()

    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>
      const nestedError = record.error && typeof record.error === 'object'
        ? record.error as Record<string, unknown>
        : null

      if (typeof record.code === 'string' && record.code.trim()) {
        code = record.code.trim()
      }
      if (typeof record.message === 'string' && record.message.trim()) {
        message = record.message.trim()
      }
      if (typeof record.error === 'string' && record.error.trim()) {
        message = record.error.trim()
      }
      if (typeof nestedError?.code === 'string' && nestedError.code.trim()) {
        code = nestedError.code.trim()
      }
      if (typeof nestedError?.message === 'string' && nestedError.message.trim()) {
        message = nestedError.message.trim()
      }
    }
  } catch {
    // Keep the status-based fallback when the backend returns a non-JSON error body.
  }

  return new RecommendationApiRequestError(response.status, code, message)
}

export const requestCreateRecommendation = async (
  payload: RecommendationRequestPayload,
  baseUrlOrOptions?: string | RecommendationsApiRequestOptions,
): Promise<RecommendationApiResponse> => {
  const options = resolveRecommendationsApiOptions(baseUrlOrOptions)
  const fetchImpl = options.fetchImpl ?? fetch
  const url = buildRecommendationsApiUrl(
    recommendationsApiEndpoints.create,
    options.baseUrl ?? defaultRecommendationCreateApiBaseUrl,
  )

  const requestInit: RequestInit = {
    method: 'POST',
    headers: createRecommendationsHeaders(options, true),
    body: JSON.stringify(payload),
    credentials: 'include',
  }
  let response = await fetchImpl(url, requestInit)

  if (payload.entryType === 'create' && !response.ok && [502, 503, 504].includes(response.status)) {
    const retryDelayMs = options.retryDelayMs ?? 1_000

    if (retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
    }

    response = await fetchImpl(url, requestInit)
  }

  if (!response.ok) {
    throw await createRecommendationApiRequestError(response)
  }

  return response.json()
}

export const requestListPopularDestinations = async (
  limit = 6,
  baseUrl = import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ?? '',
): Promise<Required<Pick<PopularDestinationsApiResponse, 'items' | 'ageGroups'>>> => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
  const endpoint = `${recommendationsApiEndpoints.popularDestinations}?limit=${encodeURIComponent(String(limit))}`
  const url = normalizedBaseUrl ? `${normalizedBaseUrl}${endpoint}` : endpoint

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Popular destinations API request failed with status ${response.status}`)
  }

  const body = (await response.json()) as PopularDestinationsApiResponse
  return {
    items: Array.isArray(body.items) ? body.items : [],
    ageGroups: Array.isArray(body.ageGroups) ? body.ageGroups : [],
  }
}

export const requestListReactionCities = async (
  limit = 1,
  baseUrlOrOptions?: string | RecommendationsApiRequestOptions,
): Promise<Required<Pick<PopularDestinationsApiResponse, 'items'>>> => {
  const options = resolveRecommendationsApiOptions(baseUrlOrOptions)
  const fetchImpl = options.fetchImpl ?? fetch
  const endpoint = `${recommendationsApiEndpoints.reactionCities}?limit=${encodeURIComponent(String(limit))}`
  const url = buildRecommendationsApiUrl(endpoint, options.baseUrl)

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: createRecommendationsHeaders(options),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Reaction cities API request failed with status ${response.status}`)
  }

  const body = (await response.json()) as Pick<PopularDestinationsApiResponse, 'items'>
  return {
    items: Array.isArray(body.items) ? body.items : [],
  }
}

export const mapRecommendationToDraft = (
  apiResponse: RecommendationApiResponse,
  options: { preferAlternativeItinerary?: boolean } = {},
): PlanDraft => {
  const { explainability, explanations } = apiResponse
  const itinerary = resolveMappableItinerary(apiResponse, options.preferAlternativeItinerary)

  if (!itinerary) {
    throw new Error('Recommendation API response is missing itinerary')
  }

  const rawNotice = explainability?.userNotice ?? explanations?.userNotice
  const userNotice: string[] = Array.isArray(rawNotice)
    ? rawNotice
    : rawNotice
      ? [rawNotice]
      : []
  const recommendationReasons =
    explainability?.recommendationReasons ?? explanations?.recommendationReasons
  const confidence = explainability?.confidence ?? explanations?.confidence

  const days: PlanDay[] = (itinerary?.days || []).map((d) => {
    const items = d.items || []
    const useSequentialTimeLabels = shouldUseSequentialTimeLabels(items)
    const stops: PlanStop[] = items.map((item, index) => {
      const time =
        useSequentialTimeLabels && index < SEQUENTIAL_TIME_LABELS.length
          ? SEQUENTIAL_TIME_LABELS[index]
          : normalizeItineraryTimeLabel(item.timeOfDay)

      return {
        itemId: item.itemId || undefined,
        itemType: item.itemType || undefined,
        day: item.day ?? d.day,
        order: item.order ?? item.sortOrder ?? undefined,
        time,
        move: `${item.moveMinutes || 0}분`,
        title: item.title || '',
        body: item.body || '',
        reason: item.reason || '',
        contentId: item.contentId ?? undefined,
        isSeed: item.isSeed ?? undefined,
        cityId: item.cityId ?? apiResponse.destination?.cityId ?? apiResponse.destination?.destinationId ?? undefined,
        theme: item.theme ?? undefined,
        indoorOutdoor: item.indoorOutdoor ?? undefined,
        imageUrl: item.imageUrl?.trim() || item.image_url?.trim() || undefined,
        latitude: item.latitude ?? undefined,
        longitude: item.longitude ?? undefined,
        moveDurationSeconds: item.moveDurationSeconds ?? undefined,
        moveDistanceMeters: item.moveDistanceMeters ?? undefined,
      }
    })

    // Bedrock Agent가 일차별 title/summary를 안 내줬을 경우, 코스 이름을 엮어서 동적으로 빌드
    const stopTitles = stops.map((s) => s.title).filter(Boolean)
    let fallbackTitle = d.title || ''
    let fallbackSummary = d.summary || ''

    if (!fallbackTitle) {
      if (stopTitles.length > 0) {
        fallbackTitle = stopTitles.length > 1
          ? `${stopTitles[0]}, ${stopTitles[1]} 중심 일정`
          : `${stopTitles[0]} 중심 일정`
      } else {
        fallbackTitle = `${d.day}일차 여행`
      }
    }

    if (!fallbackSummary) {
      if (stopTitles.length > 0) {
        fallbackSummary = `${stopTitles.join(' ➔ ')} 등을 차례로 방문하는 일정입니다.`
      } else {
        fallbackSummary = `${d.day}일차 일정을 확인해 보세요.`
      }
    }

    return {
      day: d.day,
      title: fallbackTitle,
      summary: fallbackSummary,
      stops,
      route: d.route,
    }
  })

  const stops = days.flatMap((d) => d.stops)

  return {
    durationLabel: itinerary?.durationLabel || '당일치기',
    dayCount: days.length,
    intensityLabel: 'AI 추천 여행 코스',
    festivalThemeLabel: '',
    summary: itinerary?.summary || '',
    days,
    stops,
    userNotice: userNotice.length > 0 ? userNotice : undefined,
    recommendationReasons:
      Array.isArray(recommendationReasons) && recommendationReasons.length > 0
        ? recommendationReasons
        : undefined,
    confidence,
    links: apiResponse.links,
    festivalDateVerifications: apiResponse.festivalDateVerifications,
    alternativeItinerary: apiResponse.alternativeItinerary,
  }
}

export const mapDraftToRecommendationCurrentOrder = (draft: PlanDraft): RecommendationCurrentOrderItem[] =>
  draft.days.flatMap((day) =>
    day.stops
      .map((stop, index) => {
        const fallbackId = `day-${day.day}-order-${index + 1}-${stop.title.trim().replace(/\s+/g, '-')}`

        return {
          itemId: stop.itemId || stop.contentId || fallbackId,
          contentId: stop.contentId || stop.itemId || fallbackId,
          itemType: stop.itemType || (stop.source === 'wishlist' ? 'restaurant' : 'attraction'),
          day: stop.day ?? day.day,
          order: index + 1,
          title: stop.title,
          isSeed: stop.isSeed,
          cityId: stop.cityId,
          theme: stop.theme,
          latitude: stop.latitude ?? null,
          longitude: stop.longitude ?? null,
          indoorOutdoor: stop.indoorOutdoor,
        }
      })
      .filter((item) => item.title),
  )
