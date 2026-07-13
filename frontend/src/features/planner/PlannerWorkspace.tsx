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
  selectedDurationLabel: string | null
  submitChatMessage: (message: string) => void
  submitGuidedPlannerChoices: (choices: {
    durationLabel: string
    travelMonth: number
    festivalChoice: Exclude<FestivalThemeChoice, 'undecided'>
  }) => void
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
  selectClarificationOption: (messageId: string, optionId: string) => void
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
  selectedDurationLabel,
  submitChatMessage,
  submitGuidedPlannerChoices,
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
  selectClarificationOption,
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
      className="min-w-0 rounded-[18px] border border-white/60 bg-[#fffffa]/42 px-5 py-4 shadow-[0_14px_34px_-30px_rgba(51,39,30,0.14)] backdrop-blur-2xl"
    >
      <div className="grid grid-cols-[minmax(180px,0.62fr)_minmax(0,1.75fr)] items-center gap-5 max-xl:grid-cols-1">
        <div className="min-w-0">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
            Lovv AI Planner
          </p>
          <h2
            id="chat-title"
            className="mt-2 break-keep text-[26px] font-black leading-8 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
          >
            일정 생성하기
          </h2>
          <p className="sr-only">
            {plannerCityContext
              ? shouldAskFestivalTheme
                ? `${plannerCityContext.cityName} 상세 정보를 기준으로 축제 포함 여부와 여행 기간을 먼저 정리합니다.`
                : `${plannerCityContext.cityName} 상세 정보를 기준으로 여행 기간만 먼저 정리합니다.`
              : `${plannerPreferenceLabel} 기준 테마로 축제 포함 여부와 여행 기간을 먼저 정리합니다.`}
          </p>
        </div>

        <ol
          aria-label="AI 일정 진행 상태"
          className="relative grid grid-cols-3 gap-3 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-2 scroll-smooth"
        >
          {plannerStateSteps.map((step, index) => (
            <li
              key={step.id}
              className={`relative min-w-0 rounded-[12px] border px-3 py-2.5 max-md:w-[220px] max-md:shrink-0 max-md:snap-center ${getPlannerStepClassName(step.status, getStepTone(index))}`}
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-3 top-5 h-px w-3 bg-[#F3B489]/70 max-md:hidden"
                />
              ) : null}
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                    step.status === 'completed'
                      ? 'border-[#F36B12] bg-[#F36B12] text-[#33271E]'
                      : step.status === 'active'
                        ? 'border-[#F36B12] bg-[#fffffa] text-[#A92B10]'
                        : 'border-white/70 bg-white/50 text-[#6E5A50]'
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-black leading-5">{step.label}</h3>
                    <span className="shrink-0 rounded-[5px] bg-white/48 px-2 py-0.5 text-[10px] font-black leading-4">
                      {step.statusLabel}
                    </span>
                  </div>
                  {step.status === 'active' && step.body ? (
                    <p className="mt-1 line-clamp-1 break-keep text-[11px] font-semibold leading-4">
                      {step.body}
                    </p>
                  ) : step.body ? (
                    <span className="sr-only">{step.body}</span>
                  ) : null}
                  {step.status === 'active' && step.chips.length > 0 ? (
                    <div className="mt-1.5 flex min-w-0 gap-1 overflow-hidden">
                    {step.chips.slice(0, 2).map((chip) => (
                      <span
                        key={`${step.id}-${chip}`}
                        className="inline-flex min-h-6 max-w-[92px] shrink-0 items-center truncate rounded-[5px] bg-white/52 px-2 py-0.5 text-[10px] font-black leading-4"
                      >
                        {chip}
                      </span>
                    ))}
                    </div>
                  ) : step.chips.length > 0 ? (
                    <span className="sr-only">{step.chips.join(' ')}</span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
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
          className="grid min-h-[680px] grid-cols-[minmax(0,1.6fr)_minmax(360px,0.74fr)] items-stretch gap-6 xl:h-[min(760px,calc(100dvh-9rem))] max-xl:grid-cols-1 max-xl:h-auto"
        >
          <PlannerChatInterface
            chatScrollRef={chatScrollRef}
            chatMessages={chatMessages}
            shouldShowFestivalPrompt={shouldShowFestivalPrompt}
            festivalThemeChoice={festivalThemeChoice}
            selectedDurationLabel={selectedDurationLabel}
            submitChatMessage={submitChatMessage}
            submitGuidedPlannerChoices={submitGuidedPlannerChoices}
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
            onSelectClarificationOption={selectClarificationOption}
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
