/**
 * @file PlannerChatInterface.tsx
 * @description Chatbot interaction panel for the travel planner workspace.
 * @author JJonyeok2
 * @lastModified 2026-07-16
 */

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import foxFaceImage from '../../assets/foxhead-smile.png'
import {
  durationGuidePrompts,
  festivalThemePrompts,
  followUpPrompts,
  getTravelMonthLabel,
  limitPlannerNaturalLanguageInput,
  plannerNaturalLanguageMaxLength,
  travelMonthPrompts,
} from './plannerModel'
import { getThemeDefinition } from '../onboarding/preferenceModel'
import type {
  ChatMessage,
  FestivalThemeChoice,
  MockConditionExtraction,
  PlanDraft,
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

type PlannerChatInterfaceProps = {
  chatScrollRef: React.RefObject<HTMLDivElement | null>
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
  selectedTravelMonth: number | null
  isPlannerReady: boolean
  planDraft: PlanDraft
  plannerConditionExtraction: MockConditionExtraction | null
  chatInput: string
  setChatInput: (value: string) => void
  hasGuidedPlannerChoices: boolean
  canSubmitChatInput: boolean
  submitChatForm: (event: FormEvent<HTMLFormElement>) => void
  isPlannerLoading: boolean
  shouldAskFestivalTheme: boolean
  onSelectClarificationOption: (messageId: string, optionId: string) => void
}

export function PlannerChatInterface({
  chatScrollRef,
  chatMessages,
  shouldShowFestivalPrompt,
  festivalThemeChoice,
  selectedDurationLabel,
  submitChatMessage,
  submitGuidedPlannerChoices,
  shouldShowDurationPrompt,
  shouldShowTravelMonthPrompt,
  selectedTravelMonth,
  isPlannerReady,
  planDraft,
  plannerConditionExtraction,
  chatInput,
  setChatInput,
  hasGuidedPlannerChoices,
  canSubmitChatInput,
  submitChatForm,
  isPlannerLoading,
  shouldAskFestivalTheme,
  onSelectClarificationOption,
}: PlannerChatInterfaceProps) {
  const [draftDurationLabel, setDraftDurationLabel] = useState<string | null>(selectedDurationLabel)
  const [draftTravelMonth, setDraftTravelMonth] = useState<number | null>(selectedTravelMonth)
  const [draftFestivalChoice, setDraftFestivalChoice] = useState<Exclude<FestivalThemeChoice, 'undecided'> | null>(
    hasGuidedPlannerChoices && festivalThemeChoice !== 'undecided' ? festivalThemeChoice : null,
  )

  const maybeSubmitGuidedPlannerChoices = ({
    durationLabel = draftDurationLabel,
    travelMonth = draftTravelMonth,
    festivalChoice = draftFestivalChoice,
  }: {
    durationLabel?: string | null
    travelMonth?: number | null
    festivalChoice?: Exclude<FestivalThemeChoice, 'undecided'> | null
  }) => {
    const effectiveFestivalChoice = shouldAskFestivalTheme ? festivalChoice : 'exclude'

    if (!durationLabel || !travelMonth || !effectiveFestivalChoice || hasGuidedPlannerChoices || isPlannerLoading) {
      return
    }

    submitGuidedPlannerChoices({ durationLabel, travelMonth, festivalChoice: effectiveFestivalChoice })
  }

  const renderGuidedPlannerChoiceCard = () => {
    const shouldShowGuidedChoiceCard =
      !hasGuidedPlannerChoices &&
      (shouldShowDurationPrompt || shouldShowTravelMonthPrompt || shouldShowFestivalPrompt)

    if (!shouldShowGuidedChoiceCard) {
      return null
    }

    return (
      <div className="flex max-w-[820px] items-start gap-3 animate-[lovv-chip-in_0.3s_ease-out_both]">
        <span
          className="mt-6 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F3B489]/50 bg-[#FFF0E4] shadow-[0_8px_18px_-10px_rgba(51,39,30,0.35)]"
          aria-hidden="true"
        >
          <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0 rounded-[22px] border border-white/60 bg-[#fffffa]/70 p-4 shadow-[0_18px_38px_-30px_rgba(51,39,30,0.22)] backdrop-blur-md">
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#315B3E]">
            Lovv Planner
          </p>
          <div className="rounded-[16px] border border-[#F3B489]/20 bg-white px-5 py-4 text-sm font-bold leading-6 text-[#33271E] shadow-sm max-sm:text-[13px] max-sm:leading-6">
            {shouldAskFestivalTheme
              ? '여행 기간, 희망 월, 축제 포함 여부를 한 번에 골라주세요.'
              : '여행 기간과 희망 월을 한 번에 골라주세요.'}
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-[12px] font-black text-[#A92B10]">일정 기간</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {durationGuidePrompts.map((durationLabel) => (
                  <button
                    key={durationLabel}
                    type="button"
                    aria-pressed={draftDurationLabel === durationLabel}
                    onClick={() => {
                      setDraftDurationLabel(durationLabel)
                      maybeSubmitGuidedPlannerChoices({ durationLabel })
                    }}
                    className={`inline-flex min-h-[38px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                      draftDurationLabel === durationLabel
                        ? 'border-[#F36B12]/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] font-black shadow-[0_8px_16px_-6px_rgba(243,107,18,0.3)]'
                        : 'border-white/70 bg-white/70 shadow-sm hover:-translate-y-0.5 hover:border-[#F36B12]/40 hover:bg-[#FFF0E4]'
                    }`}
                  >
                    {durationLabel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-black text-[#A92B10]">희망 월</p>
              <div className="mt-2 grid grid-cols-6 gap-2 max-sm:grid-cols-4">
                {travelMonthPrompts.map((month) => (
                  <button
                    key={month}
                    type="button"
                    aria-pressed={draftTravelMonth === month}
                    onClick={() => {
                      setDraftTravelMonth(month)
                      maybeSubmitGuidedPlannerChoices({ travelMonth: month })
                    }}
                    className={`inline-flex min-h-[36px] items-center justify-center rounded-full border px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                      draftTravelMonth === month
                        ? 'border-[#F36B12]/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] font-black shadow-[0_8px_16px_-6px_rgba(243,107,18,0.3)]'
                        : 'border-white/70 bg-white/70 shadow-sm hover:-translate-y-0.5 hover:border-[#F36B12]/40 hover:bg-[#FFF0E4]'
                    }`}
                  >
                    {getTravelMonthLabel(month)}
                  </button>
                ))}
              </div>
            </div>

            {shouldAskFestivalTheme ? (
              <div>
                <p className="text-[12px] font-black text-[#A92B10]">축제 포함 여부</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {festivalThemePrompts.map((prompt) => (
                    <button
                      key={prompt.choice}
                      type="button"
                      aria-pressed={draftFestivalChoice === prompt.choice}
                      onClick={() => {
                        if (prompt.choice === 'undecided') return
                        setDraftFestivalChoice(prompt.choice)
                        maybeSubmitGuidedPlannerChoices({ festivalChoice: prompt.choice })
                      }}
                      className={`inline-flex min-h-[38px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                        draftFestivalChoice === prompt.choice
                          ? 'border-[#F36B12]/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] font-black shadow-[0_8px_16px_-6px_rgba(243,107,18,0.3)]'
                          : 'border-white/70 bg-white/70 shadow-sm hover:-translate-y-0.5 hover:border-[#F36B12]/40 hover:bg-[#FFF0E4]'
                      }`}
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label="여행 조건을 대화로 정리하기"
      data-testid="chat-conversation-panel"
      className="lovv-chat-panel flex h-full min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/70 shadow-[0_28px_64px_-40px_rgba(51,39,30,0.34)] xl:min-h-0 max-xl:h-[600px] max-sm:h-[480px] max-sm:min-h-0"
    >
      <header className="border-b border-white/60 bg-[#FFF8F6]/76 px-6 py-4 backdrop-blur-sm max-sm:px-4 max-sm:py-3">
        <div className="flex items-center justify-between gap-5">
          <div>
            <h3
              aria-label="여행 조건을 대화로 정리하기"
              className="break-keep text-xl font-black leading-7 text-[#33271E] max-sm:text-xl max-sm:leading-7"
            >
              AI 일정 대화
            </h3>
            <p className="sr-only">
              대화에서 조건을 좁히고, 옆 요약 패널에서 일정 초안을 바로 확인합니다.
            </p>
          </div>
          <div aria-label="Lovv Planner" className="flex shrink-0 items-center rounded-full border border-white/70 bg-[#fffffa]/85 p-1 shadow-sm backdrop-blur-sm">
            <span
              className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-[#F3B489]/50 bg-[#FFF0E4]"
              aria-hidden="true"
            >
              <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
            </span>
          </div>
        </div>
      </header>
      
      <div
        ref={chatScrollRef}
        role="log"
        aria-label="AI 일정 대화"
        className="lovv-chat-scroll flex-1 space-y-5 overflow-y-auto px-6 py-6 max-sm:px-4 max-sm:py-4"
      >
        {chatMessages.map((message) => {
          const isAssistant = message.role === 'assistant'
          const isLoading = message.id === 'loading-assistant'

          return (
            <article
              key={message.id}
              className={`flex gap-3 animate-[lovv-chip-in_0.3s_ease-out_both] ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant ? (
                <span
                  className="mt-6 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F3B489]/50 bg-[#FFF0E4] shadow-[0_8px_18px_-10px_rgba(51,39,30,0.35)] max-sm:mt-4 max-sm:size-8"
                  aria-hidden="true"
                >
                  <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <div
                className={`min-w-0 ${
                  isAssistant ? 'max-w-[min(720px,82%)] max-sm:max-w-[88%]' : 'max-w-[min(600px,76%)] max-sm:max-w-[84%] items-end text-right'
                }`}
              >
                <p className="sr-only">
                  {isAssistant ? 'Lovv Planner' : '내 조건'}
                </p>
                <div
                  className={`break-keep whitespace-pre-wrap rounded-[22px] border px-5 py-4 text-sm leading-6 text-[#33271E] shadow-sm max-sm:rounded-[18px] max-sm:px-4 max-sm:py-3 max-sm:text-[13px] max-sm:leading-5 ${
                    isAssistant
                      ? 'lovv-chat-bubble-assistant border-white/70 bg-white/78 backdrop-blur-sm shadow-[0_12px_26px_-22px_rgba(51,39,30,0.3)]'
                      : 'lovv-chat-bubble-user ml-auto border-[#E65E12]/25 bg-[#F36B12] text-[#33271E] font-bold shadow-[0_12px_24px_-10px_rgba(243,107,18,0.35)] transition-all duration-200 hover:scale-[1.01]'
                  }`}
                >
                  {isLoading ? (
                    <LoadingBubble query={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
                {isAssistant && message.clarification ? (
                  <div
                    role="group"
                    aria-label="추가 확인 선택지"
                    className="mt-3 rounded-[20px] border border-[#F3B489]/25 bg-[#FFF8F6]/88 p-4 shadow-[0_12px_28px_-24px_rgba(51,39,30,0.24)] backdrop-blur-sm max-sm:p-3"
                  >
                    <p className="break-keep text-sm font-black leading-6 text-[#33271E] max-sm:text-[13px] max-sm:leading-5">
                      {message.clarification.prompt}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {message.clarification.options.map((option) => {
                        const isSelected = message.clarification?.selectedOptionId === option.optionId
                        const isDisabled = isPlannerLoading || Boolean(message.clarification?.selectedOptionId)

                        return (
                          <button
                            key={option.optionId}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isDisabled}
                            onClick={() => onSelectClarificationOption(message.id, option.optionId)}
                            className={`group rounded-[14px] border px-4 py-3 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed ${
                              isSelected
                                ? 'border-[#F36B12]/50 bg-[#FFE0CA] shadow-[0_10px_20px_-16px_rgba(243,107,18,0.45)]'
                                : 'border-white/70 bg-white/84 hover:border-[#F36B12]/40 hover:bg-white hover:shadow-[0_10px_18px_-15px_rgba(243,107,18,0.34)] disabled:opacity-60'
                            }`}
                          >
                            <span className="block break-keep text-sm font-black leading-5 text-[#33271E] max-sm:text-[13px] max-sm:leading-4">
                              {option.label}
                            </span>
                            {option.description || option.helperText ? (
                              <span className="mt-1 block break-keep text-[12px] font-semibold leading-5 text-[#6E5A50] max-sm:text-[11px] max-sm:leading-4">
                                {option.description || option.helperText}
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}

        {renderGuidedPlannerChoiceCard()}

        {isPlannerReady &&
        (plannerConditionExtraction?.softPreferences.length || plannerConditionExtraction?.unsupportedConditions.length) ? (
          <div aria-label="조건 해석 결과" className="rounded-[16px] border border-white/60 bg-[#FFF8F6]/84 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-[5px] bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#33271E]">
                {planDraft.durationLabel}
              </span>
              {plannerConditionExtraction?.activeRequiredThemes.map((themeId) => (
                <span
                  key={`active-theme-${themeId}`}
                  className="rounded-[5px] bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#33271E]"
                >
                  {getThemeDefinition(themeId).label}
                </span>
              ))}
            </div>
            {plannerConditionExtraction?.softPreferences.length ? (
              <p className="break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
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

      <div className="border-t border-white/60 bg-[#FFF8F6]/72 p-5 backdrop-blur-md max-sm:p-3.5">
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
                  className="inline-flex min-h-9 items-center rounded-full border border-white/70 bg-white/70 px-4 text-[12px] font-bold text-[#33271E] transition-all duration-200 hover:border-[#F36B12]/40 hover:bg-[#FFF0E4] hover:translate-y-[-1px] hover:shadow-[0_8px_16px_-8px_rgba(243,107,18,0.25)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        
        <form
          onSubmit={submitChatForm}
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[24px] border border-white/70 bg-[#fffffa]/82 p-2 shadow-[0_18px_34px_-28px_rgba(51,39,30,0.22)] max-sm:gap-2 max-sm:p-1.5 max-sm:rounded-[20px] focus-within:border-[#F36B12]/40 focus-within:bg-white focus-within:shadow-[0_12px_24px_-10px_rgba(243,107,18,0.25)] focus-within:ring-2 focus-within:ring-[#F36B12]/10 transition-all duration-200 backdrop-blur-sm"
        >
          <div className="min-w-0">
            <input
              aria-label="여행 조건 입력"
              aria-describedby="planner-chat-input-count"
              value={chatInput}
              maxLength={plannerNaturalLanguageMaxLength}
              onChange={(event) => setChatInput(limitPlannerNaturalLanguageInput(event.target.value))}
              disabled={!hasGuidedPlannerChoices}
              placeholder={
                hasGuidedPlannerChoices
                  ? isPlannerReady
                    ? '추가로 원하는 조건을 입력해 주세요'
                    : '동행자, 관심사, 걷는 정도를 입력해 주세요. ex) 여자친구와 함께, 힐링 여행'
                  : shouldShowFestivalPrompt
                    ? '축제 포함 여부를 먼저 선택해 주세요'
                  : shouldShowTravelMonthPrompt
                    ? '여행 예정 월을 먼저 선택해 주세요'
                  : shouldAskFestivalTheme
                    ? '여행 기간, 여행 월, 축제 포함 여부를 먼저 선택해 주세요'
                    : '여행 기간을 먼저 선택해 주세요'
              }
              className="min-h-12 w-full min-w-0 rounded-[18px] border-0 bg-transparent px-4 py-2 break-keep text-sm leading-5 text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-65 transition-all focus:bg-transparent max-sm:px-2 max-sm:text-[13px] max-sm:placeholder:text-[12px]"
            />
            <p
              id="planner-chat-input-count"
              className="min-h-4 px-4 text-right text-[10px] font-bold tabular-nums text-[#8A7467] max-sm:px-2"
            >
              {chatInput.length} / {plannerNaturalLanguageMaxLength}
            </p>
          </div>
          <button
            type="submit"
            aria-label="메시지 보내기"
            disabled={!canSubmitChatInput}
            className="inline-flex min-h-12 items-center justify-center rounded-[18px] border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-6 text-sm font-black text-[#33271E] shadow-sm transition hover:scale-[1.02] hover:shadow-[0_8px_16px_-6px_rgba(243,107,18,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            보내기
          </button>
        </form>
      </div>
    </section>
  )
}

// EOF: PlannerChatInterface.tsx
