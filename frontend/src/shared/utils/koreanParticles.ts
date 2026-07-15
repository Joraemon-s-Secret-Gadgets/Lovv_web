/**
 * @file koreanParticles.ts
 * @description Korean particle helpers for natural city copy.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

const hangulSyllableStart = 0xac00
const hangulSyllableEnd = 0xd7a3
const hangulFinalConsonantCount = 28

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getKoreanTopicParticle = (value: string) => {
  const lastCharacter = value.trim().at(-1)

  if (!lastCharacter) {
    return '는'
  }

  const codePoint = lastCharacter.charCodeAt(0)
  const hasFinalConsonant =
    codePoint >= hangulSyllableStart &&
    codePoint <= hangulSyllableEnd &&
    (codePoint - hangulSyllableStart) % hangulFinalConsonantCount !== 0

  return hasFinalConsonant ? '은' : '는'
}

export const withKoreanTopicParticle = (value: string) =>
  `${value}${getKoreanTopicParticle(value)}`

export const normalizeKoreanTopicParticle = (text: string, noun: string) =>
  text.replace(
    new RegExp(`${escapeRegExp(noun)}(?:은|는)`, 'g'),
    withKoreanTopicParticle(noun),
  )

// EOF: koreanParticles.ts
