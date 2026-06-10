import { describe, expect, it } from 'vitest'
import {
  adaptSmallCityDetailApiResponse,
  adaptSmallCityApiResponse,
  adaptSmallCityPlacesApiResponse,
  createSmallCityApiQuery,
  defaultSmallCityApiPageSize,
  smallCityApiEndpoints,
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
    expect(result.placesByCategory['관광지']).toHaveLength(2)
    expect(result.placesByCategory['관광지'][0]).toMatchObject({
      id: 'ATTRACTION-250126',
      cityId: 'KR-Gangneung',
      category: '관광지',
      categoryName: '관광지',
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
    expect(result.placesByCategory['관광지'][1]).toMatchObject({
      id: 'FESTIVAL-506743',
      cityId: 'KR-Gangneung',
      category: '관광지',
      categoryName: '축제',
      name: '강릉단오제',
      summary: '축제 기간 20260601 - 20260608',
      latitude: 37.7489,
      longitude: 128.8941,
      theme: '축제',
      themeTags: ['축제'],
      startDate: '20260601',
      endDate: '20260608',
      visitMonths: [6],
    })
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
})
