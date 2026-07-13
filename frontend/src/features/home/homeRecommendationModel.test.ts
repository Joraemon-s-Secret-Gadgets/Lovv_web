import { describe, expect, it } from 'vitest'
import type { PreferenceProfile } from '../../shared/types/app'
import type { SmallCity } from '../map-city/smallCities'
import {
  buildMonthlyThemeRecommendations,
  getSystemRecommendationMonth,
} from './homeRecommendationModel'

const preferenceProfile: PreferenceProfile = {
  version: 2,
  countryTrack: 'KR',
  selectedThemeIds: ['sea_coast'],
  source: 'onboarding',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const createSmallCity = (override: Partial<SmallCity>): SmallCity => ({
  id: 'kr-donghae',
  country: 'KR',
  countryLabel: '한국',
  region: '강원',
  nameKo: '동해시',
  latitude: 37.5248,
  longitude: 129.1143,
  themes: ['바다', '자연'],
  summary: '해안 산책과 여름 축제가 어울리는 소도시입니다.',
  detail: '동해의 바다와 로컬 장면을 연결합니다.',
  highlights: ['묵호항', '무릉계곡'],
  routeSeed: ['묵호항', '무릉계곡'],
  image: 'https://example.com/donghae.jpg',
  festivals: [
    {
      id: 'donghae-festival',
      cityId: 'kr-donghae',
      name: '동해 여름 축제',
      summary: '7월에 열리는 지역 축제입니다.',
      visitMonths: [7],
    },
  ],
  festivalCount: 1,
  ...override,
})

describe('homeRecommendationModel', () => {
  it('uses the current system month for recommendation labels', () => {
    expect(getSystemRecommendationMonth(new Date('2026-07-01T00:00:00+09:00'))).toBe(7)
  })

  it('builds July theme recommendations from live small city data', () => {
    const recommendations = buildMonthlyThemeRecommendations({
      cities: [
        createSmallCity({ id: 'kr-asan', nameKo: '아산', region: '충남', themes: ['온천'] }),
        createSmallCity({}),
      ],
      selectedPreferenceProfile: preferenceProfile,
      month: 7,
    })

    expect(recommendations[0]).toMatchObject({
      cityId: 'kr-donghae',
      cityName: '동해시',
      month: 7,
      timingTag: '7월 축제',
      source: 'api',
    })
    expect(recommendations[0].preference.cityPair).toBe('동해시 · 강원')
  })
})
