import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PlanStop } from '../../shared/types/app'
import {
  getPlanRouteCoordinates,
  getPlanStopRoutePoints,
  requestOpenRouteServicePath,
} from './plannerRouteModel'

const stops: PlanStop[] = [
  {
    time: '아침',
    move: '도보 5분',
    title: '안목해변',
    body: '바다 산책',
    reason: '해안 코스',
  },
  {
    time: '저녁',
    move: '도보 5분',
    title: '위시맛집',
    body: '강원 강릉시 해안로 1',
    reason: '나의 위시리스트에서 드래그하여 추가한 맛집입니다.',
    source: 'wishlist',
    lockLevel: 'user_added',
    wishlistRestaurantId: 'meal-1',
    latitude: 37.77,
    longitude: 128.95,
  },
]

describe('plannerRouteModel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stop 좌표와 이름 매칭 좌표를 같은 경로 입력으로 정규화한다', () => {
    const routePoints = getPlanStopRoutePoints(stops, {
      안목해변: { lat: 37.75, lng: 128.91 },
    })

    expect(routePoints).toHaveLength(2)
    expect(routePoints.map((point) => point.routeCoordinate)).toEqual([
      [128.91, 37.75],
      [128.95, 37.77],
    ])
  })

  it('위시리스트 stop 좌표를 포함한 ORS coordinates를 만든다', () => {
    expect(
      getPlanRouteCoordinates(stops, {
        안목해변: { lat: 37.75, lng: 128.91 },
      }),
    ).toEqual([
      [128.91, 37.75],
      [128.95, 37.77],
    ])
  })

  it('OpenRouteService geojson 응답을 지도 routePath 좌표로 변환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: {
              coordinates: [
                [128.91, 37.75],
                [128.93, 37.76],
                [128.95, 37.77],
              ],
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const routePath = await requestOpenRouteServicePath(
      [
        [128.91, 37.75],
        [128.95, 37.77],
      ],
      'test-ors-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'test-ors-key',
        }),
      }),
    )
    expect(routePath).toEqual([
      [128.91, 37.75],
      [128.93, 37.76],
      [128.95, 37.77],
    ])
  })
})
