import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  RecommendationApiRequestError,
  mapDraftToRecommendationCurrentOrder,
  mapRecommendationToDraft,
  requestCreateRecommendation,
  requestListPopularDestinations,
  requestListReactionCities,
} from './recommendationsApi'
import type {
  RecommendationApiResponse,
  RecommendationItinerary,
  RecommendationRequestPayload,
} from './recommendationsApi'
import type { PlanRoute } from '../types/app'

afterEach(() => {
  vi.restoreAllMocks()
})

const makeItem = (overrides: Partial<RecommendationItinerary['days'][0]['items'][0]> = {}) => ({
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
  items: RecommendationItinerary['days'][0]['items'],
  overrides: Partial<RecommendationItinerary['days'][0]> = {},
) => ({
  day,
  title: `${day}일차`,
  summary: `${day}일차 요약`,
  items,
  ...overrides,
})

const makeResponse = (
  days: RecommendationItinerary['days'],
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

describe('requestCreateRecommendation', () => {
  it('calls the recommendation endpoint with credentials and authorization when access token is provided', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeDay(1, [makeItem()])]),
    })
    const payload: RecommendationRequestPayload = {
      entryType: 'create',
      requestId: 'req-001',
      rawQuery: '양양으로 1박 2일',
      country: 'KR' as const,
      travelMonth: 7,
      travelYear: 2026,
      tripType: '2d1n' as const,
      themes: ['sea_coast'],
      activeRequiredThemes: ['바다·해안'],
      includeFestivals: false,
      destinationId: 'KR-42-830',
      executionMode: 'anchored_place_search',
      userLocation: null,
    }

    const response = await requestCreateRecommendation(payload, {
      baseUrl: 'https://api.lovv.example/',
      accessToken: 'access-token',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.example/api/v1/recommendations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      },
    )
    expect(response.itinerary?.title).toBe('서울 여행')
  })

  it('keeps explicit Bearer tokens intact', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeDay(1, [makeItem()])]),
    })

    await requestCreateRecommendation(
      {
        entryType: 'create',
        requestId: 'req-002',
        rawQuery: '자연 쪽으로 당일치기',
        country: 'KR',
        travelMonth: 7,
        travelYear: 2026,
        tripType: 'daytrip',
        themes: ['nature_trekking'],
        activeRequiredThemes: ['자연·트레킹'],
        includeFestivals: false,
        destinationId: null,
        executionMode: 'city_discovery',
        userLocation: null,
      },
      { baseUrl: '', accessToken: 'Bearer restored-token', fetchImpl },
    )

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/v1/recommendations',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer restored-token',
        }),
      }),
    )
  })

  it('preserves recommendation API error status and code', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        code: 'AGENTCORE_UNAVAILABLE',
        message: 'Recommendation generation is temporarily unavailable',
      }),
    })

    await expect(
      requestCreateRecommendation(
        {
          entryType: 'modify',
          requestId: 'req-modify-001',
          sessionId: 'session-001',
          threadId: 'thread-001',
          rawModifyQuery: '1일차 아침 일정 바꿔줘',
          currentOrder: [],
        },
        { fetchImpl },
      ),
    ).rejects.toMatchObject({
      name: 'RecommendationApiRequestError',
      status: 502,
      code: 'AGENTCORE_UNAVAILABLE',
      message: 'Recommendation generation is temporarily unavailable',
    })

    await expect(
      requestCreateRecommendation(
        {
          entryType: 'modify',
          requestId: 'req-modify-002',
          sessionId: 'session-001',
          threadId: 'thread-001',
          rawModifyQuery: '1일차 아침 일정 바꿔줘',
          currentOrder: [],
        },
        { fetchImpl },
      ),
    ).rejects.toBeInstanceOf(RecommendationApiRequestError)
  })

  it('reads the backend nested error envelope', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'themes is required',
        },
      }),
    })

    await expect(
      requestCreateRecommendation(
        {
          entryType: 'create',
          requestId: 'req-invalid-001',
          rawQuery: '양양 당일치기',
          country: 'KR',
          travelMonth: 7,
          travelYear: 2026,
          tripType: 'daytrip',
          themes: ['sea_coast'],
          activeRequiredThemes: ['바다·해안'],
          includeFestivals: false,
          destinationId: null,
          executionMode: 'city_discovery',
          userLocation: null,
        },
        { fetchImpl },
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'themes is required',
    })
  })

  it('sends clarification option answers without rewriting the server option id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'END',
        itinerary: {
          tripType: '2d1n',
          title: '양양 여행',
          summary: '확정된 일정',
          durationLabel: '1박 2일',
          days: [],
        },
      }),
    })
    const payload: RecommendationRequestPayload = {
      entryType: 'clarify',
      threadId: 'thread-001',
      recommendationId: 'rec-001',
      selectedOptionId: 'continue_without_festival',
    }

    await requestCreateRecommendation(payload, {
      baseUrl: 'https://api.lovv.example/',
      accessToken: 'access-token',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.example/api/v1/recommendations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )
  })

  it('accepts V2 clarification responses with thread and recommendation ids', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        threadId: 'thread-001',
        recommendationId: 'rec-001',
        clarification: {
          question: '숙박 중심으로 더 좁힐까요?',
          options: [{
            optionId: 'stay',
            label: '숙박 중심',
            helperText: '숙소 주변 후보를 우선합니다.',
            apply: { destinationId: null },
            then: 'anchor',
          }],
        },
      }),
    })

    const response = await requestCreateRecommendation(
      {
        entryType: 'clarify',
        threadId: 'thread-001',
        recommendationId: 'rec-001',
        selectedOptionId: 'stay',
      },
      { fetchImpl },
    )

    expect(response.threadId).toBe('thread-001')
    expect(response.recommendationId).toBe('rec-001')
    expect(response.clarification?.question).toBe('숙박 중심으로 더 좁힐까요?')
    expect(response.clarification?.options?.[0].optionId).toBe('stay')
    expect(response.clarification?.options?.[0].helperText).toBe('숙소 주변 후보를 우선합니다.')
    expect(response.clarification?.options?.[0].apply).toEqual({ destinationId: null })
    expect(response.clarification?.options?.[0].then).toBe('anchor')
  })

  it('builds V2 modify currentOrder from preserved PlanDraft item metadata', () => {
    const draft = mapRecommendationToDraft(
      makeResponse([
        makeDay(1, [
          makeItem({
            itemId: 'item-2',
            contentId: '2723663',
            itemType: 'attraction',
            day: 1,
            order: 2,
            title: '묵호항',
            isSeed: false,
            cityId: 'KR-32-3',
            theme: '바다·해안',
            latitude: 37.5491,
            longitude: 129.1162,
            indoorOutdoor: 'outdoor',
          }),
        ]),
      ]),
    )

    expect(mapDraftToRecommendationCurrentOrder(draft)).toEqual([
      {
        itemId: 'item-2',
        contentId: '2723663',
        itemType: 'attraction',
        day: 1,
        order: 1,
        title: '묵호항',
        isSeed: false,
        cityId: 'KR-32-3',
        theme: '바다·해안',
        latitude: 37.5491,
        longitude: 129.1162,
        indoorOutdoor: 'outdoor',
      },
    ])
  })

  it('builds currentOrder for local draft stops without backend item ids', () => {
    const draft = mapRecommendationToDraft(
      makeResponse([
        makeDay(1, [
          makeItem({ itemId: '', contentId: '', title: '점심 후보', timeOfDay: 'lunch' }),
          makeItem({ itemId: '', contentId: '', title: '저녁 후보', timeOfDay: 'dinner' }),
        ]),
      ]),
    )

    expect(mapDraftToRecommendationCurrentOrder(draft)).toEqual([
      expect.objectContaining({
        itemId: 'day-1-order-1-점심-후보',
        contentId: 'day-1-order-1-점심-후보',
        order: 1,
        title: '점심 후보',
      }),
      expect.objectContaining({
        itemId: 'day-1-order-2-저녁-후보',
        contentId: 'day-1-order-2-저녁-후보',
        order: 2,
        title: '저녁 후보',
      }),
    ])
  })
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
    const res = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'unknown-time' })])])
    expect(mapRecommendationToDraft(res).days[0].stops[0].time).toBe('아침')
  })

  it('lunch/noon/dinner 같은 V2 별칭을 한국어 시간대로 매핑', () => {
    const lunch = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'lunch' })])])
    const noon = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'noon' })])])
    const dinner = makeResponse([makeDay(1, [makeItem({ timeOfDay: 'dinner' })])])

    expect(mapRecommendationToDraft(lunch).days[0].stops[0].time).toBe('점심')
    expect(mapRecommendationToDraft(noon).days[0].stops[0].time).toBe('점심')
    expect(mapRecommendationToDraft(dinner).days[0].stops[0].time).toBe('저녁')
  })

  it('하루 3개 코스의 중복 시간대는 카드 순서대로 아침/점심/저녁으로 보정', () => {
    const res = makeResponse([
      makeDay(1, [
        makeItem({ timeOfDay: 'lunch', title: '첫 번째 장소' }),
        makeItem({ timeOfDay: 'lunch', title: '두 번째 장소' }),
        makeItem({ timeOfDay: 'dinner', title: '세 번째 장소' }),
      ]),
    ])

    expect(mapRecommendationToDraft(res).days[0].stops.map((stop) => stop.time)).toEqual([
      '아침',
      '점심',
      '저녁',
    ])
  })
})

describe('mapRecommendationToDraft — AgentCore V2 fields', () => {
  it('uses V2 explainability before legacy explanations', () => {
    const draft = mapRecommendationToDraft(
      makeResponse(
        [makeDay(1, [makeItem()])],
        {
          explainability: {
            userNotice: 'V2 운영 시간 확인 필요',
            confidence: 0.87,
            recommendationReasons: ['역사 테마와 잘 맞습니다.'],
          },
          explanations: {
            userNotice: 'legacy notice',
            confidence: 'legacy',
            recommendationReasons: ['legacy reason'],
          },
        },
      ),
    )

    expect(draft.userNotice).toEqual(['V2 운영 시간 확인 필요'])
    expect(draft.confidence).toBe(0.87)
    expect(draft.recommendationReasons).toEqual(['역사 테마와 잘 맞습니다.'])
  })

  it('preserves V2 links, festival verifications, and alternative itinerary metadata', () => {
    const alternativeItinerary = { trigger: 'rain', days: [] }
    const festivalDateVerifications = [{ festivalId: 'festival-1', dateStatus: 'confirmed' }]
    const links = {
      map: 'https://maps.example/gyeongju',
      staySearch: 'https://stay.example/gyeongju',
    }

    const draft = mapRecommendationToDraft(
      makeResponse(
        [makeDay(1, [makeItem()])],
        {
          links,
          festivalDateVerifications,
          alternativeItinerary,
        },
      ),
    )

    expect(draft.links).toEqual(links)
    expect(draft.festivalDateVerifications).toEqual(festivalDateVerifications)
    expect(draft.alternativeItinerary).toEqual(alternativeItinerary)
  })

  it('uses alternativeItinerary days when the primary itinerary has no days', () => {
    const draft = mapRecommendationToDraft(
      makeResponse(
        [],
        {
          alternativeItinerary: {
            tripType: 'daytrip',
            title: '비 오는 날 대체 일정',
            summary: '실내 중심 대체 일정입니다.',
            durationLabel: '당일치기',
            days: [
              makeDay(1, [
                makeItem({
                  title: '서귀포 실내 전시관',
                  body: '비를 피하며 둘러보는 장소',
                  reason: '날씨 영향을 줄입니다.',
                }),
              ]),
            ],
          },
        },
      ),
    )

    expect(draft.dayCount).toBe(1)
    expect(draft.durationLabel).toBe('당일치기')
    expect(draft.summary).toBe('실내 중심 대체 일정입니다.')
    expect(draft.days[0].stops[0].title).toBe('서귀포 실내 전시관')
  })

  it('prefers alternativeItinerary for an explicit weather replacement response', () => {
    const draft = mapRecommendationToDraft(
      makeResponse(
        [makeDay(1, [makeItem({ title: '기존 야외 일정' })])],
        {
          alternativeItinerary: {
            tripType: 'daytrip',
            title: '비 오는 날 대체 일정',
            summary: '실내 중심 대체 일정입니다.',
            durationLabel: '당일치기',
            days: [
              makeDay(1, [
                makeItem({
                  title: '서귀포 실내 전시관',
                  body: '비를 피하며 둘러보는 장소',
                  reason: '날씨 영향을 줄입니다.',
                }),
              ]),
            ],
          },
        },
      ),
      { preferAlternativeItinerary: true },
    )

    expect(draft.summary).toBe('실내 중심 대체 일정입니다.')
    expect(draft.days[0].stops[0].title).toBe('서귀포 실내 전시관')
  })

  it('preserves V2 itinerary item metadata needed for modify currentOrder', () => {
    const draft = mapRecommendationToDraft(
      makeResponse(
        [
          makeDay(1, [
            makeItem({
              itemId: 'item-2',
              contentId: '2723663',
              itemType: 'attraction',
              day: 1,
              order: 2,
              title: '묵호항',
              isSeed: false,
              cityId: 'KR-32-3',
              theme: '바다·해안',
              latitude: 37.5491,
              longitude: 129.1162,
              indoorOutdoor: 'outdoor',
            }),
          ]),
        ],
        {
          destination: {
            destinationId: 'KR-32-3',
            name: '동해시',
            country: 'KR',
          },
        },
      ),
    )

    expect(draft.days[0].stops[0]).toMatchObject({
      itemId: 'item-2',
      contentId: '2723663',
      itemType: 'attraction',
      day: 1,
      order: 2,
      title: '묵호항',
      isSeed: false,
      cityId: 'KR-32-3',
      theme: '바다·해안',
      latitude: 37.5491,
      longitude: 129.1162,
      indoorOutdoor: 'outdoor',
    })
  })
})

describe('requestListPopularDestinations', () => {
  it('calls the aggregate popular destinations endpoint with credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            cityId: 'KR-Donghae',
            name: '동해시',
            reactionCount: 7,
            savedPlanCount: 2,
            themes: ['바다'],
          },
        ],
        ageGroups: [
          {
            ageGroup: '30s',
            label: '30대',
            items: [{ cityId: 'KR-Donghae', name: '동해시' }],
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchImpl)

    const response = await requestListPopularDestinations(6, 'https://api.lovv.example/')

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.example/api/v1/recommendations/popular-destinations?limit=6',
      {
        method: 'GET',
        credentials: 'include',
      },
    )
    expect(response.items).toHaveLength(1)
    expect(response.items[0].cityId).toBe('KR-Donghae')
    expect(response.ageGroups[0].label).toBe('30대')
  })

  it('falls back to an empty item list when the response shape is incomplete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))

    await expect(requestListPopularDestinations()).resolves.toEqual({ items: [], ageGroups: [] })
  })
})

describe('requestListReactionCities', () => {
  it('calls the authenticated reaction cities endpoint with credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            cityId: 'KR-Gurye',
            name: '구례',
            themes: ['자연', '산책'],
            imageUrl: 'https://cdn.lovv.example/gurye.jpg',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchImpl)

    const response = await requestListReactionCities(1, 'https://api.lovv.example/')

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.example/api/v1/recommendations/reaction-cities?limit=1',
      {
        method: 'GET',
        headers: {},
        credentials: 'include',
      },
    )
    expect(response.items).toHaveLength(1)
    expect(response.items[0].cityId).toBe('KR-Gurye')
  })

  it('falls back to an empty item list when the reaction response shape is incomplete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))

    await expect(requestListReactionCities()).resolves.toEqual({ items: [] })
  })

  it('includes authorization when loading reaction cities with an access token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    })

    await requestListReactionCities(1, {
      baseUrl: 'https://api.lovv.example/',
      accessToken: 'access-token',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.example/api/v1/recommendations/reaction-cities?limit=1',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer access-token',
        },
        credentials: 'include',
      },
    )
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
        } as unknown as Partial<RecommendationItinerary['days'][0]['items'][0]>),
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
