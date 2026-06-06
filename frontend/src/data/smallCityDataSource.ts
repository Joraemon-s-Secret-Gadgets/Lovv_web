import {
  adaptSmallCityApiResponse,
  createSmallCityApiQuery,
  defaultSmallCityApiPageSize,
  type SmallCityApiAdapterResult,
  type SmallCityApiListParams,
  type SmallCityApiListResponse,
  type SmallCityApiRecord,
  type SmallCityApiRejectedRecord,
} from './smallCityApi'
import {
  filterSmallCities,
  smallCities,
  type SmallCity,
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

export const loadStaticSmallCityCatalog = async (
  params: SmallCityApiListParams = {},
  cities: SmallCity[] = smallCities,
) => createStaticSmallCityCatalogState(cities, params)
