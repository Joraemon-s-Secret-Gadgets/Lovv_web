import { describe, it, expect } from 'vitest'
import {
  getExplicitDurationLabel,
  getDurationLabel,
  getDurationDayCount,
  wantsLessWalking,
  resolveFestivalThemeChoice,
  getExplicitTravelMonth,
  getTravelMonthLabel,
  createPlanDraft,
  durationGuidePrompts,
  getFallbackPreference,
} from './plannerModel'

// ── getExplicitDurationLabel ──────────────────────────────────────────────────
describe('getExplicitDurationLabel', () => {
  it('빈 문자열이면 null 반환', () => {
    expect(getExplicitDurationLabel('')).toBeNull()
  })

  it('공백만 있으면 null 반환', () => {
    expect(getExplicitDurationLabel('   ')).toBeNull()
  })

  it('"당일치기" 키워드 인식', () => {
    expect(getExplicitDurationLabel('당일치기로 다녀오고 싶어요')).toBe('당일치기')
  })

  it('"당일" 키워드 인식', () => {
    expect(getExplicitDurationLabel('당일로 갈게요')).toBe('당일치기')
  })

  it('"하루" 키워드 인식', () => {
    expect(getExplicitDurationLabel('하루 여행')).toBe('당일치기')
  })

  it('1박 2일 파싱', () => {
    expect(getExplicitDurationLabel('1박 2일로 짜줘')).toBe('1박 2일')
  })

  it('2박 3일 파싱', () => {
    expect(getExplicitDurationLabel('2박 3일 일정 부탁해')).toBe('2박 3일')
  })

  it('3박 4일 파싱', () => {
    expect(getExplicitDurationLabel('3박 4일')).toBe('3박 4일')
  })

  it('숫자만 있는 일수 — 2일 → 1박 2일', () => {
    expect(getExplicitDurationLabel('2일 일정')).toBe('1박 2일')
  })

  it('숫자만 있는 일수 — 1일 → 당일치기', () => {
    expect(getExplicitDurationLabel('1일 코스')).toBe('당일치기')
  })

  it('키워드 없으면 null', () => {
    expect(getExplicitDurationLabel('바다 근처 맛집 위주로')).toBeNull()
  })
})

// ── getDurationLabel ──────────────────────────────────────────────────────────
describe('getDurationLabel', () => {
  it('기간 없으면 fallback "1일"', () => {
    expect(getDurationLabel('맛있는 거 먹고 싶어')).toBe('1일')
  })

  it('기간 있으면 해당 label 반환', () => {
    expect(getDurationLabel('1박 2일로 짜줘')).toBe('1박 2일')
  })
})

// ── getDurationDayCount ───────────────────────────────────────────────────────
describe('getDurationDayCount', () => {
  it('당일치기 → 1', () => {
    expect(getDurationDayCount('당일치기')).toBe(1)
  })

  it('1박 2일 → 2', () => {
    expect(getDurationDayCount('1박 2일')).toBe(2)
  })

  it('2박 3일 → 3', () => {
    expect(getDurationDayCount('2박 3일')).toBe(3)
  })

  it('3박 4일 → 4', () => {
    expect(getDurationDayCount('3박 4일')).toBe(4)
  })

  it('알 수 없는 label → 1 fallback', () => {
    expect(getDurationDayCount('알수없는값')).toBe(1)
  })

  it('1일 → 1', () => {
    expect(getDurationDayCount('1일')).toBe(1)
  })
})

// ── wantsLessWalking ──────────────────────────────────────────────────────────
describe('wantsLessWalking', () => {
  it('"덜 걷고" → true', () => {
    expect(wantsLessWalking('덜 걷고 싶어요')).toBe(true)
  })

  it('"여유" → true', () => {
    expect(wantsLessWalking('여유 있게 다니고 싶어요')).toBe(true)
  })

  it('"혼자" → true', () => {
    expect(wantsLessWalking('혼자 조용히 다니고 싶어')).toBe(true)
  })

  it('"동선" → true', () => {
    expect(wantsLessWalking('동선 짧게 잡아줘')).toBe(true)
  })

  it('해당 없으면 false', () => {
    expect(wantsLessWalking('적극적으로 많이 보고 싶어요')).toBe(false)
  })
})

// ── resolveFestivalThemeChoice ────────────────────────────────────────────────
describe('resolveFestivalThemeChoice', () => {
  it('"축제 포함" → include', () => {
    expect(resolveFestivalThemeChoice('축제 포함해줘', 'undecided')).toBe('include')
  })

  it('"행사 포함" → include', () => {
    expect(resolveFestivalThemeChoice('행사도 포함해줘', 'undecided')).toBe('include')
  })

  it('"축제 제외" → exclude', () => {
    expect(resolveFestivalThemeChoice('축제 제외하고', 'include')).toBe('exclude')
  })

  it('"축제 없이" → exclude', () => {
    expect(resolveFestivalThemeChoice('축제 없이 가고 싶어', 'undecided')).toBe('exclude')
  })

  it('관련 키워드 없으면 currentChoice 유지', () => {
    expect(resolveFestivalThemeChoice('바다 근처로', 'include')).toBe('include')
    expect(resolveFestivalThemeChoice('바다 근처로', 'undecided')).toBe('undecided')
  })
})

// ── getExplicitTravelMonth ────────────────────────────────────────────────────
describe('getExplicitTravelMonth', () => {
  it('"5월" → 5', () => {
    expect(getExplicitTravelMonth('5월에 가고 싶어요')).toBe(5)
  })

  it('"12월" → 12', () => {
    expect(getExplicitTravelMonth('12월 여행이에요')).toBe(12)
  })

  it('"1월" → 1', () => {
    expect(getExplicitTravelMonth('1월 초에 갈게요')).toBe(1)
  })

  it('월 표현 없으면 null', () => {
    expect(getExplicitTravelMonth('가을에 가고 싶어요')).toBeNull()
  })

  it('빈 문자열 → null', () => {
    expect(getExplicitTravelMonth('')).toBeNull()
  })
})

// ── getTravelMonthLabel ───────────────────────────────────────────────────────
describe('getTravelMonthLabel', () => {
  it('null → "월 미정"', () => {
    expect(getTravelMonthLabel(null)).toBe('월 미정')
  })

  it('5 → "5월"', () => {
    expect(getTravelMonthLabel(5)).toBe('5월')
  })

  it('12 → "12월"', () => {
    expect(getTravelMonthLabel(12)).toBe('12월')
  })
})

// ── durationGuidePrompts ──────────────────────────────────────────────────────
describe('durationGuidePrompts', () => {
  it('3개 항목만 존재 (당일치기, 1박 2일, 2박 3일)', () => {
    expect(durationGuidePrompts).toEqual(['당일치기', '1박 2일', '2박 3일'])
  })

  it('3박 4일, 4박 5일 포함하지 않음', () => {
    expect(durationGuidePrompts).not.toContain('3박 4일')
    expect(durationGuidePrompts).not.toContain('4박 5일')
  })
})

// ── createPlanDraft ───────────────────────────────────────────────────────────
describe('createPlanDraft', () => {
  const preference = getFallbackPreference()

  it('당일치기 → dayCount 1, stops 3개', () => {
    const draft = createPlanDraft(preference, '당일치기로 갈게요')
    expect(draft.dayCount).toBe(1)
    expect(draft.days).toHaveLength(1)
    expect(draft.days[0].stops).toHaveLength(3)
    expect(draft.durationLabel).toBe('당일치기')
  })

  it('1박 2일 → dayCount 2, 각 day 3개 stops', () => {
    const draft = createPlanDraft(preference, '1박 2일')
    expect(draft.dayCount).toBe(2)
    expect(draft.days).toHaveLength(2)
    draft.days.forEach(day => expect(day.stops).toHaveLength(3))
  })

  it('2박 3일 → dayCount 3, 총 9개 stops', () => {
    const draft = createPlanDraft(preference, '2박 3일')
    expect(draft.dayCount).toBe(3)
    expect(draft.stops).toHaveLength(9)
  })

  it('기간 없으면 dayCount 1 (getDurationLabel fallback "1일")', () => {
    const draft = createPlanDraft(preference, '맛집 위주로')
    expect(draft.dayCount).toBe(1)
  })

  it('각 stop은 time(아침|점심|저녁), title, body, reason, move 필드를 가짐', () => {
    const draft = createPlanDraft(preference, '당일치기')
    const stop = draft.days[0].stops[0]
    expect(['아침', '점심', '저녁']).toContain(stop.time)
    expect(typeof stop.title).toBe('string')
    expect(typeof stop.body).toBe('string')
    expect(typeof stop.reason).toBe('string')
    expect(typeof stop.move).toBe('string')
  })

  it('stops 배열은 days.flatMap(stops)와 동일', () => {
    const draft = createPlanDraft(preference, '2박 3일')
    expect(draft.stops).toEqual(draft.days.flatMap(d => d.stops))
  })

  it('day title이 "N일차 추천 일정" 형식', () => {
    const draft = createPlanDraft(preference, '2박 3일')
    expect(draft.days[0].title).toBe('1일차 추천 일정')
    expect(draft.days[1].title).toBe('2일차 추천 일정')
    expect(draft.days[2].title).toBe('3일차 추천 일정')
  })

  it('wantsLessWalking 반영 — "여유" → intensityLabel 덜 걷는 일정', () => {
    const draft = createPlanDraft(preference, '여유 있게 2박 3일')
    expect(draft.intensityLabel).toBe('덜 걷는 일정')
  })

  it('기본값 → intensityLabel 동선이 느슨한 일정', () => {
    const draft = createPlanDraft(preference, '2박 3일')
    expect(draft.intensityLabel).toBe('동선이 느슨한 일정')
  })
})
