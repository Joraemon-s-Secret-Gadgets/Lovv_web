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
  getPlannerBaselineThemeIds,
} from './plannerModel'
import { applyWishlistSummaryToPlanDraft, removeWishlistRestaurantStops } from './plannerEditModel'
import type { PlannerCityContext } from '../map-city/smallCities'
import type { PlanDay, PlanDraft, PreferenceProfile, SelectedMealPlace } from '../../shared/types/app'

const naturePreferenceProfile: PreferenceProfile = {
  version: 2,
  countryTrack: 'KR',
  selectedThemeIds: ['nature_trekking'],
  source: 'onboarding',
  updatedAt: '2026-07-16T00:00:00.000Z',
}

const coastalFoodCityContext: PlannerCityContext = {
  cityId: 'kr-gangneung',
  cityName: '강릉',
  country: 'KR',
  countryLabel: '한국',
  region: '강원',
  themes: ['바다', '미식'],
  routeSeed: ['경포해변', '중앙시장'],
  summary: '바다와 미식이 대표적인 소도시입니다.',
  festivals: [],
  festivalCount: 0,
  hasFestivalContent: false,
}

describe('getPlannerBaselineThemeIds', () => {
  it('도시 기본 테마보다 사용자가 선택한 자연·트레킹 테마를 우선한다', () => {
    expect(getPlannerBaselineThemeIds(naturePreferenceProfile, coastalFoodCityContext)).toEqual([
      'nature_trekking',
    ])
  })

  it('사용자 테마가 여러 개면 선택 순서를 그대로 유지한다', () => {
    expect(
      getPlannerBaselineThemeIds(
        {
          ...naturePreferenceProfile,
          selectedThemeIds: ['art_sense', 'nature_trekking'],
        },
        coastalFoodCityContext,
      ),
    ).toEqual(['art_sense', 'nature_trekking'])
  })

  it('사용자 테마가 비어 있을 때만 도시 테마를 fallback으로 사용한다', () => {
    expect(
      getPlannerBaselineThemeIds(
        {
          ...naturePreferenceProfile,
          selectedThemeIds: [],
        },
        coastalFoodCityContext,
      ),
    ).toEqual(['sea_coast', 'food_local'])
  })
})

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

describe('removeWishlistRestaurantStops', () => {
  const restaurant: SelectedMealPlace = {
    id: 'meal-1',
    placeName: '동네식당',
    roadAddressName: '강원 강릉시 중앙로 1',
    phone: '010-0000-0000',
    placeUrl: 'https://place.map.kakao.com/1',
    source: 'kakao',
    lat: 37.75,
    lng: 128.89,
  }

  const days: PlanDay[] = [
    {
      day: 1,
      title: '1일차',
      summary: '테스트 일정',
      stops: [
        {
          time: '아침',
          title: '기존 관광지',
          body: '기존 설명',
          reason: '추천 이유',
          move: '도보 5분',
        },
        {
          time: '점심',
          title: restaurant.placeName,
          body: restaurant.roadAddressName ?? '',
          reason: '나의 위시리스트에서 드래그하여 추가한 맛집입니다.',
          move: '도보 5분',
          source: 'wishlist',
          lockLevel: 'user_added',
          wishlistRestaurantId: restaurant.id,
        },
      ],
    },
  ]

  it('위시리스트에서 제거한 맛집으로 만든 일정 stop도 함께 제거한다', () => {
    const nextDays = removeWishlistRestaurantStops(days, restaurant)

    expect(nextDays[0].stops).toHaveLength(1)
    expect(nextDays[0].stops[0].title).toBe('기존 관광지')
  })

  it('위시리스트 stop은 AI 수정 정책에서 보존할 수 있도록 provenance를 가진다', () => {
    const wishlistStop = days[0].stops[1]

    expect(wishlistStop.source).toBe('wishlist')
    expect(wishlistStop.lockLevel).toBe('user_added')
    expect(wishlistStop.wishlistRestaurantId).toBe(restaurant.id)
  })

  it('식별자가 없는 이전 드롭 stop도 제목과 주소 기반으로 제거한다', () => {
    const legacyDays: PlanDay[] = [
      {
        ...days[0],
        stops: [
          days[0].stops[0],
          {
            time: '점심',
            title: restaurant.placeName,
            body: restaurant.roadAddressName ?? '',
            reason: `전화번호: ${restaurant.phone}`,
            move: '도보 5분',
          },
        ],
      },
    ]

    const nextDays = removeWishlistRestaurantStops(legacyDays, restaurant)

    expect(nextDays[0].stops).toHaveLength(1)
    expect(nextDays[0].stops[0].title).toBe('기존 관광지')
  })
})

describe('applyWishlistSummaryToPlanDraft', () => {
  const createDraft = (days: PlanDay[], summary = '강릉 바다를 중심으로 여유롭게 이동하는 일정입니다.'): PlanDraft => ({
    durationLabel: '당일치기',
    dayCount: days.length,
    intensityLabel: '동선이 느슨한 일정',
    festivalThemeLabel: '축제 제외',
    summary,
    days,
    stops: days.flatMap((day) => day.stops),
    selectedRestaurants: [],
  })

  const dayWithWishlistStop: PlanDay = {
    day: 1,
    title: '1일차 추천 일정',
    summary: '해안 산책과 로컬 식사를 잇는 코스입니다.',
    stops: [
      {
        time: '아침',
        title: '안목해변',
        body: '바다를 보며 걷는 코스',
        reason: '해안 감성을 느낄 수 있어요.',
        move: '도보 5분',
      },
      {
        time: '점심',
        title: '동네식당',
        body: '강원 강릉시 중앙로 1',
        reason: '나의 위시리스트에서 드래그하여 추가한 맛집입니다.',
        move: '도보 5분',
        source: 'wishlist',
        lockLevel: 'user_added',
        wishlistRestaurantId: 'meal-1',
      },
    ],
  }

  it('위시리스트에서 추가한 stop을 일차 설명과 전체 일정 설명에 반영한다', () => {
    const nextDraft = applyWishlistSummaryToPlanDraft(createDraft([dayWithWishlistStop]))

    expect(nextDraft.days[0].summary).toContain('안목해변 ➔ 동네식당 등을 차례로 방문하는 일정입니다.')
    expect(nextDraft.days[0].summary).toContain('사용자가 추가한 맛집 동네식당을 포함해 1일차 추천 일정 동선을 조정했습니다.')
    expect(nextDraft.summary).toContain('사용자가 직접 추가한 맛집 1곳을 포함한 일정입니다.')
    expect(nextDraft.stops).toEqual(nextDraft.days.flatMap((day) => day.stops))
  })

  it('반복 적용해도 생성된 설명 문구를 중복하지 않는다', () => {
    const firstDraft = applyWishlistSummaryToPlanDraft(createDraft([dayWithWishlistStop]))
    const secondDraft = applyWishlistSummaryToPlanDraft(firstDraft)

    expect(secondDraft.days[0].summary.match(/사용자가 추가한 맛집/g)).toHaveLength(1)
    expect(secondDraft.summary.match(/사용자가 직접 추가한 맛집/g)).toHaveLength(1)
  })

  it('위시리스트 stop이 사라지면 생성된 설명 문구만 제거한다', () => {
    const draftWithSummary = applyWishlistSummaryToPlanDraft(createDraft([dayWithWishlistStop]))
    const dayWithoutWishlistStop: PlanDay = {
      ...draftWithSummary.days[0],
      stops: draftWithSummary.days[0].stops.filter((stop) => !stop.wishlistRestaurantId),
    }

    const nextDraft = applyWishlistSummaryToPlanDraft({
      ...draftWithSummary,
      days: [dayWithoutWishlistStop],
      stops: dayWithoutWishlistStop.stops,
    })

    expect(nextDraft.days[0].summary).toBe('안목해변 중심으로 구성한 일정입니다.')
    expect(nextDraft.summary).toBe('안목해변을 중심으로 구성한 1일 일정입니다.')
  })

  it('여러 위시리스트 stop은 이름 목록과 총 개수를 갱신한다', () => {
    const day: PlanDay = {
      ...dayWithWishlistStop,
      stops: [
        ...dayWithWishlistStop.stops,
        {
          time: '저녁',
          title: '바다횟집',
          body: '강원 강릉시 해안로 2',
          reason: '나의 위시리스트에서 드래그하여 추가한 맛집입니다.',
          move: '차량 8분',
          source: 'wishlist',
          lockLevel: 'user_added',
          wishlistRestaurantId: 'meal-2',
        },
      ],
    }

    const nextDraft = applyWishlistSummaryToPlanDraft(createDraft([day]))

    expect(nextDraft.days[0].summary).toContain('동네식당, 바다횟집을 포함해')
    expect(nextDraft.summary).toContain('사용자가 직접 추가한 맛집 2곳을 포함한 일정입니다.')
  })

  it('위시리스트 provenance가 없는 pinned stop은 사용자 추가 맛집 설명으로 세지 않는다', () => {
    const pinnedAgentDay: PlanDay = {
      ...dayWithWishlistStop,
      stops: [
        {
          time: '아침',
          title: '보존 관광지',
          body: 'AI가 만든 핵심 코스',
          reason: '사용자가 유지하기로 고정한 관광지입니다.',
          move: '도보 5분',
          source: 'agent',
          lockLevel: 'pinned',
        },
      ],
    }

    const nextDraft = applyWishlistSummaryToPlanDraft(createDraft([pinnedAgentDay]))

    expect(nextDraft.days[0].summary).toBe('보존 관광지 중심으로 구성한 일정입니다.')
    expect(nextDraft.summary).toBe('보존 관광지를 중심으로 구성한 1일 일정입니다.')
  })
})
