import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { smallCityMapBounds, type SmallCityCountry, type SmallCityMapMarker } from '../data/smallCities'

type SmallCityLeafletMapProps = {
  markers: SmallCityMapMarker[]
  country: SmallCityCountry
  countryLabel: string
  selectedMarkerCityId: string | null
  onSelectMarker: (marker: SmallCityMapMarker) => void
}

const getCountryBounds = (country: SmallCityCountry): L.LatLngBoundsExpression => {
  const bounds = smallCityMapBounds[country]

  return [
    [bounds.minLat, bounds.minLng],
    [bounds.maxLat, bounds.maxLng],
  ]
}

export function SmallCityLeafletMap({
  markers,
  country,
  countryLabel,
  selectedMarkerCityId,
  onSelectMarker,
}: SmallCityLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const onSelectMarkerRef = useRef(onSelectMarker)

  useEffect(() => {
    onSelectMarkerRef.current = onSelectMarker
  }, [onSelectMarker])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined
    }

    const map = L.map(containerRef.current, {
      maxZoom: 12,
      minZoom: 5,
      scrollWheelZoom: false,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    markerLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    map.setView([36.2, 127.8], 6)

    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    map.fitBounds(getCountryBounds(country), { padding: [18, 18] })
    window.setTimeout(() => {
      map.invalidateSize()
    }, 0)
  }, [country])

  useEffect(() => {
    const markerLayer = markerLayerRef.current

    if (!markerLayer) {
      return
    }

    markerLayer.clearLayers()

    markers.forEach((cityMarker) => {
      const isSelected = cityMarker.cityId === selectedMarkerCityId
      const marker = L.circleMarker([cityMarker.latitude, cityMarker.longitude], {
        radius: isSelected ? 9 : 5,
        color: isSelected ? '#33271E' : '#ffffff',
        fillColor: isSelected ? '#F36B12' : '#A92B10',
        fillOpacity: isSelected ? 0.95 : 0.86,
        opacity: 1,
        weight: isSelected ? 3 : 1.5,
      })

      marker
        .bindTooltip(cityMarker.label, {
          direction: 'top',
          offset: [0, -8],
          opacity: isSelected ? 1 : 0.92,
          permanent: isSelected,
        })
        .on('click', () => {
          onSelectMarkerRef.current(cityMarker)
        })
        .addTo(markerLayer)
    })
  }, [markers, selectedMarkerCityId])

  return (
    <div
      ref={containerRef}
      data-marker-count={markers.length}
      data-testid="city-map-leaflet-map"
      aria-label={`${countryLabel} 소도시 실제 지도. 현재 조건에 맞는 도시명 마커 ${markers.length}개.`}
      className="lovv-leaflet-map h-full min-h-[inherit] w-full"
      role="region"
    />
  )
}
