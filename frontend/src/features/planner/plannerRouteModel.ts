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

export const normalizeStopCoordinateKey = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, '')

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
