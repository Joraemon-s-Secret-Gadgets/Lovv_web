import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlanDetailGoogleMap } from './PlanDetailGoogleMap'
import type { PlanStop, RoutePathCoordinate } from '../../shared/types/app'

const stops: PlanStop[] = [
  {
    time: '아침',
    move: '13분',
    title: '안목해변',
    body: '해안 산책',
    reason: '바다 테마',
  },
  {
    time: '점심',
    move: '0분',
    title: '경포해변',
    body: '호수와 바다',
    reason: '동선 연결',
  },
]

const nameToCoords = {
  안목해변: { lat: 37.771, lng: 128.947 },
  경포해변: { lat: 37.805, lng: 128.908 },
}

describe('PlanDetailGoogleMap', () => {
  afterEach(() => {
    document.getElementById('lovv-google-maps-js')?.remove()
    window.google = undefined
  })

  it('uses the calculated route path for the displayed polyline when provided', async () => {
    const polylineConstructor = vi.fn()
    const markerConstructor = vi.fn()
    const routePath: RoutePathCoordinate[] = [
      [128.947, 37.771],
      [128.935, 37.79],
      [128.908, 37.805],
    ]

    class FakeMap {
      fitBounds = vi.fn()
      setCenter = vi.fn()
      setZoom = vi.fn()
    }

    class FakeMarker {
      constructor(options: Record<string, unknown>) {
        markerConstructor(options)
      }

      addListener = vi.fn()
      setMap = vi.fn()
    }

    class FakePolyline {
      constructor(options: Record<string, unknown>) {
        polylineConstructor(options)
      }

      setMap = vi.fn()
    }

    class FakeLatLngBounds {
      extend = vi.fn()
    }

    window.google = {
      maps: {
        Map: FakeMap,
        Marker: FakeMarker,
        marker: {
          AdvancedMarkerElement: FakeMarker,
        },
        Polyline: FakePolyline,
        LatLngBounds: FakeLatLngBounds,
      },
    } as unknown as typeof window.google

    render(
      <PlanDetailGoogleMap
        stops={stops}
        nameToCoords={nameToCoords}
        countryCode="KR"
        activeStopIndex={null}
        googleMapsApiKey="test-google-key"
        googleMapsMapId="test-map-id"
        routePath={routePath}
      />,
    )

    expect(screen.getByTestId('plan-detail-google-map')).toBeInTheDocument()

    await waitFor(() => {
      expect(markerConstructor).toHaveBeenCalledTimes(2)
      expect(polylineConstructor).toHaveBeenCalledTimes(1)
    })

    expect(polylineConstructor.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        path: [
          { lng: 128.947, lat: 37.771 },
          { lng: 128.935, lat: 37.79 },
          { lng: 128.908, lat: 37.805 },
        ],
      }),
    )
  })

  it('uses stop latitude and longitude for dropped wishlist stops', async () => {
    const polylineConstructor = vi.fn()
    const markerConstructor = vi.fn()
    const stopsWithWishlistStop: PlanStop[] = [
      stops[0],
      {
        time: '저녁',
        move: '도보 5분',
        title: '위시맛집',
        body: '강원 강릉시 해안로 1',
        reason: '나의 위시리스트에서 드래그하여 추가한 맛집입니다.',
        source: 'wishlist',
        lockLevel: 'user_added',
        wishlistRestaurantId: 'meal-1',
        latitude: 37.82,
        longitude: 128.9,
      },
    ]

    class FakeMap {
      fitBounds = vi.fn()
      setCenter = vi.fn()
      setZoom = vi.fn()
    }

    class FakeMarker {
      constructor(options: Record<string, unknown>) {
        markerConstructor(options)
      }

      addListener = vi.fn()
      setMap = vi.fn()
    }

    class FakePolyline {
      constructor(options: Record<string, unknown>) {
        polylineConstructor(options)
      }

      setMap = vi.fn()
    }

    class FakeLatLngBounds {
      extend = vi.fn()
    }

    window.google = {
      maps: {
        Map: FakeMap,
        Marker: FakeMarker,
        marker: {
          AdvancedMarkerElement: FakeMarker,
        },
        Polyline: FakePolyline,
        LatLngBounds: FakeLatLngBounds,
      },
    } as unknown as typeof window.google

    render(
      <PlanDetailGoogleMap
        stops={stopsWithWishlistStop}
        wishlistRestaurants={[
          {
            id: 'meal-1',
            placeName: '위시맛집',
            roadAddressName: '강원 강릉시 해안로 1',
            source: 'kakao',
            lat: 37.82,
            lng: 128.9,
          },
        ]}
        nameToCoords={{ 안목해변: nameToCoords.안목해변 }}
        countryCode="KR"
        activeStopIndex={null}
        googleMapsApiKey="test-google-key"
        googleMapsMapId="test-map-id"
      />,
    )

    await waitFor(() => {
      expect(markerConstructor).toHaveBeenCalledTimes(2)
      expect(polylineConstructor).toHaveBeenCalledTimes(1)
    })

    expect(markerConstructor.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        position: { lat: 37.82, lng: 128.9 },
        title: '위시맛집',
      }),
    )
    expect(polylineConstructor.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        path: [
          { lat: 37.771, lng: 128.947 },
          { lat: 37.82, lng: 128.9 },
        ],
      }),
    )
  })
})
