import {
  adaptSmallCityDetailApiResponse,
  adaptSmallCityApiResponse,
  createSmallCityApiQuery,
  defaultSmallCityApiPageSize,
  type SmallCityApiAdapterResult,
  type SmallCityApiDetailAdapterResult,
  type SmallCityApiDetailResponse,
  type SmallCityApiListParams,
  type SmallCityApiListResponse,
  type SmallCityApiPlaceRecord,
  type SmallCityApiRecord,
  type SmallCityApiRejectedRecord,
} from '../../shared/api/smallCityApi'
import {
  createSmallCityDetail,
  filterSmallCities,
  smallCities,
  type SmallCity,
  type SmallCityDetail,
  type SmallCityPlace,
  type SmallCityPlaceCategory,
} from './smallCities'

export type SmallCityCatalogSource = 'static-catalog'

export type SmallCityCatalogState =
  | {
      status: 'loading'
      source: SmallCityCatalogSource
      cities: []
      rejectedRecords: []
      queryKey: string
      errorMessage: null
    }
  | {
      status: 'success'
      source: SmallCityCatalogSource
      cities: SmallCity[]
      rejectedRecords: SmallCityApiRejectedRecord[]
      queryKey: string
      errorMessage: null
    }
  | {
      status: 'empty'
      source: SmallCityCatalogSource
      cities: []
      rejectedRecords: SmallCityApiRejectedRecord[]
      queryKey: string
      errorMessage: null
    }
  | {
      status: 'error'
      source: SmallCityCatalogSource
      cities: []
      rejectedRecords: SmallCityApiRejectedRecord[]
      queryKey: string
      errorMessage: string
    }

export type SmallCityDetailState =
  | {
      status: 'loading'
      source: SmallCityCatalogSource
      cityId: string
      detail: null
      rejectedRecords: []
      errorMessage: null
    }
  | {
      status: 'success'
      source: SmallCityCatalogSource
      cityId: string
      detail: SmallCityDetail
      rejectedRecords: SmallCityApiRejectedRecord[]
      errorMessage: null
    }
  | {
      status: 'empty'
      source: SmallCityCatalogSource
      cityId: string
      detail: null
      rejectedRecords: SmallCityApiRejectedRecord[]
      errorMessage: null
    }
  | {
      status: 'error'
      source: SmallCityCatalogSource
      cityId: string
      detail: null
      rejectedRecords: SmallCityApiRejectedRecord[]
      errorMessage: string
    }

export const staticSmallCityCatalogSource: SmallCityCatalogSource = 'static-catalog'

const countryLabels = {
  KR: '한국',
  JP: '일본',
} as const

export const createSmallCityCatalogLoadingState = (
  queryKey = createSmallCityApiQuery({ pageSize: defaultSmallCityApiPageSize }),
): SmallCityCatalogState => ({
  status: 'loading',
  source: staticSmallCityCatalogSource,
  cities: [],
  rejectedRecords: [],
  queryKey,
  errorMessage: null,
})

export const createSmallCityCatalogErrorState = (
  errorMessage: string,
  queryKey = createSmallCityApiQuery({ pageSize: defaultSmallCityApiPageSize }),
  rejectedRecords: SmallCityApiRejectedRecord[] = [],
): SmallCityCatalogState => ({
  status: 'error',
  source: staticSmallCityCatalogSource,
  cities: [],
  rejectedRecords,
  queryKey,
  errorMessage,
})

export const createSmallCityDetailLoadingState = (cityId = ''): SmallCityDetailState => ({
  status: 'loading',
  source: staticSmallCityCatalogSource,
  cityId,
  detail: null,
  rejectedRecords: [],
  errorMessage: null,
})

export const createSmallCityDetailEmptyState = (
  cityId = '',
  rejectedRecords: SmallCityApiRejectedRecord[] = [],
): SmallCityDetailState => ({
  status: 'empty',
  source: staticSmallCityCatalogSource,
  cityId,
  detail: null,
  rejectedRecords,
  errorMessage: null,
})

export const createSmallCityDetailErrorState = (
  errorMessage: string,
  cityId = '',
  rejectedRecords: SmallCityApiRejectedRecord[] = [],
): SmallCityDetailState => ({
  status: 'error',
  source: staticSmallCityCatalogSource,
  cityId,
  detail: null,
  rejectedRecords,
  errorMessage,
})

export const createStaticSmallCityApiRecord = (city: SmallCity): SmallCityApiRecord => ({
  id: city.id,
  country: city.country,
  country_label: countryLabels[city.country],
  region: city.region,
  name_ko: city.nameKo,
  name_local: city.nameLocal ?? null,
  latitude: city.latitude,
  longitude: city.longitude,
  themes: city.themes,
  summary: city.summary,
  detail: city.detail,
  highlights: city.highlights,
  route_seed: city.routeSeed,
  image_url: city.image ?? null,
  festivalCount: city.festivalCount ?? 0,
  festivals: (city.festivals ?? []).map((festival) => ({
    placeId: festival.id,
    cityId: city.id,
    type: 'festival',
    title: festival.name,
    summary: festival.summary,
    latitude: city.latitude,
    longitude: city.longitude,
    theme: '축제',
    themeTags: festival.themeTags ?? ['축제'],
    startDate: festival.startDate ?? null,
    endDate: festival.endDate ?? null,
    visitMonths: festival.visitMonths ?? null,
  })),
  internal_meta: {
    source: staticSmallCityCatalogSource,
  },
})

export const createStaticSmallCityApiPlaceRecord = (place: SmallCityPlace): SmallCityApiPlaceRecord => ({
  id: place.id,
  placeId: place.id,
  city_id: place.cityId,
  cityId: place.cityId,
  category: place.category,
  categoryName: place.categoryName ?? place.category,
  name: place.name,
  summary: place.summary,
  address: place.addressName ?? null,
  address_name: place.addressName ?? null,
  roadAddress: place.roadAddressName ?? place.addressName ?? null,
  road_address_name: place.roadAddressName ?? place.addressName ?? null,
  phone: place.phone ?? null,
  latitude: place.latitude ?? null,
  longitude: place.longitude ?? null,
  theme: place.theme ?? null,
  themeTags: place.themeTags ?? null,
  startDate: place.startDate ?? null,
  endDate: place.endDate ?? null,
  visitMonths: place.visitMonths ?? null,
  kakao_place_id: null,
  placeUrl: place.placeUrl ?? null,
  place_url: place.placeUrl ?? null,
  internal_meta: {
    source: staticSmallCityCatalogSource,
  },
})

export const createStaticSmallCityApiResponse = (
  cities: SmallCity[] = smallCities,
): SmallCityApiListResponse => ({
  data: cities.map(createStaticSmallCityApiRecord),
  page: {
    page: 1,
    pageSize: Math.max(defaultSmallCityApiPageSize, cities.length),
    total: cities.length,
    hasNext: false,
  },
})

const createStaticSmallCityApiPlaceGroups = (
  detail: SmallCityDetail,
): Record<SmallCityPlaceCategory, SmallCityApiPlaceRecord[]> => {
  const placeGroups = {} as Record<SmallCityPlaceCategory, SmallCityApiPlaceRecord[]>

  Object.entries(detail.placesByCategory).forEach(([category, places]) => {
    placeGroups[category as SmallCityPlaceCategory] = places.map(createStaticSmallCityApiPlaceRecord)
  })

  return placeGroups
}

export const createStaticSmallCityDetailApiResponse = (city: SmallCity): SmallCityApiDetailResponse => {
  const detail = createSmallCityDetail(city)

  return {
    data: createStaticSmallCityApiRecord(city),
    summary: {
      festivalCount: detail.festivalCount,
    },
    places: createStaticSmallCityApiPlaceGroups(detail),
  }
}

const applyStaticCatalogParams = (cities: SmallCity[], params: SmallCityApiListParams) => {
  const countryFilteredCities = params.country
    ? cities.filter((city) => city.country === params.country)
    : cities

  return filterSmallCities(countryFilteredCities, params.query ?? '', params.themes ?? [])
}

export const createSmallCityCatalogStateFromAdapterResult = (
  adapterResult: SmallCityApiAdapterResult,
  queryKey: string,
): SmallCityCatalogState => {
  if (adapterResult.cities.length === 0) {
    return {
      status: 'empty',
      source: staticSmallCityCatalogSource,
      cities: [],
      rejectedRecords: adapterResult.rejectedRecords,
      queryKey,
      errorMessage: null,
    }
  }

  return {
    status: 'success',
    source: staticSmallCityCatalogSource,
    cities: adapterResult.cities,
    rejectedRecords: adapterResult.rejectedRecords,
    queryKey,
    errorMessage: null,
  }
}

export const createSmallCityDetailStateFromAdapterResult = (
  adapterResult: SmallCityApiDetailAdapterResult,
  cityId: string,
): SmallCityDetailState => {
  if (!adapterResult.detail) {
    return createSmallCityDetailEmptyState(cityId, adapterResult.rejectedRecords)
  }

  return {
    status: 'success',
    source: staticSmallCityCatalogSource,
    cityId,
    detail: adapterResult.detail,
    rejectedRecords: adapterResult.rejectedRecords,
    errorMessage: null,
  }
}

export const createStaticSmallCityCatalogState = (
  cities: SmallCity[] = smallCities,
  params: SmallCityApiListParams = {},
): SmallCityCatalogState => {
  const queryKey = createSmallCityApiQuery(params)
  const filteredCities = applyStaticCatalogParams(cities, params)
  const response = createStaticSmallCityApiResponse(filteredCities)

  return createSmallCityCatalogStateFromAdapterResult(
    adaptSmallCityApiResponse(response),
    queryKey,
  )
}

export const createStaticSmallCityDetailState = (
  cityId: string,
  cities: SmallCity[] = smallCities,
): SmallCityDetailState => {
  const city = cities.find((candidateCity) => candidateCity.id === cityId)

  if (!city) {
    return createSmallCityDetailEmptyState(cityId, [
      {
        id: cityId || null,
        reason: 'city not found',
      },
    ])
  }

  return createSmallCityDetailStateFromAdapterResult(
    adaptSmallCityDetailApiResponse(createStaticSmallCityDetailApiResponse(city)),
    cityId,
  )
}

export const loadStaticSmallCityCatalog = async (
  params: SmallCityApiListParams = {},
  cities: SmallCity[] = smallCities,
) => createStaticSmallCityCatalogState(cities, params)

export const loadStaticSmallCityDetail = async (
  cityId: string,
  cities: SmallCity[] = smallCities,
) => createStaticSmallCityDetailState(cityId, cities)
