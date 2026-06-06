import { describe, expect, it } from 'vitest'
import {
  adaptSmallCityApiResponse,
  createSmallCityApiQuery,
  defaultSmallCityApiPageSize,
  smallCityApiEndpoints,
  type SmallCityApiListResponse,
} from './smallCityApi'
import { createSmallCityMapMarkers } from './smallCities'

const createResponse = (overrides: Partial<SmallCityApiListResponse> = {}): SmallCityApiListResponse => ({
  data: [
    {
      id: 'jp-shimanto-001',
      country: 'JP',
      country_label: '일본',
      region: '고치',
      name_ko: '시만토',
      name_local: '四万十',
      latitude: 32.991,
      longitude: 132.933,
      themes: ['자연', '바다', '알수없음'],
      summary: '일본 고치의 시만토는 자연과 바다 분위기가 뚜렷한 소도시입니다.',
      detail: '시만토강, 침하교, 강변 흐름을 기준으로 여행 조건을 좁히기 좋은 후보입니다.',
      highlights: ['시만토강', '침하교', '강변'],
      route_seed: ['시만토강', '침하교', '강변'],
      image_url: null,
      internal_meta: {
        rankingScore: 0.92,
        source: 'city_catalog',
        provider: 'lovv-api',
      },
    },
  ],
  page: {
    page: 1,
    pageSize: 120,
    total: 1,
    hasNext: false,
  },
  ...overrides,
})

describe('small-city API contract adapter', () => {
  it('adapts backend city records into frontend SmallCity records', () => {
    const result = adaptSmallCityApiResponse(createResponse())

    expect(result.rejectedRecords).toHaveLength(0)
    expect(result.cities).toEqual([
      {
        id: 'jp-shimanto-001',
        country: 'JP',
        countryLabel: '일본',
        region: '고치',
        nameKo: '시만토',
        nameLocal: '四万十',
        latitude: 32.991,
        longitude: 132.933,
        themes: ['자연', '바다'],
        summary: '일본 고치의 시만토는 자연과 바다 분위기가 뚜렷한 소도시입니다.',
        detail: '시만토강, 침하교, 강변 흐름을 기준으로 여행 조건을 좁히기 좋은 후보입니다.',
        highlights: ['시만토강', '침하교', '강변'],
        routeSeed: ['시만토강', '침하교', '강변'],
        image: undefined,
      },
    ])
  })

  it('keeps internal metadata out of map marker payloads', () => {
    const result = adaptSmallCityApiResponse(createResponse())
    const markers = createSmallCityMapMarkers(result.cities)

    expect(markers).toEqual([
      {
        id: 'marker-jp-shimanto-001',
        cityId: 'jp-shimanto-001',
        country: 'JP',
        countryLabel: '일본',
        region: '고치',
        label: '시만토',
        localLabel: '四万十',
        latitude: 32.991,
        longitude: 132.933,
      },
    ])
    expect(markers[0]).not.toHaveProperty('themes')
    expect(markers[0]).not.toHaveProperty('routeSeed')
    expect(markers[0]).not.toHaveProperty('internal_meta')
  })

  it('reports rejected records instead of crashing on invalid rows', () => {
    const result = adaptSmallCityApiResponse(
      createResponse({
        data: [
          {
            id: 'bad-city',
            country: 'JP',
            region: '고치',
            name_ko: '시만토',
            latitude: Number.NaN,
            longitude: 132.933,
            themes: ['자연'],
            summary: '설명',
            detail: '상세',
            highlights: ['시만토강'],
            route_seed: ['시만토강'],
          },
        ],
      }),
    )

    expect(result.cities).toHaveLength(0)
    expect(result.rejectedRecords).toEqual([
      {
        id: 'bad-city',
        reason: 'invalid coordinates',
      },
    ])
  })

  it('builds stable list and detail endpoint contracts without secrets', () => {
    expect(smallCityApiEndpoints.list).toBe('/api/small-cities')
    expect(smallCityApiEndpoints.detail('jp/shimanto 001')).toBe('/api/small-cities/jp%2Fshimanto%20001')
    expect(
      createSmallCityApiQuery({
        country: 'JP',
        query: ' 시만토 시장 ',
        themes: ['자연', '바다'],
        page: 2,
        pageSize: 80,
      }),
    ).toBe('country=JP&q=%EC%8B%9C%EB%A7%8C%ED%86%A0+%EC%8B%9C%EC%9E%A5&themes=%EC%9E%90%EC%97%B0%2C%EB%B0%94%EB%8B%A4&page=2&page_size=80')
    expect(createSmallCityApiQuery({})).toBe(`page=1&page_size=${defaultSmallCityApiPageSize}`)
  })
})
