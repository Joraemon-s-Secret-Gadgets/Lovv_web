import { useEffect, useRef } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { getPlannerStepClassName } from './plannerModel'
import type { PlannerStepTone } from './plannerModel'
import type { PlannerCityContext } from '../map-city/smallCities'
import type {
  ChatMessage,
  FestivalThemeChoice,
  MockConditionExtraction,
  PlanDraft,
  PlannerStepStatus,
  PreferenceProfile,
  ThemeId,
} from '../../shared/types/app'
import { PlannerChatInterface } from './PlannerChatInterface'
import { PlannerTimelineView } from './PlannerTimelineView'

const plannerStepToneByThemeId: Partial<Record<ThemeId, PlannerStepTone>> = {
  food_local: 'orange',
  nature_trekking: 'green',
  history_tradition: 'brown',
  healing_rest: 'teal',
  sea_coast: 'blue',
  art_sense: 'purple',
}

const getPlannerStepToneForTheme = (themeId: ThemeId | undefined): PlannerStepTone =>
  (themeId ? plannerStepToneByThemeId[themeId] : undefined) ?? 'orange'

export type PlannerStateStep = {
  id: string
  label: string
  status: PlannerStepStatus
  statusLabel: string
  body: string
  chips: string[]
}

type PlannerWorkspaceProps = {
  goHome: (event?: MouseEvent<HTMLElement>) => void
  plannerCityContext: PlannerCityContext | null
  shouldAskFestivalTheme: boolean
  plannerPreferenceLabel: string
  plannerStateSteps: PlannerStateStep[]
  chatMessages: ChatMessage[]
  shouldShowFestivalPrompt: boolean
  festivalThemeChoice: FestivalThemeChoice
  submitChatMessage: (message: string) => void
  shouldShowDurationPrompt: boolean
  shouldShowTravelMonthPrompt: boolean
  isPlannerReady: boolean
  planDraft: PlanDraft
  plannerConditionExtraction: MockConditionExtraction | null
  chatInput: string
  setChatInput: (value: string) => void
  selectedTravelMonth: number | null
  hasGuidedPlannerChoices: boolean
  canSubmitChatInput: boolean
  submitChatForm: (event: FormEvent<HTMLFormElement>) => void
  currentPlanTitle: string
  plannerPreferenceProfile: PreferenceProfile
  openPlanDetailView: () => void
  isCurrentPlanLiked: boolean
  toggleGeneratedPlanLike: () => void
  resetPlannerFlow: () => void
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
  isPlanSaving?: boolean
  openMyPage: () => void
  savedPlanNotice: string | null
  isPlannerLoading: boolean
  planDestinationName?: string
  activeThemeIds?: ThemeId[]
  onAddThemePreference?: (themeId: ThemeId) => void
  onRemoveThemePreferences?: (themeIdsToRemove: ThemeId[]) => void
}

export function PlannerWorkspace({
  goHome,
  plannerCityContext,
  shouldAskFestivalTheme,
  plannerPreferenceLabel,
  plannerStateSteps,
  chatMessages,
  shouldShowFestivalPrompt,
  festivalThemeChoice,
  submitChatMessage,
  shouldShowDurationPrompt,
  shouldShowTravelMonthPrompt,
  isPlannerReady,
  planDraft,
  plannerConditionExtraction,
  chatInput,
  setChatInput,
  selectedTravelMonth,
  hasGuidedPlannerChoices,
  canSubmitChatInput,
  submitChatForm,
  currentPlanTitle,
  plannerPreferenceProfile,
  openPlanDetailView,
  isCurrentPlanLiked,
  toggleGeneratedPlanLike,
  resetPlannerFlow,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  isPlanSaving = false,
  openMyPage,
  savedPlanNotice,
  isPlannerLoading,
  planDestinationName,
  activeThemeIds,
  onAddThemePreference,
  onRemoveThemePreferences,
}: PlannerWorkspaceProps) {
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const planResultPanelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = chatScrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    if (!isPlannerReady) return
    const el = planResultPanelRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isPlannerReady])

  const activeThemes =
    activeThemeIds && activeThemeIds.length > 0
      ? activeThemeIds
      : plannerPreferenceProfile?.selectedThemeIds ?? []
  const getStepTone = (stepIndex: number) =>
    getPlannerStepToneForTheme(activeThemes[stepIndex % Math.max(activeThemes.length, 1)])

  const renderPlannerStateHeader = () => (
    <section
      aria-label="Planner State"
      data-testid="chat-planner-summary"
      className="min-w-0 rounded-[18px] border border-white/60 bg-[#fffffa]/40 p-6 shadow-[0_18px_42px_-28px_rgba(51,39,30,0.15)] backdrop-blur-2xl"
    >
      <div className="grid grid-cols-[minmax(220px,0.8fr)_minmax(0,1.45fr)_minmax(220px,0.7fr)] items-start gap-5 max-xl:grid-cols-1">
        <div>
          <p className="text-sm font-semibold text-[#33271E]">Lovv AI Planner</p>
          <h2
            id="chat-title"
            className="mt-3 break-keep text-[28px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
          >
            일정 생성하기
          </h2>
          <p className="mt-4 break-keep text-sm leading-6 text-[#33271E]">
            {plannerCityContext
              ? shouldAskFestivalTheme
                ? `${plannerCityContext.cityName} 상세 정보를 기준으로 축제 포함 여부와 여행 기간을 먼저 정리합니다.`
                : `${plannerCityContext.cityName} 상세 정보를 기준으로 여행 기간만 먼저 정리합니다.`
              : `${plannerPreferenceLabel} 기준 테마로 축제 포함 여부와 여행 기간을 먼저 정리합니다.`}
          </p>
        </div>

        <ol aria-label="AI 일정 진행 상태" className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {plannerStateSteps.map((step, index) => (
            <li
              key={step.id}
              className={`min-w-0 rounded-[14px] border px-4 py-3 ${getPlannerStepClassName(step.status, getStepTone(index))}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/55 text-[12px] font-black"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-keep text-sm font-black leading-5">{step.label}</h3>
                    <span className="rounded-[5px] bg-white/45 px-2 py-0.5 text-[11px] font-black leading-4">
                      {step.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 break-keep text-[12px] font-semibold leading-5">
                    {step.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {step.chips.slice(0, 3).map((chip) => (
                      <span
                        key={`${step.id}-${chip}`}
                        className="inline-flex min-h-7 items-center rounded-[5px] bg-white/52 px-2.5 py-0.5 text-[11px] font-black leading-4"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-[14px] border border-white/40 bg-[#FFF8F6]/75 p-5 shadow-[0_14px_30px_-28px_rgba(51,39,30,0.1)] backdrop-blur-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#A92B10]">AI Tip</p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E]">
            {plannerCityContext
              ? shouldAskFestivalTheme
                ? `${plannerCityContext.cityName}의 첫 동선 단서를 유지한 채 기간과 축제 조건만 좁힙니다.`
                : `${plannerCityContext.cityName}의 첫 동선 단서를 유지한 채 여행 기간만 좁힙니다.`
              : '취향, 기간, 축제 포함 여부를 먼저 정리하면 일정 초안의 이동 강도와 추천 이유가 더 분명해집니다.'}
          </p>
        </div>
      </div>
    </section>
  )

  return (
    <section
      id="chat"
      aria-labelledby="chat-title"
      className="mx-auto min-h-dvh max-w-[1500px] px-16 pb-16 pt-[96px] max-lg:px-8 max-sm:px-5"
    >
      <div data-testid="chat-workspace" className="space-y-5">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/60 bg-[#fffffa]/80 px-5 text-sm font-bold text-[#33271E] shadow-sm transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
        >
          ← 이전으로 돌아가기
        </button>
        {renderPlannerStateHeader()}
        <div
          data-testid="chat-top-grid"
          className="grid min-h-[680px] grid-cols-[minmax(0,1.6fr)_minmax(360px,0.74fr)] items-stretch gap-6 xl:h-[min(760px,calc(100dvh-9rem))] max-xl:grid-cols-1"
        >
          <PlannerChatInterface
            chatScrollRef={chatScrollRef}
            chatMessages={chatMessages}
            shouldShowFestivalPrompt={shouldShowFestivalPrompt}
            festivalThemeChoice={festivalThemeChoice}
            submitChatMessage={submitChatMessage}
            shouldShowDurationPrompt={shouldShowDurationPrompt}
            shouldShowTravelMonthPrompt={shouldShowTravelMonthPrompt}
            selectedTravelMonth={selectedTravelMonth}
            isPlannerReady={isPlannerReady}
            planDraft={planDraft}
            plannerConditionExtraction={plannerConditionExtraction}
            chatInput={chatInput}
            setChatInput={setChatInput}
            hasGuidedPlannerChoices={hasGuidedPlannerChoices}
            canSubmitChatInput={canSubmitChatInput}
            submitChatForm={submitChatForm}
            isPlannerLoading={isPlannerLoading}
            shouldAskFestivalTheme={shouldAskFestivalTheme}
          />
          <PlannerTimelineView
            planResultPanelRef={planResultPanelRef}
            isPlannerLoading={isPlannerLoading}
            hasGuidedPlannerChoices={hasGuidedPlannerChoices}
            isPlannerReady={isPlannerReady}
            shouldAskFestivalTheme={shouldAskFestivalTheme}
            shouldShowTravelMonthPrompt={shouldShowTravelMonthPrompt}
            planDestinationName={planDestinationName}
            plannerCityContext={plannerCityContext}
            plannerPreferenceLabel={plannerPreferenceLabel}
            planDraft={planDraft}
            plannerPreferenceProfile={plannerPreferenceProfile}
            currentPlanTitle={currentPlanTitle}
            openPlanDetailView={openPlanDetailView}
            isCurrentPlanLiked={isCurrentPlanLiked}
            toggleGeneratedPlanLike={toggleGeneratedPlanLike}
            saveGeneratedPlan={saveGeneratedPlan}
            isCurrentPlanSaved={isCurrentPlanSaved}
            isPlanSaving={isPlanSaving}
            openMyPage={openMyPage}
            savedPlanNotice={savedPlanNotice}
            resetPlannerFlow={resetPlannerFlow}
            shouldShowFestivalPrompt={shouldShowFestivalPrompt}
            shouldShowDurationPrompt={shouldShowDurationPrompt}
            activeThemeIds={activeThemeIds}
            onAddThemePreference={onAddThemePreference}
            onRemoveThemePreferences={onRemoveThemePreferences}
          />
        </div>
      </div>
    </section>
  )
}
