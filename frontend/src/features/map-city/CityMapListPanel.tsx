/**
 * @file CityMapListPanel.tsx
 * @description List panel rendering search result cards of small cities when viewing results.
 * @lastModified 2026-06-23
 */

import { type SmallCity } from './smallCities'
import { getVisibleMapThemes } from './mapCityFilters'

const MAX_VISIBLE_CITY_RESULTS = 10

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
  const visibleCities = filteredSmallCities.slice(0, MAX_VISIBLE_CITY_RESULTS)
  const hiddenCityCount = Math.max(0, filteredSmallCities.length - visibleCities.length)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/70 bg-white/66 px-4 py-3 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.2)] backdrop-blur-sm">
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/50 bg-[#fffffa]/80 px-3 py-1 text-[12px] font-black text-[#33271E] shadow-sm">
            {filteredSmallCities.length} / {activeCountryTotalCount}
          </span>
          {hiddenCityCount > 0 ? (
            <span className="rounded-full border border-white/50 bg-[#FFF0E4]/82 px-3 py-1 text-[11px] font-black text-[#6E5A50] shadow-sm">
              상위 {MAX_VISIBLE_CITY_RESULTS}개 표시
            </span>
          ) : null}
        </div>
      </div>

      {filteredSmallCities.length > 0 ? (
        <ol
          aria-labelledby="city-map-results-title"
          data-testid="city-map-result-list"
          className="mt-3 grid grid-cols-2 gap-2 max-sm:grid-cols-1"
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
          {hiddenCityCount > 0 ? (
            <li className="col-span-2 rounded-[12px] border border-white/60 bg-white/54 px-4 py-3 text-center text-[12px] font-bold leading-5 text-[#6E5A50] max-sm:col-span-1">
              검색어나 해시태그를 추가하면 나머지 {hiddenCityCount}개 후보를 더 좁혀 볼 수 있어요.
            </li>
          ) : null}
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
