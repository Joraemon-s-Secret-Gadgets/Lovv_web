/**
 * @file koreanParticles.test.ts
 * @description Tests for Korean topic-particle selection.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { describe, expect, it } from 'vitest'
import {
  getKoreanTopicParticle,
  normalizeKoreanTopicParticle,
  withKoreanTopicParticle,
} from './koreanParticles'

describe('Korean topic particles', () => {
  it('uses 은 after a final consonant and 는 otherwise', () => {
    expect(withKoreanTopicParticle('화성')).toBe('화성은')
    expect(withKoreanTopicParticle('평택')).toBe('평택은')
    expect(withKoreanTopicParticle('강릉')).toBe('강릉은')
    expect(withKoreanTopicParticle('동해')).toBe('동해는')
    expect(withKoreanTopicParticle('제주')).toBe('제주는')
    expect(getKoreanTopicParticle('')).toBe('는')
  })

  it('corrects a fixed topic particle in an API sentence', () => {
    expect(
      normalizeKoreanTopicParticle(
        '경기도 화성는 전통·자연 여행 후보가 모여 있는 소도시입니다.',
        '화성',
      ),
    ).toBe('경기도 화성은 전통·자연 여행 후보가 모여 있는 소도시입니다.')
  })
})

// EOF: koreanParticles.test.ts
