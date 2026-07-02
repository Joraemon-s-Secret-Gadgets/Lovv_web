/**
 * @file CityMapListPanel.tsx
 * @description List panel rendering search result cards of small cities when viewing results.
 * @lastModified 2026-06-23
 */

import { type SmallCity } from './smallCities'
import { getVisibleMapThemes } from './mapCityFilters'

type CityMapListPanelProps = {
  filteredSmallCities: SmallCity[]
  activeCountryTotalCount: number
  selectedSmallCity: SmallCity | null
  onSelectCityFromList: (city: SmallCity) => void
}

export function CityMapListPanel({
  filteredSmallCities,
  activeCountryTotalCount,
  selectedSmallCity,
  onSelectCityFromList,
}: CityMapListPanelProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white/66 px-4 py-3 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.2)] backdrop-blur-sm">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
            Result list
          </p>
          <h3
            id="city-map-results-title"
            className="mt-1 break-keep text-[22px] font-black leading-7 text-[#33271E] max-sm:text-xl max-sm:leading-7"
          >
            표시된 소도시
          </h3>
        </div>
        <span className="rounded-full border border-white/50 bg-[#fffffa]/80 px-3 py-1 text-[12px] font-black text-[#33271E] shadow-sm">
          {filteredSmallCities.length} / {activeCountryTotalCount}
        </span>
      </div>

      {filteredSmallCities.length > 0 ? (
        <ol
          aria-labelledby="city-map-results-title"
          data-testid="city-map-result-list"
          className="mt-3 grid gap-2"
        >
          {filteredSmallCities.map((city) => {
            const isSelected = city.id === selectedSmallCity?.id
            const visibleThemes = getVisibleMapThemes(city.themes)

            return (
              <li key={`result-${city.id}`}>
                <button
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectCityFromList(city)}
                  className={`min-h-[64px] w-full rounded-[16px] border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                    isSelected
                      ? 'border-[#F3B489]/70 bg-gradient-to-tr from-[#FFE0CA]/96 to-[#fffffa]/78 shadow-[0_16px_30px_-24px_rgba(51,39,30,0.3)]'
                      : 'border-white/60 bg-white/58 shadow-sm hover:-translate-y-0.5 hover:border-[#F3B489]/60 hover:bg-[#fffffa]/78 hover:shadow-[0_14px_28px_-24px_rgba(51,39,30,0.24)]'
                  }`}
                >
                  <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="min-w-0">
                      <span className="block break-keep text-sm font-black leading-5 text-[#33271E]">
                        {city.nameKo}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] font-semibold leading-5 text-[#6E5A50]">
                        {city.countryLabel} · {city.region}
                        {city.nameLocal ? ` · ${city.nameLocal}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {visibleThemes.slice(0, 2).map((theme) => (
                        <span
                          key={`${city.id}-list-${theme}`}
                          className="rounded-full border border-white/60 bg-[#FFF8F6]/90 px-2 py-0.5 text-[10px] font-black text-[#6E5A50]"
                        >
                          #{theme}
                        </span>
                      ))}
                      <span className="rounded-full border border-white/70 bg-[#fffffa]/88 px-2.5 py-1 text-[10px] font-black text-[#A92B10] shadow-sm">
                        보기
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="mt-5 rounded-[12px] border border-white/40 bg-white/50 px-4 py-5 shadow-sm">
          <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
            표시할 결과가 없습니다.
          </p>
          <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
            검색어를 줄이거나 테마 필터를 초기화해 주세요.
          </p>
        </div>
      )}
    </>
  )
}
