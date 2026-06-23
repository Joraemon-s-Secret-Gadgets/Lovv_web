import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  filterSmallCities,
  createSmallCityMapMarkers,
  type SmallCityCountry,
  type SmallCityTheme,
  type SmallCityMapMarker,
} from './smallCities'
import {
  createSmallCityCatalogStateFromQueryResult,
  createSmallCityDetailEmptyState,
  createStaticSmallCityDetailState,
} from './smallCityDataSource'
import {
  defaultSmallCityApiPageSize,
  requestListSmallCities,
  createSmallCityApiQuery,
} from '../../shared/api/smallCityApi'

export function useCityMap() {
  const [cityMapCountry, setCityMapCountry] = useState<SmallCityCountry>('KR')
  const [cityMapQuery, setCityMapQuery] = useState('')
  const [selectedSmallCityThemes, setSelectedSmallCityThemes] = useState<SmallCityTheme[]>([])
  const [cityMapPanelMode, setCityMapPanelMode] = useState<'list' | 'detail'>('list')
  const [selectedSmallCityId, setSelectedSmallCityId] = useState('')

  // Small cities Catalog Query (keeps statically available discovery map catalogs)
  const smallCityCatalogQueryKey = createSmallCityApiQuery({ pageSize: defaultSmallCityApiPageSize })
  const smallCityCatalogQuery = useQuery({
    queryKey: ['smallCityCatalog', smallCityCatalogQueryKey],
    queryFn: () => requestListSmallCities({ pageSize: defaultSmallCityApiPageSize }),
  })
  const smallCityCatalogState = useMemo(() => {
    return createSmallCityCatalogStateFromQueryResult(
      smallCityCatalogQuery,
      smallCityCatalogQueryKey,
    )
  }, [smallCityCatalogQuery, smallCityCatalogQueryKey])

  const activeCountrySmallCities = useMemo(
    () => smallCityCatalogState.cities.filter((city) => city.country === cityMapCountry),
    [cityMapCountry, smallCityCatalogState.cities],
  )

  const filteredSmallCities = useMemo(
    () =>
      filterSmallCities(activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes, {
        includeDiscoveryText: false,
      }),
    [activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes],
  )

  const visibleSmallCityMapMarkers = useMemo(
    () => createSmallCityMapMarkers(filteredSmallCities),
    [filteredSmallCities],
  )

  const selectedSmallCity = useMemo(() => {
    if (!selectedSmallCityId || filteredSmallCities.length === 0) {
      return null
    }

    return filteredSmallCities.find((city) => city.id === selectedSmallCityId) ?? null
  }, [filteredSmallCities, selectedSmallCityId])

  const selectedSmallCityDetailState = useMemo(() => {
    if (!selectedSmallCity) {
      return createSmallCityDetailEmptyState(selectedSmallCityId)
    }

    return createStaticSmallCityDetailState(selectedSmallCity.id, smallCityCatalogState.cities)
  }, [selectedSmallCity, selectedSmallCityId, smallCityCatalogState.cities])

  const selectSmallCityMapMarker = (marker: SmallCityMapMarker) => {
    if (selectedSmallCityId === marker.cityId) {
      setSelectedSmallCityId('')
      setCityMapPanelMode('list')
      return
    }

    setSelectedSmallCityId(marker.cityId)
    setCityMapPanelMode('detail')
  }

  const selectCityMapCountry = (country: SmallCityCountry) => {
    setCityMapCountry(country)
    setSelectedSmallCityId('')
    setCityMapPanelMode('list')
  }

  const toggleSmallCityThemeFilter = (theme: SmallCityTheme) => {
    setSelectedSmallCityThemes((currentThemes) =>
      currentThemes.includes(theme)
        ? currentThemes.filter((currentTheme) => currentTheme !== theme)
        : [...currentThemes, theme],
    )
    setCityMapPanelMode('list')
  }

  const clearSmallCityFilters = () => {
    setCityMapQuery('')
    setSelectedSmallCityThemes([])
    setSelectedSmallCityId('')
    setCityMapPanelMode('list')
  }

  return {
    cityMapCountry,
    setCityMapCountry,
    cityMapQuery,
    setCityMapQuery,
    selectedSmallCityThemes,
    setSelectedSmallCityThemes,
    cityMapPanelMode,
    setCityMapPanelMode,
    selectedSmallCityId,
    setSelectedSmallCityId,
    smallCityCatalogQuery,
    smallCityCatalogState,
    activeCountrySmallCities,
    filteredSmallCities,
    visibleSmallCityMapMarkers,
    selectedSmallCity,
    selectedSmallCityDetailState,
    selectSmallCityMapMarker,
    selectCityMapCountry,
    toggleSmallCityThemeFilter,
    clearSmallCityFilters,
  }
}
