import { describe, expect, it } from 'vitest'
import {
  createSmallCityCatalogErrorState,
  createSmallCityCatalogLoadingState,
  createStaticSmallCityApiRecord,
  createStaticSmallCityApiResponse,
  createStaticSmallCityCatalogState,
  loadStaticSmallCityCatalog,
  staticSmallCityCatalogSource,
} from './smallCityDataSource'
import { smallCities } from './smallCities'

describe('small-city data source boundary', () => {
  it('wraps the static city catalog as API-shaped records', () => {
    const sampleCity = smallCities.find((city) => city.id === 'jp-001')
    expect(sampleCity).toBeDefined()

    const record = createStaticSmallCityApiRecord(sampleCity!)

    expect(record).toMatchObject({
      id: sampleCity!.id,
      country: sampleCity!.country,
      country_label: sampleCity!.countryLabel,
      region: sampleCity!.region,
      name_ko: sampleCity!.nameKo,
      name_local: sampleCity!.nameLocal,
      themes: sampleCity!.themes,
      route_seed: sampleCity!.routeSeed,
      internal_meta: {
        source: staticSmallCityCatalogSource,
      },
    })
  })

  it('creates a successful catalog state from static data', () => {
    const state = createStaticSmallCityCatalogState()

    expect(state.status).toBe('success')
    expect(state.cities).toHaveLength(80)
    expect(state.rejectedRecords).toHaveLength(0)
    expect(state.queryKey).toBe('page=1&page_size=120')
  })

  it('supports country, theme, and search params through the static loader', async () => {
    const state = await loadStaticSmallCityCatalog({
      country: 'JP',
      query: '시만토강',
      themes: ['자연'],
      pageSize: 80,
    })

    expect(state.status).toBe('success')
    expect(state.queryKey).toBe('country=JP&q=%EC%8B%9C%EB%A7%8C%ED%86%A0%EA%B0%95&themes=%EC%9E%90%EC%97%B0&page=1&page_size=80')
    expect(state.cities).toHaveLength(1)
    expect(state.cities[0]).toMatchObject({
      country: 'JP',
      nameKo: '시만토',
      routeSeed: expect.arrayContaining(['시만토강']),
    })
  })

  it('represents empty, loading, and error states explicitly', () => {
    const emptyState = createStaticSmallCityCatalogState([], { country: 'KR' })
    const loadingState = createSmallCityCatalogLoadingState('country=KR&page=1&page_size=120')
    const errorState = createSmallCityCatalogErrorState('연결을 확인해 주세요.', 'country=KR&page=1&page_size=120')

    expect(emptyState).toMatchObject({
      status: 'empty',
      cities: [],
      errorMessage: null,
    })
    expect(loadingState).toMatchObject({
      status: 'loading',
      cities: [],
      errorMessage: null,
    })
    expect(errorState).toMatchObject({
      status: 'error',
      cities: [],
      errorMessage: '연결을 확인해 주세요.',
    })
  })

  it('keeps static response pagination consistent with returned data', () => {
    const response = createStaticSmallCityApiResponse(smallCities.slice(0, 3))

    expect(response.page).toEqual({
      page: 1,
      pageSize: 120,
      total: 3,
      hasNext: false,
    })
    expect(response.data).toHaveLength(3)
  })
})
