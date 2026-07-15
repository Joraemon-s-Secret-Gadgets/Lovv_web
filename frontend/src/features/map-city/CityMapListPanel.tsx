/**
 * @file CityMapListPanel.tsx
 * @description List panel rendering search result cards of small cities when viewing results.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type SmallCity } from './smallCities'
import { getVisibleMapThemes } from './mapCityFilters'

const CITY_RESULTS_PER_PAGE = 10

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
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredSmallCities.length / CITY_RESULTS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageStartIndex = (currentPage - 1) * CITY_RESULTS_PER_PAGE
  const visibleCities = filteredSmallCities.slice(pageStartIndex, pageStartIndex + CITY_RESULTS_PER_PAGE)
  const firstVisibleResult = filteredSmallCities.length > 0 ? pageStartIndex + 1 : 0
  const lastVisibleResult = Math.min(pageStartIndex + visibleCities.length, filteredSmallCities.length)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/70 bg-white/66 px-4 py-3 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.2)] backdrop-blur-sm">
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
          {firstVisibleResult}-{lastVisibleResult} / {filteredSmallCities.length}
          {filteredSmallCities.length !== activeCountryTotalCount ? ` (전체 ${activeCountryTotalCount})` : ''}
        </span>
      </div>

      {filteredSmallCities.length > 0 ? (
        <ol
          aria-labelledby="city-map-results-title"
          data-testid="city-map-result-list"
          className="mt-3 grid min-h-0 flex-1 content-start grid-cols-2 gap-2 overflow-y-auto pr-1 max-xl:overflow-visible max-sm:grid-cols-1"
        >
          {visibleCities.map((city) => {
            const isSelected = city.id === selectedSmallCity?.id
            const visibleThemes = getVisibleMapThemes(city.themes)
            const festivalCount = city.festivalCount ?? city.festivals?.length ?? 0

            return (
              <li key={`result-${city.id}`}>
                <button
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectCityFromList(city)}
                  className={`min-h-[88px] w-full rounded-[14px] border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                    isSelected
                      ? 'border-[#F3B489]/70 bg-gradient-to-tr from-[#FFE0CA]/96 to-[#fffffa]/78 shadow-[0_16px_30px_-24px_rgba(51,39,30,0.3)]'
                      : 'border-white/60 bg-white/58 shadow-sm hover:-translate-y-0.5 hover:border-[#F3B489]/60 hover:bg-[#fffffa]/78 hover:shadow-[0_14px_28px_-24px_rgba(51,39,30,0.24)]'
                  }`}
                >
                  <span className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-3">
                    <span className="block size-12 overflow-hidden rounded-[10px] border border-white/70 bg-[#FFF0E4]">
                      {city.image ? (
                        <img src={city.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[11px] font-black text-[#A92B10]">
                          {city.region}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-sm font-black leading-5 text-[#33271E]">
                          {city.nameKo}
                        </span>
                        {festivalCount > 0 ? (
                          <span className="shrink-0 rounded-[5px] bg-[#FFF0E4] px-1.5 py-0.5 text-[10px] font-black text-[#A92B10]">
                            행사 {festivalCount}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] font-semibold leading-5 text-[#6E5A50]">
                        {city.countryLabel} · {city.region}
                        {city.nameLocal ? ` · ${city.nameLocal}` : ''}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {visibleThemes.slice(0, 2).map((theme) => (
                          <span
                            key={`${city.id}-list-${theme}`}
                            className="rounded-[5px] border border-white/60 bg-[#FFF8F6]/90 px-1.5 py-0.5 text-[10px] font-black text-[#6E5A50]"
                          >
                            #{theme}
                          </span>
                        ))}
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

      {filteredSmallCities.length > CITY_RESULTS_PER_PAGE ? (
        <nav
          aria-label="소도시 결과 페이지"
          className="mt-3 flex min-h-12 shrink-0 items-center justify-center gap-4 rounded-[12px] border border-dashed border-[#F3B489]/60 bg-white/54 px-4 py-2 text-center shadow-sm"
        >
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex size-8 items-center justify-center rounded-full text-[#A92B10] transition hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.5} />
          </button>
          <span className="min-w-16 text-center text-[12px] font-black text-[#6E5A50]" aria-live="polite">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex size-8 items-center justify-center rounded-full text-[#A92B10] transition hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            <ChevronRight aria-hidden="true" size={18} strokeWidth={2.5} />
          </button>
        </nav>
      ) : null}
    </div>
  )
}

// EOF: CityMapListPanel.tsx
