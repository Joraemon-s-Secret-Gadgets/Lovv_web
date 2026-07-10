/**
 * @file CityMapDetailPanel.tsx
 * @description Detail panel displaying selected small city summary, weather, places, and planning triggers.
 * @lastModified 2026-06-23
 */

import { getThemeLabels } from '../onboarding/preferenceModel'
import { getVisibleMapThemes } from './mapCityFilters'
import {
  type SmallCity,
  type SmallCityFestival,
} from './smallCities'
import type { PreferenceProfile } from '../../shared/types/app'
import type { SmallCityDetailState } from './smallCityDataSource'

type CityMapDetailPanelProps = {
  selectedSmallCity: SmallCity
  selectedSmallCityDetailState: SmallCityDetailState
  selectedPreferenceProfile: PreferenceProfile
  onSetPanelMode: (mode: 'list' | 'detail') => void
  onOpenPlanner: (city: SmallCity) => void
}

const formatCompactFestivalDate = (value?: string) => {
  if (!value) {
    return null
  }

  const dateMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/)

  if (!dateMatch) {
    return value
  }

  const [, year, month, day] = dateMatch

  return `${year}.${month}.${day}`
}

const formatFestivalPeriod = (festival: SmallCityFestival) => {
  const startDate = formatCompactFestivalDate(festival.startDate)
  const endDate = formatCompactFestivalDate(festival.endDate)

  if (startDate && endDate) {
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`
  }

  return startDate ?? endDate
}

export function CityMapDetailPanel({
  selectedSmallCity,
  selectedSmallCityDetailState,
  selectedPreferenceProfile,
  onSetPanelMode,
  onOpenPlanner,
}: CityMapDetailPanelProps) {
  const selectedSmallCityDetail =
    selectedSmallCityDetailState.status === 'success' ? selectedSmallCityDetailState.detail : null

  const selectedThemeKeywords = getThemeLabels(selectedPreferenceProfile.selectedThemeIds).flatMap((label) =>
    label.split('·'),
  )
  const selectedSmallCityVisibleThemes = getVisibleMapThemes(selectedSmallCity.themes)
  const selectedCityMatchedThemes =
    selectedSmallCityVisibleThemes.filter((theme) => selectedThemeKeywords.includes(theme)) ?? []
  const selectedCityFallbackThemeText =
    selectedSmallCityVisibleThemes.length > 0
      ? `${selectedSmallCityVisibleThemes.slice(0, 2).join('·')} 테마`
      : '선택한 도시의 장소 단서'

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
        <div data-testid={testId} className="mt-5 rounded-[18px] border border-white/70 bg-[#fffffa]/86 p-4 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.2)] backdrop-blur-sm">
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

    const selectedCityFestivals = selectedSmallCityDetail.festivals

    return (
      <div data-testid={testId} className="mt-5 rounded-[18px] border border-white/70 bg-[#fffffa]/86 p-4 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.2)] backdrop-blur-sm">
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
          장소 정보
        </p>
        <div className="mt-3 grid gap-3">
          {(['관광지'] as const).map((category) => {
            const places = selectedSmallCityDetail.placesByCategory[category].filter(
              (place) => place.categoryName !== '축제',
            )

            return (
              <section
                key={`${selectedSmallCityDetail.city.id}-${testId}-${category}`}
                aria-label={`${category} 장소 후보`}
                className="rounded-[14px] border border-white/70 bg-white/78 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="break-keep text-[13px] font-black leading-5 text-[#33271E]">
                    {category}
                  </h4>
                  <span className="rounded-[5px] border border-white/60 bg-[#fffffa]/60 px-2 py-1 text-[11px] font-black text-[#6E5A50] shadow-sm">
                    {places.length}
                  </span>
                </div>
                {places.length > 0 ? (
                  <ul className="mt-2 grid gap-2">
                    {places.slice(0, 5).map((place) => (
                      <li key={`${testId}-${place.id}`} className="break-keep text-[12px] leading-5 text-[#33271E]">
                        <p className="font-black">{place.name}</p>
                        {place.addressName ? (
                          <p className="mt-1 font-bold text-[#8A7467]">{place.addressName}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {place.phone ? (
                            <span className="rounded-[5px] border border-white/60 bg-[#fffffa]/60 px-2 py-1 text-[11px] font-black text-[#6E5A50] shadow-sm">
                              {place.phone}
                            </span>
                          ) : null}
                          {place.placeUrl ? (
                            <a
                              href={place.placeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-[5px] border border-white/60 bg-[#fffffa]/70 px-2 py-1 text-[11px] font-black text-[#A92B10] shadow-sm transition hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              Kakao 장소 보기
                            </a>
                          ) : null}
                        </div>
                      </li>
                    ))}
                    {places.length > 5 ? (
                      <li className="break-keep text-[11px] font-bold text-[#8A7467] mt-1 pl-1">
                        외 {places.length - 5}곳 더 있음
                      </li>
                    ) : null}
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
        {selectedCityFestivals.length > 0 ? (
          <section
            aria-label="축제 정보"
            className="mt-4 rounded-[14px] border border-white/70 bg-white/78 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="break-keep text-[13px] font-black leading-5 text-[#33271E]">
                축제 정보
              </h4>
              <span className="rounded-[5px] border border-white/60 bg-[#fffffa]/60 px-2 py-1 text-[11px] font-black text-[#6E5A50] shadow-sm">
                {selectedCityFestivals.length}
              </span>
            </div>
            <ul className="mt-2 grid gap-2">
              {selectedCityFestivals.map((festival) => {
                const festivalPeriod = formatFestivalPeriod(festival)

                return (
                  <li
                    key={`${testId}-${festival.id}`}
                    className="break-keep text-[12px] leading-5 text-[#33271E]"
                  >
                    <p className="font-black">{festival.name}</p>
                    {festivalPeriod ? (
                      <p className="mt-1 font-bold text-[#8A7467]">{festivalPeriod}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onSetPanelMode('list')}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/70 bg-[#fffffa]/88 px-4 text-sm font-black text-[#33271E] shadow-sm transition hover:-translate-y-0.5 hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
      >
        ← 목록으로
      </button>
      <div className="mt-4 rounded-[24px] border border-white/70 bg-white/68 p-5 shadow-[0_16px_34px_-28px_rgba(51,39,30,0.24)] backdrop-blur-sm">
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
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
              className="rounded-full border border-white/70 bg-[#fffffa]/84 px-3 py-1 text-[12px] font-black text-[#33271E] shadow-sm"
            >
              #{theme}
            </span>
          ))}
        </div>
        <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
          {selectedSmallCity.summary}
        </p>
      </div>
      <p className="mt-3 break-keep text-sm leading-6 text-[#33271E]">
        {selectedSmallCity.detail}
      </p>
      <div className="mt-5 rounded-[18px] border border-white/70 bg-white/64 p-4 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.18)] backdrop-blur-sm">
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
          추천 근거
        </p>
        <p className="mt-2 break-keep text-sm font-black leading-6 text-[#33271E]">
          {selectedCityMatchedThemes.length > 0
            ? `선택 취향의 ${selectedCityMatchedThemes.join('·')} 테마와 겹쳐 먼저 볼 만합니다.`
            : `${selectedCityFallbackThemeText}가 뚜렷해서 새로운 후보로 비교하기 좋습니다.`}
        </p>
      </div>
      <div className="mt-5 rounded-[18px] border border-white/70 bg-white/64 p-4 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.18)] backdrop-blur-sm">
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
              className="break-keep rounded-[10px] border border-white/70 bg-[#fffffa]/86 px-3 py-2 text-[12px] font-bold leading-5 text-[#33271E] shadow-sm"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => onOpenPlanner(selectedSmallCity)}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[16px] border border-white/50 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-sm font-black text-[#33271E] shadow-sm transition hover:scale-[1.01] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
      >
        이 소도시로 AI 일정 짜기
      </button>
    </>
  )
}
