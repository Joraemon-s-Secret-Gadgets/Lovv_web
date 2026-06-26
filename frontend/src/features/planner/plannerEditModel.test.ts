import { describe, expect, it } from 'vitest'
import type { PlanDay } from '../../shared/types/app'
import {
  applyPlanDayReplacement,
  applyPlanStopReplacement,
  createDayReplacementCandidate,
  createStopReplacementCandidate,
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

  it('returns null for unsupported edit commands', () => {
    expect(parsePlannerEditCommand('전체 여행 다시 짜줘', sampleDays)).toBeNull()
  })

  it('replaces only the selected stop', () => {
    const replacement = createStopReplacementCandidate(sampleDays[0], 0, '강릉')
    const nextDays = applyPlanStopReplacement(sampleDays, 1, 0, replacement)

    expect(nextDays[0].stops[0].title).not.toBe('하평 해변')
    expect(nextDays[0].stops[1]).toEqual(sampleDays[0].stops[1])
    expect(nextDays[0].stops[2]).toEqual(sampleDays[0].stops[2])
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
