import {
  smallCityThemes,
  type SmallCity,
  type SmallCityCountry,
  type SmallCityTheme,
} from './smallCities'

export const smallCityApiEndpoints = {
  list: '/api/small-cities',
  detail: (cityId: string) => `/api/small-cities/${encodeURIComponent(cityId)}`,
} as const

export const defaultSmallCityApiPageSize = 120

export type SmallCityApiListParams = {
  country?: SmallCityCountry
  query?: string
  themes?: SmallCityTheme[]
  page?: number
  pageSize?: number
}

export type SmallCityApiPage = {
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

export type SmallCityApiInternalMeta = {
  rankingScore?: number
  source?: string
  provider?: string
  updatedAt?: string
}

export type SmallCityApiRecord = {
  id: string
  country: SmallCityCountry
  country_label?: '한국' | '일본'
  region: string
  name_ko: string
  name_local?: string | null
  latitude: number
  longitude: number
  themes: string[]
  summary: string
  detail: string
  highlights: string[]
  route_seed: string[]
  image_url?: string | null
  internal_meta?: SmallCityApiInternalMeta
}

export type SmallCityApiListResponse = {
  data: SmallCityApiRecord[]
  page: SmallCityApiPage
}

export type SmallCityApiRejectedRecord = {
  id: string | null
  reason: string
}

export type SmallCityApiAdapterResult = {
  cities: SmallCity[]
  rejectedRecords: SmallCityApiRejectedRecord[]
  page: SmallCityApiPage
}

const countryLabels: Record<SmallCityCountry, '한국' | '일본'> = {
  KR: '한국',
  JP: '일본',
}

const validThemeSet = new Set<string>(smallCityThemes)

const isSmallCityCountry = (value: string): value is SmallCityCountry =>
  value === 'KR' || value === 'JP'

const isSmallCityTheme = (value: string): value is SmallCityTheme =>
  validThemeSet.has(value)

const normalizeRequiredString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined

const normalizeStringArray = (values: unknown) =>
  Array.isArray(values)
    ? values
        .map((value) => normalizeRequiredString(value))
        .filter((value): value is string => value !== null)
    : []

const normalizeThemes = (themes: unknown) =>
  normalizeStringArray(themes).filter(isSmallCityTheme)

const isFiniteCoordinate = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)

const normalizePositiveInteger = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback

const normalizeSmallCityApiRecord = (
  record: SmallCityApiRecord,
): { city: SmallCity; rejected: null } | { city: null; rejected: SmallCityApiRejectedRecord } => {
  const id = normalizeRequiredString(record.id)
  const region = normalizeRequiredString(record.region)
  const nameKo = normalizeRequiredString(record.name_ko)
  const summary = normalizeRequiredString(record.summary)
  const detail = normalizeRequiredString(record.detail)
  const themes = normalizeThemes(record.themes)
  const highlights = normalizeStringArray(record.highlights)
  const routeSeed = normalizeStringArray(record.route_seed)

  if (!id) {
    return { city: null, rejected: { id: null, reason: 'missing id' } }
  }

  if (!isSmallCityCountry(record.country)) {
    return { city: null, rejected: { id, reason: 'invalid country' } }
  }

  if (!region || !nameKo || !summary || !detail) {
    return { city: null, rejected: { id, reason: 'missing required text fields' } }
  }

  if (!isFiniteCoordinate(record.latitude) || !isFiniteCoordinate(record.longitude)) {
    return { city: null, rejected: { id, reason: 'invalid coordinates' } }
  }

  if (themes.length === 0) {
    return { city: null, rejected: { id, reason: 'missing valid themes' } }
  }

  if (highlights.length === 0 || routeSeed.length === 0) {
    return { city: null, rejected: { id, reason: 'missing detail arrays' } }
  }

  return {
    city: {
      id,
      country: record.country,
      countryLabel: countryLabels[record.country],
      region,
      nameKo,
      nameLocal: normalizeOptionalString(record.name_local),
      latitude: record.latitude,
      longitude: record.longitude,
      themes,
      summary,
      detail,
      highlights,
      routeSeed,
      image: normalizeOptionalString(record.image_url),
    },
    rejected: null,
  }
}

export const adaptSmallCityApiResponse = (
  response: SmallCityApiListResponse,
): SmallCityApiAdapterResult => {
  const cities: SmallCity[] = []
  const rejectedRecords: SmallCityApiRejectedRecord[] = []

  response.data.forEach((record) => {
    const normalized = normalizeSmallCityApiRecord(record)

    if (normalized.city) {
      cities.push(normalized.city)
    } else {
      rejectedRecords.push(normalized.rejected)
    }
  })

  return {
    cities,
    rejectedRecords,
    page: {
      page: normalizePositiveInteger(response.page.page, 1),
      pageSize: normalizePositiveInteger(response.page.pageSize, defaultSmallCityApiPageSize),
      total: normalizePositiveInteger(response.page.total, cities.length),
      hasNext: Boolean(response.page.hasNext),
    },
  }
}

export const createSmallCityApiQuery = ({
  country,
  query,
  themes = [],
  page = 1,
  pageSize = defaultSmallCityApiPageSize,
}: SmallCityApiListParams) => {
  const params = new URLSearchParams()

  if (country) {
    params.set('country', country)
  }

  if (query?.trim()) {
    params.set('q', query.trim())
  }

  if (themes.length > 0) {
    params.set('themes', themes.join(','))
  }

  params.set('page', String(Math.max(1, Math.trunc(page))))
  params.set('page_size', String(Math.max(1, Math.trunc(pageSize))))

  return params.toString()
}
