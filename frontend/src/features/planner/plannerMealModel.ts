import type { PlanDay, SelectedMealPlace } from '../../shared/types/app'

export type MealType = 'breakfast' | 'lunch' | 'dinner'

export type MealSlotDescriptor = {
  id: string
  dayNumber: number
  afterStopIndex: number
  mealType: MealType
  label: string
  query: string
}

export type KakaoMealPlaceRaw = {
  id?: string
  place_name?: string
  road_address_name?: string
  address_name?: string
  phone?: string
  place_url?: string
  x?: string
  y?: string
}

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner']

const mealLabelByType: Record<MealType, string> = {
  breakfast: '아침 식사',
  lunch: '점심 식사',
  dinner: '저녁 식사',
}

export const createMealSlotId = (dayNumber: number, mealType: MealType) => `day-${dayNumber}-${mealType}`

export const createKakaoMapSearchUrl = (query: string) =>
  `https://map.kakao.com/link/search/${encodeURIComponent(query.trim())}`

export const createMealSlotDescriptors = (day: PlanDay): MealSlotDescriptor[] =>
  day.stops.slice(0, 3).map((stop, index) => {
    const mealType = mealTypeOrder[index]

    return {
      id: createMealSlotId(day.day, mealType),
      dayNumber: day.day,
      afterStopIndex: index,
      mealType,
      label: mealLabelByType[mealType],
      query: `${stop.title} 근처 맛집`,
    }
  })

const readTrimmedString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined

export const adaptKakaoMealPlace = (rawPlace: KakaoMealPlaceRaw): SelectedMealPlace | null => {
  const placeName = readTrimmedString(rawPlace.place_name)

  if (!placeName) {
    return null
  }

  return {
    id: readTrimmedString(rawPlace.id) ?? `${placeName}-${readTrimmedString(rawPlace.address_name) ?? 'kakao'}`,
    placeName,
    roadAddressName: readTrimmedString(rawPlace.road_address_name),
    addressName: readTrimmedString(rawPlace.address_name),
    phone: readTrimmedString(rawPlace.phone),
    placeUrl: readTrimmedString(rawPlace.place_url),
    source: 'kakao',
    lat: rawPlace.y ? parseFloat(rawPlace.y) : undefined,
    lng: rawPlace.x ? parseFloat(rawPlace.x) : undefined,
  }
}
