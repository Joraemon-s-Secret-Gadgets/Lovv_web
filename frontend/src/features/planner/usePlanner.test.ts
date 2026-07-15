import { describe, expect, it } from 'vitest'
import { createRecommendationClarification } from './usePlanner'

describe('createRecommendationClarification', () => {
  it('preserves V2 clarification option metadata for the chat UI', () => {
    const clarification = createRecommendationClarification({
      threadId: ' thread-1 ',
      recommendationId: 'recommendation-1',
      clarification: {
        prompt: '일정 수정 방향을 골라주세요.',
        options: [
          {
            optionId: ' nearby ',
            label: '가까운 장소',
            helperText: ' 숙소 주변 후보를 우선합니다. ',
            apply: { distanceKm: 5 },
            then: { entryType: 'modify' },
          },
        ],
      },
    })

    expect(clarification).toEqual({
      threadId: 'thread-1',
      recommendationId: 'recommendation-1',
      reasonCode: undefined,
      prompt: '일정 수정 방향을 골라주세요.',
      selectedOptionId: undefined,
      options: [
        {
          optionId: 'nearby',
          label: '가까운 장소',
          description: undefined,
          helperText: '숙소 주변 후보를 우선합니다.',
          apply: { distanceKm: 5 },
          then: { entryType: 'modify' },
        },
      ],
    })
  })
})
