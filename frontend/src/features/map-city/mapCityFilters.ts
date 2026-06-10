import type { SmallCityTheme } from './smallCities'

export const mapFilterThemes: SmallCityTheme[] = ['온천', '바다', '미식', '전통', '자연', '예술']

const mapFilterThemeSet = new Set<SmallCityTheme>(mapFilterThemes)

export const getVisibleMapThemes = (themes: SmallCityTheme[]) =>
  themes.filter((theme) => mapFilterThemeSet.has(theme))
