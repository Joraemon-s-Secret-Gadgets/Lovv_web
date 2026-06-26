/**
 * @file recommendationsApi.ts
 * @description Frontend adapter for calling the recommendation API and mapping the response.
 */

import type { ThemeId, PlanDraft, PlanDay, PlanRoute, PlanStop } from '../types/app'

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
  itinerary: {
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
}

export const requestCreateRecommendation = async (
  payload: RecommendationRequestPayload,
  baseUrl = (import.meta.env.VITE_LOVV_AGENT_API_URL?.trim() || import.meta.env.VITE_LOVV_API_BASE_URL?.trim()) ?? ''
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
