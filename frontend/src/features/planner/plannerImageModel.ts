/**
 * Korean Revised Romanization table for generating S3 image filename keys.
 * Covers onset (초성), vowel (중성), and all 28 coda (종성) slots.
 */
const ONSET = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '',
  'j', 'jj', 'ch', 'k', 't', 'p', 'h',
]

const VOWEL = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o',
  'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu',
  'eu', 'ui', 'i',
]

const CODA = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 'l',
  'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 'h',
]

const HANGUL_START = 0xAC00
const HANGUL_END = 0xD7A3

export const romanizeKorean = (text: string): string => {
  let result = ''
  let previousCodaIdx: number | null = null

  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0

    if (code >= HANGUL_START && code <= HANGUL_END) {
      const offset = code - HANGUL_START
      const onsetIdx = Math.floor(offset / (21 * 28))
      const vowelIdx = Math.floor((offset % (21 * 28)) / 28)
      const codaIdx = offset % 28
      const onset = previousCodaIdx === 21 && onsetIdx === 5 ? 'n' : ONSET[onsetIdx]

      result += onset + VOWEL[vowelIdx] + CODA[codaIdx]
      previousCodaIdx = codaIdx
    } else {
      result += ch.toLowerCase()
      previousCodaIdx = null
    }
  }

  return result
}

export const romanizeAttractionTitle = (title: string): string =>
  title
    .split(/\s+/)
    .map((word) => {
      const romanizedWord = romanizeKorean(word).replace(/[^a-z0-9]/g, '')
      return romanizedWord ? romanizedWord.charAt(0).toUpperCase() + romanizedWord.slice(1) : ''
    })
    .join('')

export const buildAttractionImageKey = (
  cityEnglishName: string,
  title: string,
  country = 'KR',
): string => {
  const normalizedCountry = country.trim().toUpperCase()
  const normalizedCity = cityEnglishName.trim()
  const romanizedTitle = romanizeAttractionTitle(title)

  if (!normalizedCountry || !normalizedCity || !romanizedTitle) return ''

  return `images/${normalizedCountry}/${normalizedCity}/${romanizedTitle}_1.jpg`
}

export const buildAttractionImageUrl = (
  imageCdnBase: string,
  cityEnglishName: string,
  title: string,
  country = 'KR',
): string => {
  const normalizedBase = imageCdnBase.trim().replace(/\/+$/, '')
  const key = buildAttractionImageKey(cityEnglishName, title, country)

  return normalizedBase && key ? `${normalizedBase}/${key}` : ''
}
