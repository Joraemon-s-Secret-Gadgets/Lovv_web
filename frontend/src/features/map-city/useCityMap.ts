/**
 * @file useCityMap.ts
 * @description Custom hook for managing small city map discovery state, catalog queries, filters, and markers.
 * @lastModified 2026-06-23
 */

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
  createSmallCityDetailStateFromQueryResult,
} from './smallCityDataSource'
import {
  defaultSmallCityApiPageSize,
  requestListSmallCities,
  requestGetSmallCityDetail,
  createSmallCityApiQuery,
} from '../../shared/api/smallCityApi'

/**
 * Custom hook to encapsulate small city discovery map logic and catalog querying.
 */
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
  
  // Transform Query result to consistent UI catalog structure
  const smallCityCatalogState = useMemo(() => {
    return createSmallCityCatalogStateFromQueryResult(
      smallCityCatalogQuery,
      smallCityCatalogQueryKey,
    )
  }, [smallCityCatalogQuery, smallCityCatalogQueryKey])

  // Filter cities by the currently active country track (KR vs JP)
  const activeCountrySmallCities = useMemo(
    () => smallCityCatalogState.cities.filter((city) => city.country === cityMapCountry),
    [cityMapCountry, smallCityCatalogState.cities],
  )

  // Apply search text and theme category chips filter
  const filteredSmallCities = useMemo(
    () =>
      filterSmallCities(activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes, {
        includeDiscoveryText: false,
      }),
    [activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes],
  )

  // Map representation structure (pins and coordinate coordinates)
  const visibleSmallCityMapMarkers = useMemo(
    () => createSmallCityMapMarkers(filteredSmallCities),
    [filteredSmallCities],
  )

  // Retrieve the currently selected city detail record
  const selectedSmallCity = useMemo(() => {
    if (!selectedSmallCityId || filteredSmallCities.length === 0) {
      return null
    }

    return filteredSmallCities.find((city) => city.id === selectedSmallCityId) ?? null
  }, [filteredSmallCities, selectedSmallCityId])

  // Selected city detail query (fetches dynamic place groups and details from backend)
  const smallCityDetailQuery = useQuery({
    queryKey: ['smallCityDetail', selectedSmallCityId],
    queryFn: () => requestGetSmallCityDetail(selectedSmallCityId),
    enabled: Boolean(selectedSmallCityId),
  })

  // Compute selected city detailed state (attractions, stats, and related elements)
  const selectedSmallCityDetailState = useMemo(() => {
    if (!selectedSmallCityId) {
      return createSmallCityDetailEmptyState(selectedSmallCityId)
    }

    return createSmallCityDetailStateFromQueryResult(
      smallCityDetailQuery,
      selectedSmallCityId,
    )
  }, [smallCityDetailQuery, selectedSmallCityId])

  // Map markers selection callback
  const selectSmallCityMapMarker = (marker: SmallCityMapMarker) => {
    if (selectedSmallCityId === marker.cityId) {
      setSelectedSmallCityId('')
      setCityMapPanelMode('list')
      return
    }

    setSelectedSmallCityId(marker.cityId)
    setCityMapPanelMode('detail')
  }

  // Country selector update action
  const selectCityMapCountry = (country: SmallCityCountry) => {
    setCityMapCountry(country)
    setSelectedSmallCityId('')
    setCityMapPanelMode('list')
  }

  // Add/remove active theme categories from filter list
  const toggleSmallCityThemeFilter = (theme: SmallCityTheme) => {
    setSelectedSmallCityThemes((currentThemes) =>
      currentThemes.includes(theme)
        ? currentThemes.filter((currentTheme) => currentTheme !== theme)
        : [...currentThemes, theme],
    )
    setCityMapPanelMode('list')
  }

  // Reset all active map filters and selections
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
    smallCityDetailQuery,
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

// EOF: useCityMap.ts
