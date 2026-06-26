/**
 * @file PlannerTimelineView.tsx
 * @description Summary timeline view displaying the day-by-day generated plans stops, saving controls, and details navigation.
 * @lastModified 2026-06-23
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlannerCityContext } from '../map-city/smallCities'
import type { PlanDraft, PreferenceProfile, ThemeId } from '../../shared/types/app'

type PlannerTimelineViewProps = {
  planResultPanelRef: React.RefObject<HTMLElement | null>
  isPlannerLoading: boolean
  hasGuidedPlannerChoices: boolean
  isPlannerReady: boolean
  shouldAskFestivalTheme: boolean
  shouldShowTravelMonthPrompt: boolean
  planDestinationName?: string
  plannerCityContext: PlannerCityContext | null
  plannerPreferenceLabel: string
  planDraft: PlanDraft
  plannerPreferenceProfile: PreferenceProfile
  currentPlanTitle: string
  openPlanDetailView: () => void
  isCurrentPlanLiked: boolean
  toggleGeneratedPlanLike: () => void
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
  isPlanSaving?: boolean
  openMyPage: () => void
  savedPlanNotice: string | null
  resetPlannerFlow: () => void
  shouldShowFestivalPrompt: boolean
  shouldShowDurationPrompt: boolean
  activeThemeIds?: ThemeId[]
  onAddThemePreference?: (themeId: ThemeId) => void
  onRemoveThemePreferences?: (themeIdsToRemove: ThemeId[]) => void
}

export function PlannerTimelineView({
  planResultPanelRef,
  isPlannerLoading,
  hasGuidedPlannerChoices,
  isPlannerReady,
  shouldAskFestivalTheme,
  shouldShowTravelMonthPrompt,
  planDestinationName,
  plannerCityContext,
  plannerPreferenceLabel,
  planDraft,
  plannerPreferenceProfile,
  currentPlanTitle,
  openPlanDetailView,
  isCurrentPlanLiked,
  toggleGeneratedPlanLike,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  isPlanSaving = false,
  openMyPage,
  savedPlanNotice,
  resetPlannerFlow,
  shouldShowFestivalPrompt,
  shouldShowDurationPrompt,
  activeThemeIds = [],
  onAddThemePreference,
  onRemoveThemePreferences,
}: PlannerTimelineViewProps) {

  const { t } = useTranslation()
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  const feedbackChips = [
    { id: 'healing_rest', label: t('feedback.chip_healing') },
    { id: 'nature_trekking', label: t('feedback.chip_nature') },
    { id: 'history_tradition', label: t('feedback.chip_tradition') },
    { id: 'food_local', label: t('feedback.chip_food') },
  ]

  const handleChipClick = (themeId: ThemeId) => {
    if (onAddThemePreference) {
      onAddThemePreference(themeId)
      setFeedbackNotice(t('feedback.notice_positive'))
      setTimeout(() => setFeedbackNotice(null), 3000)
    }
  }

  const handleNegativeClick = () => {
    if (onRemoveThemePreferences && activeThemeIds) {
      onRemoveThemePreferences(activeThemeIds)
      setFeedbackNotice(t('feedback.notice_negative'))
      setTimeout(() => setFeedbackNotice(null), 3000)
    }
  }

  const renderSkeletonItineraryPanel = () => (
    <section
      aria-label="AI 일정 생성 중"
      aria-busy="true"
      className="lovv-liquid-panel flex h-full min-h-[680px] flex-col overflow-hidden rounded-[22px] border-0 shadow-[0_18px_44px_-32px_rgba(33,46,33,0.1)] xl:min-h-0"
    >
      <div className="shrink-0 border-b border-white/40 bg-[#FFF0E4]/45 px-6 py-6 backdrop-blur-md">
        <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#33271E]">AI가 맞춤 일정을 짜는 중…</p>
            <h3 className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
              {planDestinationName ?? plannerCityContext?.cityName ?? (
                <span
                  className="inline-block h-7 w-40 rounded-md bg-[#F3B489]/40 align-middle"
                  style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite' }}
                  aria-label="추천 도시를 찾는 중"
                />
              )}
            </h3>
            <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
              고른 조건을 바탕으로 핵심 흐름을 정리하고 있어요.
            </p>
          </div>
          <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-[12px] font-bold text-[#33271E] shadow-sm">
            {Math.max(1, planDraft.dayCount)}일 구성
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {[
            plannerCityContext ? `${plannerCityContext.cityName} 중심` : `${plannerPreferenceLabel} 중심`,
            `${plannerPreferenceProfile.selectedThemeIds.length}개 테마 반영`,
          ].map((item, index) => (
            <span
              key={item}
              className="inline-flex min-h-11 min-w-0 items-center rounded-[14px] border border-white/50 bg-[#fffffa]/80 px-4 py-2 break-keep text-sm font-bold leading-5 text-[#33271E] shadow-sm max-sm:text-[13px]"
              style={{ animation: 'lovv-chip-in 0.34s ease-out both', animationDelay: `${index * 160}ms` }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <h4 className="sr-only break-keep max-sm:text-lg max-sm:leading-6">{currentPlanTitle}</h4>

        <div className="mt-4 rounded-[16px] border border-white/40 bg-[#FFF8F6]/75 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#A92B10]">핵심 추천 기준</p>
          <div className="mt-2 h-4 w-full rounded-md bg-[#F3B489]/30" style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite', animationDelay: '80ms' }} />
          <div className="mt-1 h-4 w-3/4 rounded-md bg-[#F3B489]/30" style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite', animationDelay: '160ms' }} />
        </div>

        <section className="mt-6 rounded-[20px] border border-white/50 bg-[#FFF7F0]/70 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#F36B12]">Summary</p>
              <h5 className="mt-2 break-keep text-lg font-black leading-7 text-[#33271E]">일차별 핵심 흐름</h5>
            </div>
            <span className="rounded-full border border-white/60 bg-[#fffffa]/80 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-sm">
              {Math.max(1, planDraft.dayCount)}일 요약
            </span>
          </div>

          <ol className="mt-4 grid gap-3" aria-label="일정 로딩 중">
            {Array.from({ length: Math.max(1, planDraft.dayCount) }, (_, i) => i + 1).map((day) => (
              <li
                key={day}
                className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-start gap-3 rounded-[16px] border border-white/40 bg-[#fffffa]/80 px-4 py-3 max-sm:grid-cols-[38px_minmax(0,1fr)] shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-sm font-black text-[#33271E]">
                  {day}
                </span>
                <div className="min-w-0">
                  <div className="h-4 w-32 rounded-md bg-[#F3B489]/40" style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite', animationDelay: `${day * 100 + 50}ms` }} />
                  <div className="mt-2 h-3 w-48 rounded-md bg-[#F3B489]/25" style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite', animationDelay: `${day * 100 + 100}ms` }} />
                </div>
                <span
                  className="h-6 w-14 rounded-full bg-[#F3B489]/30 max-sm:col-start-2 max-sm:w-fit"
                  style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite', animationDelay: `${day * 100 + 150}ms` }}
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )

  if (isPlannerLoading && hasGuidedPlannerChoices) {
    return renderSkeletonItineraryPanel()
  }

  if (!isPlannerReady) {
    return (
      <section
        aria-label="AI 일정 결과"
        className="lovv-liquid-panel flex h-full min-h-[680px] flex-col justify-between overflow-hidden rounded-[22px] border-0 p-6 shadow-[0_18px_44px_-32px_rgba(33,46,33,0.1)] xl:min-h-0"
      >
        <div>
          <p className="text-sm font-semibold text-[#33271E]">맞춤 일정 결과</p>
          <h3 className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
            아직 일정이 생성되지 않았어요
          </h3>
          <p className="mt-4 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
            {shouldAskFestivalTheme
              ? '축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.'
              : shouldShowTravelMonthPrompt
                ? '여행 예정 월을 고르면 해당 소도시의 축제 기간과 맞는지 확인해 일정 초안을 표시합니다.'
                : '여행 기간을 고른 뒤 해당 소도시의 동선 단서를 기준으로 일정 초안이 여기에 표시됩니다.'}
          </p>
        </div>
        <div className="mt-8 rounded-[18px] border border-white/45 bg-[#FFF0E4]/75 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-[12px] font-bold text-[#33271E]">다음 입력</p>
          <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
            {shouldShowFestivalPrompt
              ? '축제 테마를 포함할지 먼저 골라주세요.'
              : shouldShowDurationPrompt
                ? '당일치기부터 2박 3일까지 여행 기간을 선택해 주세요.'
                : shouldShowTravelMonthPrompt
                  ? '여행 예정 월을 선택해 주세요.'
                : '동행, 관심사, 걷는 정도를 자연어로 입력해 주세요.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={planResultPanelRef}
      aria-labelledby="generated-plan-title"
      className="lovv-liquid-panel flex h-full min-h-[680px] flex-col overflow-hidden rounded-[22px] border-0 shadow-[0_18px_44px_-32px_rgba(33,46,33,0.1)] xl:min-h-0"
    >
      <div className="shrink-0 border-b border-white/40 bg-[#FFF0E4]/45 px-6 py-6 backdrop-blur-md">
        <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
          <div>
            <p className="text-sm font-semibold text-[#33271E]">맞춤 일정 결과</p>
            <h3
              id="generated-plan-title"
              className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7"
            >
              {planDestinationName ?? '생성된 일정 요약'}
            </h3>
            <p className="sr-only break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">챗봇에서 정리된 조건을 바탕으로, 핵심 흐름만 압축해서 보여줍니다.</p>
          </div>
          <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-[12px] font-bold text-[#33271E] shadow-sm">
            {planDraft.dayCount}일 구성
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {[
            plannerCityContext
              ? `${plannerCityContext.cityName} 중심`
              : `${plannerPreferenceLabel} 중심`,
            shouldAskFestivalTheme ? `${planDraft.festivalThemeLabel} 반영` : null,
            `${plannerPreferenceProfile.selectedThemeIds.length}개 테마 반영`,
          ].filter((item): item is string => Boolean(item)).map((item) => (
            <span
              key={item}
              className="inline-flex min-h-11 min-w-0 items-center rounded-[14px] border border-white/50 bg-[#fffffa]/80 px-4 py-2 break-keep text-sm font-bold leading-5 text-[#33271E] shadow-sm max-sm:text-[13px]"
            >
              {item}
            </span>
          ))}
        </div>

        {planDraft.userNotice && planDraft.userNotice.length > 0 && (
          <div className="mt-4 rounded-[12px] border border-white/45 bg-[#FFF3E0]/75 px-4 py-3 text-[13px] leading-5 text-[#7A4F2D] shadow-sm backdrop-blur-sm">
            {planDraft.userNotice.map((notice, i) => (
              <p key={i}>{notice}</p>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <h4 className="sr-only break-keep max-sm:text-lg max-sm:leading-6">{currentPlanTitle}</h4>
        <span className="sr-only">총 {planDraft.stops.length}개 코스</span>

        <div className="mt-4 rounded-[16px] border border-white/40 bg-[#FFF8F6]/75 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#A92B10]">
            핵심 추천 기준
          </p>
          <p className="mt-2 line-clamp-3 break-keep text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
            {planDraft.summary}
          </p>
        </div>

        <section
          aria-labelledby="generated-plan-summary-title"
          className="mt-6 rounded-[20px] border border-white/50 bg-[#FFF7F0]/70 p-5 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#F36B12]">
                Summary
              </p>
              <h5
                id="generated-plan-summary-title"
                className="mt-2 break-keep text-lg font-black leading-7 text-[#33271E]"
              >
                일차별 핵심 흐름
              </h5>
            </div>
            <span className="rounded-full border border-white/60 bg-[#fffffa]/80 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-sm">
              {planDraft.dayCount}일 요약
            </span>
          </div>

          <ol className="mt-4 grid gap-3" aria-label="일차별 일정 요약">
            {planDraft.days.map((day) => (
              <li
                key={day.day}
                className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-start gap-3 rounded-[16px] border border-white/40 bg-[#fffffa]/80 px-4 py-3 max-sm:grid-cols-[38px_minmax(0,1fr)] shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-sm font-black text-[#33271E]">
                  {day.day}
                </span>
                <div className="min-w-0">
                  <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                    {day.title}
                  </p>
                  <p className="mt-1 line-clamp-2 break-keep text-[13px] font-semibold leading-5 text-[#6E5A50]">
                    {day.summary}
                  </p>
                </div>
                <span className="rounded-full border border-white/60 bg-[#fffffa]/80 px-3 py-1 text-[12px] font-bold text-[#33271E] max-sm:col-start-2 max-sm:w-fit shadow-sm">
                  {day.stops.length}개 코스
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={openPlanDetailView}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-sm font-black text-[#33271E] shadow-sm transition hover:scale-[1.01] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            세부 일정 보기
          </button>
          <p className="mt-3 break-keep text-center text-[12px] font-bold leading-5 text-[#6E5A50]">
            시간대별 장소, 이동 시간, 추천 이유는 세부 화면에서 확인할 수 있어요.
          </p>
        </section>

        <div className="sr-only">
          {/* Feedback Card */}
          <div className="mt-6 rounded-[20px] border border-white/50 bg-[#FFF7F0]/70 p-5 backdrop-blur-sm">
            <p className="break-keep text-sm font-black text-[#33271E]">
              {t('feedback.title')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 max-sm:grid-cols-1">
              {feedbackChips.map((chip) => {
                const isSelected = activeThemeIds?.includes(chip.id as ThemeId)
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipClick(chip.id as ThemeId)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-[8px] border px-3 text-[12px] font-bold transition focus-visible:outline focus-visible:outline-2 ${
                      isSelected
                        ? 'border-[#F36B12] bg-[#FFE0CA] text-[#33271E] shadow-sm'
                        : 'border-[#F3B489] bg-[#fffffa] text-[#33271E]/80 hover:bg-[#FFE0CA] shadow-sm'
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={handleNegativeClick}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-[8px] border border-gray-200 bg-[#fffffa] px-3 text-[12px] font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition focus-visible:outline focus-visible:outline-2"
              >
                {t('feedback.chip_negative')}
              </button>
            </div>
            <p className="mt-2 break-keep text-[10px] font-semibold leading-4 text-[#6E5A50]">
              {t('feedback.guide_note')}
            </p>
            {feedbackNotice && (
              <p aria-live="polite" className="mt-2 text-[11px] font-bold text-[#A92B10]">
                {feedbackNotice}
              </p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
            <button
              type="button"
              aria-pressed={isCurrentPlanLiked}
              onClick={toggleGeneratedPlanLike}
              className={`inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-bold text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                isCurrentPlanLiked
                  ? 'border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E] shadow-sm hover:scale-[1.01]'
                  : 'border-white/60 bg-[#fffffa]/80 hover:border-[#F36B12] hover:bg-[#FFE0CA] shadow-sm hover:scale-[1.01]'
              }`}
            >
              {isCurrentPlanLiked ? '좋아요 취소' : '좋아요'}
            </button>
            <button
              type="button"
              onClick={saveGeneratedPlan}
              disabled={isCurrentPlanSaved || isPlanSaving}
              className={`inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-sm font-black text-[#33271E] shadow-sm transition hover:scale-[1.01] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                isCurrentPlanSaved
                  ? 'disabled:cursor-default disabled:opacity-85'
                  : isPlanSaving
                  ? 'disabled:cursor-wait disabled:opacity-75'
                  : ''
              }`}
            >
              {isPlanSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#33271E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isCurrentPlanSaved ? '마이페이지에 저장됨' : isPlanSaving ? '저장 중...' : '마이페이지에 저장'}
            </button>
            <button
              type="button"
              onClick={() => resetPlannerFlow()}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/60 bg-[#fffffa]/80 px-5 text-sm font-bold text-[#33271E] shadow-sm transition hover:border-[#F36B12] hover:bg-[#FFE0CA] hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:col-span-1 md:col-span-2"
            >
              일정 다시짜기
            </button>
          </div>

          {isCurrentPlanSaved ? (
            <button
              type="button"
              onClick={openMyPage}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/60 bg-[#fffffa]/80 px-4 text-sm font-bold text-[#33271E] shadow-sm transition hover:border-[#F36B12] hover:bg-[#FFE0CA] hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              마이페이지 보기
            </button>
          ) : null}
          {savedPlanNotice ? (
            <p aria-live="polite" className="mt-4 break-keep text-sm font-bold leading-6 text-[#33271E]">
              {savedPlanNotice}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

// EOF: PlannerTimelineView.tsx
