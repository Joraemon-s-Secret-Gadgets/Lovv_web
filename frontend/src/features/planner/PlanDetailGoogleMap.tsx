/**
 * @file PlanDetailGoogleMap.tsx
 * @description Interactive Google Map displaying itinerary course markers and sequential paths.
 * @lastModified 2026-06-24
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PlanStop, RoutePathCoordinate, SelectedMealPlace } from '../../shared/types/app'
import { smallCityMapBounds, type SmallCityCountry } from '../map-city/smallCities'
import { getPlanStopRoutePoints } from './plannerRouteModel'

type PlanDetailGoogleMapProps = {
  stops: PlanStop[]
  wishlistRestaurants?: SelectedMealPlace[]
  nameToCoords: Record<string, { lat: number; lng: number }>
  countryCode: SmallCityCountry
  activeStopIndex: number | null
  onSelectStopIndex?: (index: number) => void
  googleMapsApiKey?: string
  googleMapsMapId?: string
  routePath?: RoutePathCoordinate[]
}

type GoogleMapInstance = {
  fitBounds: (bounds: GoogleLatLngBoundsInstance, padding?: number) => void
  setCenter: (position: GoogleLatLngLiteral) => void
  setZoom: (zoom: number) => void
}

type GoogleMapMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void
  addListener?: (eventName: 'click', handler: () => void) => void
}

type GoogleMapAdvancedMarkerInstance = {
  addEventListener?: (eventName: 'gmp-click', handler: () => void) => void
  addListener?: (eventName: 'click', handler: () => void) => void
  map: GoogleMapInstance | null
}

type GoogleMapMarkerOverlay = GoogleMapMarkerInstance | GoogleMapAdvancedMarkerInstance

type GooglePolylineInstance = {
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
  marker?: {
    AdvancedMarkerElement?: new (options: Record<string, unknown>) => GoogleMapAdvancedMarkerInstance
  }
  Polyline?: new (options: Record<string, unknown>) => GooglePolylineInstance
  LatLngBounds: new () => GoogleLatLngBoundsInstance
  SymbolPath?: {
    CIRCLE: number
  }
}

const googleMapsScriptId = 'lovv-google-maps-js'
const googleMapsCallbackName = '__lovvGoogleMapsReady'
const defaultGoogleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
const defaultGoogleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() ?? ''
let googleMapsRuntimePromise: Promise<GoogleMapsNamespace> | null = null

const getLoadedGoogleMaps = () => window.google?.maps?.Map ? window.google.maps : null

const clearMarkerOverlay = (marker: GoogleMapMarkerOverlay) => {
  if ('setMap' in marker) {
    marker.setMap(null)
    return
  }

  marker.map = null
}

const createNumberedMarkerContent = (label: string, isSelected: boolean) => {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = [
    'lovv-plan-map-marker',
    'grid',
    'place-items-center',
    'rounded-full',
    'border-2',
    'font-black',
    'shadow-[0_14px_24px_-16px_rgba(51,39,30,0.55)]',
    isSelected ? 'size-9 border-[#33271E] bg-[#F36B12] text-[#33271E]' : 'size-8 border-white bg-[#A92B10] text-white',
  ].join(' ')
  marker.textContent = label

  return marker
}

const createRestaurantMarkerContent = () => {
  const marker = document.createElement('span')
  marker.className = [
    'lovv-plan-map-restaurant-marker',
    'grid',
    'size-8',
    'place-items-center',
    'rounded-full',
    'border-2',
    'border-white',
    'bg-[#10B981]',
    'text-[13px]',
    'shadow-[0_14px_24px_-16px_rgba(51,39,30,0.55)]',
  ].join(' ')
  marker.textContent = '식'

  return marker
}

const getCountryCenter = (country: SmallCityCountry): GoogleLatLngLiteral => {
  const bounds = smallCityMapBounds[country] || smallCityMapBounds.KR
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const routePathToLatLng = (routePath?: RoutePathCoordinate[]) => {
  if (!Array.isArray(routePath)) {
    return []
  }

  return routePath
    .map(([lng, lat]) => (isFiniteNumber(lat) && isFiniteNumber(lng) ? { lat, lng } : null))
    .filter((point): point is GoogleLatLngLiteral => point !== null)
}

const loadGoogleMapsRuntime = (apiKey: string) => {
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=marker&callback=${googleMapsCallbackName}`
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

export function PlanDetailGoogleMap({
  stops,
  wishlistRestaurants = [],
  nameToCoords,
  countryCode,
  activeStopIndex,
  onSelectStopIndex,
  googleMapsApiKey = defaultGoogleMapsApiKey,
  googleMapsMapId = defaultGoogleMapsMapId,
  routePath,
}: PlanDetailGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<GoogleMapInstance | null>(null)
  const mapsRef = useRef<GoogleMapsNamespace | null>(null)
  const markerInstancesRef = useRef<GoogleMapMarkerOverlay[]>([])
  const polylineInstanceRef = useRef<GooglePolylineInstance | null>(null)

  const [runtimeStatus, setRuntimeStatus] = useState<'loading' | 'ready' | 'fallback'>(
    googleMapsApiKey ? 'loading' : 'fallback',
  )
  const [mapInstanceVersion, setMapInstanceVersion] = useState(0)

  const validPoints = useMemo(() => {
    return getPlanStopRoutePoints(stops, nameToCoords)
  }, [stops, nameToCoords])
  const placedWishlistRestaurantIds = useMemo(
    () => new Set(stops.map((stop) => stop.wishlistRestaurantId).filter((id): id is string => Boolean(id))),
    [stops],
  )
  const unplacedWishlistRestaurants = useMemo(
    () => wishlistRestaurants.filter((restaurant) => !placedWishlistRestaurantIds.has(restaurant.id)),
    [wishlistRestaurants, placedWishlistRestaurantIds],
  )

  const routeLinePath = useMemo(() => {
    const routeCoordinates = routePathToLatLng(routePath)
    return routeCoordinates.length > 1 ? routeCoordinates : validPoints.map((pt) => pt.coords)
  }, [routePath, validPoints])

  useEffect(() => {
    if (!googleMapsApiKey || typeof window === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRuntimeStatus('fallback')
      return undefined
    }

    let isMounted = true

    loadGoogleMapsRuntime(googleMapsApiKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return

        mapsRef.current = maps
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center: getCountryCenter(countryCode),
          clickableIcons: false,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          maxZoom: 16,
          minZoom: 5,
          zoom: 11,
          ...(googleMapsMapId ? { mapId: googleMapsMapId } : {}),
        })

        setRuntimeStatus('ready')
        setMapInstanceVersion((v) => v + 1)
      })
      .catch(() => {
        if (isMounted) {
          setRuntimeStatus('fallback')
        }
      })

    return () => {
      isMounted = false
    }
  }, [googleMapsApiKey, googleMapsMapId, countryCode])

  // Center/fit map bounds to fit all active markers
  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current

    if (!map || !maps || runtimeStatus !== 'ready') return

    const boundsPath = routeLinePath.length > 0 ? routeLinePath : validPoints.map((pt) => pt.coords)

    if (boundsPath.length === 0 && unplacedWishlistRestaurants.length === 0) {
      map.setCenter(getCountryCenter(countryCode))
      map.setZoom(10)
      return
    }

    const bounds = new maps.LatLngBounds()
    boundsPath.forEach((point) => {
      bounds.extend(point)
    })

    unplacedWishlistRestaurants.forEach((r) => {
      if (r.lat != null && r.lng != null) {
        bounds.extend({ lat: r.lat, lng: r.lng })
      }
    })

    // Padding prevents markers from getting cut off at edge of sticky screen
    map.fitBounds(bounds, 64)
  }, [countryCode, routeLinePath, validPoints, unplacedWishlistRestaurants, runtimeStatus, mapInstanceVersion])

  // Render markers and polyline paths
  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current
    const GoogleMarker = maps?.Marker
    const GoogleAdvancedMarker = googleMapsMapId ? maps?.marker?.AdvancedMarkerElement : undefined
    const GooglePolyline = maps?.Polyline

    // 1. Clear existing markers
    markerInstancesRef.current.forEach(clearMarkerOverlay)
    markerInstancesRef.current = []

    // 2. Clear existing polyline
    if (polylineInstanceRef.current) {
      polylineInstanceRef.current.setMap(null)
      polylineInstanceRef.current = null
    }

    if (!map || !maps || (!GoogleAdvancedMarker && !GoogleMarker)) return

    // 3. Render numbered markers
    const stopMarkers = validPoints.map((pt) => {
      const isSelected = activeStopIndex === pt.index
      if (GoogleAdvancedMarker) {
        const marker = new GoogleAdvancedMarker({
          content: createNumberedMarkerContent(String(pt.index + 1), isSelected),
          gmpClickable: Boolean(onSelectStopIndex),
          map,
          position: pt.coords,
          title: pt.stop.title,
        })

        if (onSelectStopIndex) {
          marker.addEventListener?.('gmp-click', () => {
            onSelectStopIndex(pt.index)
          })
        }

        return marker
      }

      if (!GoogleMarker) {
        throw new Error('Google Maps marker runtime unavailable.')
      }

      const marker = new GoogleMarker({
        position: pt.coords,
        map,
        clickable: true,
        label: {
          text: String(pt.index + 1),
          color: isSelected ? '#33271E' : '#FFFFFF',
          fontSize: '12px',
          fontWeight: '900',
        },
        title: pt.stop.title,
        icon: {
          path: maps.SymbolPath?.CIRCLE ?? 0,
          fillColor: isSelected ? '#F36B12' : '#A92B10',
          fillOpacity: 1.0,
          strokeColor: isSelected ? '#33271E' : '#FFFFFF',
          strokeWeight: 2,
          scale: isSelected ? 16 : 13,
        },
      })

      if (onSelectStopIndex) {
        marker.addListener?.('click', () => {
          onSelectStopIndex(pt.index)
        })
      }

      return marker
    })

    // 3.5. Render wishlist restaurant markers
    const wishlistMarkers = unplacedWishlistRestaurants
      .map((restaurant) => {
        if (restaurant.lat == null || restaurant.lng == null) {
          return null
        }
        if (GoogleAdvancedMarker) {
          return new GoogleAdvancedMarker({
            content: createRestaurantMarkerContent(),
            map,
            position: { lat: restaurant.lat, lng: restaurant.lng },
            title: restaurant.placeName,
          })
        }

        if (!GoogleMarker) {
          throw new Error('Google Maps marker runtime unavailable.')
        }

        const marker = new GoogleMarker({
          position: { lat: restaurant.lat, lng: restaurant.lng },
          map,
          clickable: true,
          label: {
            text: '🍽️',
            fontSize: '11px',
          },
          title: restaurant.placeName,
          icon: {
            path: maps.SymbolPath?.CIRCLE ?? 0,
            fillColor: '#10B981', // green/emerald for restaurants
            fillOpacity: 1.0,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 12,
          },
        })
        return marker
      })
      .filter((m): m is GoogleMapMarkerOverlay => m !== null)

    markerInstancesRef.current = [...stopMarkers, ...wishlistMarkers]

    // 4. Render Dashed Polyline Path connecting stops in order
    if (GooglePolyline && routeLinePath.length > 1) {
      const lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeColor: '#F36B12',
        scale: 3,
      }

      polylineInstanceRef.current = new GooglePolyline({
        path: routeLinePath,
        strokeOpacity: 0,
        icons: [
          {
            icon: lineSymbol,
            offset: '0',
            repeat: '15px',
          },
        ],
        map,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPoints, unplacedWishlistRestaurants, routeLinePath, activeStopIndex, runtimeStatus, mapInstanceVersion])

  return (
    <div
      data-testid="plan-detail-google-map"
      className="relative h-full w-full overflow-hidden"
      role="region"
      aria-label="여행 코스 동선 지도"
    >
      <div ref={mapContainerRef} className="absolute inset-0" aria-hidden={runtimeStatus !== 'ready'} />
      {runtimeStatus !== 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFF0E4]/60 p-6 text-center">
          <span className="text-sm font-black text-[#F36B12]">
            {runtimeStatus === 'loading' ? '지도를 불러오고 있어요…' : '지도를 표시할 수 없습니다.'}
          </span>
          <p className="mt-2 text-xs font-semibold text-[#6E5A50]">
            {runtimeStatus === 'loading'
              ? '구글 맵 API 설정을 확인하는 중입니다.'
              : 'Google Maps API 키 또는 연결 상태를 확인해 주세요.'}
          </p>
        </div>
      )}
    </div>
  )
}
