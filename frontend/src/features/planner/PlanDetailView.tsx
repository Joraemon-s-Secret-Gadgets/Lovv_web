import type { PlanDraft, PlanReactionType } from '../../shared/types/app'
import { PlanReactionControls } from '../saved-plans/PlanReactionControls'

type PlanDetailViewProps = {
  isPlannerReady: boolean
  shouldAskFestivalTheme: boolean
  returnToChatWorkspace: () => void
  currentPlanTitle: string
  planDraft: PlanDraft
  plannerBasisLabel: string
  planId: string
  planReaction: PlanReactionType
  onSelectPlanReaction: (planId: string, reaction: Exclude<PlanReactionType, null>) => void
  planReactionPending?: boolean
  planReactionError?: string | null
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
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
  planId,
  planReaction,
  onSelectPlanReaction,
  planReactionPending = false,
  planReactionError = null,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  openMyPage,
  savedPlanNotice,
}: PlanDetailViewProps) {
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

    return (
      <section className="mx-auto min-h-dvh max-w-[1280px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
        <div
          role="region"
          aria-labelledby="plan-detail-title"
          className="overflow-hidden rounded-[24px] border border-transparent bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]"
        >
          <div className="bg-[#FFF0E4] px-8 py-7 max-sm:px-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                  Plan detail
                </p>
                <h1
                  id="plan-detail-title"
                  className="mt-4 break-keep text-[34px] font-black leading-[44px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                >
                  세부 일정 상세
                </h1>
                <h2 className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                  {currentPlanTitle}
                </h2>
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

              <div className="mt-7 space-y-7">
                {planDraft.days.map((day) => (
                  <section key={day.day} aria-labelledby={`plan-detail-day-${day.day}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 rounded-[18px] bg-[#FFF7F0] px-5 py-4">
                      <div className="min-w-0">
                        <h3
                          id={`plan-detail-day-${day.day}`}
                          className="break-keep text-lg font-black leading-7 text-[#33271E]"
                        >
                          {day.title}
                        </h3>
                        <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                          {day.summary}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                        {day.stops.length}개 코스
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      {day.stops.map((item, index) => (
                        <article
                          key={`${day.day}-${item.time}-${item.title}`}
                          className="grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <span className="flex size-10 items-center justify-center rounded-full bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_8px_18px_-14px_rgba(51,39,30,0.5)]">
                              {index + 1}
                            </span>
                            {index < day.stops.length - 1 ? (
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
                ))}
              </div>
            </div>

            <aside className="rounded-[20px] border border-transparent bg-[#FFF0E4] p-5">
              <p className="text-sm font-black text-[#33271E]">일정 액션</p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]/80">
                일정을 살펴본 뒤 피드백을 남기거나 마이페이지에 저장해 다시 확인할 수 있습니다.
              </p>
              <div className="mt-5 rounded-[14px] border border-transparent bg-[#fffffa] p-4">
                <p id="plan-detail-reaction-title" className="break-keep text-sm font-black text-[#33271E]">
                  이 일정은 어땠나요?
                </p>
                <p className="mt-1 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                  좋아요와 싫어요 중 하나만 선택되며, 다시 누르면 선택이 해제됩니다.
                </p>
                <div className="mt-3">
                  <PlanReactionControls
                    planId={planId}
                    reaction={planReaction}
                    onSelectReaction={onSelectPlanReaction}
                    pending={planReactionPending}
                    errorMessage={planReactionError}
                    labelledBy="plan-detail-reaction-title"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={saveGeneratedPlan}
                  disabled={isCurrentPlanSaved}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] disabled:cursor-default disabled:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {isCurrentPlanSaved ? '마이페이지에 저장됨' : '마이페이지에 저장'}
                </button>
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
