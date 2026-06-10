import type { PlannerCityContext, SmallCityTheme } from '../map-city/smallCities'
import {
  getPreferenceByThemeId,
  getThemeDefinition,
  getThemeLabels,
  preferences,
  themeDefinitions,
} from '../onboarding/preferenceModel'
import type {
  ChatMessage,
  FestivalThemeChoice,
  MockConditionExtraction,
  PlanDay,
  PlanDraft,
  PlanStop,
  PlannerStepStatus,
  Preference,
  PreferenceProfile,
  ThemeId,
} from '../../shared/types/app'

export const durationGuidePrompts = ['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일']

export const travelMonthPrompts = Array.from({ length: 12 }, (_, index) => index + 1)

export const festivalThemePrompts: { label: string; choice: FestivalThemeChoice }[] = [
  { label: '축제 포함', choice: 'include' },
  { label: '축제 제외', choice: 'exclude' },
]

export const createMessageId = (role: ChatMessage['role'], index: number) => `${role}-${index}`

export const getExplicitDurationLabel = (message: string) => {
  const normalizedMessage = message.replace(/\s+/g, '')

  if (!normalizedMessage) {
    return null
  }

  const nightsMatch = normalizedMessage.match(/([1-4])박([2-5])일/)

  if (nightsMatch) {
    const nights = Number(nightsMatch[1])
    const days = nights + 1

    return `${nights}박 ${days}일`
  }

  if (/당일치기|당일|하루/.test(message)) {
    return '당일치기'
  }

  const daysOnlyMatch = normalizedMessage.match(/([1-5])일/)

  if (daysOnlyMatch) {
    const days = Number(daysOnlyMatch[1])

    if (days <= 1) {
      return '당일치기'
    }

    return `${days - 1}박 ${days}일`
  }

  return null
}

export const getDurationLabel = (message: string) => getExplicitDurationLabel(message) ?? '1일'

export const getDurationDayCount = (durationLabel: string) => {
  if (durationLabel === '당일치기') {
    return 1
  }

  const dayMatch = durationLabel.match(/(\d+)일/)

  return dayMatch ? Number(dayMatch[1]) : 1
}

export const wantsLessWalking = (message: string) => /덜\s*걷|적게\s*걷|동선|천천|여유|혼자/.test(message)

export const resolveFestivalThemeChoice = (
  message: string,
  currentChoice: FestivalThemeChoice,
): FestivalThemeChoice => {
  if (/축제\s*포함|축제.*넣|축제.*같이|행사.*포함/.test(message)) {
    return 'include'
  }

  if (/축제\s*제외|축제.*빼|축제.*없이|행사.*제외/.test(message)) {
    return 'exclude'
  }

  return currentChoice
}

const themeExtractionPatterns: Record<ThemeId, RegExp> = {
  hot_spring_rest: /온천|스파|휴양|숙소|료칸|회복|쉬고|휴식/,
  sea_coast: /바다|해변|해안|리조트|항구|섬|오션/,
  history_tradition: /역사|전통|사찰|절|고택|한옥|문화재|골목/,
  food_local: /미식|맛집|노포|시장|식당|음식|비빔밥|타코야키|로컬\s*식탁/,
  nature_trekking: /자연|숲|산|트레킹|올레|폭포|계곡|걷|산책/,
  art_emotion: /예술|감성|공예|전시|편집숍|갤러리|정원|카페|사진/,
}

export const cityThemeToThemeId: Partial<Record<SmallCityTheme, ThemeId>> = {
  온천: 'hot_spring_rest',
  바다: 'sea_coast',
  미식: 'food_local',
  전통: 'history_tradition',
  자연: 'nature_trekking',
  예술: 'art_emotion',
}

export const getPlannerBaselineThemeIds = (
  profile: PreferenceProfile,
  cityContext: PlannerCityContext | null,
) => {
  if (!cityContext) {
    return profile.selectedThemeIds
  }

  const cityThemeIds = Array.from(
    new Set(
      cityContext.themes
        .map((theme) => cityThemeToThemeId[theme])
        .filter((themeId): themeId is ThemeId => Boolean(themeId)),
    ),
  )

  return cityThemeIds.length > 0 ? cityThemeIds.slice(0, 3) : profile.selectedThemeIds
}

export const hasCityFestivalContent = (cityContext: PlannerCityContext | null) =>
  Boolean(cityContext?.hasFestivalContent || cityContext?.festivalCount || cityContext?.festivals.length)

export const shouldAskFestivalForCity = (cityContext: PlannerCityContext | null) =>
  !cityContext || hasCityFestivalContent(cityContext)

export const getTravelMonthLabel = (month: number | null) => (month ? `${month}월` : '월 미정')

export const getExplicitTravelMonth = (message: string) => {
  const monthMatch = message.match(/(1[0-2]|[1-9])\s*월/)

  if (!monthMatch) {
    return null
  }

  const month = Number(monthMatch[1])

  return month >= 1 && month <= 12 ? month : null
}

const getMonthFromCompactDate = (dateValue: string | undefined) => {
  const compactDate = dateValue?.replace(/\D/g, '')

  if (!compactDate || compactDate.length < 6) {
    return null
  }

  const month = Number(compactDate.slice(4, 6))

  return month >= 1 && month <= 12 ? month : null
}

export const getFestivalVisitMonths = (cityContext: PlannerCityContext | null) =>
  Array.from(
    new Set(
      (cityContext?.festivals ?? [])
        .flatMap((festival) => {
          const explicitMonths = festival.visitMonths ?? []
          const startMonth = getMonthFromCompactDate(festival.startDate)
          const endMonth = getMonthFromCompactDate(festival.endDate)

          return [...explicitMonths, startMonth, endMonth]
        })
        .filter((month): month is number => typeof month === 'number' && month >= 1 && month <= 12),
    ),
  ).sort((a, b) => a - b)

export const shouldAskTravelMonthForCity = (
  cityContext: PlannerCityContext | null,
  festivalThemeChoice: FestivalThemeChoice,
) => Boolean(cityContext && festivalThemeChoice === 'include' && getFestivalVisitMonths(cityContext).length > 0)

export const isFestivalAvailableForTravelMonth = (
  cityContext: PlannerCityContext | null,
  travelMonth: number | null,
) => {
  if (!cityContext || travelMonth === null) {
    return true
  }

  const availableMonths = getFestivalVisitMonths(cityContext)

  return availableMonths.length === 0 || availableMonths.includes(travelMonth)
}

export const detectExcludedThemes = (query: string) =>
  themeDefinitions
    .filter((theme) => {
      const themeKeywordPattern = new RegExp(theme.keywords.join('|'))

      return themeKeywordPattern.test(query) && /싫|제외|빼고|없이/.test(query)
    })
    .map((theme) => theme.id)

export const extractSoftPreferences = (query: string) => {
  const softPreferences = [
    [/덜\s*걷|적게\s*걷|동선|무리|천천|여유/, '이동 부담 낮추기'],
    [/혼자|solo|솔로/, '혼자 여행'],
    [/친구|연인|가족|부모|아이|동행/, '동행 고려'],
    [/카페|커피|디저트/, '카페 여백'],
    [/야경|저녁|밤/, '저녁 장면'],
    [/숙소|호텔|료칸|스테이/, '숙소 체류'],
  ] as const

  return softPreferences
    .filter(([pattern]) => pattern.test(query))
    .map(([, label]) => label)
}

export const createMockConditionExtraction = (
  query: string,
  baselineThemeIds: ThemeId[],
): MockConditionExtraction => {
  const cleanedRawQuery = query.replace(/\s+/g, ' ').trim()
  const detectedThemeIds = themeDefinitions
    .filter((theme) => themeExtractionPatterns[theme.id].test(cleanedRawQuery))
    .map((theme) => theme.id)
  const excludedThemes = detectExcludedThemes(cleanedRawQuery)
  const activeRequiredThemes = Array.from(
    new Set([...baselineThemeIds, ...detectedThemeIds].filter((themeId) => !excludedThemes.includes(themeId))),
  ).slice(0, 3)
  const backupThemes = baselineThemeIds.filter((themeId) => !activeRequiredThemes.includes(themeId))
  const unsupportedConditionMatchers: [RegExp, string][] = [
    [/항공권|비행기|항공/, '항공권 조건'],
    [/숙박\s*예약|호텔\s*예약|예약/, '실시간 예약'],
    [/날씨|강수|비\s*오면/, '실시간 날씨'],
  ]
  const unsupportedConditions = unsupportedConditionMatchers
    .filter(([pattern]) => pattern.test(cleanedRawQuery))
    .map(([, label]) => label)

  return {
    activeRequiredThemes: activeRequiredThemes.length > 0 ? activeRequiredThemes : baselineThemeIds.slice(0, 1),
    softPreferences: extractSoftPreferences(cleanedRawQuery),
    cleanedRawQuery,
    unsupportedConditions,
    excludedThemes,
    backupThemes,
  }
}

export const formatThemeList = (themeIds: ThemeId[]) => getThemeLabels(themeIds).join(' · ')

export const getFestivalThemeSummary = (choice: FestivalThemeChoice) => {
  if (choice === 'include') {
    return '지역 축제나 시즌 행사가 있으면 일정 후보에 함께 넣습니다.'
  }

  if (choice === 'exclude') {
    return '축제보다 식당과 동네 산책을 우선합니다.'
  }

  return '축제 포함 여부는 대화 초반에 먼저 확인합니다.'
}

export const getFestivalThemeLabel = (choice: FestivalThemeChoice) => {
  if (choice === 'include') {
    return '축제 포함'
  }

  if (choice === 'exclude') {
    return '축제 제외'
  }

  return '축제 미정'
}

export const getPlanFestivalThemeSummary = (
  choice: FestivalThemeChoice,
  cityContext: PlannerCityContext | null,
  travelMonth: number | null = null,
) => {
  if (!shouldAskFestivalForCity(cityContext)) {
    return '선택한 소도시의 장소 단서와 여행 기간을 중심으로 구성합니다.'
  }

  if (cityContext && choice === 'include' && !isFestivalAvailableForTravelMonth(cityContext, travelMonth)) {
    return '선택한 기간에 맞는 축제는 없어 일반 코스로 구성합니다.'
  }

  return getFestivalThemeSummary(choice)
}

export const getPlanFestivalThemeLabel = (
  choice: FestivalThemeChoice,
  cityContext: PlannerCityContext | null,
) => {
  if (!shouldAskFestivalForCity(cityContext)) {
    return '축제 조건 없음'
  }

  return getFestivalThemeLabel(choice)
}

export const createPlanDraft = (
  preference: Preference,
  message = '',
  festivalThemeChoice: FestivalThemeChoice = 'undecided',
  cityContext: PlannerCityContext | null = null,
  travelMonth: number | null = null,
): PlanDraft => {
  const durationLabel = getDurationLabel(message)
  const dayCount = getDurationDayCount(durationLabel)
  const isLessWalking = wantsLessWalking(message)
  const cityThemeText = cityContext?.themes.join('·') ?? ''
  const isArtFocused =
    preference.tag === '예술' || /전시|편집숍|쇼핑|예술/.test(`${message} ${cityThemeText}`)
  const intensityLabel = isLessWalking ? '덜 걷는 일정' : '동선이 느슨한 일정'
  const cityRouteSeed = cityContext?.routeSeed ?? []
  const cityRouteText = cityRouteSeed.slice(0, 3).join(' · ')
  const baseSummary = cityContext
    ? `${cityContext.countryLabel} ${cityContext.region}의 ${cityContext.cityName}에서 ${cityRouteText} 흐름을 우선하고, ${cityThemeText} 테마가 보이는 장면을 앞에 둡니다.`
    : isArtFocused
      ? '전시와 편집숍 사이 이동을 줄이는 쪽으로, 저녁에는 동네 산책보다 휴식 여백을 먼저 둡니다.'
      : `${preference.routeHint} 흐름을 기준으로 이동 부담을 낮추고, ${preference.tag} 취향이 잘 보이는 장면을 앞에 둡니다.`
  const festivalThemeSummary = getPlanFestivalThemeSummary(festivalThemeChoice, cityContext, travelMonth)
  const firstRoute = cityRouteSeed[0] ?? preference.routeHint
  const middleRoute = cityRouteSeed.slice(1).join(' · ') || preference.description
  const lastRoute = cityRouteSeed[2] ?? preference.editorialNote
  const routeOptions = [firstRoute, middleRoute, lastRoute].filter(Boolean)
  const getRouteOption = (index: number, fallback: string) => routeOptions[index % routeOptions.length] ?? fallback
  const createPlanDayStops = (dayNumber: number): PlanStop[] => {
    const isFirstDay = dayNumber === 1

    return [
      {
        time: '아침',
        move: isLessWalking ? '12분' : '18분',
        title: isFirstDay
          ? isLessWalking
            ? '가볍게 도착하고 가까운 동네부터 보기'
            : '가볍게 도착하고 동네 감 잡기'
          : `${dayNumber}일차 아침 컨디션 맞추기`,
        body: isFirstDay ? firstRoute : getRouteOption(dayNumber - 1, firstRoute),
        reason: isFirstDay
          ? cityContext
            ? '선택한 소도시의 첫 동선 단서를 기준으로 여행 분위기를 빠르게 잡습니다.'
            : '첫 장소는 걷는 부담보다 여행 분위기를 잡는 데 집중합니다.'
          : '전날 이동 피로를 줄이고 가까운 장소부터 천천히 다시 시작합니다.',
      },
      {
        time: '점심',
        move: isLessWalking ? '16분' : '24분',
        title: isFirstDay
          ? isArtFocused
            ? '전시와 편집숍을 한 동선 안에 묶기'
            : '취향에 맞는 핵심 장소 둘러보기'
          : `${preference.tag} 테마를 더 깊게 보기`,
        body: isFirstDay
          ? cityContext
            ? middleRoute
            : isArtFocused
              ? '전시 공간 · 편집숍 · 쉬어가는 카페를 한 구역에 묶어 봅니다.'
              : preference.description
          : getRouteOption(dayNumber, middleRoute),
        reason: isFirstDay
          ? cityContext
            ? '상세 패널에서 고른 장소 흐름을 오후 핵심 동선으로 이어갑니다.'
            : isArtFocused
              ? '선택한 예술 취향이 가장 잘 드러나는 장소를 이동이 짧은 순서로 배치합니다.'
              : '선택한 취향이 가장 잘 드러나는 장소를 중간에 배치합니다.'
          : '선택한 테마가 반복해서 보이는 장소를 중간 시간대에 배치합니다.',
      },
      {
        time: '저녁',
        move: isLessWalking ? '10분' : '15분',
        title: isFirstDay ? '무리하지 않는 마무리 동선' : `${dayNumber}일차를 느슨하게 정리하기`,
        body: isFirstDay ? lastRoute : getRouteOption(dayNumber + 1, lastRoute),
        reason: isFirstDay
          ? '마지막에는 이동을 줄이고 쉬어갈 수 있는 여백을 둡니다.'
          : '숙소 복귀 전 이동을 줄이고 다음 날 일정을 조정할 여백을 남깁니다.',
      },
    ]
  }
  const days: PlanDay[] = Array.from({ length: dayCount }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1

    return {
      day: dayNumber,
      title: `${dayNumber}일차 추천 일정`,
      summary:
        dayNumber === 1
          ? '도착 후 첫 인상과 핵심 테마를 확인하는 흐름입니다.'
          : `${dayNumber}일차는 전날보다 동선을 좁히고 선택 테마를 더 깊게 보는 흐름입니다.`,
      stops: createPlanDayStops(dayNumber),
    }
  })

  return {
    durationLabel,
    dayCount,
    intensityLabel,
    festivalThemeLabel: getPlanFestivalThemeLabel(festivalThemeChoice, cityContext),
    summary: `${baseSummary} ${festivalThemeSummary}`,
    days,
    stops: days.flatMap((day) => day.stops),
  }
}

export const createInitialChatMessages = (
  basisLabel: string,
  cityContext: PlannerCityContext | null = null,
  shouldAskFestival = true,
): ChatMessage[] => [
  {
    id: createMessageId('assistant', 0),
    role: 'assistant',
    content: cityContext
      ? shouldAskFestival
        ? `${cityContext.cityName}(${cityContext.countryLabel} ${cityContext.region})를 기준으로 시작할게요. 먼저 축제를 일정 테마에 포함할까요?`
        : `${cityContext.cityName}(${cityContext.countryLabel} ${cityContext.region})를 기준으로 시작할게요. 이 소도시 안에서 구성할 여행 기간을 먼저 골라주세요.`
      : `${basisLabel} 기준 테마로 시작할게요. 먼저 축제를 일정 테마에 포함할까요?`,
  },
  {
    id: createMessageId('user', 1),
    role: 'user',
    content: cityContext
      ? `${cityContext.cityName}로 세부 일정을 짜고 싶어요.`
      : '대화로 먼저 여행 조건을 좁혀보고 싶어요.',
  },
]

export const createAssistantReply = (
  basisLabel: string,
  draft: PlanDraft,
  extraction: MockConditionExtraction,
  cityContext: PlannerCityContext | null = null,
) =>
  `${cityContext ? `${cityContext.cityName} 중심으로` : `${basisLabel} 기준으로`} ${draft.durationLabel} 흐름을 잡아볼게요. ${draft.intensityLabel}으로 ${formatThemeList(extraction.activeRequiredThemes)} 장면을 먼저 배치했습니다.${
    extraction.softPreferences.length > 0
      ? ` 현재 입력에서는 ${extraction.softPreferences.slice(0, 2).join(', ')} 조건을 함께 봅니다.`
      : ''
  }`

export const createPlanId = (
  basisLabel: string,
  draft: PlanDraft,
  festivalThemeChoice: FestivalThemeChoice,
  cityContext: PlannerCityContext | null = null,
  extraction: MockConditionExtraction | null = null,
) =>
  [
    cityContext?.cityId,
    basisLabel,
    draft.durationLabel,
    getFestivalThemeLabel(festivalThemeChoice),
    draft.intensityLabel,
    extraction?.activeRequiredThemes.join('.'),
  ]
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-')

export const getPlannerCitySeedText = (cityContext: PlannerCityContext | null) =>
  cityContext
    ? [
        cityContext.cityName,
        cityContext.countryLabel,
        cityContext.region,
        cityContext.summary,
        ...cityContext.themes,
        ...cityContext.routeSeed,
      ].join(' ')
    : ''

export const compactHashtag = (label: string) =>
  `#${label
    .replace(/[·,/]/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/[()]/g, '')}`

export const getThemeHashtags = (profile: PreferenceProfile) =>
  profile.selectedThemeIds.map((themeId) => `#${getThemeDefinition(themeId).shortLabel}`)

export const getRecommendationBasisHashtags = (profile: PreferenceProfile) => {
  const themeBasis = getThemeLabels(profile.selectedThemeIds)
    .flatMap((label) => label.split('·'))
    .map((theme) => theme.trim())

  return Array.from(new Set(themeBasis.map(compactHashtag).filter((tag) => tag.length > 1))).slice(0, 6)
}

export const getPreferenceProfileLabel = (profile: PreferenceProfile) =>
  getThemeLabels(profile.selectedThemeIds).join(' · ')

export const getPlannerStepClassName = (status: PlannerStepStatus) => {
  if (status === 'completed') {
    return 'border-transparent bg-[#F36B12] text-[#33271E] shadow-[0_12px_26px_-22px_rgba(51,39,30,0.5)]'
  }

  if (status === 'active') {
    return 'border-transparent bg-[#FFF0E4] text-[#33271E]'
  }

  return 'border-transparent bg-[#fffffa]/78 text-[#897163]'
}

export const createSinglePreferenceProfile = (
  preference: Preference,
  source: PreferenceProfile['source'],
) => ({
  version: 2,
  selectedThemeIds: [preference.themeId],
  source,
  updatedAt: new Date().toISOString(),
}) satisfies PreferenceProfile

export const getFallbackPreference = () => preferences[0]
export { getPreferenceByThemeId, getThemeDefinition, getThemeLabels }
