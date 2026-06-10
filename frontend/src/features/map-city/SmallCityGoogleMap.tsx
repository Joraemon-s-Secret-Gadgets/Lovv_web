import { useEffect, useMemo, useRef, useState } from 'react'
import { smallCityMapBounds, type SmallCityCountry, type SmallCityMapMarker } from './smallCities'

type SmallCityGoogleMapProps = {
  markers: SmallCityMapMarker[]
  country: SmallCityCountry
  countryLabel: string
  selectedMarkerCityId: string | null
  onSelectMarker: (marker: SmallCityMapMarker) => void
  googleMapsApiKey?: string
  googleMapsMapId?: string
}

type GoogleMapInstance = {
  fitBounds: (bounds: GoogleLatLngBoundsInstance, padding?: number) => void
  setCenter: (position: GoogleLatLngLiteral) => void
  setZoom: (zoom: number) => void
}

type GoogleMapMarkerInstance = {
  addListener?: (eventName: 'click', handler: () => void) => void
  setMap: (map: GoogleMapInstance | null) => void
}

type GoogleLatLngBoundsInstance = {
  extend: (position: GoogleLatLngLiteral) => void
}

type GoogleLatLngLiteral = {
  lat: number
  lng: number
}

type GoogleMapsNamespace = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance
  Marker?: new (options: Record<string, unknown>) => GoogleMapMarkerInstance
  LatLngBounds: new () => GoogleLatLngBoundsInstance
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace
    }
    __lovvGoogleMapsReady?: () => void
  }
}

const googleMapsScriptId = 'lovv-google-maps-js'
const googleMapsCallbackName = '__lovvGoogleMapsReady'
const defaultGoogleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
const defaultGoogleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() ?? ''
let googleMapsRuntimePromise: Promise<GoogleMapsNamespace> | null = null

const getCountryCenter = (country: SmallCityCountry): GoogleLatLngLiteral => {
  const bounds = smallCityMapBounds[country]

  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }
}

const getLoadedGoogleMaps = () => window.google?.maps?.Map ? window.google.maps : null

const clampPercent = (value: number) => Math.min(96, Math.max(4, value))

const getFallbackMarkerPosition = (marker: SmallCityMapMarker, country: SmallCityCountry) => {
  const bounds = smallCityMapBounds[country]
  const longitudeRange = bounds.maxLng - bounds.minLng || 1
  const latitudeRange = bounds.maxLat - bounds.minLat || 1

  return {
    left: `${clampPercent(((marker.longitude - bounds.minLng) / longitudeRange) * 100)}%`,
    top: `${clampPercent(((bounds.maxLat - marker.latitude) / latitudeRange) * 100)}%`,
  }
}

const loadGoogleMapsRuntime = (apiKey: string) =>
  {
    const loadedGoogleMaps = getLoadedGoogleMaps()

    if (loadedGoogleMaps) {
      return Promise.resolve(loadedGoogleMaps)
    }

    if (googleMapsRuntimePromise) {
      return googleMapsRuntimePromise
    }

    googleMapsRuntimePromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
      const existingScript = document.getElementById(googleMapsScriptId)

      if (existingScript) {
        existingScript.remove()
      }

      const clearRuntimeHooks = () => {
        window.__lovvGoogleMapsReady = undefined
      }

      const timeoutId = window.setTimeout(() => {
        googleMapsRuntimePromise = null
        clearRuntimeHooks()
        reject(new Error('Google Maps script timed out.'))
      }, 12000)

      window.__lovvGoogleMapsReady = () => {
        const maps = getLoadedGoogleMaps()
        window.clearTimeout(timeoutId)
        clearRuntimeHooks()
        if (maps) {
          resolve(maps)
        } else {
          reject(new Error('Google Maps runtime unavailable after script load.'))
        }
      }

      const script = document.createElement('script')
      script.id = googleMapsScriptId
      script.async = true
      script.defer = true
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&callback=${googleMapsCallbackName}`
      script.addEventListener('error', () => {
        window.clearTimeout(timeoutId)
        googleMapsRuntimePromise = null
        clearRuntimeHooks()
        reject(new Error('Google Maps script failed to load.'))
      })
      document.head.appendChild(script)
    }).catch((error) => {
      googleMapsRuntimePromise = null
      throw error
    })

    return googleMapsRuntimePromise
  }

export function SmallCityGoogleMap({
  markers,
  country,
  countryLabel,
  selectedMarkerCityId,
  onSelectMarker,
  googleMapsApiKey = defaultGoogleMapsApiKey,
  googleMapsMapId = defaultGoogleMapsMapId,
}: SmallCityGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<GoogleMapInstance | null>(null)
  const mapsRef = useRef<GoogleMapsNamespace | null>(null)
  const markerInstancesRef = useRef<GoogleMapMarkerInstance[]>([])
  const onSelectMarkerRef = useRef(onSelectMarker)
  const countryRef = useRef(country)
  const [runtimeStatus, setRuntimeStatus] = useState<'fallback' | 'loading' | 'ready'>(
    googleMapsApiKey ? 'loading' : 'fallback',
  )
  const [mapInstanceVersion, setMapInstanceVersion] = useState(0)
  const selectedMarkerLabel = useMemo(
    () => markers.find((marker) => marker.cityId === selectedMarkerCityId)?.label,
    [markers, selectedMarkerCityId],
  )

  useEffect(() => {
    countryRef.current = country
  }, [country])

  useEffect(() => {
    onSelectMarkerRef.current = onSelectMarker
  }, [onSelectMarker])

  useEffect(() => {
    if (!googleMapsApiKey || typeof window === 'undefined') {
      return undefined
    }

    let isMounted = true

    loadGoogleMapsRuntime(googleMapsApiKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) {
          return
        }

        mapsRef.current = maps
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center: getCountryCenter(countryRef.current),
          clickableIcons: false,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          keyboardShortcuts: true,
          mapTypeControl: false,
          maxZoom: 12,
          minZoom: 5,
          streetViewControl: false,
          zoom: 7,
          ...(googleMapsMapId ? { mapId: googleMapsMapId } : {}),
        })
        setRuntimeStatus('ready')
        setMapInstanceVersion((version) => version + 1)
      })
      .catch(() => {
        if (isMounted) {
          setRuntimeStatus('fallback')
        }
      })

    return () => {
      isMounted = false
    }
  }, [googleMapsApiKey, googleMapsMapId])

  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current

    if (!map || !maps) {
      return
    }

    if (markers.length === 0) {
      map.setCenter(getCountryCenter(country))
      map.setZoom(country === 'KR' ? 7 : 8)
      return
    }

    const bounds = new maps.LatLngBounds()
    markers.forEach((marker) => {
      bounds.extend({ lat: marker.latitude, lng: marker.longitude })
    })
    map.fitBounds(bounds, 44)
  }, [country, markers, runtimeStatus, mapInstanceVersion])

  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current
    const GoogleMarker = maps?.Marker

    markerInstancesRef.current.forEach((marker) => marker.setMap(null))
    markerInstancesRef.current = []

    if (!map || !GoogleMarker) {
      return
    }

    markerInstancesRef.current = markers.map((cityMarker) => {
      const isSelected = cityMarker.cityId === selectedMarkerCityId
      const marker = new GoogleMarker({
        clickable: true,
        label: {
          color: isSelected ? '#33271E' : '#ffffff',
          fontSize: '11px',
          fontWeight: '900',
          text: cityMarker.label.slice(0, 2),
        },
        map,
        position: { lat: cityMarker.latitude, lng: cityMarker.longitude },
        title: cityMarker.label,
      })

      marker.addListener?.('click', () => {
        onSelectMarkerRef.current(cityMarker)
      })

      return marker
    })
  }, [markers, selectedMarkerCityId, runtimeStatus, mapInstanceVersion])

  return (
    <div
      data-marker-count={markers.length}
      data-runtime-status={runtimeStatus}
      data-selected-city-id={selectedMarkerCityId ?? ''}
      data-testid="city-map-google-map"
      aria-label={`${countryLabel} 소도시 Google 지도. 현재 조건에 맞는 도시명 마커 ${markers.length}개.`}
      className="lovv-google-map relative h-full min-h-[inherit] w-full overflow-hidden"
      role="region"
    >
      <div ref={mapContainerRef} className="absolute inset-0" aria-hidden={runtimeStatus !== 'ready'} />
      {runtimeStatus !== 'ready' ? (
        <div className="lovv-google-map-fallback absolute inset-0 flex flex-col gap-4 p-5">
          <div className="max-w-[360px] rounded-[8px] bg-white/88 px-3 py-2 text-[12px] font-black leading-5 text-[#33271E] shadow-[0_12px_24px_-22px_rgba(51,39,30,0.35)] backdrop-blur">
            <span>{runtimeStatus === 'loading' ? 'Google Maps loading' : 'Google Maps fallback'}</span>
            <span className="ml-2 text-[#6E5A50]">{markers.length} markers</span>
            {selectedMarkerLabel ? <span className="ml-2 text-[#A92B10]">{selectedMarkerLabel}</span> : null}
          </div>
          <div
            role="list"
            aria-label={`${countryLabel} 지도 마커 대체 목록`}
            className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] border border-white/70 bg-white/24 shadow-[inset_0_0_0_1px_rgba(169,43,16,0.06)]"
          >
            {markers.length > 0 ? (
              markers.map((marker) => {
                const isSelected = marker.cityId === selectedMarkerCityId

                return (
                  <button
                    key={marker.id}
                    type="button"
                    aria-label={`지도 마커: ${marker.label}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelectMarker(marker)}
                    style={getFallbackMarkerPosition(marker, country)}
                    className={`absolute inline-flex min-h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-[5px] border px-2 py-1 text-[11px] font-black leading-4 shadow-[0_12px_22px_-16px_rgba(51,39,30,0.5)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                      isSelected
                        ? 'z-20 border-[#A92B10] bg-[#F36B12] text-[#33271E]'
                        : 'z-10 border-white/80 bg-white/90 text-[#33271E] hover:bg-[#FFE0CA]'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${isSelected ? 'bg-[#33271E]' : 'bg-[#F36B12]'}`} />
                    {marker.label}
                  </button>
                )
              })
            ) : (
              <div className="absolute inset-0 grid place-items-center px-5 text-center text-[12px] font-black text-[#6E5A50]">
                표시할 소도시 마커가 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
