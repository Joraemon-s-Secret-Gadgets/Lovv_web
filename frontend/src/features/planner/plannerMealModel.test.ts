import { describe, expect, it } from 'vitest'
import type { PlanDay } from '../../shared/types/app'
import {
  adaptKakaoMealPlace,
  createKakaoMapSearchUrl,
  createMealSlotDescriptors,
  createMealSlotId,
} from './plannerMealModel'

const sampleDay: PlanDay = {
  day: 2,
  title: '2일차 추천 일정',
  summary: '둘째 날 흐름입니다.',
  stops: [
    {
      time: '아침',
      move: '15분',
      title: '안목해변',
      body: '바다 산책',
      reason: '가볍게 시작합니다.',
    },
    {
      time: '점심',
      move: '12분',
      title: '중앙시장',
      body: '시장 산책',
      reason: '동선이 좋습니다.',
    },
    {
      time: '저녁',
      move: '20분',
      title: '월화거리',
      body: '저녁 산책',
      reason: '하루를 마무리합니다.',
    },
  ],
}

describe('planner meal model', () => {
  it('creates one meal slot after each schedule stop', () => {
    const slots = createMealSlotDescriptors(sampleDay)

    expect(slots).toEqual([
      {
        id: 'day-2-breakfast',
        dayNumber: 2,
        afterStopIndex: 0,
        mealType: 'breakfast',
        label: '아침 식사',
        query: '안목해변 근처 맛집',
      },
      {
        id: 'day-2-lunch',
        dayNumber: 2,
        afterStopIndex: 1,
        mealType: 'lunch',
        label: '점심 식사',
        query: '중앙시장 근처 맛집',
      },
      {
        id: 'day-2-dinner',
        dayNumber: 2,
        afterStopIndex: 2,
        mealType: 'dinner',
        label: '저녁 식사',
        query: '월화거리 근처 맛집',
      },
    ])
  })

  it('adapts only necessary Kakao place fields', () => {
    expect(
      adaptKakaoMealPlace({
        id: 'kakao-1',
        place_name: '해변식당',
        road_address_name: '강원 강릉시 해변로 1',
        address_name: '강원 강릉시 견소동 1',
        phone: '033-000-0000',
        place_url: 'https://place.map.kakao.com/1',
      }),
    ).toEqual({
      id: 'kakao-1',
      placeName: '해변식당',
      roadAddressName: '강원 강릉시 해변로 1',
      addressName: '강원 강릉시 견소동 1',
      phone: '033-000-0000',
      placeUrl: 'https://place.map.kakao.com/1',
      source: 'kakao',
    })
  })

  it('builds stable meal slot ids and Kakao search links', () => {
    expect(createMealSlotId(3, 'dinner')).toBe('day-3-dinner')
    expect(createKakaoMapSearchUrl('강릉 맛집')).toBe(
      'https://map.kakao.com/link/search/%EA%B0%95%EB%A6%89%20%EB%A7%9B%EC%A7%91',
    )
  })
})
