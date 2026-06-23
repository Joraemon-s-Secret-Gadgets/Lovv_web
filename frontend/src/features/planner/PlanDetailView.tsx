import { useEffect, useState } from 'react'
import type { PlanDraft, SavedPlanLike } from '../../shared/types/app'
import { SavedPlanLikeControls } from '../saved-plans/SavedPlanLikeControls'

type PlanDetailViewProps = {
  isPlannerReady: boolean
  shouldAskFestivalTheme: boolean
  returnToChatWorkspace: () => void
  currentPlanTitle: string
  planDraft: PlanDraft
  plannerBasisLabel: string
  cityImageUrl?: string
  destinationName?: string
  planId: string
  planLike: SavedPlanLike
  onSelectSavedPlanLike: (planId: string, like: Exclude<SavedPlanLike, null>) => void
  savedPlanLikePending?: boolean
  savedPlanLikeError?: string | null
  isSavedPlanDetailLoading?: boolean
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
  isPlanSaving?: boolean
  savedPlanDeletePending?: boolean
  onDeleteSavedPlan: (planId: string, options?: { navigateToMyPage?: boolean }) => void
  openMyPage: () => void
  savedPlanNotice: string | null
}

export function PlanDetailView({
  isPlannerReady,
  shouldAskFestivalTheme,
  returnToChatWorkspace,
  currentPlanTitle,
  planDraft,
  plannerBasisLabel,
  cityImageUrl,
  destinationName,
  planId,
  planLike,
  onSelectSavedPlanLike,
  savedPlanLikePending = false,
  savedPlanLikeError = null,
  isSavedPlanDetailLoading = false,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  isPlanSaving = false,
  savedPlanDeletePending = false,
  onDeleteSavedPlan,
  openMyPage,
  savedPlanNotice,
}: PlanDetailViewProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Day-by-day tabs (당일 / N일차) instead of one long scroll of every day.
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  // Reset to the first day whenever a different plan is opened.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveDayIndex(0)
  }, [planId])

  if (isSavedPlanDetailLoading) {
      return (
        <section
          role="status"
          aria-live="polite"
          className="mx-auto min-h-dvh max-w-[1120px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
        >
          <div className="rounded-[22px] border border-transparent bg-[#fffffa] p-8 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
            <span
              aria-hidden="true"
              className="block size-9 animate-spin rounded-full border-4 border-[#F3B489]/45 border-t-[#F36B12]"
            />
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
              Plan detail
            </p>
            <h1 className="mt-4 break-keep text-[36px] font-black leading-[46px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9">
              일정 상세를 불러오고 있어요
            </h1>
            <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
              잠시만 기다려 주세요.
            </p>
          </div>
        </section>
      )
    }

    if (!isPlannerReady) {
      return (
        <section className="mx-auto min-h-dvh max-w-[1120px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
          <div className="rounded-[22px] border border-transparent bg-[#fffffa] p-8 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
              Plan detail
            </p>
            <h1
              id="plan-detail-title"
              className="mt-4 break-keep text-[36px] font-black leading-[46px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
            >
              세부 일정 상세
            </h1>
            <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
              {shouldAskFestivalTheme
                ? '아직 확정된 일정 초안이 없어요. 챗봇에서 축제 포함 여부와 여행 기간을 먼저 골라주세요.'
                : '아직 확정된 일정 초안이 없어요. 챗봇에서 여행 기간을 먼저 골라주세요.'}
            </p>
            <button
              type="button"
              onClick={returnToChatWorkspace}
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              채팅으로 돌아가기
            </button>
          </div>
        </section>
      )
    }

    const days = planDraft.days
    const safeDayIndex = Math.min(activeDayIndex, Math.max(0, days.length - 1))
    const activeDay = days[safeDayIndex]
    const dayTabLabel = (dayNumber: number) => (days.length <= 1 ? '당일' : `${dayNumber}일차`)

    return (
      <section className="mx-auto min-h-dvh max-w-[1280px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
        <div
          role="region"
          aria-labelledby="plan-detail-title"
          className="overflow-hidden rounded-[24px] border border-transparent bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]"
        >
          {cityImageUrl && (
            <div className="relative h-52 w-full overflow-hidden max-sm:h-36">
              <img
                src={cityImageUrl}
                alt={currentPlanTitle}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#33271E]/40 to-transparent" />
            </div>
          )}
          <div className="bg-[#FFF0E4] px-8 py-7 max-sm:px-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                  Plan detail
                </p>
                {destinationName ? (
                  <>
                    <h1
                      id="plan-detail-title"
                      className="mt-4 break-keep text-[34px] font-black leading-[44px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                    >
                      {destinationName}
                    </h1>
                    <h2 className="mt-2 break-keep text-xl font-bold leading-8 text-[#33271E]/70 max-sm:text-lg">
                      {currentPlanTitle}
                    </h2>
                  </>
                ) : (
                  <>
                    <h1
                      id="plan-detail-title"
                      className="mt-4 break-keep text-[34px] font-black leading-[44px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                    >
                      세부 일정 상세
                    </h1>
                    <h2 className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                      {currentPlanTitle}
                    </h2>
                  </>
                )}
                <p className="mt-4 max-w-[760px] break-keep text-sm font-semibold leading-7 text-[#33271E]">
                  {planDraft.summary}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
                {[
                  plannerBasisLabel,
                  planDraft.durationLabel,
                  shouldAskFestivalTheme ? planDraft.festivalThemeLabel : null,
                  planDraft.intensityLabel,
                ].filter((item): item is string => Boolean(item)).map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-9 items-center rounded-full bg-[#fffffa] px-4 py-1 text-[12px] font-black leading-4 text-[#33271E]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 px-8 py-8 max-lg:grid-cols-1 max-sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#33271E]">일차별 시간대 흐름</p>
                  <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                    현재 대화에서 정리한 조건으로 만든 전체 일정 초안입니다.
                  </p>
                </div>
                <span className="rounded-full border border-[#A92B10] bg-[#F36B12] px-4 py-2 text-[12px] font-black text-[#33271E]">
                  {planDraft.dayCount}일 구성
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="일차 선택">
                {days.map((day, index) => {
                  const isActive = index === safeDayIndex
                  return (
                    <button
                      key={day.day}
                      id={`day-tab-${day.day}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`day-panel-${day.day}`}
                      onClick={() => setActiveDayIndex(index)}
                      className={`inline-flex min-h-10 items-center rounded-full px-5 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                        isActive
                          ? 'border border-[#A92B10] bg-[#F36B12] text-[#33271E]'
                          : 'border border-[#F3B489] bg-[#fffffa] text-[#33271E] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
                      }`}
                    >
                      {dayTabLabel(day.day)}
                    </button>
                  )
                })}
              </div>

              {activeDay ? (
                <section
                  role="tabpanel"
                  id={`day-panel-${activeDay.day}`}
                  aria-labelledby={`day-tab-${activeDay.day}`}
                  className="mt-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-[18px] bg-[#FFF7F0] px-5 py-4">
                    <div className="min-w-0">
                      <h3
                        id={`plan-detail-day-heading-${activeDay.day}`}
                        className="break-keep text-lg font-black leading-7 text-[#33271E]"
                      >
                        {activeDay.title}
                      </h3>
                      <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                        {activeDay.summary}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                      {activeDay.stops.length}개 코스
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {activeDay.stops.map((item, index) => (
                      <article
                        key={`${activeDay.day}-${item.time}-${item.title}`}
                        className="grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <span className="flex size-10 items-center justify-center rounded-full bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_8px_18px_-14px_rgba(51,39,30,0.5)]">
                            {index + 1}
                          </span>
                          {index < activeDay.stops.length - 1 ? (
                            <span className="mt-2 h-full min-h-8 w-px bg-[#F3B489]/45" />
                          ) : null}
                        </div>
                        <div className="min-w-0 rounded-[20px] border border-transparent bg-[#FFF0E4] p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                              {item.time}
                            </span>
                            <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                              다음 장소까지 {item.move}
                            </span>
                          </div>
                          <h4 className="mt-4 break-keep text-xl font-black leading-8 text-[#33271E] max-sm:text-lg max-sm:leading-7">
                            {item.title}
                          </h4>
                          <p className="mt-2 break-keep text-sm font-semibold leading-7 text-[#33271E]">
                            {item.body}
                          </p>
                          <div className="mt-4 rounded-[16px] border border-transparent bg-[#fffffa] px-4 py-3">
                            <p className="text-[12px] font-black text-[#A92B10]">추천 이유</p>
                            <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="rounded-[20px] border border-transparent bg-[#FFF0E4] p-5">
              <p className="text-sm font-black text-[#33271E]">일정 액션</p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]/80">
                일정을 살펴본 뒤 피드백을 남기거나 마이페이지에 저장해 다시 확인할 수 있습니다.
              </p>
              <div className="mt-5 rounded-[14px] border border-transparent bg-[#fffffa] p-4">
                <p id="plan-detail-like-title" className="break-keep text-sm font-black text-[#33271E]">
                  이 일정은 어땠나요?
                </p>
                <p className="mt-1 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                  좋아요를 누르면 저장되고, 다시 누르면 해제됩니다.
                </p>
                <div className="mt-3">
                  <SavedPlanLikeControls
                    planId={planId}
                    like={planLike}
                    onSelectLike={onSelectSavedPlanLike}
                    pending={savedPlanLikePending}
                    errorMessage={savedPlanLikeError}
                    labelledBy="plan-detail-like-title"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={saveGeneratedPlan}
                  disabled={isCurrentPlanSaved || isPlanSaving}
                  className={`inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                    isCurrentPlanSaved
                      ? 'disabled:cursor-default disabled:bg-[#FF8A2A]'
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
                {isCurrentPlanSaved ? (
                  <button
                    type="button"
                    aria-label="저장 일정 삭제"
                    onClick={() => onDeleteSavedPlan(planId, { navigateToMyPage: true })}
                    disabled={savedPlanDeletePending}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#A92B10] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                  >
                    {savedPlanDeletePending ? '삭제 중' : '저장 일정 삭제'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={returnToChatWorkspace}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  채팅으로 돌아가기
                </button>
                <button
                  type="button"
                  onClick={openMyPage}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  마이페이지로 이동
                </button>
              </div>
              {savedPlanNotice ? (
                <p aria-live="polite" className="mt-4 break-keep text-sm font-black leading-6 text-[#33271E]">
                  {savedPlanNotice}
                </p>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    )
}
