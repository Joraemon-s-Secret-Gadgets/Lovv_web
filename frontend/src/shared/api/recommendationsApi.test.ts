import { describe, it, expect } from 'vitest'
import { mapRecommendationToDraft } from './recommendationsApi'
import type { RecommendationApiResponse } from './recommendationsApi'
import type { PlanRoute } from '../types/app'

const makeItem = (overrides: Partial<RecommendationApiResponse['itinerary']['days'][0]['items'][0]> = {}) => ({
  itemId: 'item-1',
  sortOrder: 1,
  timeOfDay: 'morning' as const,
  title: '경복궁',
  body: '조선의 법궁',
  reason: '역사 테마',
  moveMinutes: 15,
  ...overrides,
})

const makeDay = (
  day: number,
  items: RecommendationApiResponse['itinerary']['days'][0]['items'],
  overrides: Partial<RecommendationApiResponse['itinerary']['days'][0]> = {},
) => ({
  day,
  title: `${day}일차`,
  summary: `${day}일차 요약`,
  items,
  ...overrides,
})

const makeResponse = (
  days: RecommendationApiResponse['itinerary']['days'],
  overrides: Partial<RecommendationApiResponse> = {},
): RecommendationApiResponse => ({
  itinerary: {
    tripType: '2d1n',
    title: '서울 여행',
    summary: '핵심 코스',
    durationLabel: '1박 2일',
    days,
  },
  ...overrides,
})

// ── timeOfDay 매핑 ────────────────────────────────────────────────────────────
describe('mapRecommendationToDraft — timeOfDay 매핑', () => {
  it('morning → 아침', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'morning' })])])
    const draft = mapRecommendationToDraft(res)
    expect(draft.days[0].stops[0].time).toBe('아침')
  })

  it('"아침" → 아침', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: '아침' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('아침')
  })

  it('afternoon → 점심', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'afternoon' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('점심')
  })

  it('"점심" → 점심', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: '점심' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('점심')
  })

  it('evening → 저녁', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'evening' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('저녁')
  })

  it('"저녁" → 저녁', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: '저녁' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('저녁')
  })

  it('알 수 없는 timeOfDay → 아침 fallback', () => {
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'noon' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('아침')
  })
})

// ── contentId 처리 ────────────────────────────────────────────────────────────
describe('mapRecommendationToDraft — contentId 처리', () => {
  it('contentId 있으면 stop에 포함', () => {
    const res = makeResponse([makeDay(1, [makeItem({ contentId: 'CT-001' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].contentId).toBe('CT-001')
  })

  it('contentId null → stop에 undefined', () => {
    const res = makeResponse([makeDay(1, [makeItem({ contentId: null as unknown as undefined })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].contentId).toBeUndefined()
  })

  it('contentId 필드 없으면 undefined', () => {
    const item = makeItem()
    delete (item as Record<string, unknown>).contentId
    const res = makeResponse([makeDay(1, [item])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].contentId).toBeUndefined()
  })
})

// ── PlanDraft 구조 ────────────────────────────────────────────────────────────
describe('mapRecommendationToDraft — PlanDraft 구조', () => {
  it('durationLabel API 값 그대로', () => {
    const res = makeResponse([makeDay(1, [makeItem()])])
    expect(mapRecommendationToDraft(res).durationLabel).toBe('1박 2일')
  })

  it('dayCount는 days 배열 길이', () => {
    const res = makeResponse([makeDay(1, [makeItem()]), makeDay(2, [makeItem()])])
    expect(mapRecommendationToDraft(res).dayCount).toBe(2)
  })

  it('stops는 days.flatMap(stops)와 동일', () => {
    const res = makeResponse([
      makeDay(1, [makeItem({ timeOfDay: 'morning' }), makeItem({ timeOfDay: 'afternoon' })]),
      makeDay(2, [makeItem({ timeOfDay: 'evening' })]),
    ])
    const draft = mapRecommendationToDraft(res)
    expect(draft.stops).toEqual(draft.days.flatMap(d => d.stops))
    expect(draft.stops).toHaveLength(3)
  })

  it('OpenRouteService route geometry를 day에 보존', () => {
    const route: PlanRoute = {
      provider: 'openrouteservice',
      profile: 'driving-car',
      geometry: {
        type: 'LineString',
        coordinates: [[128.947, 37.771], [128.908, 37.805]],
      },
      distanceMeters: 4200,
      durationSeconds: 780,
      segments: [{ distanceMeters: 4200, durationSeconds: 780 }],
    }
    const res = makeResponse([
      makeDay(1, [makeItem({ title: '안목해변' }), makeItem({ title: '경포해변' })], {
        route,
      }),
    ])

    expect(mapRecommendationToDraft(res).days[0].route).toEqual(route)
  })

  it('지도와 저장 상세에 필요한 stop 좌표와 ORS 이동값을 보존', () => {
    const res = makeResponse([
      makeDay(1, [
        makeItem({
          title: '안목해변',
          latitude: 37.771,
          longitude: 128.947,
          imageUrl: 'https://example.com/anmok.jpg',
          moveDurationSeconds: 780,
          moveDistanceMeters: 4200,
        } as unknown as Partial<RecommendationApiResponse['itinerary']['days'][0]['items'][0]>),
      ]),
    ])

    const stop = mapRecommendationToDraft(res).days[0].stops[0] as Record<string, unknown>

    expect(stop.latitude).toBe(37.771)
    expect(stop.longitude).toBe(128.947)
    expect(stop.imageUrl).toBe('https://example.com/anmok.jpg')
    expect(stop.moveDurationSeconds).toBe(780)
    expect(stop.moveDistanceMeters).toBe(4200)
  })

  it('moveMinutes → "N분" 형식', () => {
    const res = makeResponse([makeDay(1, [makeItem({ moveMinutes: 20 })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].move).toBe('20분')
  })

  it('moveMinutes 0이면 "0분"', () => {
    const res = makeResponse([makeDay(1, [makeItem({ moveMinutes: 0 })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].move).toBe('0분')
  })
})

// ── userNotice 처리 ───────────────────────────────────────────────────────────
describe('mapRecommendationToDraft — userNotice 처리', () => {
  it('userNotice 없으면 undefined', () => {
    const res = makeResponse([makeDay(1, [makeItem()])])
    expect(mapRecommendationToDraft(res).userNotice).toBeUndefined()
  })

  it('userNotice 문자열 → 배열로 변환', () => {
    const res = makeResponse([makeDay(1, [makeItem()])], {
      explanations: { userNotice: '안내 메시지' },
    })
    expect(mapRecommendationToDraft(res).userNotice).toEqual(['안내 메시지'])
  })

  it('userNotice 배열이면 그대로', () => {
    const res = makeResponse([makeDay(1, [makeItem()])], {
      explanations: { userNotice: ['A', 'B'] },
    })
    expect(mapRecommendationToDraft(res).userNotice).toEqual(['A', 'B'])
  })
})

// ── fallback title/summary ────────────────────────────────────────────────────
describe('mapRecommendationToDraft — day title/summary fallback', () => {
  it('title 없으면 stop 제목 기반 fallback 생성', () => {
    const res = makeResponse([
      makeDay(1, [makeItem({ title: '경복궁' }), makeItem({ timeOfDay: 'afternoon', title: '인사동' })], {
        title: '',
        summary: '',
      }),
    ])
    const day = mapRecommendationToDraft(res).days[0]
    expect(day.title).toContain('경복궁')
    expect(day.summary).toContain('경복궁')
  })

  it('title 있으면 API 값 그대로', () => {
    const res = makeResponse([makeDay(1, [makeItem()], { title: '1일차 명소 투어', summary: '핵심 요약' })])
    const day = mapRecommendationToDraft(res).days[0]
    expect(day.title).toBe('1일차 명소 투어')
    expect(day.summary).toBe('핵심 요약')
  })
})
