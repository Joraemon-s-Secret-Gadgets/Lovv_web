import type { RefObject } from 'react'
import { getThemeLabels } from '../onboarding/preferenceModel'
import type { PreferenceProfile } from '../../shared/types/app'
import { SmallCityGoogleMap } from './SmallCityGoogleMap'
import { getVisibleMapThemes, mapFilterThemes } from './mapCityFilters'
import {
  smallCityCountryOptions,
  smallCityPlaceCategories,
  type SmallCity,
  type SmallCityCountry,
  type SmallCityMapMarker,
  type SmallCityTheme,
} from './smallCities'
import type { SmallCityCatalogState, SmallCityDetailState } from './smallCityDataSource'

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
    const canUseSmallCityCatalog = smallCityCatalogState.status === 'success'
    const hasSmallCityCatalogError = smallCityCatalogState.status === 'error'
    const isSmallCityCatalogLoading = smallCityCatalogState.status === 'loading'
    const selectedSmallCityDetail =
      selectedSmallCityDetailState.status === 'success' ? selectedSmallCityDetailState.detail : null
    const selectedCountryOption =
      smallCityCountryOptions.find((option) => option.country === cityMapCountry) ??
      smallCityCountryOptions[0]
    const activeCountryTotalCount = activeCountrySmallCities.length
    const hasActiveFilters = cityMapQuery.trim().length > 0 || selectedSmallCityThemes.length > 0
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
    const selectedThemeKeywords = getThemeLabels(selectedPreferenceProfile.selectedThemeIds).flatMap((label) =>
      label.split('·'),
    )
    const selectedSmallCityVisibleThemes = selectedSmallCity
      ? getVisibleMapThemes(selectedSmallCity.themes)
      : []
    const selectedCityMatchedThemes =
      selectedSmallCityVisibleThemes.filter((theme) => selectedThemeKeywords.includes(theme)) ?? []
    const selectedCityFallbackThemeText =
      selectedSmallCityVisibleThemes.length > 0
        ? `${selectedSmallCityVisibleThemes.slice(0, 2).join('·')} 테마`
        : '선택한 도시의 장소 단서'
    const isCityMapListPanel = cityMapPanelMode === 'list' || !selectedSmallCity
    const renderSelectedCityPlacePanel = (testId: string) => {
      const detailStatusMessage =
        selectedSmallCityDetailState.status === 'loading'
          ? {
              title: '장소 정보를 불러오는 중입니다.',
              body: '선택한 city_id 기준으로 상세 후보를 정리합니다.',
            }
          : selectedSmallCityDetailState.status === 'error'
            ? {
                title: '장소 정보를 불러오지 못했습니다.',
                body: selectedSmallCityDetailState.errorMessage,
              }
            : selectedSmallCityDetailState.status === 'empty'
              ? {
                  title: '장소 정보가 없습니다.',
                  body: '선택한 소도시의 상세 후보가 준비되면 이 영역에 표시됩니다.',
                }
              : null

      if (detailStatusMessage || !selectedSmallCityDetail) {
        return (
          <div data-testid={testId} className="mt-5 rounded-[12px] border border-transparent bg-[#fffffa] p-4">
            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
              장소 정보
            </p>
            <p className="mt-3 break-keep text-sm font-black leading-6 text-[#33271E]">
              {detailStatusMessage?.title ?? '장소 정보가 없습니다.'}
            </p>
            <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
              {detailStatusMessage?.body ?? '선택한 소도시의 상세 후보가 준비되면 이 영역에 표시됩니다.'}
            </p>
          </div>
        )
      }

      return (
        <div data-testid={testId} className="mt-5 rounded-[12px] border border-transparent bg-[#fffffa] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
            장소 정보
          </p>
          <div className="mt-3 grid gap-3">
            {smallCityPlaceCategories.map((category) => {
              const places = selectedSmallCityDetail.placesByCategory[category]

              return (
                <section
                  key={`${selectedSmallCityDetail.city.id}-${testId}-${category}`}
                  aria-label={`${category} 장소 후보`}
                  className="rounded-[8px] border border-[#FFE0CA] bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="break-keep text-[13px] font-black leading-5 text-[#33271E]">
                      {category}
                    </h4>
                    <span className="rounded-[5px] bg-[#FFF8F6] px-2 py-1 text-[11px] font-black text-[#6E5A50]">
                      {places.length}
                    </span>
                  </div>
                  {places.length > 0 ? (
                    <ul className="mt-2 grid gap-2">
                      {places.map((place) => (
                        <li key={`${testId}-${place.id}`} className="break-keep text-[12px] leading-5 text-[#33271E]">
                          <p className="font-black">{place.name}</p>
                          <p className="mt-1 font-semibold text-[#6E5A50]">{place.summary}</p>
                          {place.addressName ? (
                            <p className="mt-1 font-bold text-[#8A7467]">{place.addressName}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {place.phone ? (
                              <span className="rounded-[5px] bg-[#FFF8F6] px-2 py-1 text-[11px] font-black text-[#6E5A50]">
                                {place.phone}
                              </span>
                            ) : null}
                            {place.placeUrl ? (
                              <a
                                href={place.placeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-[5px] bg-[#FFF8F6] px-2 py-1 text-[11px] font-black text-[#A92B10] transition hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                              >
                                Kakao 장소 보기
                              </a>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                      준비된 후보가 없습니다.
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <section
        id="city-map-discovery"
        data-testid="city-map-discovery-section"
        aria-labelledby="city-map-discovery-title"
        className="mx-auto max-w-[1440px] px-[55px] pb-14 max-sm:px-5"
      >
        <div className="rounded-[24px] border border-transparent bg-white/84 shadow-[0_18px_48px_-34px_rgba(51,39,30,0.28)]">
          <div
            data-testid="city-map-layout-shell"
            className="grid grid-cols-[minmax(0,2fr)_minmax(440px,0.52fr)] gap-0 xl:h-[min(900px,calc(100vh-72px))] xl:min-h-[760px] xl:overflow-hidden max-xl:grid-cols-1"
          >
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden p-8 max-xl:overflow-visible max-sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 max-lg:grid-cols-1">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F36B12]">
                    Small city map
                  </p>
                  <h2
                    id="city-map-discovery-title"
                    className="mt-3 break-keep text-[34px] font-black leading-10 text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                  >
                    내가 가고 싶은 소도시 찾아보기
                  </h2>
                  <p className="mt-3 max-w-[720px] break-keep text-sm font-semibold leading-6 text-[#33271E]">
                    국가와 도시명으로 지도에서 소도시를 먼저 고르고, 테마는 후보를 좁히는 필터와 선택 이후 일정 소재로 사용합니다.
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="국가 선택"
                  className="inline-grid min-w-[236px] grid-cols-2 rounded-[8px] border border-transparent bg-[#FFF8F6] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72)] max-sm:min-w-0"
                >
                  {smallCityCountryOptions.map((option) => {
                    const isSelected = option.country === cityMapCountry

                    return (
                      <button
                        key={option.country}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelectCountry(option.country)}
                        className={`min-h-11 rounded-[5px] px-4 text-sm font-black text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                          isSelected
                            ? 'border border-transparent bg-[#F36B12]'
                            : 'border border-transparent bg-transparent hover:bg-[#FFE0CA]'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-md:grid-cols-1">
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
                    className="min-h-12 w-full rounded-[8px] border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-bold text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#A92B10] focus:ring-4 focus:ring-[#FF7017]/15"
                  />
                </label>
                <button
                  type="button"
                  onClick={onClearFilters}
                  disabled={!hasActiveFilters || !canUseSmallCityCatalog}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-transparent bg-[#fffffa] px-5 text-sm font-black text-[#33271E] shadow-[0_12px_24px_-22px_rgba(51,39,30,0.28)] transition hover:bg-[#FFE0CA] disabled:cursor-default disabled:opacity-45 disabled:hover:bg-[#fffffa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  필터 초기화
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="소도시 테마 필터">
                {mapFilterThemes.map((theme) => {
                  const isSelected = selectedSmallCityThemes.includes(theme)

                  return (
                    <button
                      key={theme}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={!canUseSmallCityCatalog}
                      onClick={() => onToggleThemeFilter(theme)}
                      className={`inline-flex min-h-9 items-center rounded-[5px] border px-3 py-1 text-[12px] font-black leading-4 text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                        isSelected
                          ? 'border-[#A92B10] bg-[#F36B12]'
                          : 'border-transparent bg-[#FFF8F6] hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#FFF8F6]'
                      }`}
                    >
                      #{theme}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="break-keep text-sm font-black text-[#33271E]">
                      {selectedCountryOption.label} {filteredSmallCities.length}곳 / 전체{' '}
                      {activeCountryTotalCount}곳
                    </p>
                    <span className="rounded-[5px] bg-[#FFF8F6] px-3 py-1 text-[12px] font-black text-[#33271E]">
                      도시명 마커 {visibleSmallCityMapMarkers.length}개
                    </span>
                  </div>

                  <div
                    data-testid="city-map-marker-layer"
                    className="lovv-city-map-surface relative min-h-[560px] flex-1 overflow-hidden rounded-[18px] border border-transparent bg-[#FFF8F6] shadow-[0_14px_34px_-30px_rgba(51,39,30,0.32)] xl:min-h-0 max-xl:h-[620px] max-sm:h-[440px] max-sm:min-h-[440px]"
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
                    <div className="absolute left-5 top-5 z-10 rounded-[5px] bg-white/88 px-3 py-2 text-[12px] font-black text-[#33271E] shadow-[0_12px_24px_-22px_rgba(51,39,30,0.35)] backdrop-blur">
                      {selectedCountryOption.description}
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
              className="min-h-0 min-w-0 overflow-hidden rounded-r-[24px] bg-[#FFF0E4] p-8 max-xl:overflow-visible max-xl:rounded-b-[24px] max-xl:rounded-r-none max-sm:p-5"
            >
              <div
                ref={cityMapDetailPanelRef}
                data-testid="city-map-detail-sticky-content"
                className="h-full min-h-0 overflow-y-auto pr-1"
              >
                {isCityMapListPanel ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                          City list
                        </p>
                        <h3
                          id="city-map-results-title"
                          className="mt-3 break-keep text-[28px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
                        >
                          표시된 소도시
                        </h3>
                        <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                          목록에서 도시를 고르면 이 패널이 상세 정보로 전환됩니다.
                        </p>
                      </div>
                      <span className="rounded-[5px] bg-white px-3 py-1 text-[12px] font-black text-[#33271E]">
                        {filteredSmallCities.length} / {activeCountryTotalCount}
                      </span>
                    </div>

                    {filteredSmallCities.length > 0 ? (
                      <ol
                        aria-labelledby="city-map-results-title"
                        data-testid="city-map-result-list"
                        className="mt-5 grid gap-2"
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
                                className={`min-h-[82px] w-full rounded-[8px] border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                                  isSelected
                                    ? 'border-[#A92B10] bg-[#FFE0CA]'
                                    : 'border-transparent bg-white hover:bg-[#fffffa] hover:shadow-[0_10px_22px_-20px_rgba(51,39,30,0.38)]'
                                }`}
                              >
                                <span className="block break-keep text-sm font-black leading-5 text-[#33271E]">
                                  {city.nameKo}
                                </span>
                                <span className="mt-1 block break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                                  {city.countryLabel} · {city.region}
                                  {city.nameLocal ? ` · ${city.nameLocal}` : ''}
                                </span>
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                  {visibleThemes.slice(0, 3).map((theme) => (
                                    <span
                                      key={`${city.id}-list-${theme}`}
                                      className="rounded-[5px] bg-[#FFF8F6] px-2 py-0.5 text-[11px] font-black text-[#6E5A50]"
                                    >
                                      #{theme}
                                    </span>
                                  ))}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ol>
                    ) : (
                      <div className="mt-5 rounded-[12px] border border-transparent bg-white px-4 py-5">
                        <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                          표시할 결과가 없습니다.
                        </p>
                        <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                          검색어를 줄이거나 테마 필터를 초기화해 주세요.
                        </p>
                      </div>
                    )}
                  </>
                ) : selectedSmallCity ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onSetPanelMode('list')}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      ← 목록으로
                    </button>
                    <p className="mt-5 text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                      Selected city
                    </p>
                    <h3
                      id="city-map-selected-title"
                      className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
                    >
                      {selectedSmallCity.nameKo}
                    </h3>
                    <p className="mt-2 break-keep text-sm font-black text-[#6E5A50]">
                      {selectedSmallCity.countryLabel} · {selectedSmallCity.region}
                      {selectedSmallCity.nameLocal ? ` · ${selectedSmallCity.nameLocal}` : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedSmallCityVisibleThemes.map((theme) => (
                        <span
                          key={`${selectedSmallCity.id}-${theme}`}
                          className="rounded-[5px] bg-[#fffffa] px-3 py-1 text-[12px] font-black text-[#33271E]"
                        >
                          #{theme}
                        </span>
                      ))}
                    </div>
                    <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {selectedSmallCity.summary}
                    </p>
                    <p className="mt-3 break-keep text-sm leading-6 text-[#33271E]">
                      {selectedSmallCity.detail}
                    </p>
                    <div className="mt-5 rounded-[12px] border border-transparent bg-[#fffffa] p-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                        추천 근거
                      </p>
                      <p className="mt-2 break-keep text-sm font-black leading-6 text-[#33271E]">
                        {selectedCityMatchedThemes.length > 0
                          ? `선택 취향의 ${selectedCityMatchedThemes.join('·')} 테마와 겹쳐 먼저 볼 만합니다.`
                          : `${selectedCityFallbackThemeText}가 뚜렷해서 새로운 후보로 비교하기 좋습니다.`}
                      </p>
                    </div>
                    <div className="mt-5 rounded-[12px] border border-transparent bg-[#fffffa] p-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                        First route note
                      </p>
                      <p className="mt-2 break-keep text-sm font-black leading-6 text-[#33271E]">
                        {selectedSmallCity.routeSeed.slice(0, 3).join(' · ')}
                      </p>
                    </div>
                    {renderSelectedCityPlacePanel('city-map-detail-place-panel')}
                    <div className="mt-5">
                      <p className="text-[12px] font-black text-[#33271E]">하이라이트</p>
                      <ul className="mt-2 grid gap-2">
                        {selectedSmallCity.highlights.slice(0, 4).map((highlight) => (
                          <li
                            key={`${selectedSmallCity.id}-${highlight}`}
                            className="break-keep rounded-[5px] bg-white px-3 py-2 text-[12px] font-bold leading-5 text-[#33271E]"
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPlanner(selectedSmallCity)}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[8px] border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      이 소도시로 AI 일정 짜기
                    </button>
                  </>
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
