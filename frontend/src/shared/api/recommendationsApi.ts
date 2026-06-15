/**
 * @file recommendationsApi.ts
 * @description Frontend adapter for calling the recommendation API and mapping the response.
 */

import type { ThemeId, PlanDraft, PlanDay, PlanStop } from '../types/app'

export const recommendationsApiEndpoints = {
  create: '/api/v1/recommendations',
} as const

export type RecommendationRequestPayload = {
  entryType: 'chat' | 'map_marker' | 'home_recommendation'
  country: 'KR' | 'JP'
  tripType: 'daytrip' | '2d1n' | '3d2n' | '4d3n' | '5d4n'
  themes: ThemeId[]
  includeFestivals: boolean
  destinationId?: string
  naturalLanguageQuery?: string
  sessionId?: string
  travelYear?: number
  travelMonth?: number
}

export type RecommendationApiResponse = {
  sessionId?: string
  generatedAt?: string
  fallback?: boolean
  error?: string
  explanations?: {
    userNotice?: string | string[]
    confidence?: number | string
    recommendationReasons?: string[]
  }
  itinerary: {
    tripType: string
    title: string
    summary: string
    durationLabel: string
    days: Array<{
      day: number
      title: string
      summary: string
      items: Array<{
        itemId: string
        contentId?: string
        sortOrder: number
        timeOfDay: 'morning' | 'afternoon' | 'evening' | string
        title: string
        body: string
        reason: string
        moveMinutes: number
        latitude?: number | null
        longitude?: number | null
      }>
    }>
  }
}

export const requestCreateRecommendation = async (
  payload: RecommendationRequestPayload,
  baseUrl = import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ?? ''
): Promise<RecommendationApiResponse> => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
  const url = normalizedBaseUrl
    ? `${normalizedBaseUrl}${recommendationsApiEndpoints.create}`
    : recommendationsApiEndpoints.create

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Recommendation API request failed with status ${response.status}`)
  }

  return response.json()
}

export const mapRecommendationToDraft = (apiResponse: RecommendationApiResponse): PlanDraft => {
  const { itinerary, explanations } = apiResponse

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
      }
    })

    return {
      day: d.day,
      title: d.title || '',
      summary: d.summary || '',
      stops,
    }
  })

  const stops = days.flatMap((d) => d.stops)

  return {
    durationLabel: itinerary?.durationLabel || '당일치기',
    dayCount: days.length,
    intensityLabel: '동선이 느슨한 일정',
    festivalThemeLabel: '',
    summary: itinerary?.summary || '',
    days,
    stops,
    userNotice: userNotice.length > 0 ? userNotice : undefined,
  }
}
