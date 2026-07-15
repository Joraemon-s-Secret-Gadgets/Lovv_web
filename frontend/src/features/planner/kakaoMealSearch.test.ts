import { afterEach, describe, expect, it } from 'vitest'
import { searchKakaoMealPlaces } from './kakaoMealSearch'

const createRawPlaces = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `place-${index + 1}`,
    place_name: `테스트 맛집 ${index + 1}`,
    road_address_name: `강원특별자치도 테스트로 ${index + 1}`,
    x: String(129.1 + index / 1000),
    y: String(37.5 + index / 1000),
  }))

describe('searchKakaoMealPlaces', () => {
  afterEach(() => {
    delete window.kakao
  })

  it('returns the first ten valid Kakao candidates', async () => {
    const results = createRawPlaces(11)
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        services: {
          Places: class {
            keywordSearch(
              _query: string,
              callback: (places: typeof results, status: 'OK' | 'ZERO_RESULT' | 'ERROR') => void,
            ) {
              callback(results, 'OK')
            }
          },
        },
      },
    }

    const result = await searchKakaoMealPlaces('후보 열 개 제한 테스트', 'test-key')

    expect(result.status).toBe('ready')
    expect(result.places).toHaveLength(10)
    expect(result.places.map((place) => place.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `place-${index + 1}`),
    )
    expect(result.places.some((place) => place.id === 'place-11')).toBe(false)
  })
})
