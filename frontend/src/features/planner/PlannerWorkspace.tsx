import foxFaceImage from '../../assets/foxhead-smile.png'
import type { FormEvent, MouseEvent } from 'react'
import {
  durationGuidePrompts,
  festivalThemePrompts,
  getTravelMonthLabel,
  getPlannerStepClassName,
  travelMonthPrompts,
} from './plannerModel'
import { getThemeDefinition } from '../onboarding/preferenceModel'
import type { PlannerCityContext } from '../map-city/smallCities'
import type {
  ChatMessage,
  FestivalThemeChoice,
  MockConditionExtraction,
  PlanDay,
  PlanDraft,
  PlannerStepStatus,
  PreferenceProfile,
} from '../../shared/types/app'

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
  selectedPlanDay: PlanDay
  setSelectedPlanDayNumber: (dayNumber: number) => void
  openPlanDetailView: () => void
  isCurrentPlanLiked: boolean
  toggleGeneratedPlanLike: () => void
  resetPlannerFlow: () => void
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
  savedPlanNotice: string | null
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
  selectedPlanDay,
  setSelectedPlanDayNumber,
  openPlanDetailView,
  isCurrentPlanLiked,
  toggleGeneratedPlanLike,
  resetPlannerFlow,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  savedPlanNotice,
}: PlannerWorkspaceProps) {
  const renderPlannerStateHeader = () => (
    <section
      aria-label="Planner State"
      data-testid="chat-planner-summary"
      className="min-w-0 rounded-[18px] border border-transparent bg-[#fffffa]/92 p-6 shadow-[0_18px_42px_-28px_rgba(51,39,30,0.22)]"
    >
      <div className="grid grid-cols-[minmax(220px,0.8fr)_minmax(0,1.45fr)_minmax(220px,0.7fr)] items-start gap-5 max-xl:grid-cols-1">
        <div>
          <p className="text-sm font-semibold text-[#33271E]">Lovv AI Planner</p>
          <h2
            id="chat-title"
            className="mt-3 break-keep text-[28px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
          >
            AI 일정 챗봇
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
              className={`min-w-0 rounded-[14px] border px-4 py-3 ${getPlannerStepClassName(step.status)}`}
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
                    {step.chips.slice(0, 2).map((chip) => (
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

        <div className="rounded-[14px] border border-transparent bg-[#FFF8F6] p-5 shadow-[0_14px_30px_-28px_rgba(51,39,30,0.28)]">
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

  const renderAssistantOptionGroup = (
    promptText: string,
    options: {
      key: string
      label: string
      selected?: boolean
      onClick: () => void
    }[],
  ) => (
    <div className="flex max-w-[720px] items-start gap-3">
      <span
        className="mt-6 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E4] shadow-[0_8px_20px_-16px_rgba(51,39,30,0.5)]"
        aria-hidden="true"
      >
        <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#315B3E]">
          Lovv AI
        </p>
        <div className="inline-flex max-w-full rounded-[18px] border border-transparent bg-white px-5 py-4 text-sm font-bold leading-6 text-[#33271E] shadow-[0_12px_24px_-20px_rgba(51,39,30,0.28)] max-sm:text-[13px] max-sm:leading-6">
          {promptText}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.selected}
              onClick={option.onClick}
              className={`inline-flex min-h-[38px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                option.selected
                  ? 'border-[#A92B10] bg-[#F36B12]'
                  : 'border-transparent bg-[#FFF8F6]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderChatConversationPanel = () => (
    <section
      aria-labelledby="chat-title"
      data-testid="chat-conversation-panel"
      className="flex min-h-[660px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-transparent bg-[#fffffa] shadow-[0_18px_42px_-28px_rgba(51,39,30,0.22)]"
    >
      <header className="bg-[#FFF8F6] px-6 py-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A92B10]">
              Lovv Conversation
            </p>
            <h3 className="mt-2 break-keep text-2xl font-black leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
              여행 조건을 대화로 정리하기
            </h3>
          </div>
          <span
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E4] shadow-[0_8px_20px_-16px_rgba(51,39,30,0.55)]"
            aria-hidden="true"
          >
            <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
          </span>
        </div>
      </header>
      <div role="log" aria-label="AI 일정 대화" className="flex-1 space-y-5 px-6 py-6">
        {chatMessages.map((message) => {
          const isAssistant = message.role === 'assistant'

          return (
            <article
              key={message.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant ? (
                <span
                  className="mt-6 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E4] shadow-[0_8px_20px_-16px_rgba(51,39,30,0.5)]"
                  aria-hidden="true"
                >
                  <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <div className={`min-w-0 max-w-[620px] ${isAssistant ? '' : 'items-end text-right'}`}>
                <p
                  className={`mb-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                    isAssistant ? 'text-[#315B3E]' : 'text-[#A92B10]'
                  }`}
                >
                  {isAssistant ? 'Lovv AI' : '내 조건'}
                </p>
                <div
                  className={`break-keep rounded-[18px] border px-5 py-4 text-sm leading-6 text-[#33271E] shadow-[0_12px_24px_-20px_rgba(51,39,30,0.25)] max-sm:text-[13px] max-sm:leading-6 ${
                    isAssistant
                      ? 'border-transparent bg-white'
                      : 'ml-auto border-transparent bg-[#F36B12] font-semibold'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </article>
          )
        })}

        {shouldShowFestivalPrompt
          ? renderAssistantOptionGroup(
              '축제 테마를 일정에 포함할까요?',
              festivalThemePrompts.map((prompt) => ({
                key: prompt.choice,
                label: prompt.label,
                selected: festivalThemeChoice === prompt.choice,
                onClick: () => submitChatMessage(prompt.label),
              })),
            )
          : null}

        {shouldShowDurationPrompt
          ? renderAssistantOptionGroup(
              '일정 기간을 먼저 골라주세요',
              durationGuidePrompts.map((prompt) => ({
                key: prompt,
                label: prompt,
                onClick: () => submitChatMessage(prompt),
              })),
            )
          : null}

        {shouldShowTravelMonthPrompt
          ? renderAssistantOptionGroup(
              '여행 예정 월을 골라주세요',
              travelMonthPrompts.map((month) => ({
                key: String(month),
                label: getTravelMonthLabel(month),
                selected: selectedTravelMonth === month,
                onClick: () => submitChatMessage(getTravelMonthLabel(month)),
              })),
            )
          : null}

        {isPlannerReady ? (
          <div aria-label="조건 해석 결과" className="rounded-[18px] border border-transparent bg-[#FFF8F6] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[5px] bg-[#fffffa] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                일정 초안
              </span>
              <span className="rounded-[5px] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                {planDraft.durationLabel}
              </span>
              <span className="rounded-[5px] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                {planDraft.intensityLabel} 반영
              </span>
              {plannerConditionExtraction?.activeRequiredThemes.map((themeId) => (
                <span
                  key={`active-theme-${themeId}`}
                  className="rounded-[5px] bg-[#fffffa] px-3 py-1 text-[12px] font-bold text-[#33271E]"
                >
                  {getThemeDefinition(themeId).label}
                </span>
              ))}
            </div>
            <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
              하단 일정 상세에 반영했어요. 시간대별 동선과 추천 이유를 이어서 확인해 주세요.
            </p>
            {plannerConditionExtraction?.softPreferences.length ? (
              <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                추가 조건: {plannerConditionExtraction.softPreferences.join(' · ')}
              </p>
            ) : null}
            {plannerConditionExtraction?.unsupportedConditions.length ? (
              <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#A92B10]">
                아직 반영하지 않는 조건: {plannerConditionExtraction.unsupportedConditions.join(' · ')}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="bg-[#FFF8F6] p-5">
        <form
          onSubmit={submitChatForm}
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-full border border-[#F3B489]/70 bg-[#fffffa] p-2 shadow-[0_16px_32px_-26px_rgba(51,39,30,0.35)] max-sm:grid-cols-1 max-sm:rounded-[22px]"
        >
          <input
            aria-label="여행 조건 입력"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            disabled={!hasGuidedPlannerChoices}
            placeholder={
              hasGuidedPlannerChoices
                ? isPlannerReady
                  ? '추가로 원하는 조건을 입력해 주세요'
                  : '동행, 관심사, 걷는 정도를 추가로 입력해 주세요'
                : shouldShowTravelMonthPrompt
                  ? '여행 예정 월을 먼저 선택해 주세요'
                : shouldAskFestivalTheme
                  ? '축제 포함 여부와 여행 기간을 먼저 선택해 주세요'
                  : '여행 기간을 먼저 선택해 주세요'
            }
            className="min-h-11 min-w-0 rounded-full border-0 bg-transparent px-4 py-2 break-keep text-sm leading-5 text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-65 focus:bg-[#FFF8F6] max-sm:text-[13px]"
          />
          <button
            type="submit"
            aria-label="메시지 보내기"
            disabled={!canSubmitChatInput}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-bold text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#A92B10] disabled:hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            보내기
          </button>
        </form>
      </div>
    </section>
  )

  const renderItineraryPanel = () => {
    if (!isPlannerReady) {
      return (
        <section
          aria-label="AI 일정 결과"
          className="flex min-h-[660px] flex-col justify-between rounded-[18px] border border-transparent bg-[#fffffa] p-6 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
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
          <div className="mt-8 rounded-[18px] border border-transparent bg-[#FFF0E4] p-5">
            <p className="text-[12px] font-bold text-[#33271E]">다음 입력</p>
            <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
              {shouldShowFestivalPrompt
                ? '축제 테마를 포함할지 먼저 골라주세요.'
                : shouldShowDurationPrompt
                  ? '당일치기부터 4박 5일까지 여행 기간을 선택해 주세요.'
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
        aria-labelledby="generated-plan-title"
        className="min-h-[660px] overflow-hidden rounded-[18px] border border-transparent bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
      >
        <div className="bg-[#FFF0E4] px-6 py-6">
          <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
            <div>
              <p className="text-sm font-semibold text-[#33271E]">맞춤 일정 결과</p>
              <h3
                id="generated-plan-title"
                className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7"
              >
                생성된 일정 상세
              </h3>
              <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                챗봇에서 정리된 조건을 바탕으로, 오른쪽 일정 패널에 결과를 보여줍니다.
              </p>
            </div>
            <span className="inline-flex h-10 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-[12px] font-bold text-[#33271E]">
              {planDraft.dayCount}일 구성
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {[
              planDraft.intensityLabel,
              plannerCityContext
                ? `${plannerCityContext.cityName} 중심`
                : `${plannerPreferenceLabel} 중심`,
              shouldAskFestivalTheme ? `${planDraft.festivalThemeLabel} 반영` : null,
              `${plannerPreferenceProfile.selectedThemeIds.length}개 테마 반영`,
            ].filter((item): item is string => Boolean(item)).map((item) => (
              <span
                key={item}
                className="inline-flex min-h-11 min-w-0 items-center rounded-[14px] bg-[#fffffa] px-4 py-2 break-keep text-sm font-bold leading-5 text-[#33271E] max-sm:text-[13px]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4 max-md:grid-cols-1">
            <div>
              <p className="text-sm font-bold text-[#33271E]">일차별 추천 일정</p>
              <h4 className="mt-2 break-keep text-xl font-bold leading-7 text-[#33271E] max-sm:text-lg max-sm:leading-6">
                {currentPlanTitle}
              </h4>
              <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                장소를 확정하기 전, 취향에 맞는 전체 여행 흐름과 이동 강도를 먼저 확인합니다.{' '}
                {planDraft.summary}
              </p>
            </div>
            <span className="rounded-full bg-[#FFF0E4] px-4 py-2 text-[12px] font-bold text-[#33271E]">
              총 {planDraft.stops.length}개 코스
            </span>
          </div>

          <div className="mt-6 grid grid-cols-[140px_minmax(0,1fr)] gap-5 max-md:grid-cols-1">
            <div className="rounded-[18px] bg-[#FFF7F0] p-3">
              <p className="px-2 text-[12px] font-black uppercase text-[#897163]">Days</p>
              <div
                role="tablist"
                aria-label="일차 선택"
                className="mt-3 flex flex-col gap-2 max-md:flex-row max-md:overflow-x-auto max-md:pb-1"
              >
                {planDraft.days.map((day) => {
                  const isSelectedDay = day.day === selectedPlanDay.day

                  return (
                    <button
                      key={day.day}
                      type="button"
                      role="tab"
                      id={`generated-plan-day-tab-${day.day}`}
                      aria-selected={isSelectedDay}
                      aria-controls={`generated-plan-day-panel-${day.day}`}
                      onClick={() => setSelectedPlanDayNumber(day.day)}
                      className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                        isSelectedDay
                          ? 'bg-[#F36B12] text-[#33271E] shadow-[0_10px_22px_-18px_rgba(51,39,30,0.45)]'
                          : 'bg-[#fffffa] text-[#33271E] hover:bg-[#FFE0CA]'
                      }`}
                    >
                      {day.day}일차
                    </button>
                  )
                })}
              </div>
            </div>

            <section
              id={`generated-plan-day-panel-${selectedPlanDay.day}`}
              role="tabpanel"
              aria-labelledby={`generated-plan-day-tab-${selectedPlanDay.day}`}
              className="min-w-0 rounded-[20px] bg-[#FFF7F0] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#F36B12]">
                    Day {selectedPlanDay.day}
                  </p>
                  <h5
                    id={`generated-plan-day-${selectedPlanDay.day}`}
                    className="mt-2 break-keep text-lg font-black leading-7 text-[#33271E] max-sm:text-base"
                  >
                    {selectedPlanDay.title}
                  </h5>
                  <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                    {selectedPlanDay.summary}
                  </p>
                </div>
                <span className="rounded-full bg-[#fffffa] px-4 py-2 text-[12px] font-bold text-[#33271E]">
                  {selectedPlanDay.stops.length}개 코스
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {selectedPlanDay.stops.map((item, index) => (
                  <article
                    key={`${selectedPlanDay.day}-${item.time}`}
                    className="grid grid-cols-[38px_minmax(0,1fr)] gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_8px_18px_-14px_rgba(51,39,30,0.5)]">
                        {index + 1}
                      </span>
                      {index < selectedPlanDay.stops.length - 1 ? (
                        <span className="mt-2 h-full w-px bg-[#F3B489]/45" />
                      ) : null}
                    </div>
                    <div className="min-w-0 rounded-[18px] border border-transparent bg-[#FFF0E4] p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                          {item.time}
                        </span>
                        <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-semibold leading-4 text-[#33271E]">
                          다음 장소까지 {item.move}
                        </span>
                      </div>
                      <h6 className="mt-4 break-keep text-lg font-bold leading-7 text-[#33271E] max-sm:text-base max-sm:leading-6">
                        {item.title}
                      </h6>
                      <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                        {item.body}
                      </p>
                      <div className="mt-4 rounded-[14px] border border-transparent bg-[#fffffa] px-4 py-3">
                        <p className="text-[12px] font-bold text-[#33271E]">추천 이유</p>
                        <p className="mt-1 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <button
              type="button"
              onClick={openPlanDetailView}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              세부 일정 보기
            </button>
            <button
              type="button"
              aria-pressed={isCurrentPlanLiked}
              onClick={toggleGeneratedPlanLike}
              className={`inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-bold text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                isCurrentPlanLiked
                  ? 'border-[#A92B10] bg-[#F36B12] hover:bg-[#FF8A2A]'
                  : 'border-[#F3B489] bg-[#fffffa] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
              }`}
            >
              {isCurrentPlanLiked ? '좋아요 취소' : '좋아요'}
            </button>
            <button
              type="button"
              onClick={() => resetPlannerFlow()}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              일정 다시짜기
            </button>
          </div>

          <section
            aria-labelledby="save-plan-cta-title"
            className="mt-6 rounded-[20px] border border-transparent bg-[#FFF0E4] p-5"
          >
            <p className="text-center text-2xl font-black leading-8 text-[#F36B12]" aria-hidden="true">
              ♥
            </p>
            <h5
              id="save-plan-cta-title"
              className="mt-2 break-keep text-center text-xl font-black leading-7 text-[#33271E] max-sm:text-lg"
            >
              추천 일정이 마음에 드세요?
            </h5>
            <p className="mt-2 break-keep text-center text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
              담은 일정은 마이페이지에서 다시 확인하고 리뷰를 남길 수 있어요.
            </p>
            <button
              type="button"
              onClick={saveGeneratedPlan}
              disabled={isCurrentPlanSaved}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-default disabled:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              {isCurrentPlanSaved ? '마이페이지에 저장됨' : '마이페이지에 저장'}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <button
                type="button"
                onClick={() => resetPlannerFlow()}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                새로운 추천받기
              </button>
              <button
                type="button"
                onClick={goHome}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                다시하기
              </button>
            </div>
          </section>
          {savedPlanNotice ? (
            <p aria-live="polite" className="mt-4 break-keep text-sm font-bold leading-6 text-[#33271E]">
              {savedPlanNotice}
            </p>
          ) : null}
        </div>
      </section>
    )
  }


  return (
    <section
      id="chat"
      aria-labelledby="chat-title"
      className="mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
    >
      <div data-testid="chat-workspace" className="space-y-5">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
        >
          ← 이전으로 돌아가기
        </button>
        {renderPlannerStateHeader()}
        <div
          data-testid="chat-top-grid"
          className="grid min-h-[660px] grid-cols-[minmax(0,0.96fr)_minmax(360px,0.82fr)] items-start gap-6 max-xl:grid-cols-1"
        >
          {renderChatConversationPanel()}
          {renderItineraryPanel()}
        </div>
      </div>
    </section>
  )
}
