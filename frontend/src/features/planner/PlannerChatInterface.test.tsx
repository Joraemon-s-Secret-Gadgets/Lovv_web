import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlannerChatInterface } from './PlannerChatInterface'
import type { ChatMessage, MockConditionExtraction, PlanDraft } from '../../shared/types/app'

const basePlanDraft: PlanDraft = {
  durationLabel: '1박 2일',
  intensityLabel: '느긋한 일정',
  festivalThemeLabel: '축제 미정',
  summary: '테스트 일정',
  dayCount: 2,
  stops: [],
  days: [],
}

const renderChat = (
  overrides: Partial<React.ComponentProps<typeof PlannerChatInterface>> = {},
) => {
  const props: React.ComponentProps<typeof PlannerChatInterface> = {
    chatScrollRef: { current: null },
    chatMessages: [],
    shouldShowFestivalPrompt: false,
    festivalThemeChoice: 'undecided',
    selectedDurationLabel: null,
    submitChatMessage: vi.fn(),
    submitGuidedPlannerChoices: vi.fn(),
    shouldShowDurationPrompt: false,
    shouldShowTravelMonthPrompt: false,
    selectedTravelMonth: null,
    isPlannerReady: false,
    planDraft: basePlanDraft,
    plannerConditionExtraction: null as MockConditionExtraction | null,
    chatInput: '',
    setChatInput: vi.fn(),
    hasGuidedPlannerChoices: true,
    canSubmitChatInput: false,
    submitChatForm: vi.fn(),
    isPlannerLoading: false,
    shouldAskFestivalTheme: false,
    onSelectClarificationOption: vi.fn(),
    ...overrides,
  }

  render(<PlannerChatInterface {...props} />)

  return props
}

describe('PlannerChatInterface clarification options', () => {
  it('limits natural-language planner input to 300 characters', () => {
    const setChatInput = vi.fn()

    renderChat({ setChatInput })

    const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
    const overLimitInput = '가'.repeat(301)

    expect(input).toHaveAttribute('maxLength', '300')
    expect(screen.getByText('0 / 300')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: overLimitInput } })

    expect(setChatInput).toHaveBeenCalledWith('가'.repeat(300))
  })

  it('continues guided planning without a festival choice when the destination has no festival prompt', () => {
    const submitGuidedPlannerChoices = vi.fn()

    renderChat({
      shouldAskFestivalTheme: false,
      shouldShowDurationPrompt: true,
      hasGuidedPlannerChoices: false,
      submitGuidedPlannerChoices,
    })

    expect(screen.getByText('여행 기간과 희망 월을 한 번에 골라주세요.')).toBeInTheDocument()
    expect(screen.queryByText('축제 포함 여부')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))
    expect(submitGuidedPlannerChoices).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    expect(submitGuidedPlannerChoices).toHaveBeenCalledWith({
      durationLabel: '1박 2일',
      travelMonth: 6,
      festivalChoice: 'exclude',
    })
  })

  it('renders server clarification options as buttons and returns the selected option id', async () => {
    const onSelectClarificationOption = vi.fn()
    const chatMessages: ChatMessage[] = [
      {
        id: 'assistant-clarify-1',
        role: 'assistant',
        content: '축제 포함 여부를 골라주세요.',
        clarification: {
          threadId: 'thread-001',
          recommendationId: 'rec-001',
          reasonCode: 'FESTIVAL_CHOICE_REQUIRED',
          prompt: '축제를 일정에 포함할까요?',
          options: [
            {
              optionId: 'continue_without_festival',
              label: '축제 없이 계속하기',
              helperText: '동선을 먼저 안정적으로 구성합니다.',
              apply: { includeFestivals: false },
              then: 'rerun_discovery',
            },
            {
              optionId: 'include_festival',
              label: '축제 포함하기',
            },
          ],
        },
      },
    ]

    renderChat({ chatMessages, onSelectClarificationOption })

    expect(screen.getByText('축제를 일정에 포함할까요?')).toBeInTheDocument()
    expect(screen.getByText('동선을 먼저 안정적으로 구성합니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /축제 없이 계속하기/ }))

    expect(onSelectClarificationOption).toHaveBeenCalledWith(
      'assistant-clarify-1',
      'continue_without_festival',
    )
  })

  it('shows a retry-later notice without a dedicated generation action', () => {
    renderChat({
      chatMessages: [
        {
          id: 'assistant-new-generation-1',
          role: 'assistant',
          content: '일정 생성 결과를 확인하지 못했어요. 잠시 후 채팅을 다시 시작해 주세요.',
        },
      ],
    })

    expect(screen.getByText('일정 생성 결과를 확인하지 못했어요. 잠시 후 채팅을 다시 시작해 주세요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /새 일정 생성/ })).not.toBeInTheDocument()
  })
})
