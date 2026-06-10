import { describe, expect, it } from 'vitest'
import {
  createSmallCityCatalogErrorState,
  createSmallCityCatalogLoadingState,
  createStaticSmallCityDetailState,
  createStaticSmallCityApiRecord,
  createStaticSmallCityApiResponse,
  createStaticSmallCityCatalogState,
  loadStaticSmallCityDetail,
  loadStaticSmallCityCatalog,
  staticSmallCityCatalogSource,
} from './smallCityDataSource'
import { smallCities, smallCityPlaceCategories } from './smallCities'

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
    expect(state.cities).toHaveLength(46)
    expect(state.rejectedRecords).toHaveLength(0)
    expect(state.queryKey).toBe('page=1&page_size=120')
  })

  it('supports country, theme, and search params through the static loader', async () => {
    const state = await loadStaticSmallCityCatalog({
      country: 'JP',
      query: '게곤폭포',
      themes: ['자연'],
      pageSize: 80,
    })

    expect(state.status).toBe('success')
    expect(state.queryKey).toBe('country=JP&q=%EA%B2%8C%EA%B3%A4%ED%8F%AD%ED%8F%AC&themes=%EC%9E%90%EC%97%B0&page=1&page_size=80')
    expect(state.cities).toHaveLength(1)
    expect(state.cities[0]).toMatchObject({
      country: 'JP',
      nameKo: '닛코',
      routeSeed: expect.arrayContaining(['게곤폭포']),
    })
  })

  it('creates static city detail state with place groups for Kakao-shaped categories', async () => {
    const gyeongju = smallCities.find((city) => city.nameKo === '경주')
    expect(gyeongju).toBeDefined()

    const state = createStaticSmallCityDetailState(gyeongju!.id)
    const loadedState = await loadStaticSmallCityDetail(gyeongju!.id)

    expect(state.status).toBe('success')
    expect(loadedState.status).toBe('success')
    expect(state.detail?.city.nameKo).toBe('경주')
    expect(Object.keys(state.detail!.placesByCategory)).toEqual(smallCityPlaceCategories)
    smallCityPlaceCategories.forEach((category) => {
      expect(state.detail!.placesByCategory[category]).toHaveLength(1)
      expect(state.detail!.placesByCategory[category][0]).toMatchObject({
        cityId: gyeongju!.id,
        category,
        categoryName: category,
        placeUrl: expect.stringContaining('https://place.map.kakao.com/'),
      })
    })
    expect(state.detail!.placesByCategory['관광지'][0].name).toContain('황리단길')
    expect(state.detail!.placesByCategory['음식점'][0].name).toContain('경주')
    expect(state.detail!.placesByCategory['카페'][0].name).toContain('경주')
    expect(state.detail!.placesByCategory['숙소'][0].name).toContain('경주')
  })

  it('keeps the Korean art filter populated in visible map regions', async () => {
    const state = await loadStaticSmallCityCatalog({
      country: 'KR',
      themes: ['예술'],
      pageSize: 80,
    })

    expect(state.status).toBe('success')
    expect(state.queryKey).toBe('country=KR&themes=%EC%98%88%EC%88%A0&page=1&page_size=80')
    expect(state.cities.map((city) => city.nameKo)).toEqual(expect.arrayContaining(['문경', '평창']))
    expect(state.cities.every((city) => city.themes.includes('예술'))).toBe(true)
  })

  it('keeps static festival data separate from theme-only festival tags', () => {
    const yangyang = smallCities.find((city) => city.nameKo === '양양')
    const jinju = smallCities.find((city) => city.nameKo === '진주')

    expect(yangyang).toBeDefined()
    expect(jinju).toBeDefined()
    expect(yangyang!.themes).toContain('축제')
    expect(yangyang!.festivalCount).toBe(0)

    const jinjuDetail = createStaticSmallCityDetailState(jinju!.id)

    expect(jinju!.festivalCount).toBe(1)
    expect(jinjuDetail.status).toBe('success')
    expect(jinjuDetail.detail?.festivalCount).toBe(1)
    expect(jinjuDetail.detail?.festivals[0].name).toBe('진주남강유등축제')
    expect(jinjuDetail.detail?.placesByCategory['관광지'].some((place) => place.categoryName === '축제')).toBe(true)
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
