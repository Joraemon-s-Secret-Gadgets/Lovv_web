import { describe, expect, it, vi } from 'vitest'
import {
  adaptSavedPlanApiListResponse,
  requestCreateSavedPlan,
  requestDeleteSavedPlan,
  requestGetSavedPlan,
  requestLikeSavedPlan,
  requestListSavedPlans,
  requestUpdateSavedPlanShareStatus,
  requestUnlikeSavedPlan,
  savedPlansApiEndpoints,
} from './savedPlansApi'
import type { SavedPlan } from '../types/app'

describe('saved plans API adapter', () => {
  it('uses the saved_plans is_liked field as the only like source', () => {
    const result = adaptSavedPlanApiListResponse({
      items: [
        {
          itineraryId: 'plan-1',
          userId: 'user-1',
          title: '강릉 1박 2일',
          destination: { nameKo: '강릉' },
          durationLabel: '1박 2일',
          themes: ['바다'],
          summary: '해안 산책 중심 일정',
          itinerary: {
            days: [
              {
                day: 1,
                title: '1일차',
                summary: '도착과 산책',
                stops: [
                  {
                    time: '아침',
                    move: '도보 10분',
                    title: '안목해변',
                    body: '바다를 먼저 봅니다.',
                    reason: '바다 테마와 맞습니다.',
                  },
                ],
              },
            ],
          },
          is_liked: 1,
          savedAt: '2026-06-11T00:00:00Z',
        },
        {
          itineraryId: 'plan-2',
          userId: 'user-1',
          title: '경주 당일치기',
          destination: { nameKo: '경주' },
          durationLabel: '당일치기',
          themes: ['전통'],
          itinerary: {
            days: [
              {
                day: 1,
                title: '1일차',
                summary: '전통 산책',
                stops: [
                  {
                    time: '점심',
                    move: '도보 8분',
                    title: '황리단길',
                    body: '느린 산책을 합니다.',
                    reason: '전통 테마와 맞습니다.',
                  },
                ],
              },
            ],
          },
          isLiked: false,
          savedAt: '2026-06-11T00:00:00Z',
        },
      ],
    })

    expect(result.savedPlans).toHaveLength(2)
    expect(result.savedPlans[0]).toMatchObject({
      id: 'plan-1',
      sourceRecommendationId: '',
      ownerId: 'user-1',
      cityPair: '강릉',
      themeTag: '바다',
      isLiked: true,
    })
    expect(result.savedPlans[1]).toMatchObject({
      id: 'plan-2',
      cityPair: '경주',
      themeTag: '전통',
      isLiked: false,
    })
    expect(result.likes).toEqual({ 'plan-1': 'like' })
  })

  it('keeps endpoint names aligned with the current saved_plans API boundary', () => {
    expect(savedPlansApiEndpoints.list).toBe('/api/v1/me/itineraries')
    expect(savedPlansApiEndpoints.create).toBe('/api/v1/me/itineraries')
    expect(savedPlansApiEndpoints.detail('plan/a')).toBe('/api/v1/itineraries/plan%2Fa')
    expect(savedPlansApiEndpoints.delete('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa')
    expect(savedPlansApiEndpoints.like('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa/reactions/like')
    expect(savedPlansApiEndpoints.unlike('plan/a')).toBe('/api/v1/me/itineraries/plan%2Fa/reactions/like')
  })

  it('saves generated itineraries to the backend with JSON body and credentials', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        itineraryId: 'server-plan-1',
        sourceRecommendationId: 'draft-plan-1',
        savedAt: '2026-06-13T00:00:00Z',
        duplicate: false,
      }),
    }))

    await expect(
      requestCreateSavedPlan(
        {
          sourceRecommendationId: 'draft-plan-1',
          idempotencyKey: 'draft-plan-1',
          title: '강릉 1박 2일',
          summary: '바다 산책',
          destination: {
            destinationId: 'KR-Gangneung',
            name: '강릉',
            country: 'KR',
            region: '강원',
          },
          durationLabel: '1박 2일',
          themes: ['sea_coast'],
          itinerary: {
            days: [
              {
                day: 1,
                title: '1일차',
                summary: '바다 산책',
                stops: [
                  {
                    time: '아침',
                    move: '도보 10분',
                    title: '안목해변',
                    body: '바다를 먼저 봅니다.',
                    reason: '바다 테마와 맞습니다.',
                  },
                ],
              },
            ],
          },
        },
        {
          baseUrl: 'https://api.lovv.example',
          accessToken: 'access-token',
          fetchImpl,
        },
      ),
    ).resolves.toEqual({
      itineraryId: 'server-plan-1',
      sourceRecommendationId: 'draft-plan-1',
      savedAt: '2026-06-13T00:00:00Z',
      duplicate: false,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.example/api/v1/me/itineraries',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
        },
        credentials: 'include',
      }),
    )
    const createRequest = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]

    expect(JSON.parse(String(createRequest[1].body))).toMatchObject({
      sourceRecommendationId: 'draft-plan-1',
      idempotencyKey: 'draft-plan-1',
      destination: {
        destinationId: 'KR-Gangneung',
      },
      itinerary: {
        days: [
          {
            stops: [
              {
                title: '안목해변',
              },
            ],
          },
        ],
      },
    })
  })

  it('sends saved itinerary deletes to the backend with cookie credentials and bearer auth', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 204,
    }))

    await expect(
      requestDeleteSavedPlan('plan/a', {
        baseUrl: 'https://api.lovv.example/',
        accessToken: 'access-token',
        fetchImpl,
      }),
    ).resolves.toBe(true)

    expect(fetchImpl).toHaveBeenCalledWith('https://api.lovv.example/api/v1/me/itineraries/plan%2Fa', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer access-token',
      },
      credentials: 'include',
    })
  })

  it('loads saved itinerary lists through the backend API and adapts likes', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            itineraryId: 'server-plan-1',
            userId: 'user-1',
            title: '서버 저장 일정',
            destination: { nameKo: '강릉' },
            durationLabel: '1박 2일',
            themes: ['바다'],
            itinerary: {
              days: [
                {
                  day: 1,
                  title: '1일차',
                  stops: [
                    {
                      time: '아침',
                      move: '도보 10분',
                      title: '안목해변',
                      body: '바다를 봅니다.',
                      reason: '바다 테마와 맞습니다.',
                    },
                  ],
                },
              ],
            },
            isLiked: true,
            savedAt: '2026-06-13T00:00:00Z',
          },
        ],
      }),
    }))

    await expect(
      requestListSavedPlans({
        baseUrl: 'https://api.lovv.example/',
        accessToken: 'access-token',
        fetchImpl,
      }),
    ).resolves.toMatchObject({
      savedPlans: [
        {
          id: 'server-plan-1',
          title: '서버 저장 일정',
          cityPair: '강릉',
          isLiked: true,
        },
      ],
      likes: {
        'server-plan-1': 'like',
      },
    })

    expect(fetchImpl).toHaveBeenCalledWith('https://api.lovv.example/api/v1/me/itineraries', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer access-token',
      },
      credentials: 'include',
    })
  })

  it('loads a saved itinerary detail through the backend API', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        itineraryId: 'server-plan-1',
        userId: 'user-1',
        title: '서버 상세 일정',
        destination: { nameKo: '경주' },
        durationLabel: '당일치기',
        themes: ['전통'],
        itinerary: {
          selected_restaurants: [
            {
              id: 'meal-1',
              name: '경주 밥집',
              address: '경북 경주시 원화로 1',
            },
          ],
          days: [
            {
              day: 1,
              title: '1일차',
              stops: [
                {
                  time: '점심',
                  move: '도보 8분',
                  title: '황리단길',
                  body: '골목을 걷습니다.',
                  reason: '전통 테마와 맞습니다.',
                  source: 'wishlist',
                  lockLevel: 'user_added',
                  wishlistRestaurantId: 'meal-1',
                },
              ],
            },
          ],
        },
        isLiked: false,
        savedAt: '2026-06-13T00:00:00Z',
      }),
    }))

    await expect(
      requestGetSavedPlan('server-plan-1', {
        accessToken: 'Bearer access-token',
        fetchImpl,
        baseUrl: '',
      }),
    ).resolves.toMatchObject({
      id: 'server-plan-1',
      title: '서버 상세 일정',
      cityPair: '경주',
      isLiked: false,
      days: [
        {
          stops: [
            {
              source: 'wishlist',
              lockLevel: 'user_added',
              wishlistRestaurantId: 'meal-1',
            },
          ],
        },
      ],
      selectedRestaurants: [
        {
          id: 'meal-1',
          name: '경주 밥집',
          address: '경북 경주시 원화로 1',
        },
      ],
    })

    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/itineraries/server-plan-1', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer access-token',
      },
      credentials: 'include',
    })
  })

  it('sends saved itinerary like and unlike requests to the backend', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        itineraryId: 'server-plan-1',
        reactionType: 'like',
        isLiked: true,
      }),
    }))

    await expect(
      requestLikeSavedPlan('server-plan-1', {
        accessToken: 'access-token',
        fetchImpl,
        baseUrl: '',
      }),
    ).resolves.toBe(true)

    await expect(
      requestUnlikeSavedPlan('server-plan-1', {
        accessToken: 'access-token',
        fetchImpl,
        baseUrl: '',
      }),
    ).resolves.toBe(true)

    expect(fetchImpl).toHaveBeenNthCalledWith(1, '/api/v1/me/itineraries/server-plan-1/reactions/like', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer access-token',
      },
      credentials: 'include',
    })
    expect(fetchImpl).toHaveBeenNthCalledWith(2, '/api/v1/me/itineraries/server-plan-1/reactions/like', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer access-token',
      },
      credentials: 'include',
    })
  })

  it('keeps an existing bearer token prefix when deleting a saved itinerary', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
    }))

    await requestDeleteSavedPlan('plan-1', {
      accessToken: 'Bearer restored-access-token',
      fetchImpl,
      baseUrl: '',
    })

    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/me/itineraries/plan-1', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer restored-access-token',
      },
      credentials: 'include',
    })
  })

  it('throws a typed request error when a saved itinerary delete fails', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'ITINERARY_NOT_FOUND',
          message: 'Saved itinerary was not found',
        },
      }),
    }))

    await expect(requestDeleteSavedPlan('missing-plan', { fetchImpl })).rejects.toMatchObject({
      name: 'SavedPlansApiRequestError',
      statusCode: 404,
      code: 'ITINERARY_NOT_FOUND',
      message: 'Saved itinerary was not found',
    })
  })

  it('keeps the existing saved plan details when share response only returns public status', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        itineraryId: 'plan-1',
        isPublic: true,
      }),
    }))
    const fallbackPlan: SavedPlan = {
      id: 'plan-1',
      sourceRecommendationId: 'source-1',
      ownerId: 'user-1',
      title: '강릉 1박 2일',
      cityPair: '강릉',
      themeTag: '바다',
      themeLabels: ['바다'],
      conditionSummary: '',
      durationLabel: '1박 2일',
      festivalThemeLabel: '',
      intensityLabel: '',
      summary: '해안 산책 중심 일정',
      days: [
        {
          day: 1,
          title: '1일차',
          summary: '도착과 산책',
          stops: [
            {
              time: '아침',
              move: '도보 10분',
              title: '안목해변',
              body: '바다를 먼저 봅니다.',
              reason: '바다 테마와 맞습니다.',
            },
          ],
        },
      ],
      stops: [
        {
          time: '아침',
          move: '도보 10분',
          title: '안목해변',
          body: '바다를 먼저 봅니다.',
          reason: '바다 테마와 맞습니다.',
        },
      ],
      selectedRestaurants: [],
      isLiked: false,
      isPublic: false,
      copiedFromItineraryId: '',
      createdAt: '',
      savedAt: '2026-06-11T00:00:00Z',
    }

    await expect(
      requestUpdateSavedPlanShareStatus('plan-1', true, { fetchImpl, baseUrl: '' }, fallbackPlan),
    ).resolves.toMatchObject({
      id: 'plan-1',
      title: '강릉 1박 2일',
      isPublic: true,
    })

    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/me/itineraries/plan-1/share', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isPublic: true }),
      credentials: 'include',
    })
  })
})
