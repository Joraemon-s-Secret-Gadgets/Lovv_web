/**
 * @file PlannerChatInterface.tsx
 * @description Chatbot interaction panel for the travel planner workspace.
 * @lastModified 2026-06-23
 */

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import foxFaceImage from '../../assets/foxhead-smile.png'
import {
  durationGuidePrompts,
  festivalThemePrompts,
  followUpPrompts,
  getTravelMonthLabel,
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
  submitChatMessage: (message: string) => void
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
}

export function PlannerChatInterface({
  chatScrollRef,
  chatMessages,
  shouldShowFestivalPrompt,
  festivalThemeChoice,
  submitChatMessage,
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
}: PlannerChatInterfaceProps) {
  
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
    <div className="flex max-w-[760px] items-start gap-3 animate-[lovv-chip-in_0.3s_ease-out_both]">
      <span
        className="mt-6 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F3B489]/50 bg-[#FFF0E4] shadow-[0_8px_18px_-10px_rgba(51,39,30,0.35)]"
        aria-hidden="true"
      >
        <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0 rounded-[22px] border border-white/60 bg-[#fffffa]/70 p-3 shadow-[0_18px_38px_-30px_rgba(51,39,30,0.22)] backdrop-blur-md">
        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#315B3E]">
          Lovv Planner
        </p>
        <div className="inline-flex max-w-full rounded-[16px] border border-[#F3B489]/20 bg-white px-5 py-4 text-sm font-bold leading-6 text-[#33271E] shadow-sm max-sm:text-[13px] max-sm:leading-6">
          {promptText}
        </div>
        <div className={`mt-3 ${optionsClassName}`}>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.selected}
              onClick={option.onClick}
              className={`inline-flex min-h-[38px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                option.selected
                  ? 'border-[#F36B12]/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E] shadow-[0_8px_16px_-6px_rgba(243,107,18,0.3)] scale-[1.02] font-black'
                  : 'border-white/70 bg-white/70 shadow-sm hover:border-[#F36B12]/40 hover:bg-[#FFF0E4] hover:translate-y-[-1px] hover:shadow-[0_8px_16px_-8px_rgba(243,107,18,0.25)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <section
      aria-label="여행 조건을 대화로 정리하기"
      data-testid="chat-conversation-panel"
      className="lovv-chat-panel flex h-full min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/70 shadow-[0_28px_64px_-40px_rgba(51,39,30,0.34)] xl:min-h-0"
    >
      <header className="border-b border-white/60 bg-[#FFF8F6]/76 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A92B10]">
              Conversation
            </p>
            <h3 className="mt-2 break-keep text-2xl font-black leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
              여행 조건을 대화로 정리하기
            </h3>
            <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6E5A50] max-sm:text-[13px]">
              대화에서 조건을 좁히고, 옆 요약 패널에서 일정 초안을 바로 확인합니다.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/70 bg-[#fffffa]/85 px-3 py-2 shadow-sm backdrop-blur-sm">
            <span
              className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-[#F3B489]/50 bg-[#FFF0E4]"
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
        className="lovv-chat-scroll flex-1 space-y-5 overflow-y-auto px-6 py-6"
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
                  className="mt-6 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F3B489]/50 bg-[#FFF0E4] shadow-[0_8px_18px_-10px_rgba(51,39,30,0.35)]"
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
                  {isAssistant ? 'Lovv Planner' : '내 조건'}
                </p>
                <div
                  className={`break-keep whitespace-pre-wrap rounded-[22px] border px-5 py-4 text-sm leading-6 text-[#33271E] shadow-sm max-sm:text-[13px] max-sm:leading-6 ${
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
          <div aria-label="조건 해석 결과" className="rounded-[20px] border border-white/60 bg-[#FFF8F6]/84 p-5 shadow-[0_14px_30px_-26px_rgba(51,39,30,0.18)] backdrop-blur-sm">
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

      <div className="border-t border-white/60 bg-[#FFF8F6]/72 p-5 backdrop-blur-md">
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
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[24px] border border-white/70 bg-[#fffffa]/82 p-2 shadow-[0_18px_34px_-28px_rgba(51,39,30,0.22)] max-sm:grid-cols-1 max-sm:rounded-[22px] focus-within:border-[#F36B12]/40 focus-within:bg-white focus-within:shadow-[0_12px_24px_-10px_rgba(243,107,18,0.25)] focus-within:ring-2 focus-within:ring-[#F36B12]/10 transition-all duration-200 backdrop-blur-sm"
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
                  : '동행, 관심사, 걷는 정도를 자연어로 입력해 주세요.'
                : shouldShowTravelMonthPrompt
                  ? '여행 예정 월을 먼저 선택해 주세요'
                : shouldAskFestivalTheme
                  ? '축제 포함 여부와 여행 기간을 먼저 선택해 주세요'
                  : '여행 기간을 먼저 선택해 주세요'
            }
            className="min-h-12 min-w-0 rounded-[18px] border-0 bg-transparent px-4 py-2 break-keep text-sm leading-5 text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-65 transition-all focus:bg-transparent max-sm:text-[13px]"
          />
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
