import type { PlanStop, RoutePathCoordinate } from '../../shared/types/app'

type LatLng = {
  lat: number
  lng: number
}

type OpenRouteServiceFeatureCollection = {
  features?: Array<{
    geometry?: {
      coordinates?: unknown
    }
  }>
}

export type PlanStopRoutePoint = {
  index: number
  stop: PlanStop
  coords: LatLng
  routeCoordinate: RoutePathCoordinate
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const EARTH_RADIUS_METERS = 6_371_000
const WALKING_THRESHOLD_METERS = 900
const WALKING_METERS_PER_MINUTE = 67
const DRIVING_METERS_PER_MINUTE = 330

const toRadians = (degrees: number) => degrees * (Math.PI / 180)

export const normalizeStopCoordinateKey = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, '')

export const normalizeStopContentKey = (value?: string | number | null) => {
  if (value == null) {
    return ''
  }

  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9가-힣]/g, '')
  const numericMatch = normalized.match(/\d+/g)

  return numericMatch ? numericMatch.join('') : normalized
}

export const getPlanStopLatLng = (
  stop: PlanStop,
  nameToCoords: Record<string, LatLng>,
): LatLng | null => {
  if (isFiniteNumber(stop.latitude) && isFiniteNumber(stop.longitude)) {
    return {
      lat: stop.latitude,
      lng: stop.longitude,
    }
  }

  const contentKey = normalizeStopContentKey(stop.contentId)
  if (contentKey && nameToCoords[contentKey]) {
    return nameToCoords[contentKey]
  }

  return nameToCoords[normalizeStopCoordinateKey(stop.title)] ?? null
}

export const getPlanStopRoutePoints = (
  stops: PlanStop[],
  nameToCoords: Record<string, LatLng>,
): PlanStopRoutePoint[] =>
  stops
    .map((stop, index) => {
      const coords = getPlanStopLatLng(stop, nameToCoords)

      if (!coords) {
        return null
      }

      return {
        index,
        stop,
        coords,
        routeCoordinate: [coords.lng, coords.lat] as RoutePathCoordinate,
      }
    })
    .filter((point): point is PlanStopRoutePoint => point !== null)

export const getPlanRouteCoordinates = (
  stops: PlanStop[],
  nameToCoords: Record<string, LatLng>,
): RoutePathCoordinate[] =>
  getPlanStopRoutePoints(stops, nameToCoords).map((point) => point.routeCoordinate)

export const getStraightLineDistanceMeters = (from: LatLng, to: LatLng) => {
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export const formatEstimatedMoveLabel = (
  from: LatLng | null,
  to: LatLng | null,
) => {
  if (!from || !to) {
    return '이동 시간 확인 필요'
  }

  const distanceMeters = getStraightLineDistanceMeters(from, to)

  if (distanceMeters < 80) {
    return '도보 1분'
  }

  if (distanceMeters <= WALKING_THRESHOLD_METERS) {
    return `도보 ${Math.max(1, Math.ceil(distanceMeters / WALKING_METERS_PER_MINUTE))}분`
  }

  return `차량 ${Math.max(5, Math.ceil(distanceMeters / DRIVING_METERS_PER_MINUTE))}분`
}

const toRoutePathCoordinates = (coordinates: unknown): RoutePathCoordinate[] => {
  if (!Array.isArray(coordinates)) {
    return []
  }

  return coordinates
    .map((coordinate) => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return null
      }

      const [lng, lat] = coordinate

      return isFiniteNumber(lng) && isFiniteNumber(lat)
        ? ([lng, lat] as RoutePathCoordinate)
        : null
    })
    .filter((coordinate): coordinate is RoutePathCoordinate => coordinate !== null)
}

export const requestOpenRouteServicePath = async (
  coordinates: RoutePathCoordinate[],
  apiKey: string,
): Promise<RoutePathCoordinate[] | null> => {
  if (!apiKey || coordinates.length < 2) {
    return null
  }

  const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
    method: 'POST',
    headers: {
      Accept: 'application/json, application/geo+json',
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates,
      instructions: false,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as OpenRouteServiceFeatureCollection
  const routeCoordinates = toRoutePathCoordinates(data.features?.[0]?.geometry?.coordinates)

  return routeCoordinates.length > 1 ? routeCoordinates : null
}
