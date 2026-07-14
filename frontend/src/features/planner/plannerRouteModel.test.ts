import { describe, expect, it } from 'vitest'
import type { PlanDay, PlanRoute, PlanStop } from '../../shared/types/app'
import {
  applyCalculatedRouteToDay,
  formatEstimatedMoveLabel,
  getStraightLineDistanceMeters,
  getPlanStopLatLng,
  getPlanRouteCoordinates,
  getPlanStopRoutePoints,
  resolveDisplayedRoutePath,
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

  it('위시리스트 stop 좌표를 포함한 경로 API coordinates를 만든다', () => {
    expect(
      getPlanRouteCoordinates(stops, {
        안목해변: { lat: 37.75, lng: 128.91 },
      }),
    ).toEqual([
      [128.91, 37.75],
      [128.95, 37.77],
    ])
  })

  it('생성 일정의 제목이 장소명과 달라도 contentId로 좌표를 찾는다', () => {
    expect(
      getPlanStopLatLng(
        {
          time: '아침',
          move: '도보 10분',
          title: 'AI가 재작성한 장소명',
          body: '본문',
          reason: '사유',
          contentId: 'attraction#2868839',
        },
        {
          2868839: { lat: 37.8041, lng: 128.9097 },
        },
      ),
    ).toEqual({ lat: 37.8041, lng: 128.9097 })
  })

  it('좌표가 있는 맛집 추가 구간은 거리 기준으로 이동 수단 라벨을 추정한다', () => {
    expect(
      formatEstimatedMoveLabel(
        { lat: 35.8353, lng: 129.2111 },
        { lat: 35.836, lng: 129.212 },
      ),
    ).toMatch(/^도보 \d+분$/)

    expect(
      formatEstimatedMoveLabel(
        { lat: 35.8395, lng: 129.222 },
        { lat: 35.7973, lng: 129.3488 },
      ),
    ).toMatch(/^차량 \d+분$/)
  })

  it('좌표가 없으면 고정 도보 시간이 아니라 확인 필요 라벨을 반환한다', () => {
    expect(formatEstimatedMoveLabel(null, { lat: 35.836, lng: 129.212 })).toBe('이동 시간 확인 필요')
    expect(getStraightLineDistanceMeters({ lat: 35.8353, lng: 129.2111 }, { lat: 35.836, lng: 129.212 })).toBeGreaterThan(0)
  })

  it('위시리스트 추가와 순서 변경을 경로 입력 순서에 반영한다', () => {
    const nameToCoords = { 안목해변: { lat: 37.75, lng: 128.91 } }

    expect(getPlanRouteCoordinates([...stops].reverse(), nameToCoords)).toEqual([
      [128.95, 37.77],
      [128.91, 37.75],
    ])
  })

  it('재계산 경로를 적용할 때 최신 정류장 배열을 보존한다', () => {
    const day: PlanDay = { day: 1, title: '1일차', summary: '', stops }
    const route: PlanRoute = {
      provider: 'kakao-mobility',
      geometry: { type: 'LineString', coordinates: [[128.91, 37.75], [128.95, 37.77]] },
    }

    const updated = applyCalculatedRouteToDay(day, route)
    expect(updated.stops).toBe(stops)
    expect(updated.route).toEqual(route)
  })

  it('변경 경로 계산 중이거나 실패하면 이전 저장 경로를 표시하지 않는다', () => {
    const persistedPath = [[128.91, 37.75], [128.95, 37.77]] as [number, number][]

    expect(resolveDisplayedRoutePath({
      calculatedPath: null,
      persistedPath,
      hasUserAddedWishlistStop: false,
      persistedRouteMatchesCurrent: false,
      calculationFailed: false,
    })).toBeUndefined()
    expect(resolveDisplayedRoutePath({
      calculatedPath: null,
      persistedPath,
      hasUserAddedWishlistStop: false,
      persistedRouteMatchesCurrent: true,
      calculationFailed: true,
    })).toBeUndefined()
  })

  it('현재 정류장 좌표와 일치하는 저장 경로는 재계산 전에도 유지한다', () => {
    const persistedPath = [[128.91, 37.75], [128.95, 37.77]] as [number, number][]

    expect(resolveDisplayedRoutePath({
      calculatedPath: null,
      persistedPath,
      hasUserAddedWishlistStop: false,
      persistedRouteMatchesCurrent: true,
      calculationFailed: false,
    })).toBe(persistedPath)
  })

})
