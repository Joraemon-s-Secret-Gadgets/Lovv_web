import foxFaceImage from '../../assets/foxhead-smile.png'
import { useState, useEffect, useRef } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import {
  durationGuidePrompts,
  festivalThemePrompts,
  followUpPrompts,
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
  PlanDraft,
  PlannerStepStatus,
  PreferenceProfile,
} from '../../shared/types/app'

function getLoadingMessages(query: string): string[] {
  const q = query.toLowerCase()
  const matched: string[] = []

  if (/오토바이|바이크|자전거|드라이브|렌트카|차로/.test(q)) {
    matched.push('이동 경로를 반영 중이에요', '코스 동선을 최적화 중이에요')
  }
  if (/맛집|음식|먹|식당|카페|노포|로컬|해산물|술/.test(q)) {
    matched.push('맛집 코스를 구성 중이에요', '로컬 맛집을 찾는 중이에요')
  }
  if (/바다|해변|해수욕|해안|서핑|스노클/.test(q)) {
    matched.push('바다 일정을 짜는 중이에요')
  }
  if (/여자친구|남자친구|커플|연인|데이트|둘이|같이/.test(q)) {
    matched.push('둘만의 코스를 고르는 중이에요')
  }
  if (/가족|아이|애|자녀|부모|아빠|엄마/.test(q)) {
    matched.push('가족 동선을 반영 중이에요')
  }
  if (/온천|쉬|휴양|힐링|느긋|천천|느리/.test(q)) {
    matched.push('여유로운 일정을 배치 중이에요')
  }
  if (/걷|트레킹|등산|하이킹|산/.test(q)) {
    matched.push('걷기 좋은 동선을 고르는 중이에요')
  }
  if (/사진|인생샷|포토|뷰|경치|풍경/.test(q)) {
    matched.push('포토 스팟을 찾는 중이에요')
  }
  if (/야경|밤|저녁|노을|일몰/.test(q)) {
    matched.push('저녁 코스를 구성 중이에요')
  }
  if (/혼자|솔로|1인/.test(q)) {
    matched.push('나만의 코스를 짜는 중이에요')
  }

  return [
    ...matched,
    '일정을 생성 중이에요',
    '추천 장소를 선별 중이에요',
    'AI가 최적 코스를 찾는 중이에요',
    '잠시만 기다려 주세요',
  ]
}

function LoadingBubble({ query }: { query: string }) {
  const messages = getLoadingMessages(query)
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <span className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 py-0.5" aria-label="AI가 일정을 생성하고 있습니다">
        <span className="size-2 rounded-full bg-[#F36B12] opacity-60" style={{ animation: 'lovv-bounce 1.2s ease-in-out infinite', animationDelay: '0ms' }} />
        <span className="size-2 rounded-full bg-[#F36B12] opacity-60" style={{ animation: 'lovv-bounce 1.2s ease-in-out infinite', animationDelay: '200ms' }} />
        <span className="size-2 rounded-full bg-[#F36B12] opacity-60" style={{ animation: 'lovv-bounce 1.2s ease-in-out infinite', animationDelay: '400ms' }} />
      </span>
      <span
        className="text-[13px] font-semibold text-[#6E5A50]"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        {messages[index]}
      </span>
    </span>
  )
}

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

  const renderAssistantOptionGroup = (
    promptText: string,
    options: {
      key: string
      label: string
      selected?: boolean
      onClick: () => void
    }[],
    optionsClassName = 'flex flex-wrap gap-2',
  ) => (
    <div className="flex max-w-[760px] items-start gap-3">
      <span
        className="mt-6 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E4] shadow-[0_10px_22px_-16px_rgba(51,39,30,0.5)]"
        aria-hidden="true"
      >
        <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0 rounded-[20px] border border-white/50 bg-white/45 p-3 shadow-[0_16px_34px_-28px_rgba(51,39,30,0.15)] backdrop-blur-md">
        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#315B3E]">
          Lovv AI
        </p>
        <div className="inline-flex max-w-full rounded-[16px] border border-transparent bg-[#fffffa] px-5 py-4 text-sm font-bold leading-6 text-[#33271E] max-sm:text-[13px] max-sm:leading-6">
          {promptText}
        </div>
        <div className={`mt-3 ${optionsClassName}`}>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.selected}
              onClick={option.onClick}
              className={`inline-flex min-h-[38px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                option.selected
                  ? 'border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E] shadow-sm hover:scale-[1.01]'
                  : 'border-white/60 bg-[#fffffa]/60 hover:bg-[#FFE0CA]'
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
      className="flex h-full min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/60 bg-[#fffffa]/40 shadow-[0_24px_56px_-34px_rgba(51,39,30,0.25)] backdrop-blur-2xl xl:min-h-0"
    >
      <header className="border-b border-white/50 bg-[#FFF8F6]/60 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A92B10]">
              Lovv Conversation
            </p>
            <h3 className="mt-2 break-keep text-2xl font-black leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
              여행 조건을 대화로 정리하기
            </h3>
            <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6E5A50] max-sm:text-[13px]">
              대화에서 조건을 좁히고, 옆 요약 패널에서 일정 초안을 바로 확인합니다.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/60 bg-[#fffffa]/80 px-3 py-2 shadow-sm backdrop-blur-sm">
            <span
              className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E4]"
              aria-hidden="true"
            >
              <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-[12px] font-black text-[#33271E] max-sm:hidden">대화 우선</span>
          </div>
        </div>
      </header>
      <div
        ref={chatScrollRef}
        role="log"
        aria-label="AI 일정 대화"
        className="flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,250,0.4),rgba(255,248,246,0.3))] px-6 py-6"
      >
        {chatMessages.map((message) => {
          const isAssistant = message.role === 'assistant'
          const isLoading = message.id === 'loading-assistant'

          return (
            <article
              key={message.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant ? (
                <span
                  className="mt-6 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E4] shadow-[0_10px_22px_-16px_rgba(51,39,30,0.5)]"
                  aria-hidden="true"
                >
                  <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <div
                className={`min-w-0 ${
                  isAssistant ? 'max-w-[min(720px,82%)]' : 'max-w-[min(600px,76%)] items-end text-right'
                }`}
              >
                <p
                  className={`mb-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                    isAssistant ? 'text-[#315B3E]' : 'text-[#A92B10]'
                  }`}
                >
                  {isAssistant ? 'Lovv AI' : '내 조건'}
                </p>
                <div
                  className={`break-keep whitespace-pre-wrap rounded-[20px] border px-5 py-4 text-sm leading-6 text-[#33271E] shadow-sm max-sm:text-[13px] max-sm:leading-6 ${
                    isAssistant
                      ? 'border-white/50 bg-white/60 backdrop-blur-sm'
                      : 'ml-auto border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E] font-bold shadow-sm'
                  }`}
                >
                  {isLoading ? (
                    <LoadingBubble query={message.content} />
                  ) : (
                    message.content
                  )}
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
              'grid grid-cols-6 gap-2',
            )
          : null}

        {isPlannerReady ? (
          <div aria-label="조건 해석 결과" className="rounded-[18px] border border-white/40 bg-[#FFF8F6]/75 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[5px] border border-white/65 bg-[#fffffa]/90 px-3 py-1 text-[12px] font-bold text-[#33271E] shadow-sm">
                일정 초안
              </span>
              <span className="rounded-[5px] border border-white/65 bg-[#FFF0E4]/90 px-3 py-1 text-[12px] font-bold text-[#33271E] shadow-sm">
                {planDraft.durationLabel}
              </span>
              {plannerConditionExtraction?.activeRequiredThemes.map((themeId) => (
                <span
                  key={`active-theme-${themeId}`}
                  className="rounded-[5px] border border-white/65 bg-[#fffffa]/90 px-3 py-1 text-[12px] font-bold text-[#33271E] shadow-sm"
                >
                  {getThemeDefinition(themeId).label}
                </span>
              ))}
            </div>
            <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
              요약 패널에 반영했어요. 시간대별 동선과 추천 이유는 세부 일정에서 이어서 확인해 주세요.
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
      <div className="border-t border-white/50 bg-[#FFF8F6]/40 p-5 backdrop-blur-md">
        {isPlannerReady ? (
          <div className="mb-3">
            <p className="text-[12px] font-black text-[#A92B10]">자주 쓰는 조건</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {followUpPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => submitChatMessage(prompt.query)}
                  disabled={isPlannerLoading}
                  className="inline-flex min-h-9 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-[12px] font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form
          onSubmit={submitChatForm}
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[24px] border border-white/60 bg-white/65 p-2 shadow-[0_16px_32px_-26px_rgba(51,39,30,0.15)] max-sm:grid-cols-1 max-sm:rounded-[22px] backdrop-blur-sm"
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
            className="min-h-12 min-w-0 rounded-[18px] border-0 bg-transparent px-4 py-2 break-keep text-sm leading-5 text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-65 transition-all focus:bg-white max-sm:text-[13px]"
          />
          <button
            type="submit"
            aria-label="메시지 보내기"
            disabled={!canSubmitChatInput}
            className="inline-flex min-h-12 items-center justify-center rounded-[18px] border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-6 text-sm font-black text-[#33271E] shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            보내기
          </button>
        </form>
      </div>
    </section>
  )

  const renderSkeletonItineraryPanel = () => (
    <section
      aria-label="AI 일정 생성 중"
      aria-busy="true"
      className="flex h-full min-h-[680px] flex-col overflow-hidden rounded-[22px] border border-white/50 bg-[#fffffa]/30 shadow-[0_18px_44px_-32px_rgba(33,46,33,0.1)] xl:sticky xl:top-[96px] xl:min-h-0 backdrop-blur-xl"
    >
      {/* Mirrors renderItineraryPanel's result header 1:1 so there is no layout jump when the
          real plan replaces this. Known values (city for city flows, day count, theme chips)
          render for real; only genuinely-unknown content (title body, summary, day details)
          stays as a shimmer. */}
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
        <div className="grid grid-cols-[1fr_auto] items-start gap-4 max-md:grid-cols-1">
          <div>
            <p className="text-sm font-bold text-[#33271E]">추천 흐름 요약</p>
            <h4 className="mt-2 break-keep text-xl font-bold leading-7 text-[#33271E] max-sm:text-lg max-sm:leading-6">
              {currentPlanTitle}
            </h4>
            <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
              AI가 코스를 정리하는 중이에요. 잠시만 기다려 주세요.
            </p>
          </div>
          <span
            className="h-9 w-20 rounded-full bg-[#F3B489]/30"
            style={{ animation: 'lovv-pulse 1.6s ease-in-out infinite' }}
          />
        </div>

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

  const renderItineraryPanel = () => {
    if (isPlannerLoading && hasGuidedPlannerChoices) {
      return renderSkeletonItineraryPanel()
    }

    if (!isPlannerReady) {
      return (
        <section
          aria-label="AI 일정 결과"
          className="flex h-full min-h-[680px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/50 bg-[#fffffa]/30 p-6 shadow-[0_18px_44px_-32px_rgba(33,46,33,0.1)] xl:sticky xl:top-[96px] xl:min-h-0 backdrop-blur-xl"
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
        className="flex h-full min-h-[680px] flex-col overflow-hidden rounded-[22px] border border-white/50 bg-[#fffffa]/30 shadow-[0_18px_44px_-32px_rgba(33,46,33,0.1)] xl:sticky xl:top-[96px] xl:min-h-0 backdrop-blur-xl"
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
              <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                챗봇에서 정리된 조건을 바탕으로, 핵심 흐름만 압축해서 보여줍니다.
              </p>
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
          <div className="grid grid-cols-[1fr_auto] items-start gap-4 max-md:grid-cols-1">
            <div>
              <p className="text-sm font-bold text-[#33271E]">추천 흐름 요약</p>
              <h4 className="mt-2 break-keep text-xl font-bold leading-7 text-[#33271E] max-sm:text-lg max-sm:leading-6">
                {currentPlanTitle}
              </h4>
              <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                여기서는 코스를 빠르게 확인하고, 추천 이유는 세부 일정에서 확인합니다.
              </p>
            </div>
            <span className="rounded-full border border-white/60 bg-[#fffffa]/80 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-sm">
              총 {planDraft.stops.length}개 코스
            </span>
          </div>

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
      </section>
    )
  }


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
          {renderChatConversationPanel()}
          {renderItineraryPanel()}
        </div>
      </div>
    </section>
  )
}
