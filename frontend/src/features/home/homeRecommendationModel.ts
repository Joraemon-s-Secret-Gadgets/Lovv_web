import type {
  MonthlyRecommendation,
  Preference,
  PreferenceProfile,
  ThemeId,
} from '../../shared/types/app'
import type { SmallCity, SmallCityFestival, SmallCityTheme } from '../map-city/smallCities'
import { preferences } from '../onboarding/preferenceModel'
import { monthlyRecommendations } from './homeContent'

const monthlyRecommendationLimit = 6

const themeKeywordMap: Record<ThemeId, SmallCityTheme[]> = {
  healing_rest: ['온천', '산책'],
  sea_coast: ['바다', '자연'],
  history_tradition: ['전통', '축제', '산책'],
  food_local: ['미식', '축제'],
  nature_trekking: ['자연', '산책'],
  art_sense: ['예술', '바다', '전통'],
}

const monthlyTitleMap: Record<ThemeId, (cityName: string, month: number) => string> = {
  healing_rest: (cityName, month) => `${cityName}에서 쉬어가는 ${month}월`,
  sea_coast: (cityName, month) => `${cityName}에서 만나는 ${month}월 바다`,
  history_tradition: (cityName, month) => `${cityName}의 오래된 길을 걷는 ${month}월`,
  food_local: (cityName, month) => `${cityName} 로컬 식탁을 따라가는 ${month}월`,
  nature_trekking: (cityName, month) => `${cityName}의 계절을 걷는 ${month}월`,
  art_sense: (cityName, month) => `${cityName}의 장면을 기록하는 ${month}월`,
}

const normalizeMonth = (month: number) => Math.min(12, Math.max(1, Math.trunc(month)))

export const getSystemRecommendationMonth = (now = new Date()) => now.getMonth() + 1

const parseMonthFromDate = (value?: string) => {
  if (!value) {
    return null
  }

  const dateMatch = value.match(/^\d{4}[-.](\d{1,2})[-.]\d{1,2}/)

  if (!dateMatch) {
    return null
  }

  const month = Number(dateMatch[1])

  return month >= 1 && month <= 12 ? month : null
}

const festivalMatchesMonth = (festival: SmallCityFestival, month: number) => {
  if (festival.visitMonths?.includes(month)) {
    return true
  }

  const startMonth = parseMonthFromDate(festival.startDate)
  const endMonth = parseMonthFromDate(festival.endDate)

  if (startMonth === month || endMonth === month) {
    return true
  }

  if (startMonth && endMonth && startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth
  }

  return false
}

const getThemeOrder = (selectedPreferenceProfile: PreferenceProfile) => {
  const knownThemeIds = preferences.map((preference) => preference.themeId)
  const selectedThemeIds = selectedPreferenceProfile.selectedThemeIds.filter((themeId) =>
    knownThemeIds.includes(themeId),
  )

  return [
    ...selectedThemeIds,
    ...knownThemeIds.filter((themeId) => !selectedThemeIds.includes(themeId)),
  ].slice(0, monthlyRecommendationLimit)
}

const getCityThemeMatches = (city: SmallCity, themeId: ThemeId) => {
  const keywords = themeKeywordMap[themeId]

  return city.themes.filter((theme) => keywords.includes(theme))
}

const scoreCity = (city: SmallCity, themeId: ThemeId, month: number, usedCityIds: Set<string>) => {
  if (usedCityIds.has(city.id)) {
    return -1
  }

  const themeMatches = getCityThemeMatches(city, themeId)
  const monthFestivalCount =
    city.festivals?.filter((festival) => festivalMatchesMonth(festival, month)).length ?? 0
  const festivalCount = city.festivalCount ?? city.festivals?.length ?? 0

  return (
    themeMatches.length * 24 +
    monthFestivalCount * 34 +
    Math.min(festivalCount, 4) * 3 +
    (city.image ? 2 : 0)
  )
}

const createPreferenceForCity = (preference: Preference, city: SmallCity): Preference => ({
  ...preference,
  cityPair: `${city.nameKo} · ${city.region}`,
  routeHint: city.routeSeed.length > 0 ? city.routeSeed.slice(0, 2).join(' · ') : preference.routeHint,
})

const createCityRecommendation = (
  city: SmallCity,
  preference: Preference,
  month: number,
): MonthlyRecommendation => {
  const themeMatches = getCityThemeMatches(city, preference.themeId)
  const hasMonthFestival =
    city.festivals?.some((festival) => festivalMatchesMonth(festival, month)) ?? false
  const primaryTheme = themeMatches[0] ?? city.themes[0]
  const badgeThemes = city.themes.length > 0 ? city.themes.slice(0, 2) : preference.tag.split('·')

  return {
    id: `monthly-${month}-${preference.themeId}-${city.id}`,
    preference: createPreferenceForCity(preference, city),
    title: monthlyTitleMap[preference.themeId](city.nameKo, month),
    summary: city.summary || city.detail || `${city.region} ${city.nameKo}의 계절감이 맞는 소도시를 추천합니다.`,
    badge: badgeThemes.join('·'),
    image: city.image ?? null,
    themes: badgeThemes,
    cityId: city.id,
    cityName: city.nameKo,
    region: city.region,
    month,
    timingTag: hasMonthFestival
      ? `${month}월 축제`
      : primaryTheme
        ? `${month}월 ${primaryTheme}`
        : `${month}월 추천`,
    source: 'api',
  }
}

export const buildMonthlyThemeRecommendations = ({
  cities,
  selectedPreferenceProfile,
  month = getSystemRecommendationMonth(),
  fallbackRecommendations = monthlyRecommendations,
}: {
  cities: SmallCity[]
  selectedPreferenceProfile: PreferenceProfile
  month?: number
  fallbackRecommendations?: MonthlyRecommendation[]
}) => {
  const currentMonth = normalizeMonth(month)
  const usableCities = cities.filter((city) => city.country === selectedPreferenceProfile.countryTrack)

  if (usableCities.length === 0) {
    return fallbackRecommendations
  }

  const usedCityIds = new Set<string>()
  const recommendations = getThemeOrder(selectedPreferenceProfile)
    .map((themeId) => {
      const preference = preferences.find((item) => item.themeId === themeId)

      if (!preference) {
        return null
      }

      const bestCity = usableCities
        .map((city, index) => ({
          city,
          score: scoreCity(city, themeId, currentMonth, usedCityIds),
          index,
        }))
        .filter(({ score }) => score >= 0)
        .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.city

      if (!bestCity) {
        return null
      }

      usedCityIds.add(bestCity.id)

      return createCityRecommendation(bestCity, preference, currentMonth)
    })
    .filter((recommendation): recommendation is MonthlyRecommendation => Boolean(recommendation))

  return recommendations.length > 0 ? recommendations : fallbackRecommendations
}
