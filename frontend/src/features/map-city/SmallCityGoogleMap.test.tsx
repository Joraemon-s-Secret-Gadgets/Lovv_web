import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SmallCityGoogleMap } from './SmallCityGoogleMap'
import type { SmallCityMapMarker } from './smallCities'

const markers: SmallCityMapMarker[] = [
  {
    id: 'marker-kr-gangneung-001',
    cityId: 'kr-gangneung-001',
    country: 'KR',
    countryLabel: '한국',
    region: '강원',
    label: '강릉',
    latitude: 37.7519,
    longitude: 128.8761,
  },
  {
    id: 'marker-kr-gyeongju-001',
    cityId: 'kr-gyeongju-001',
    country: 'KR',
    countryLabel: '한국',
    region: '경북',
    label: '경주',
    latitude: 35.8562,
    longitude: 129.2247,
  },
]

const japanMarkers: SmallCityMapMarker[] = [
  {
    id: 'marker-jp-otaru-001',
    cityId: 'jp-otaru-001',
    country: 'JP',
    countryLabel: '일본',
    region: '홋카이도',
    label: '오타루',
    latitude: 43.1907,
    longitude: 140.9947,
  },
  {
    id: 'marker-jp-nikko-001',
    cityId: 'jp-nikko-001',
    country: 'JP',
    countryLabel: '일본',
    region: '도치기',
    label: '닛코',
    latitude: 36.75,
    longitude: 139.6167,
  },
]

const clearGoogleMapsScript = () => {
  document.getElementById('lovv-google-maps-js')?.remove()
}

describe('SmallCityGoogleMap', () => {
  afterEach(() => {
    clearGoogleMapsScript()
  })

  it('renders a visible fallback marker list when the Google Maps API key is absent', () => {
    const onSelectMarker = vi.fn()

    render(
      <SmallCityGoogleMap
        markers={markers}
        country="KR"
        countryLabel="한국"
        selectedMarkerCityId={null}
        onSelectMarker={onSelectMarker}
        googleMapsApiKey=""
      />,
    )

    const mapRegion = screen.getByTestId('city-map-google-map')

    expect(mapRegion).toHaveAttribute('data-runtime-status', 'fallback')
    expect(mapRegion).toHaveAttribute('data-marker-count', '2')
    expect(mapRegion).toHaveTextContent('Google Maps fallback')
    expect(within(mapRegion).getAllByRole('button', { name: /지도 마커:/ })).toHaveLength(2)
    expect(mapRegion).toHaveClass('lovv-google-map')

    fireEvent.click(within(mapRegion).getByRole('button', { name: '지도 마커: 경주' }))

    expect(onSelectMarker).toHaveBeenCalledWith(markers[1])
  })

  it('loads the Google Maps script, then synchronizes bounds and markers after runtime is ready', async () => {
    const fitBounds = vi.fn()
    const setCenter = vi.fn()
    const setZoom = vi.fn()
    const extend = vi.fn()
    const mapConstructor = vi.fn()
    const markerListeners: Array<() => void> = []
    const markerSetMap = vi.fn()
    const markerConstructor = vi.fn()
    const onSelectMarker = vi.fn()

    class FakeMap {
      constructor(element: HTMLElement, options: Record<string, unknown>) {
        mapConstructor(element, options)
      }

      fitBounds = fitBounds
      setCenter = setCenter
      setZoom = setZoom
    }

    class FakeMarker {
      constructor(options: Record<string, unknown>) {
        markerConstructor(options)
      }

      addListener = (_eventName: 'click', handler: () => void) => {
        markerListeners.push(handler)
      }

      setMap = markerSetMap
    }

    class FakeLatLngBounds {
      extend = extend
    }

    render(
      <SmallCityGoogleMap
        markers={markers}
        country="KR"
        countryLabel="한국"
        selectedMarkerCityId="kr-gangneung-001"
        onSelectMarker={onSelectMarker}
        googleMapsApiKey="test-google-key"
        googleMapsMapId="test-map-id"
      />,
    )

    const mapRegion = screen.getByTestId('city-map-google-map')
    const script = document.getElementById('lovv-google-maps-js') as HTMLScriptElement | null

    expect(mapRegion).toHaveAttribute('data-runtime-status', 'loading')
    expect(mapRegion).toHaveAttribute('data-marker-count', '2')
    expect(script?.src).toContain('maps.googleapis.com/maps/api/js')
    expect(script?.src).toContain('key=test-google-key')
    expect(script?.src).toContain('callback=__lovvGoogleMapsReady')

    window.google = {
      maps: {
        Map: FakeMap,
        Marker: FakeMarker,
        LatLngBounds: FakeLatLngBounds,
      },
    }
    window.__lovvGoogleMapsReady?.()

    await waitFor(() => {
      expect(mapRegion).toHaveAttribute('data-runtime-status', 'ready')
      expect(markerConstructor).toHaveBeenCalledTimes(2)
    })
    expect(mapConstructor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ mapId: 'test-map-id' }),
    )
    expect(fitBounds).toHaveBeenCalled()
    expect(extend).toHaveBeenCalledTimes(2)

    markerListeners[1]()

    expect(onSelectMarker).toHaveBeenCalledWith(markers[1])
  })

  it('keeps one map instance and refreshes markers after switching countries', async () => {
    const fitBounds = vi.fn()
    const setCenter = vi.fn()
    const setZoom = vi.fn()
    const mapInstances: FakeMap[] = []
    const markerConstructor = vi.fn()
    const markerSetMap = vi.fn()
    const onSelectMarker = vi.fn()

    class FakeMap {
      constructor(element: HTMLElement, options: Record<string, unknown>) {
        mapInstances.push(this)
        expect(element).toBeInstanceOf(HTMLElement)
        expect(options).toEqual(expect.objectContaining({ clickableIcons: false }))
      }

      fitBounds = fitBounds
      setCenter = setCenter
      setZoom = setZoom
    }

    class FakeMarker {
      constructor(options: Record<string, unknown>) {
        markerConstructor(options)
      }

      addListener = vi.fn()
      setMap = markerSetMap
    }

    class FakeLatLngBounds {
      extend = vi.fn()
    }

    window.google = {
      maps: {
        Map: FakeMap,
        Marker: FakeMarker,
        LatLngBounds: FakeLatLngBounds,
      },
    }

    const { rerender } = render(
      <SmallCityGoogleMap
        markers={markers}
        country="KR"
        countryLabel="한국"
        selectedMarkerCityId={null}
        onSelectMarker={onSelectMarker}
        googleMapsApiKey="test-google-key"
      />,
    )

    await waitFor(() => {
      expect(mapInstances).toHaveLength(1)
      expect(markerConstructor).toHaveBeenCalledTimes(2)
    })

    rerender(
      <SmallCityGoogleMap
        markers={japanMarkers}
        country="JP"
        countryLabel="일본"
        selectedMarkerCityId={null}
        onSelectMarker={onSelectMarker}
        googleMapsApiKey="test-google-key"
      />,
    )

    await waitFor(() => {
      expect(markerConstructor).toHaveBeenCalledTimes(4)
      expect(markerConstructor.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({
          map: mapInstances[0],
          title: '닛코',
        }),
      )
    })
    await new Promise((resolve) => {
      window.setTimeout(resolve, 0)
    })

    expect(mapInstances).toHaveLength(1)
  })
})
