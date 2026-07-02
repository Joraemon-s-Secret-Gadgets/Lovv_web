/**
 * @file CityMapFilters.tsx
 * @description Search text box, country selector tab, and theme chips filters for the city discovery map.
 * @lastModified 2026-06-23
 */

import {
  smallCityCountryOptions,
  type SmallCityCountry,
  type SmallCityTheme,
  type SmallCity,
} from './smallCities'
import { mapFilterThemes } from './mapCityFilters'
import type { SmallCityCatalogState } from './smallCityDataSource'

type CityMapFiltersProps = {
  cityMapCountry: SmallCityCountry
  cityMapQuery: string
  selectedSmallCityThemes: SmallCityTheme[]
  smallCityCatalogState: SmallCityCatalogState
  filteredSmallCities: SmallCity[]
  activeCountryTotalCount: number
  onSelectCountry: (country: SmallCityCountry) => void
  onQueryChange: (query: string) => void
  onClearFilters: () => void
  onToggleThemeFilter: (theme: SmallCityTheme) => void
  onSetPanelMode: (mode: 'list' | 'detail') => void
}

export function CityMapFilters({
  cityMapCountry,
  cityMapQuery,
  selectedSmallCityThemes,
  smallCityCatalogState,
  filteredSmallCities,
  activeCountryTotalCount,
  onSelectCountry,
  onQueryChange,
  onClearFilters,
  onToggleThemeFilter,
  onSetPanelMode,
}: CityMapFiltersProps) {
  const canUseSmallCityCatalog = smallCityCatalogState.status === 'success'
  const selectedCountryOption =
    smallCityCountryOptions.find((option) => option.country === cityMapCountry) ??
    smallCityCountryOptions[0]
  const visibleCountryOptions = smallCityCountryOptions.filter((option) => option.country === 'KR')
  const hasActiveFilters = cityMapQuery.trim().length > 0 || selectedSmallCityThemes.length > 0

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 rounded-[26px] border border-white/70 bg-white/62 p-6 shadow-[0_18px_42px_-32px_rgba(51,39,30,0.22)] backdrop-blur-md max-lg:grid-cols-1 max-sm:p-5">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#A92B10]">
            Small city atlas
          </p>
          <h2
            id="city-map-discovery-title"
            className="mt-3 break-keep text-[34px] font-black leading-10 text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
          >
            가고 싶은 곳 찾아보기
          </h2>
          <p className="mt-3 max-w-[720px] break-keep text-sm font-semibold leading-6 text-[#5E4B42]">
            국가와 도시명으로 지도에서 소도시를 먼저 고르고,
            <br className="hidden md:block" />
            테마는 후보를 좁히는 필터와 선택 이후 일정 소재로 사용합니다.
          </p>
        </div>

        <div
          role="group"
          aria-label="국가 선택"
          className="relative isolate inline-grid min-w-[128px] grid-cols-1 overflow-hidden rounded-full border border-white/70 bg-[#fffffa]/54 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.54),0_12px_28px_-24px_rgba(51,39,30,0.3)] backdrop-blur-sm max-sm:min-w-0"
        >
          {visibleCountryOptions.map((option) => {
            const isSelected = option.country === cityMapCountry

            return (
              <button
                key={option.country}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCountry(option.country)}
                className={`relative z-10 min-h-11 rounded-full border border-transparent bg-transparent px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                  isSelected
                    ? 'cursor-default bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E] shadow-[0_6px_14px_-8px_rgba(243,107,18,0.5)]'
                    : 'text-[#6E5A50] hover:bg-white/30 hover:text-[#33271E]'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4 mt-6 rounded-[24px] border border-white/70 bg-white/64 p-4 shadow-[0_14px_34px_-30px_rgba(51,39,30,0.2)] backdrop-blur-md">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-md:grid-cols-1">
          <label className="min-w-0">
            <span className="sr-only">소도시 검색어</span>
            <input
              value={cityMapQuery}
              onChange={(event) => {
                onQueryChange(event.target.value)
                onSetPanelMode('list')
              }}
              disabled={!canUseSmallCityCatalog}
              placeholder="도시, 지역, 테마 검색"
              className="min-h-12 w-full rounded-[18px] border border-white/70 bg-[#fffffa]/82 px-4 text-sm font-bold text-[#33271E] outline-none transition-all placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#F36B12] focus:bg-white focus:ring-4 focus:ring-[#FF7017]/10"
            />
          </label>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters || !canUseSmallCityCatalog}
            className="inline-flex min-h-12 items-center justify-center rounded-[18px] border border-white/70 bg-[#fffffa]/72 px-5 text-sm font-black text-[#33271E] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFE0CA] disabled:cursor-default disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-[#fffffa]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            필터 초기화
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="소도시 테마 필터">
            {mapFilterThemes.map((theme) => {
              const isSelected = selectedSmallCityThemes.includes(theme)

              return (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={!canUseSmallCityCatalog}
                  onClick={() => onToggleThemeFilter(theme)}
                  className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-[12px] font-black leading-4 text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                    isSelected
                      ? 'border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E] shadow-sm'
                      : 'border-white/70 bg-[#fffffa]/72 hover:-translate-y-0.5 hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'
                  }`}
                >
                  #{theme}
                </button>
              )
            })}
          </div>
          <p className="shrink-0 break-keep text-[12px] font-black text-[#6E5A50]">
            {selectedCountryOption.label} {filteredSmallCities.length}곳 / 전체 {activeCountryTotalCount}곳
          </p>
        </div>
      </div>
    </>
  )
}
