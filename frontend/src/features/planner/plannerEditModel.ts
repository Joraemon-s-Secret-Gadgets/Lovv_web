import type { PlanDay, PlanDraft, PlanStop, SelectedMealPlace } from '../../shared/types/app'

export type PlannerEditIntent =
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
const USER_WISHLIST_DAY_SUMMARY_PATTERN =
  /\s*사용자가 추가한 맛집 [^.]+ 동선을 조정했습니다\./g
const USER_WISHLIST_PLAN_SUMMARY_PATTERN =
  /\s*사용자가 직접 추가한 맛집 \d+곳을 포함한 일정입니다\./g

const normalizeCommandText = (text: string) => text.trim().replace(/\s+/g, ' ')
const stripGeneratedWishlistSummary = (summary: string) =>
  summary
    .replace(USER_WISHLIST_DAY_SUMMARY_PATTERN, '')
    .replace(USER_WISHLIST_PLAN_SUMMARY_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

const getUniqueStopTitles = (stops: PlanStop[]) =>
  Array.from(new Set(stops.map((stop) => stop.title.trim()).filter(Boolean)))

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
    const baseSummary = stripGeneratedWishlistSummary(day.summary)

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
  const baseSummary = stripGeneratedWishlistSummary(draft.summary)

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
): PlannerEditIntent | null => {
  const text = normalizeCommandText(rawText)
  const compactText = text.replace(/\s+/g, '')
  const dayMatch = compactText.match(/([1-9]\d*)일차/)
  const day = dayMatch ? Number(dayMatch[1]) : null

  if (!day || !days.some((planDay) => planDay.day === day)) {
    return null
  }

  if (!/(바꿔|변경|교체|수정)/.test(compactText)) {
    return null
  }

  const matchedTimeLabel = TIME_LABELS.find((timeLabel) => compactText.includes(timeLabel))

  if (matchedTimeLabel) {
    const targetDay = days.find((planDay) => planDay.day === day)
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
