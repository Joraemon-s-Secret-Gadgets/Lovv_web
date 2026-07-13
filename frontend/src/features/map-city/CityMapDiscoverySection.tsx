/**
 * @file CityMapDiscoverySection.tsx
 * @description Main entry panel coordinating filters, list, details view, and the interactive Google Map.
 * @lastModified 2026-06-23
 */

import type { RefObject } from 'react'
import type { PreferenceProfile } from '../../shared/types/app'
import { SmallCityGoogleMap } from './SmallCityGoogleMap'
import {
  smallCityCountryOptions,
  type SmallCity,
  type SmallCityCountry,
  type SmallCityMapMarker,
  type SmallCityTheme,
} from './smallCities'
import type { SmallCityCatalogState, SmallCityDetailState } from './smallCityDataSource'
import { CityMapFilters } from './CityMapFilters'
import { CityMapListPanel } from './CityMapListPanel'
import { CityMapDetailPanel } from './CityMapDetailPanel'

type CityMapDiscoverySectionProps = {
  cityMapDetailPanelRef: RefObject<HTMLDivElement | null>
  cityMapCountry: SmallCityCountry
  cityMapQuery: string
  selectedSmallCityThemes: SmallCityTheme[]
  selectedPreferenceProfile: PreferenceProfile
  smallCityCatalogState: SmallCityCatalogState
  activeCountrySmallCities: SmallCity[]
  filteredSmallCities: SmallCity[]
  visibleSmallCityMapMarkers: SmallCityMapMarker[]
  selectedSmallCity: SmallCity | null
  selectedSmallCityDetailState: SmallCityDetailState
  cityMapPanelMode: 'list' | 'detail'
  onSelectCountry: (country: SmallCityCountry) => void
  onQueryChange: (query: string) => void
  onClearFilters: () => void
  onToggleThemeFilter: (theme: SmallCityTheme) => void
  onSelectCityFromList: (city: SmallCity) => void
  onSelectMapMarker: (marker: SmallCityMapMarker) => void
  onSetPanelMode: (mode: 'list' | 'detail') => void
  onOpenPlanner: (city: SmallCity) => void
}

export function CityMapDiscoverySection({
  cityMapDetailPanelRef,
  cityMapCountry,
  cityMapQuery,
  selectedSmallCityThemes,
  selectedPreferenceProfile,
  smallCityCatalogState,
  activeCountrySmallCities,
  filteredSmallCities,
  visibleSmallCityMapMarkers,
  selectedSmallCity,
  selectedSmallCityDetailState,
  cityMapPanelMode,
  onSelectCountry,
  onQueryChange,
  onClearFilters,
  onToggleThemeFilter,
  onSelectCityFromList,
  onSelectMapMarker,
  onSetPanelMode,
  onOpenPlanner,
}: CityMapDiscoverySectionProps) {
  const hasSmallCityCatalogError = smallCityCatalogState.status === 'error'
  const isSmallCityCatalogLoading = smallCityCatalogState.status === 'loading'
  const selectedCountryOption =
    smallCityCountryOptions.find((option) => option.country === cityMapCountry) ??
    smallCityCountryOptions[0]
  const activeCountryTotalCount = activeCountrySmallCities.length

  const cityCatalogStatusMessage = isSmallCityCatalogLoading
    ? {
        title: '소도시 데이터를 불러오는 중입니다.',
        body: '국가별 후보를 정리한 뒤 지도에 표시합니다.',
      }
    : hasSmallCityCatalogError
      ? {
          title: '소도시 데이터를 불러오지 못했습니다.',
          body: smallCityCatalogState.errorMessage,
        }
      : smallCityCatalogState.status === 'empty'
        ? {
            title: '표시할 소도시 데이터가 없습니다.',
            body: '데이터 소스가 준비되면 다시 확인할 수 있습니다.',
          }
        : null

  const isCityMapListPanel = cityMapPanelMode === 'list' || !selectedSmallCity

  return (
    <section
      id="city-map-discovery"
      data-testid="city-map-discovery-section"
      aria-labelledby="city-map-discovery-title"
      className="lovv-page-map lovv-map-page mx-auto max-w-[1500px] px-16 pb-16 pt-6 max-lg:px-8 max-sm:px-5"
    >
      <div className="lovv-map-shell overflow-hidden rounded-[22px] border border-white/70 shadow-[0_24px_60px_-42px_rgba(51,39,30,0.28)] backdrop-blur-2xl">
        <div
          data-testid="city-map-layout-shell"
          className="grid grid-cols-[minmax(0,1.7fr)_minmax(380px,0.82fr)] gap-0 xl:h-[min(900px,calc(100vh-112px))] xl:min-h-[760px] xl:overflow-hidden max-xl:grid-cols-1"
        >
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#fffffa]/26 p-5 backdrop-blur-md max-xl:overflow-visible max-sm:p-4">
            <CityMapFilters
              cityMapCountry={cityMapCountry}
              cityMapQuery={cityMapQuery}
              selectedSmallCityThemes={selectedSmallCityThemes}
              smallCityCatalogState={smallCityCatalogState}
              filteredSmallCities={filteredSmallCities}
              activeCountryTotalCount={activeCountryTotalCount}
              onSelectCountry={onSelectCountry}
              onQueryChange={onQueryChange}
              onClearFilters={onClearFilters}
              onToggleThemeFilter={onToggleThemeFilter}
              onSetPanelMode={onSetPanelMode}
            />

            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div
                  data-testid="city-map-marker-layer"
                  className="lovv-city-map-surface relative min-h-[560px] flex-1 overflow-hidden rounded-[20px] border border-white/60 bg-[#fffffa]/40 shadow-[0_18px_48px_-36px_rgba(51,39,30,0.22)] backdrop-blur-sm xl:min-h-0 max-xl:h-[620px] max-sm:h-[440px] max-sm:min-h-[440px]"
                  role="region"
                  aria-label={`${selectedCountryOption.label} 소도시 지도. 현재 조건에 맞는 도시명 마커 ${visibleSmallCityMapMarkers.length}개.`}
                >
                  <SmallCityGoogleMap
                    markers={visibleSmallCityMapMarkers}
                    country={cityMapCountry}
                    countryLabel={selectedCountryOption.label}
                    selectedMarkerCityId={selectedSmallCity?.id ?? null}
                    onSelectMarker={onSelectMapMarker}
                  />
                  <div className="absolute left-4 top-4 z-10 max-w-[280px] rounded-[12px] border border-white/70 bg-white/86 px-3 py-2 text-[11px] font-black text-[#33271E] shadow-[0_12px_24px_-20px_rgba(51,39,30,0.2)] backdrop-blur-md">
                    <p>{selectedCountryOption.description}</p>
                    <p className="mt-1 text-[#6E5A50]">도시명 마커 {visibleSmallCityMapMarkers.length}개</p>
                  </div>
                  {cityCatalogStatusMessage ? (
                    <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
                      <div className="rounded-[12px] border border-transparent bg-white/90 px-5 py-4 shadow-[0_12px_28px_-20px_rgba(51,39,30,0.28)]">
                        <p className="break-keep text-sm font-black text-[#33271E]">
                          {cityCatalogStatusMessage.title}
                        </p>
                        <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                          {cityCatalogStatusMessage.body}
                        </p>
                      </div>
                    </div>
                  ) : filteredSmallCities.length === 0 ? (
                    <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
                      <div className="rounded-[12px] border border-transparent bg-white/90 px-5 py-4 shadow-[0_12px_28px_-20px_rgba(51,39,30,0.28)]">
                        <p className="break-keep text-sm font-black text-[#33271E]">
                          조건에 맞는 소도시가 없습니다.
                        </p>
                        <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                          검색어를 줄이거나 테마 필터를 초기화해 주세요.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <aside
            data-testid="city-map-detail-panel"
            aria-label={isCityMapListPanel ? '소도시 목록 패널' : selectedSmallCity ? undefined : '선택 소도시 상세 정보'}
            aria-labelledby={
              isCityMapListPanel
                ? 'city-map-results-title'
                : selectedSmallCity
                  ? 'city-map-selected-title'
                  : undefined
            }
            aria-live="polite"
            className="min-h-0 min-w-0 overflow-hidden border-l border-white/60 bg-[#FFF0E4]/54 p-6 backdrop-blur-xl max-xl:overflow-visible max-xl:rounded-b-[28px] max-xl:border-l-0 max-xl:border-t max-sm:p-5"
          >
            <div
              ref={cityMapDetailPanelRef}
              data-testid="city-map-detail-sticky-content"
              className="lovv-map-side-panel h-full min-h-0 overflow-y-auto rounded-[18px] p-3 pr-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.48)]"
            >
              {isCityMapListPanel ? (
                <CityMapListPanel
                  filteredSmallCities={filteredSmallCities}
                  activeCountryTotalCount={activeCountryTotalCount}
                  selectedSmallCity={selectedSmallCity}
                  onSelectCityFromList={onSelectCityFromList}
                />
              ) : selectedSmallCity ? (
                <CityMapDetailPanel
                  selectedSmallCity={selectedSmallCity}
                  selectedSmallCityDetailState={selectedSmallCityDetailState}
                  selectedPreferenceProfile={selectedPreferenceProfile}
                  onSetPanelMode={onSetPanelMode}
                  onOpenPlanner={onOpenPlanner}
                />
              ) : (
                <div className="flex min-h-[320px] flex-col justify-center">
                  <p className="break-keep text-lg font-black leading-7 text-[#33271E]">
                    선택할 수 있는 소도시가 없습니다.
                  </p>
                  <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6E5A50]">
                    필터를 초기화하면 다시 상세 정보를 볼 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
