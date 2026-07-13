import type { PlanDay, PlanDraft, PlanStop, SelectedMealPlace } from '../../shared/types/app'

export type PlannerEditIntent =
  | {
      type: 'replace_plan'
      rawText: string
    }
  | {
      type: 'replace_stop'
      day: number
      stopIndex: number
      timeLabel: PlanStop['time']
      rawText: string
    }
  | {
      type: 'replace_day_confirmation'
      day: number
      rawText: string
    }

const TIME_LABELS: PlanStop['time'][] = ['아침', '점심', '저녁']
const PLAN_REPLACEMENT_PATTERN = /(도시|지역|여행지|소도시|전체|전부|다)\s*(를|을|도)?\s*(바꿔|변경|교체|수정|다시)/
const USER_WISHLIST_DAY_SUMMARY_PATTERN =
  /\s*사용자가 추가한 맛집 [^.]+ 동선을 조정했습니다\./g
const USER_WISHLIST_PLAN_SUMMARY_PATTERN =
  /\s*사용자가 직접 추가한 맛집 \d+곳을 포함한 일정입니다\./g
const GENERATED_ROUTE_SUMMARY_PATTERN =
  /\s*[^.]+(?:등을\s*)?차례로 방문하는 일정입니다\./g
const GENERATED_SINGLE_STOP_SUMMARY_PATTERN =
  /\s*[^.]+ 중심으로 구성한 일정입니다\./g

const normalizeCommandText = (text: string) => text.trim().replace(/\s+/g, ' ')

export const hasExplicitReplacementDestination = (text: string) =>
  /(?:으로|로)\s*(?:바꿔|변경|교체|수정)/.test(normalizeCommandText(text).replace(/\s+/g, ''))

const getOrdinalIndex = (text: string) => {
  const compactText = text.replace(/\s+/g, '')
  const numericMatch = compactText.match(/([1-9]\d*)(?:번째|번|번째장소|번째일정|번째코스)/)

  if (numericMatch) {
    return Number(numericMatch[1]) - 1
  }

  const ordinalMap: Array<[RegExp, number]> = [
    [/첫(?:번째|째|번)?/, 0],
    [/두(?:번째|째|번)?/, 1],
    [/세(?:번째|째|번)?/, 2],
    [/네(?:번째|째|번)?/, 3],
    [/다섯(?:번째|째|번)?/, 4],
  ]

  return ordinalMap.find(([pattern]) => pattern.test(compactText))?.[1] ?? null
}

const stripGeneratedWishlistSummary = (summary: string) =>
  summary
    .replace(USER_WISHLIST_DAY_SUMMARY_PATTERN, '')
    .replace(USER_WISHLIST_PLAN_SUMMARY_PATTERN, '')
    .replace(GENERATED_ROUTE_SUMMARY_PATTERN, '')
    .replace(GENERATED_SINGLE_STOP_SUMMARY_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

const getUniqueStrings = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))

const getUniqueStopTitles = (stops: PlanStop[]) =>
  getUniqueStrings(stops.map((stop) => stop.title))

const appendObjectParticle = (value: string) => {
  const lastChar = value.trim().at(-1)

  if (!lastChar) {
    return value
  }

  const codePoint = lastChar.charCodeAt(0)
  const hangulBase = 0xac00
  const hangulLast = 0xd7a3

  if (codePoint < hangulBase || codePoint > hangulLast) {
    return `${value}을`
  }

  return `${value}${(codePoint - hangulBase) % 28 === 0 ? '를' : '을'}`
}

const isMealPlaceholderLikeStop = (stop: PlanStop) => {
  const haystack = `${stop.title} ${stop.body} ${stop.reason}`.toLowerCase()

  return (
    /식사\s*장소/.test(haystack) ||
    /자유롭게\s*(선택|식사)/.test(haystack) ||
    /식사는?\s*사용자/.test(haystack) ||
    /meal\s*place/i.test(haystack) ||
    /freely\s*choose/i.test(haystack)
  )
}

const getSummaryStopTitles = (stops: PlanStop[]) =>
  getUniqueStopTitles(stops.filter((stop) => !isMealPlaceholderLikeStop(stop)))

export const createDaySummaryFromStops = (day: PlanDay) => {
  const stopTitles = getSummaryStopTitles(day.stops)

  if (stopTitles.length === 0) {
    return `${day.day}일차 일정을 확인해 보세요.`
  }

  if (stopTitles.length === 1) {
    return `${stopTitles[0]} 중심으로 구성한 일정입니다.`
  }

  return `${stopTitles.join(' ➔ ')} 등을 차례로 방문하는 일정입니다.`
}

export const createPlanSummaryFromDays = (days: PlanDay[]) => {
  const dayTitles = days
    .map((day) => getSummaryStopTitles(day.stops))
    .filter((titles) => titles.length > 0)

  const allTitles = getUniqueStrings(dayTitles.flatMap((titles) => titles))

  if (allTitles.length === 0) {
    return '방문 순서와 이동 흐름을 정리한 맞춤 일정입니다.'
  }

  const highlightedTitles = allTitles.slice(0, 3)
  const suffix = allTitles.length > highlightedTitles.length
    ? ` 외 ${allTitles.length - highlightedTitles.length}곳`
    : ''

  return `${appendObjectParticle(`${highlightedTitles.join(' ➔ ')}${suffix}`)} 중심으로 구성한 ${days.length}일 일정입니다.`
}

const formatWishlistStopNames = (stops: PlanStop[]) => {
  const titles = getUniqueStopTitles(stops)

  if (titles.length === 0) {
    return '선택 장소'
  }

  if (titles.length <= 2) {
    return titles.join(', ')
  }

  return `${titles.slice(0, 2).join(', ')} 외 ${titles.length - 2}곳`
}

const appendSentence = (baseText: string, sentence: string) =>
  [baseText, sentence].filter(Boolean).join(' ').trim()

export const isUserAddedWishlistStop = (stop: PlanStop) =>
  Boolean(stop.wishlistRestaurantId || stop.source === 'wishlist')

export const applyWishlistSummaryToDays = (days: PlanDay[]): PlanDay[] =>
  days.map((day) => {
    const wishlistStops = day.stops.filter(isUserAddedWishlistStop)
    const baseSummary = createDaySummaryFromStops(day)

    if (wishlistStops.length === 0) {
      return {
        ...day,
        summary: baseSummary,
      }
    }

    return {
      ...day,
      summary: appendSentence(
        baseSummary,
        `사용자가 추가한 맛집 ${formatWishlistStopNames(wishlistStops)}을 포함해 ${day.title} 동선을 조정했습니다.`,
      ),
    }
  })

export const applyWishlistSummaryToPlanDraft = (draft: PlanDraft): PlanDraft => {
  const days = applyWishlistSummaryToDays(draft.days)
  const stops = days.flatMap((day) => day.stops)
  const wishlistStopCount = stops.filter(isUserAddedWishlistStop).length
  const baseSummary = createPlanSummaryFromDays(days) || stripGeneratedWishlistSummary(draft.summary)

  return {
    ...draft,
    summary:
      wishlistStopCount > 0
        ? appendSentence(baseSummary, `사용자가 직접 추가한 맛집 ${wishlistStopCount}곳을 포함한 일정입니다.`)
        : baseSummary,
    days,
    stops,
  }
}

export const parsePlannerEditCommand = (
  rawText: string,
  days: PlanDay[],
  fallbackDay?: number,
): PlannerEditIntent | null => {
  const text = normalizeCommandText(rawText)
  const compactText = text.replace(/\s+/g, '')
  const dayMatch = compactText.match(/([1-9]\d*)일차/)
  const day = dayMatch ? Number(dayMatch[1]) : fallbackDay ?? null

  if (PLAN_REPLACEMENT_PATTERN.test(compactText)) {
    return {
      type: 'replace_plan',
      rawText: text,
    }
  }

  if (!/(바꿔|변경|교체|수정)/.test(compactText)) {
    return null
  }

  if (!day || !days.some((planDay) => planDay.day === day)) {
    return null
  }

  const targetDay = days.find((planDay) => planDay.day === day)
  const ordinalIndex = getOrdinalIndex(compactText)

  if (targetDay && ordinalIndex !== null && targetDay.stops[ordinalIndex]) {
    return {
      type: 'replace_stop',
      day,
      stopIndex: ordinalIndex,
      timeLabel: targetDay.stops[ordinalIndex].time,
      rawText: text,
    }
  }

  const matchedTimeLabel = TIME_LABELS.find((timeLabel) => compactText.includes(timeLabel))

  if (matchedTimeLabel) {
    const stopIndex = targetDay?.stops.findIndex((stop) => stop.time === matchedTimeLabel) ?? -1

    if (stopIndex >= 0) {
      return {
        type: 'replace_stop',
        day,
        stopIndex,
        timeLabel: matchedTimeLabel,
        rawText: text,
      }
    }
  }

  if (/일정/.test(compactText)) {
    return {
      type: 'replace_day_confirmation',
      day,
      rawText: text,
    }
  }

  return null
}

const getReplacementTitle = (stop: PlanStop, destinationName: string) => {
  const destinationPrefix = destinationName.trim() || '해당 지역'
  const titleByTime: Record<PlanStop['time'], string> = {
    아침: `${destinationPrefix} 로컬 산책 코스`,
    점심: `${destinationPrefix} 골목 미식 코스`,
    저녁: `${destinationPrefix} 노을 전망 코스`,
  }

  return stop.title === titleByTime[stop.time]
    ? `${destinationPrefix} 숨은 장소 코스`
    : titleByTime[stop.time]
}

export const createStopReplacementCandidate = (
  day: PlanDay,
  stopIndex: number,
  destinationName: string,
): PlanStop => {
  const currentStop = day.stops[stopIndex]

  return {
    ...currentStop,
    title: getReplacementTitle(currentStop, destinationName),
    body: `${destinationName || '해당 지역'} 안에서 기존 시간대의 흐름은 유지하고 다른 장소 후보로 바꿉니다.`,
    reason: '전체 일정을 다시 만들지 않고 선택한 카드만 다른 지역 후보로 교체합니다.',
  }
}

export const createDayReplacementCandidate = (
  day: PlanDay,
  destinationName: string,
): PlanDay => ({
  ...day,
  title: `${day.day}일차 대체 일정 후보`,
  summary: `${destinationName || '해당 지역'} 안에서 같은 여행 조건을 유지한 대체 흐름입니다.`,
  stops: day.stops.map((_, index) => createStopReplacementCandidate(day, index, destinationName)),
})

export const applyPlanStopReplacement = (
  days: PlanDay[],
  dayNumber: number,
  stopIndex: number,
  replacement: PlanStop,
): PlanDay[] =>
  days.map((day) =>
    day.day === dayNumber
      ? {
          ...day,
          stops: day.stops.map((stop, index) => (index === stopIndex ? replacement : stop)),
        }
      : day,
  )

export const applyPlanDayReplacement = (
  days: PlanDay[],
  dayNumber: number,
  replacement: PlanDay,
): PlanDay[] => days.map((day) => (day.day === dayNumber ? replacement : day))

export const isStopFromWishlistRestaurant = (
  stop: PlanStop,
  restaurant: SelectedMealPlace,
) => {
  if (stop.wishlistRestaurantId === restaurant.id) {
    return true
  }

  const restaurantAddress = restaurant.roadAddressName ?? restaurant.addressName ?? ''
  const hasMatchingTitle = stop.title.trim() === restaurant.placeName.trim()
  const hasMatchingAddress = restaurantAddress.length > 0 && stop.body.trim() === restaurantAddress.trim()
  const looksLikeWishlistDrop =
    stop.reason.includes('위시리스트') ||
    (restaurant.phone ? stop.reason.includes(restaurant.phone) : false)

  return hasMatchingTitle && hasMatchingAddress && looksLikeWishlistDrop
}

export const removeWishlistRestaurantStops = (
  days: PlanDay[],
  restaurant: SelectedMealPlace,
): PlanDay[] =>
  days.map((day) => ({
    ...day,
    stops: day.stops.filter((stop) => !isStopFromWishlistRestaurant(stop, restaurant)),
  }))
