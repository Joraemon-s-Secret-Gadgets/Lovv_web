import {
  smallCityPlaceCategories,
  smallCityThemes,
  type SmallCityDetail,
  type SmallCityFestival,
  type SmallCityPlace,
  type SmallCityPlaceCategory,
  type SmallCityPlaceGroups,
  type SmallCity,
  type SmallCityCountry,
  type SmallCityTheme,
} from '../../features/map-city/smallCities'

export const smallCityApiEndpoints = {
  list: '/api/small-cities',
  detail: (cityId: string) => `/api/small-cities/${encodeURIComponent(cityId)}`,
  places: (cityId: string) => `/api/small-cities/${encodeURIComponent(cityId)}/places`,
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
  festivalCount?: number
  festival_count?: number
  festivals?: SmallCityApiPlaceRecord[]
  internal_meta?: SmallCityApiInternalMeta
}

export type SmallCityApiListResponse = {
  data: SmallCityApiRecord[]
  page: SmallCityApiPage
}

export type SmallCityApiPlaceRecord = {
  id?: string
  placeId?: string
  place_id?: string
  contentId?: string | number | null
  content_id?: string | number | null
  cityId?: string
  city_id?: string
  type?: 'attraction' | 'festival' | string
  category?: SmallCityPlaceCategory | string
  categoryName?: string
  category_name?: string
  name?: string
  title?: string
  summary?: string | Record<string, unknown> | null
  description?: string | null
  address?: string | null
  address_name?: string | null
  roadAddress?: string | null
  road_address_name?: string | null
  phone?: string | null
  imageUrl?: string | null
  image_url?: string | null
  latitude?: number | string | null
  lat?: number | string | null
  longitude?: number | string | null
  lng?: number | string | null
  kakao_place_id?: string | null
  placeUrl?: string | null
  place_url?: string | null
  theme?: string | null
  themeTags?: unknown
  theme_tags?: unknown
  startDate?: string | null
  start_date?: string | null
  endDate?: string | null
  end_date?: string | null
  visitMonths?: unknown
  visit_months?: unknown
  internal_meta?: SmallCityApiInternalMeta
}

export type SmallCityApiPlaceGroups = Partial<Record<SmallCityPlaceCategory, SmallCityApiPlaceRecord[]>>

export type SmallCityApiPlacesPayload =
  | SmallCityApiPlaceGroups
  | SmallCityApiPlaceRecord[]
  | SmallCityApiPlacesResponse

export type SmallCityApiPlacesResponse = {
  cityId?: string
  city_id?: string
  cityName?: string
  city_name?: string
  summary?: Record<string, unknown>
  data?: SmallCityApiPlaceRecord[]
  places?: SmallCityApiPlaceGroups | SmallCityApiPlaceRecord[]
  attractions?: SmallCityApiPlaceRecord[]
  festivals?: SmallCityApiPlaceRecord[]
}

export type SmallCityApiDetailResponse = {
  data: SmallCityApiRecord
  summary?: Record<string, unknown>
  places?: SmallCityApiPlacesPayload
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

export type SmallCityApiDetailAdapterResult = {
  detail: SmallCityDetail | null
  rejectedRecords: SmallCityApiRejectedRecord[]
}

export type SmallCityApiPlacesAdapterResult = {
  placesByCategory: SmallCityPlaceGroups
  festivals: SmallCityFestival[]
  festivalCount: number
  rejectedRecords: SmallCityApiRejectedRecord[]
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

const isSmallCityPlaceCategory = (value: string): value is SmallCityPlaceCategory =>
  smallCityPlaceCategories.includes(value as SmallCityPlaceCategory)

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

const normalizeNumberArray = (values: unknown) =>
  Array.isArray(values)
    ? values
        .map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : null))
        .filter((value): value is number => value !== null)
    : []

const normalizeThemes = (themes: unknown) =>
  normalizeStringArray(themes).filter(isSmallCityTheme)

const isFiniteCoordinate = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)

const normalizePositiveInteger = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback

const normalizeCoordinate = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value)

    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  return null
}

const kakaoCategoryCodeMap: Record<string, SmallCityPlaceCategory> = {
  AT4: '관광지',
  FD6: '음식점',
  CE7: '카페',
  AD5: '숙소',
}

const normalizePlaceCategory = (
  category: unknown,
  categoryName: unknown,
  placeType?: unknown,
): SmallCityPlaceCategory | null => {
  const normalizedCategory = normalizeRequiredString(category)
  const normalizedCategoryName = normalizeRequiredString(categoryName)
  const normalizedPlaceType = normalizeRequiredString(placeType)

  if (normalizedCategory && isSmallCityPlaceCategory(normalizedCategory)) {
    return normalizedCategory
  }

  if (normalizedPlaceType === 'attraction' || normalizedPlaceType === 'festival') {
    return '관광지'
  }

  if (normalizedCategory && kakaoCategoryCodeMap[normalizedCategory]) {
    return kakaoCategoryCodeMap[normalizedCategory]
  }

  const searchableName = normalizedCategoryName ?? normalizedCategory ?? ''

  if (searchableName.includes('음식')) {
    return '음식점'
  }

  if (searchableName.includes('카페')) {
    return '카페'
  }

  if (searchableName.includes('숙박') || searchableName.includes('숙소')) {
    return '숙소'
  }

  if (searchableName.includes('관광') || searchableName.includes('명소') || searchableName.includes('여행')) {
    return '관광지'
  }

  return null
}

const normalizePlaceCategoryName = (
  category: SmallCityPlaceCategory,
  categoryName: unknown,
  placeType: unknown,
) => {
  const normalizedCategoryName = normalizeOptionalString(categoryName)
  const normalizedPlaceType = normalizeRequiredString(placeType)

  if (normalizedCategoryName) {
    return normalizedCategoryName
  }

  if (normalizedPlaceType === 'festival') {
    return '축제'
  }

  if (normalizedPlaceType === 'attraction') {
    return '관광지'
  }

  return category
}

const createEmptySmallCityPlaceGroups = (): SmallCityPlaceGroups =>
  smallCityPlaceCategories.reduce((groups, category) => {
    groups[category] = []

    return groups
  }, {} as SmallCityPlaceGroups)

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
  const festivalRecords = flattenSmallCityPlaceRecords({ festivals: record.festivals ?? [] })
  const festivals = festivalRecords
    .map((festivalRecord) => normalizeSmallCityApiPlaceRecord(festivalRecord, id ?? ''))
    .flatMap((normalizedFestival) => (normalizedFestival.place ? [toSmallCityFestival(normalizedFestival.place)] : []))
  const rawFestivalCount = record.festivalCount ?? record.festival_count
  const festivalCount =
    typeof rawFestivalCount === 'number' && Number.isFinite(rawFestivalCount)
      ? Math.max(rawFestivalCount, festivals.length)
      : festivals.length

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
      festivals,
      festivalCount,
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

const normalizeSmallCityApiPlaceRecord = (
  record: SmallCityApiPlaceRecord,
  fallbackCityId: string,
): { place: SmallCityPlace; rejected: null } | { place: null; rejected: SmallCityApiRejectedRecord } => {
  const id =
    normalizeRequiredString(record.placeId) ??
    normalizeRequiredString(record.place_id) ??
    normalizeRequiredString(record.kakao_place_id) ??
    normalizeRequiredString(record.id) ??
    normalizeRequiredString(record.contentId) ??
    normalizeRequiredString(record.content_id)
  const cityId =
    normalizeRequiredString(record.cityId) ??
    normalizeRequiredString(record.city_id) ??
    normalizeRequiredString(fallbackCityId)
  const category = normalizePlaceCategory(
    record.category,
    record.categoryName ?? record.category_name,
    record.type,
  )
  const name =
    normalizeRequiredString(record.name) ??
    normalizeRequiredString(record.title)
  const roadAddressName =
    normalizeOptionalString(record.roadAddress) ??
    normalizeOptionalString(record.road_address_name)
  const phone = normalizeOptionalString(record.phone)
  const placeUrl =
    normalizeOptionalString(record.placeUrl) ??
    normalizeOptionalString(record.place_url)
  const latitudeInput = record.latitude ?? record.lat
  const longitudeInput = record.longitude ?? record.lng
  const latitude = normalizeCoordinate(latitudeInput)
  const longitude = normalizeCoordinate(longitudeInput)
  const addressName =
    normalizeOptionalString(record.address) ??
    normalizeOptionalString(record.address_name)
  const description = normalizeRequiredString(record.description)
  const imageUrl =
    normalizeOptionalString(record.imageUrl) ??
    normalizeOptionalString(record.image_url)
  const themeTags = normalizeStringArray(record.themeTags ?? record.theme_tags)
  const visitMonths = normalizeNumberArray(record.visitMonths ?? record.visit_months)
  const startDate =
    normalizeOptionalString(record.startDate) ??
    normalizeOptionalString(record.start_date)
  const endDate =
    normalizeOptionalString(record.endDate) ??
    normalizeOptionalString(record.end_date)
  const dateSummary = startDate || endDate ? `축제 기간 ${[startDate, endDate].filter(Boolean).join(' - ')}` : null
  const summary =
    normalizeRequiredString(record.summary) ??
    description ??
    dateSummary ??
    (name
      ? `${name}${addressName ? `, ${addressName}` : ''} 기준으로 확인할 수 있는 장소 후보입니다.`
      : null)

  if (!id) {
    return { place: null, rejected: { id: null, reason: 'missing place id' } }
  }

  if (!cityId) {
    return { place: null, rejected: { id, reason: 'missing city id' } }
  }

  if (!category) {
    return { place: null, rejected: { id, reason: 'invalid place category' } }
  }

  if (!name || !summary) {
    return { place: null, rejected: { id, reason: 'missing place text fields' } }
  }

  if (
    (latitudeInput !== undefined && latitudeInput !== null && latitude === null) ||
    (longitudeInput !== undefined && longitudeInput !== null && longitude === null)
  ) {
    return { place: null, rejected: { id, reason: 'invalid place coordinates' } }
  }

  return {
    place: {
      id,
      cityId,
      category,
      categoryCode: normalizeOptionalString(record.category),
      categoryName: normalizePlaceCategoryName(
        category,
        record.categoryName ?? record.category_name,
        record.type,
      ),
      name,
      summary,
      addressName,
      roadAddressName,
      phone,
      placeUrl,
      imageUrl,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      theme: normalizeOptionalString(record.theme),
      themeTags: themeTags.length > 0 ? themeTags : undefined,
      startDate,
      endDate,
      visitMonths: visitMonths.length > 0 ? visitMonths : undefined,
    },
    rejected: null,
  }
}

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const appendPlaceRecords = (
  target: SmallCityApiPlaceRecord[],
  records: unknown,
  defaults: Partial<SmallCityApiPlaceRecord> = {},
) => {
  if (!Array.isArray(records)) {
    return
  }

  records.forEach((record) => {
    if (!isRecordObject(record)) {
      return
    }

    target.push({
      ...defaults,
      ...record,
      category: (record.category as SmallCityApiPlaceRecord['category']) ?? defaults.category,
      type: (record.type as SmallCityApiPlaceRecord['type']) ?? defaults.type,
    })
  })
}

const flattenSmallCityPlaceRecords = (
  payload: SmallCityApiPlacesPayload | undefined,
): SmallCityApiPlaceRecord[] => {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  const records: SmallCityApiPlaceRecord[] = []
  const payloadRecord = payload as Record<string, unknown>

  appendPlaceRecords(records, payloadRecord.data)
  appendPlaceRecords(records, payloadRecord.attractions, { type: 'attraction' })
  appendPlaceRecords(records, payloadRecord.festivals, { type: 'festival' })

  const nestedPlaces = payloadRecord.places
  if (Array.isArray(nestedPlaces)) {
    appendPlaceRecords(records, nestedPlaces)
  } else if (isRecordObject(nestedPlaces)) {
    smallCityPlaceCategories.forEach((category) => {
      appendPlaceRecords(records, nestedPlaces[category], { category })
    })
  }

  smallCityPlaceCategories.forEach((category) => {
    appendPlaceRecords(records, payloadRecord[category], { category })
  })

  return records
}

const isFestivalPlace = (place: SmallCityPlace) =>
  place.categoryName === '축제' ||
  place.theme === '축제' ||
  Boolean(place.themeTags?.includes('축제'))

const toSmallCityFestival = (place: SmallCityPlace): SmallCityFestival => ({
  id: place.id,
  cityId: place.cityId,
  name: place.name,
  summary: place.summary,
  startDate: place.startDate,
  endDate: place.endDate,
  visitMonths: place.visitMonths,
  themeTags: place.themeTags,
})

const getPayloadFestivalCount = (
  payload: SmallCityApiPlacesPayload | undefined,
  festivals: SmallCityFestival[],
) => {
  if (!isRecordObject(payload)) {
    return festivals.length
  }

  const payloadRecord = payload as Record<string, unknown>
  const summary = payloadRecord.summary

  if (!isRecordObject(summary)) {
    return festivals.length
  }

  const rawFestivalCount = summary.festivalCount ?? summary.festival_count

  return typeof rawFestivalCount === 'number' && Number.isFinite(rawFestivalCount)
    ? Math.max(rawFestivalCount, festivals.length)
    : festivals.length
}

const adaptSmallCityPlacePayload = (
  payload: SmallCityApiPlacesPayload | undefined,
  fallbackCityId: string,
): SmallCityApiPlacesAdapterResult => {
  const normalizedFallbackCityId = normalizeRequiredString(fallbackCityId) ?? ''

  const rejectedRecords: SmallCityApiRejectedRecord[] = []
  const placesByCategory = createEmptySmallCityPlaceGroups()
  const festivals: SmallCityFestival[] = []

  flattenSmallCityPlaceRecords(payload).forEach((record) => {
    const normalizedPlace = normalizeSmallCityApiPlaceRecord(record, normalizedFallbackCityId)

    if (!normalizedPlace.place) {
      rejectedRecords.push(normalizedPlace.rejected)
      return
    }

    if (normalizedFallbackCityId && normalizedPlace.place.cityId !== normalizedFallbackCityId) {
      rejectedRecords.push({
        id: normalizedPlace.place.id,
        reason: 'place city mismatch',
      })
      return
    }

    placesByCategory[normalizedPlace.place.category].push(normalizedPlace.place)

    if (isFestivalPlace(normalizedPlace.place)) {
      festivals.push(toSmallCityFestival(normalizedPlace.place))
    }
  })

  return {
    placesByCategory,
    festivals,
    festivalCount: getPayloadFestivalCount(payload, festivals),
    rejectedRecords,
  }
}

export const adaptSmallCityPlacesApiResponse = (
  response: SmallCityApiPlacesResponse,
  fallbackCityId = '',
): SmallCityApiPlacesAdapterResult => {
  const responseCityId =
    normalizeRequiredString(response.cityId) ??
    normalizeRequiredString(response.city_id) ??
    normalizeRequiredString(fallbackCityId) ??
    ''

  return adaptSmallCityPlacePayload(response, responseCityId)
}

export const adaptSmallCityDetailApiResponse = (
  response: SmallCityApiDetailResponse,
): SmallCityApiDetailAdapterResult => {
  const normalizedCity = normalizeSmallCityApiRecord(response.data)

  if (!normalizedCity.city) {
    return {
      detail: null,
      rejectedRecords: [normalizedCity.rejected],
    }
  }

  const placesPayload =
    isRecordObject(response.places)
      ? (() => {
          const placesRecord = response.places as Record<string, unknown>

          return {
            ...placesRecord,
            summary: isRecordObject(placesRecord.summary) ? placesRecord.summary : response.summary,
          } as SmallCityApiPlacesPayload
        })()
      : response.places ?? (response.summary ? { summary: response.summary } : undefined)
  const placeAdapterResult = adaptSmallCityPlacePayload(placesPayload, normalizedCity.city.id)

  return {
    detail: {
      city: {
        ...normalizedCity.city,
        festivals: placeAdapterResult.festivals,
        festivalCount: placeAdapterResult.festivalCount,
      },
      placesByCategory: placeAdapterResult.placesByCategory,
      festivals: placeAdapterResult.festivals,
      festivalCount: placeAdapterResult.festivalCount,
    },
    rejectedRecords: placeAdapterResult.rejectedRecords,
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
