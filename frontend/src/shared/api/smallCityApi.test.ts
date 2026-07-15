/**
 * @file smallCityApi.test.ts
 * @description Tests for small-city pagination, details, and planner data mapping.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  adaptSmallCityDetailApiResponse,
  adaptSmallCityApiResponse,
  adaptSmallCityPlacesApiResponse,
  createSmallCityApiQuery,
  defaultSmallCityApiPageSize,
  smallCityApiEndpoints,
  requestGetSmallCityDetail,
  requestGetSmallCityPlaces,
  requestListSmallCities,
  type SmallCityApiDetailResponse,
  type SmallCityApiListResponse,
  type SmallCityApiPlacesResponse,
} from './smallCityApi'
import { createSmallCityMapMarkers, smallCityPlaceCategories } from '../../features/map-city/smallCities'

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
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('API network failure mock')
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

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
        festivals: [],
        festivalCount: 0,
      },
    ])
  })

  it('corrects fixed 은/는 particles in backend city summaries', () => {
    const result = adaptSmallCityApiResponse(
      createResponse({
        data: [
          {
            ...createResponse().data[0],
            id: 'KR-Hwaseong',
            country: 'KR',
            region: '경기도',
            name_ko: '화성',
            name_local: '화성시',
            summary: '경기도 화성는 전통·자연 여행 후보가 모여 있는 소도시입니다.',
          },
        ],
      }),
    )

    expect(result.cities[0].summary).toBe(
      '경기도 화성은 전통·자연 여행 후보가 모여 있는 소도시입니다.',
    )
  })

  it('accepts both camelCase and snake_case city image fields', () => {
    const result = adaptSmallCityApiResponse(
      createResponse({
        data: [
          {
            ...createResponse().data[0],
            imageUrl: 'https://example.com/camel-city.jpg',
            image_url: 'https://example.com/snake-city.jpg',
          },
          {
            ...createResponse().data[0],
            id: 'jp-shimanto-002',
            imageUrl: null,
            image_url: 'https://example.com/snake-only-city.jpg',
          },
        ],
      }),
    )

    expect(result.rejectedRecords).toHaveLength(0)
    expect(result.cities[0].image).toBe('https://example.com/camel-city.jpg')
    expect(result.cities[1].image).toBe('https://example.com/snake-only-city.jpg')
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

  it('adapts city detail and categorized place records without leaking provider metadata', () => {
    const detailResponse: SmallCityApiDetailResponse = {
      data: createResponse().data[0],
      places: {
        관광지: [
          {
            id: 'tour-shimanto-river',
            city_id: 'jp-shimanto-001',
            category: '관광지',
            name: '시만토강',
            summary: '시만토의 자연 흐름을 먼저 잡는 강변 산책지입니다.',
            address_name: '고치현 시만토시',
            latitude: 32.991,
            longitude: 132.933,
            kakao_place_id: 'kakao-tour-1',
            place_url: 'https://place.map.kakao.com/kakao-tour-1',
          },
        ],
        음식점: [],
        카페: [
          {
            placeId: '26338954',
            category: 'CE7',
            categoryName: '카페',
            name: '시만토 로컬 카페',
            address: '고치현 시만토시',
            roadAddress: '고치현 시만토시 강변로',
            lat: '32.992',
            lng: '132.934',
            phone: '0880-00-0000',
            placeUrl: 'https://place.map.kakao.com/26338954',
          },
        ],
        숙소: [],
      },
    }

    const result = adaptSmallCityDetailApiResponse(detailResponse)

    expect(result.rejectedRecords).toHaveLength(0)
    expect(result.detail?.city.id).toBe('jp-shimanto-001')
    expect(Object.keys(result.detail!.placesByCategory)).toEqual(smallCityPlaceCategories)
    expect(result.detail!.placesByCategory['관광지'][0]).toMatchObject({
      cityId: 'jp-shimanto-001',
      category: '관광지',
      name: '시만토강',
      summary: '시만토의 자연 흐름을 먼저 잡는 강변 산책지입니다.',
    })
    expect(result.detail!.placesByCategory['관광지'][0]).not.toHaveProperty('kakao_place_id')
    expect(result.detail!.placesByCategory['관광지'][0]).not.toHaveProperty('place_url')
    expect(result.detail!.placesByCategory['카페'][0]).toMatchObject({
      id: '26338954',
      cityId: 'jp-shimanto-001',
      category: '카페',
      categoryCode: 'CE7',
      categoryName: '카페',
      name: '시만토 로컬 카페',
      addressName: '고치현 시만토시',
      roadAddressName: '고치현 시만토시 강변로',
      phone: '0880-00-0000',
      placeUrl: 'https://place.map.kakao.com/26338954',
      latitude: 32.992,
      longitude: 132.934,
    })
  })

  it('adapts backend S3 raw city places response into frontend place groups', () => {
    const placesResponse: SmallCityApiPlacesResponse = {
      cityId: 'KR-Gangneung',
      cityName: '강릉',
      summary: {
        attractionCount: 1,
        festivalCount: 1,
        visitorStatisticsCount: 12,
      },
      attractions: [
        {
          placeId: 'ATTRACTION-250126',
          type: 'attraction',
          contentId: '250126',
          title: '오죽헌',
          description: '강릉의 전통과 산책 흐름을 함께 잡는 관광지입니다.',
          address: '강원특별자치도 강릉시 율곡로3139번길 24',
          phone: '033-660-3301',
          imageUrl: 'https://example.com/ojukheon.jpg',
          latitude: 37.7794,
          longitude: 128.8782,
          theme: '전통',
          themeTags: ['전통', '자연'],
        },
      ],
      festivals: [
        {
          placeId: 'FESTIVAL-506743',
          type: 'festival',
          contentId: '506743',
          title: '강릉단오제',
          address: '강원특별자치도 강릉시 단오장길 1',
          latitude: '37.7489',
          longitude: '128.8941',
          theme: '축제',
          themeTags: ['축제'],
          startDate: '20260601',
          endDate: '20260608',
          visitMonths: [6],
        },
      ],
    }

    const result = adaptSmallCityPlacesApiResponse(placesResponse)

    expect(result.rejectedRecords).toHaveLength(0)
    expect(result.festivalCount).toBe(1)
    expect(result.festivals).toMatchObject([
      {
        id: 'FESTIVAL-506743',
        cityId: 'KR-Gangneung',
        name: '강릉단오제',
        visitMonths: [6],
      },
    ])
    expect(result.placesByCategory['관광지']).toHaveLength(1)
    expect(result.placesByCategory['관광지'][0]).toMatchObject({
      id: 'ATTRACTION-250126',
      cityId: 'KR-Gangneung',
      category: '관광지',
      categoryName: '관광지',
      contentId: '250126',
      name: '오죽헌',
      summary: '강릉의 전통과 산책 흐름을 함께 잡는 관광지입니다.',
      addressName: '강원특별자치도 강릉시 율곡로3139번길 24',
      phone: '033-660-3301',
      imageUrl: 'https://example.com/ojukheon.jpg',
      latitude: 37.7794,
      longitude: 128.8782,
      theme: '전통',
      themeTags: ['전통', '자연'],
    })
    expect(result.placesByCategory['관광지'].some((place) => place.categoryName === '축제')).toBe(false)
    expect(result.placesByCategory['음식점']).toHaveLength(0)
    expect(result.placesByCategory['카페']).toHaveLength(0)
    expect(result.placesByCategory['숙소']).toHaveLength(0)
  })

  it('builds stable list, detail, and place endpoint contracts without secrets', () => {
    expect(smallCityApiEndpoints.list).toBe('/api/small-cities')
    expect(smallCityApiEndpoints.detail('jp/shimanto 001')).toBe('/api/small-cities/jp%2Fshimanto%20001')
    expect(smallCityApiEndpoints.places('jp/shimanto 001')).toBe('/api/small-cities/jp%2Fshimanto%20001/places')
    expect(smallCityApiEndpoints).not.toHaveProperty('searchPlaces')
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

  it('loads every deployed city page for the discovery catalog', async () => {
    const firstCity = createResponse().data[0]
    const secondCity = {
      ...firstCity,
      id: 'kr-gangneung-001',
      country: 'KR' as const,
      country_label: '한국' as const,
      region: '강원',
      name_ko: '강릉',
      name_local: '강릉',
    }
    const fetchImpl = vi.fn(async (input: string) => {
      const page = new URL(input, 'https://api.lovv.test').searchParams.get('page')
      const payload = page === '2'
        ? createResponse({
            data: [secondCity],
            page: { page: 2, pageSize: 120, total: 121, hasNext: false },
          })
        : createResponse({
            page: { page: 1, pageSize: 120, total: 121, hasNext: true },
          })

      return {
        ok: true,
        status: 200,
        json: async () => payload,
      }
    })

    const result = await requestListSmallCities({}, {
      baseUrl: 'https://api.lovv.test',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[0][0]).toContain('page=1')
    expect(fetchImpl.mock.calls[1][0]).toContain('page=2')
    expect(result.cities.map((city) => city.id)).toEqual([
      'jp-shimanto-001',
      'kr-gangneung-001',
    ])
    expect(result.page).toEqual({ page: 1, pageSize: 2, total: 121, hasNext: false })
  })

  it('keeps explicit page requests scoped to one page', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => createResponse({
        page: { page: 1, pageSize: 120, total: 235, hasNext: true },
      }),
    }))

    const result = await requestListSmallCities({ page: 1 }, {
      baseUrl: 'https://api.lovv.test',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(result.page).toEqual({ page: 1, pageSize: 120, total: 235, hasNext: true })
  })

  it('falls back to static catalog detail when live API fails', async () => {
    const result = await requestGetSmallCityDetail('kr-001')
    expect(result.detail).not.toBeNull()
    expect(result.detail?.city.id).toBe('kr-001')
    expect(result.detail?.city.nameKo).toBe('아산')
  })

  it('falls back to static places when live API fails', async () => {
    const result = await requestGetSmallCityPlaces('kr-001')
    expect(result.placesByCategory['관광지']).toHaveLength(1)
    expect(result.placesByCategory['관광지'][0].name).toContain('산책')
  })
})

// EOF: smallCityApi.test.ts
