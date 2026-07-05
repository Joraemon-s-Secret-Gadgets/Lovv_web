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
  rawQuery: string
  country: 'KR' | 'JP'
  travelMonth: number
  travelYear: number
  tripType: 'daytrip' | '2d1n' | '3d2n' | '4d3n' | '5d4n'
  activeRequiredThemes: RecommendationThemeLabel[]
  includeFestivals: boolean
  destinationId: string | null
  executionMode: 'city_discovery' | 'anchored_place_search'
  userLocation: null
  softPreferenceQuery?: string
}

export type RecommendationClarificationRequestPayload = {
  entryType: 'clarify'
  threadId: string
  recommendationId?: string
  selectedOptionId?: string
  rawQuery?: string
}

export type RecommendationRequestPayload =
  | RecommendationCreateRequestPayload
  | RecommendationClarificationRequestPayload

export type RecommendationClarificationOption = {
  optionId?: string
  label?: string
  title?: string
  description?: string
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
      sortOrder: number
      timeOfDay: 'morning' | 'afternoon' | 'evening' | string
      title: string
      body: string
      reason: string
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
  clarification?: RecommendationClarification
  itinerary?: RecommendationItinerary
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

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: createRecommendationsHeaders(options, true),
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Recommendation API request failed with status ${response.status}`)
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

export const mapRecommendationToDraft = (apiResponse: RecommendationApiResponse): PlanDraft => {
  const { itinerary, explanations } = apiResponse

  if (!itinerary) {
    throw new Error('Recommendation API response is missing itinerary')
  }

  const rawNotice = explanations?.userNotice
  const userNotice: string[] = Array.isArray(rawNotice)
    ? rawNotice
    : rawNotice
      ? [rawNotice]
      : []

  const days: PlanDay[] = (itinerary?.days || []).map((d) => {
    const stops: PlanStop[] = (d.items || []).map((item) => {
      let time: '아침' | '점심' | '저녁' = '아침'
      if (item.timeOfDay === 'morning' || item.timeOfDay === '아침') {
        time = '아침'
      } else if (item.timeOfDay === 'afternoon' || item.timeOfDay === '점심') {
        time = '점심'
      } else if (item.timeOfDay === 'evening' || item.timeOfDay === '저녁') {
        time = '저녁'
      }

      return {
        time,
        move: `${item.moveMinutes || 0}분`,
        title: item.title || '',
        body: item.body || '',
        reason: item.reason || '',
        contentId: item.contentId ?? undefined,
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
  }
}
