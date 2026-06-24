import { describe, expect, it } from 'vitest'
import {
  smallCities,
  koreanSmallCities,
  japaneseSmallCities,
  smallCityMapBounds,
} from './smallCities'

describe('small-city catalog data validation', () => {
  it('contains exactly 40 Korean small cities', () => {
    expect(koreanSmallCities).toHaveLength(40)
  })

  it('contains exactly 40 Japanese small cities', () => {
    expect(japaneseSmallCities).toHaveLength(40)
  })

  it('contains exactly 80 small cities in total catalog', () => {
    expect(smallCities).toHaveLength(80)
  })

  it('ensures all city IDs are unique and formatted correctly', () => {
    const ids = smallCities.map((city) => city.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(80)

    smallCities.forEach((city) => {
      expect(city.id).toMatch(/^(kr|jp)-\d{3}$/)
      if (city.country === 'KR') {
        expect(city.id.startsWith('kr-')).toBe(true)
      } else {
        expect(city.id.startsWith('jp-')).toBe(true)
      }
    })
  })

  it('ensures all cities have valid coordinates within map boundaries', () => {
    smallCities.forEach((city) => {
      const bounds = smallCityMapBounds[city.country]
      expect(city.latitude).toBeGreaterThanOrEqual(bounds.minLat)
      expect(city.latitude).toBeLessThanOrEqual(bounds.maxLat)
      expect(city.longitude).toBeGreaterThanOrEqual(bounds.minLng)
      expect(city.longitude).toBeLessThanOrEqual(bounds.maxLng)
    })
  })

  it('ensures all city marker labels contain only the city name', () => {
    smallCities.forEach((city) => {
      // nameKo should be a clean city name (no themes, details or hints).
      expect(city.nameKo).toBeDefined()
      expect(city.nameKo.trim()).not.toBe('')
      expect(city.nameKo.length).toBeLessThanOrEqual(10) // Small city names are short.
      expect(city.nameKo).not.toContain('·')
      expect(city.nameKo).not.toContain(' ')
    })
  })
})
