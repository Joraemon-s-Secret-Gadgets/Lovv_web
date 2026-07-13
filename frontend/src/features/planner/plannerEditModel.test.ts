import { describe, expect, it } from 'vitest'
import type { PlanDay } from '../../shared/types/app'
import {
  applyPlanDayReplacement,
  applyPlanStopReplacement,
  applyWishlistSummaryToPlanDraft,
  createDayReplacementCandidate,
  createStopReplacementCandidate,
  hasExplicitReplacementDestination,
  parsePlannerEditCommand,
} from './plannerEditModel'

const sampleDays: PlanDay[] = [
  {
    day: 1,
    title: '1일차 추천 일정',
    summary: '첫날 흐름입니다.',
    stops: [
      {
        time: '아침',
        move: '18분',
        title: '하평 해변',
        body: '가볍게 도착하고 바다를 봅니다.',
        reason: '도착 직후 부담이 적습니다.',
      },
      {
        time: '점심',
        move: '24분',
        title: '중앙시장',
        body: '시장 골목을 둘러봅니다.',
        reason: '식사와 산책을 같이 할 수 있습니다.',
      },
      {
        time: '저녁',
        move: '16분',
        title: '해안 산책로',
        body: '저녁 산책으로 마무리합니다.',
        reason: '하루를 느슨하게 정리합니다.',
      },
    ],
  },
]

describe('planner edit model', () => {
  it('parses a single time-slot replacement command', () => {
    expect(parsePlannerEditCommand('1일차 아침 일정 바꿔줘', sampleDays)).toEqual({
      type: 'replace_stop',
      day: 1,
      stopIndex: 0,
      timeLabel: '아침',
      rawText: '1일차 아침 일정 바꿔줘',
    })
  })

  it('parses a day replacement command as confirmation-required', () => {
    expect(parsePlannerEditCommand('1일차 일정 바꿔줘', sampleDays)).toEqual({
      type: 'replace_day_confirmation',
      day: 1,
      rawText: '1일차 일정 바꿔줘',
    })
  })

  it('parses broad plan replacement commands', () => {
    expect(parsePlannerEditCommand('도시 바꿔줘', sampleDays)).toEqual({
      type: 'replace_plan',
      rawText: '도시 바꿔줘',
    })
  })

  it('parses ordinal stop replacement commands', () => {
    expect(parsePlannerEditCommand('1일차 2번째 장소를 시장 말고 카페로 바꿔줘', sampleDays)).toEqual({
      type: 'replace_stop',
      day: 1,
      stopIndex: 1,
      timeLabel: '점심',
      rawText: '1일차 2번째 장소를 시장 말고 카페로 바꿔줘',
    })
  })

  it('uses the active day for ordinal stop replacement commands without day text', () => {
    expect(parsePlannerEditCommand('두 번째를 카페로 바꿔줘', sampleDays, 1)).toEqual({
      type: 'replace_stop',
      day: 1,
      stopIndex: 1,
      timeLabel: '점심',
      rawText: '두 번째를 카페로 바꿔줘',
    })
  })

  it('returns null for unsupported edit commands', () => {
    expect(parsePlannerEditCommand('그냥 좋아', sampleDays)).toBeNull()
  })

  it('detects direct destination replacement requests before they reach the agent', () => {
    expect(hasExplicitReplacementDestination('1일차 점심을 설악해변으로 바꿔줘')).toBe(true)
    expect(hasExplicitReplacementDestination('두 번째 장소를 카페로 변경해줘')).toBe(true)
    expect(hasExplicitReplacementDestination('1일차 2번째 중앙시장 바꿔줘')).toBe(false)
    expect(hasExplicitReplacementDestination('1일차 점심을 실내 위주로 찾아줘')).toBe(false)
  })

  it('replaces only the selected stop', () => {
    const replacement = createStopReplacementCandidate(sampleDays[0], 0, '강릉')
    const nextDays = applyPlanStopReplacement(sampleDays, 1, 0, replacement)

    expect(nextDays[0].stops[0].title).not.toBe('하평 해변')
    expect(nextDays[0].stops[1]).toEqual(sampleDays[0].stops[1])
    expect(nextDays[0].stops[2]).toEqual(sampleDays[0].stops[2])
  })

  it('refreshes summaries from the edited stop list', () => {
    const replacement = {
      ...sampleDays[0].stops[0],
      title: '새 아침 산책로',
      body: '바뀐 첫 장소입니다.',
    }
    const nextDays = applyPlanStopReplacement(sampleDays, 1, 0, replacement)
    const nextDraft = applyWishlistSummaryToPlanDraft({
      durationLabel: '당일치기',
      dayCount: 1,
      intensityLabel: '동선이 느슨한 일정',
      festivalThemeLabel: '축제 제외',
      summary: '하평 해변을 방문하고 중앙시장을 둘러보는 일정입니다.',
      days: nextDays,
      stops: nextDays.flatMap((day) => day.stops),
    })

    expect(nextDraft.days[0].summary).toBe('새 아침 산책로 ➔ 중앙시장 ➔ 해안 산책로 등을 차례로 방문하는 일정입니다.')
    expect(nextDraft.summary).toContain('새 아침 산책로')
    expect(nextDraft.summary).not.toContain('하평 해변')
  })

  it('replaces only the selected day', () => {
    const replacement = createDayReplacementCandidate(sampleDays[0], '강릉')
    const nextDays = applyPlanDayReplacement(sampleDays, 1, replacement)

    expect(nextDays).toHaveLength(1)
    expect(nextDays[0].day).toBe(1)
    expect(nextDays[0].stops).toHaveLength(sampleDays[0].stops.length)
    expect(nextDays[0].stops[0].title).not.toBe(sampleDays[0].stops[0].title)
  })
})
