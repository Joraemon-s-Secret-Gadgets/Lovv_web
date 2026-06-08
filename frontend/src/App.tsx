import { useEffect, useMemo, useRef, useState } from 'react'
import logoImage from './assets/lovv-logo.png'
import foxFaceImage from './assets/foxhead-smile.png'
import beppuImage from './assets/cities/beppu.jpg'
import busanImage from './assets/cities/busan.jpg'
import fireworkImage from './assets/cities/firework.jpg'
import gangneungImage from './assets/cities/gangneung.jpg'
import gyeongjuImage from './assets/cities/gyeongju.jpg'
import jejuImage from './assets/cities/jeju.jpg'
import jeonjuImage from './assets/cities/jeonju.jpg'
import kanazawaImage from './assets/cities/kanazawa.jpg'
import kyotoImage from './assets/cities/kyoto.jpg'
import nikkoImage from './assets/cities/nikko.jpg'
import okinawaImage from './assets/cities/okinawa.jpg'
import onyangImage from './assets/cities/onyang.jpg'
import osakaImage from './assets/cities/osaka.jpg'
import seaHeroImage from './assets/cities/sea.jpg'
import townHeroImage from './assets/cities/town.jpg'
import { SmallCityLeafletMap } from './components/SmallCityLeafletMap'
import {
  createSmallCityMapMarkers,
  createPlannerCityContext,
  filterSmallCities,
  smallCityCountryOptions,
  smallCityThemes,
  type PlannerCityContext,
  type SmallCity,
  type SmallCityCountry,
  type SmallCityMapMarker,
  type SmallCityTheme,
} from './data/smallCities'
import { createStaticSmallCityCatalogState } from './data/smallCityDataSource'

type CityCoverImage = {
  city: string
  image: string
}

type FestivalThemeChoice = 'undecided' | 'include' | 'exclude'

type ThemeId =
  | 'hot_spring_rest'
  | 'sea_coast'
  | 'history_tradition'
  | 'food_local'
  | 'nature_trekking'
  | 'art_emotion'

type PreferenceProfileSource = 'onboarding' | 'preference_edit' | 'legacy_migration'

type ThemeDefinition = {
  id: ThemeId
  label: string
  shortLabel: string
  description: string
  keywords: string[]
}

type PreferenceProfile = {
  version: 2
  selectedThemeIds: ThemeId[]
  source: PreferenceProfileSource
  updatedAt: string
}

type Preference = {
  themeId: ThemeId
  cityPair: string
  legacyCityPairs?: string[]
  description: string
  tag: string
  signals: string[]
  weakSignal: string
  issue: string
  editorialNote: string
  routeHint: string
  coverImages: CityCoverImage[]
}

type MonthlyRecommendation = {
  id: string
  preference: Preference
  title: string
  summary: string
  badge: string
  image: string
  themes: string[]
}

type HeroTheme = {
  id: 'mountain' | 'sea' | 'festival'
  label: string
  lead: string
  accent: string
  summary: string
  backgroundImage: string
  accentClassName: string
  glowClassName: string
}

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

type PlannerStepStatus = 'completed' | 'active' | 'pending'

type PlanStop = {
  time: '오전' | '오후' | '저녁'
  move: string
  title: string
  body: string
  reason: string
}

type PlanDraft = {
  durationLabel: string
  dayCount: number
  intensityLabel: string
  festivalThemeLabel: string
  summary: string
  stops: PlanStop[]
}

type MockConditionExtraction = {
  activeRequiredThemes: ThemeId[]
  softPreferences: string[]
  cleanedRawQuery: string
  unsupportedConditions: string[]
  excludedThemes: ThemeId[]
  backupThemes: ThemeId[]
}

type SavedPlan = {
  id: string
  ownerId: string
  title: string
  cityPair: string
  themeTag: string
  themeLabels: string[]
  conditionSummary: string
  durationLabel: string
  festivalThemeLabel: string
  intensityLabel: string
  summary: string
  stops: PlanStop[]
  createdAt: string
  savedAt: string
}

type LovvUser = {
  id: string
  name: string
  email: string
  avatarInitial: string
  provider: AuthProvider
}

type AuthProvider = 'google' | 'kakao'

const preferenceStorageKey = 'lovv.preference'
const authStorageKey = 'lovv.auth.user'
const savedPlansStorageKey = 'lovv.savedPlans'
const likedPlanIdsStorageKey = 'lovv.likedPlanIds'
const preferenceProfileVersion = 2

const mockAuthUsers: Record<AuthProvider, LovvUser> = {
  google: {
    id: 'mock-google-user',
    name: 'Lovv Google User',
    email: 'google@lovv.local',
    avatarInitial: 'G',
    provider: 'google',
  },
  kakao: {
    id: 'mock-kakao-user',
    name: 'Lovv Kakao User',
    email: 'kakao@lovv.local',
    avatarInitial: 'K',
    provider: 'kakao',
  },
}

const heroRotationIntervalMs = 10000

const heroThemes: HeroTheme[] = [
  {
    id: 'mountain',
    label: 'Mountain',
    lead: '당신이 몰랐던',
    accent: '소도시의 숨은 매력',
    summary:
      '복잡한 도심을 벗어나 현지인의 숨결이 닿은 산과 오래된 마을로 초대합니다. Lovv가 제안하는 느린 여행을 시작해보세요.',
    backgroundImage: townHeroImage,
    accentClassName: 'lovv-text-mountain',
    glowClassName: 'lovv-hero-glow-mountain',
  },
  {
    id: 'sea',
    label: 'Sea',
    lead: '당신이 몰랐던',
    accent: '소도시의 푸른 바다',
    summary:
      '탁 트인 바다와 청량한 바람이 머무는 곳. Lovv와 함께 파도 소리에 맞춰 걷는 특별한 여정을 찾아보세요.',
    backgroundImage: seaHeroImage,
    accentClassName: 'lovv-text-sea',
    glowClassName: 'lovv-hero-glow-sea',
  },
  {
    id: 'festival',
    label: 'Festival',
    lead: '당신이 몰랐던',
    accent: '소도시의 화려한 축제',
    summary:
      '밤하늘의 빛, 골목의 음악, 지역의 계절감이 만나는 순간. 축제의 에너지를 담은 소도시 여정을 제안합니다.',
    backgroundImage: fireworkImage,
    accentClassName: 'lovv-text-festival-gradient',
    glowClassName: 'lovv-hero-glow-festival',
  },
]

const authServiceBullets = [
  'Lovv는 소도시 여행 추천 큐레이션 서비스를 제공합니다.',
  '대도시 대신 취향과 분위기에 가까운 한국과 일본의 작은 도시 후보를 먼저 정리합니다.',
  'AI 챗봇으로 여행 기간, 축제 포함 여부, 걷는 양을 대화로 좁혀갑니다.',
  '추천 일정은 세부 일정 확인, 좋아요, 마이페이지 저장 흐름으로 확장됩니다.',
]

const authServiceCards = [
  {
    title: '숨겨진 장소',
    body: '관광객은 모르는 현지 감각의 작은 도시와 동네를 먼저 제안합니다.',
  },
  {
    title: '취향 큐레이션',
    body: 'AI가 사용자의 속도와 장면 선택을 바탕으로 일정 후보를 정리합니다.',
  },
]

const authJourneyItems = [
  {
    date: 'Step 01',
    title: '여행 분위기 선택',
    body: '도시 이름보다 여행의 속도와 장면을 먼저 고릅니다.',
  },
  {
    date: 'Step 02',
    title: 'AI 일정 대화',
    body: '기간, 축제 포함 여부, 걷는 양을 채팅으로 좁힙니다.',
  },
  {
    date: 'Step 03',
    title: '소도시 일정 저장',
    body: '마음에 드는 추천 일정은 나중에 마이페이지에 담을 수 있게 확장합니다.',
  },
]

const themeDefinitions: ThemeDefinition[] = [
  {
    id: 'hot_spring_rest',
    label: '온천·휴양',
    shortLabel: '온천',
    description: '숙소 체류, 온천, 스파처럼 회복감이 있는 장면을 먼저 봅니다.',
    keywords: ['온천', '휴양', '스파', '숙소', '회복'],
  },
  {
    id: 'sea_coast',
    label: '바다·해안',
    shortLabel: '바다',
    description: '바다색, 해변 산책, 리조트 여백이 있는 소도시를 우선합니다.',
    keywords: ['바다', '해안', '해변', '리조트', '섬'],
  },
  {
    id: 'history_tradition',
    label: '역사·전통',
    shortLabel: '전통',
    description: '사찰, 오래된 거리, 지역의 전통이 살아 있는 동선을 고릅니다.',
    keywords: ['역사', '전통', '사찰', '골목', '고택'],
  },
  {
    id: 'food_local',
    label: '미식·노포',
    shortLabel: '미식',
    description: '시장, 로컬 식탁, 오래된 가게를 따라가는 여행에 맞춥니다.',
    keywords: ['미식', '노포', '시장', '로컬 음식', '식탁'],
  },
  {
    id: 'nature_trekking',
    label: '자연·트레킹',
    shortLabel: '자연',
    description: '숲, 산, 폭포, 전망처럼 걷는 리듬이 있는 장면을 봅니다.',
    keywords: ['자연', '트레킹', '숲', '산', '폭포'],
  },
  {
    id: 'art_emotion',
    label: '예술·감성',
    shortLabel: '예술',
    description: '공예, 정원, 카페, 전시처럼 기록하고 싶은 장면을 우선합니다.',
    keywords: ['예술', '감성', '공예', '카페', '전시'],
  },
]

const preferences: Preference[] = [
  {
    themeId: 'hot_spring_rest',
    cityPair: '아산/온양 · 벳푸',
    legacyCityPairs: ['온양 · 벳푸', '벳푸 · 온양'],
    description: '온양온천, 스파 휴양 · 온천 수도, 지옥 순례',
    tag: '온천·휴양',
    signals: ['온천 +2', '휴양 +1', '스파 +1', '숙소 체류 +1'],
    weakSignal: '혼잡 도심 - 약함',
    issue: 'No. 01',
    editorialNote: '온양온천과 벳푸처럼 뜨거운 물, 숙소 체류, 느린 회복감을 중심에 둬요.',
    routeHint: '온양온천 · 스파 휴양 · 지옥 순례',
    coverImages: [
      { city: '아산/온양', image: onyangImage },
      { city: '벳푸', image: beppuImage },
    ],
  },
  {
    themeId: 'sea_coast',
    cityPair: '부산 · 오키나와',
    legacyCityPairs: ['제주 · 오키나와', '오키나와 · 제주'],
    description: '해운대, 광안리 · 에메랄드 바다, 리조트',
    tag: '바다·해안',
    signals: ['바다 +2', '해안 +1', '리조트 +1', '휴식 +1'],
    weakSignal: '산악 트레킹 - 약함',
    issue: 'No. 02',
    editorialNote: '해변과 바다색이 먼저 떠오르는 여행, 리조트와 해안 산책의 여백을 중시해요.',
    routeHint: '해운대 · 광안리 · 에메랄드 바다',
    coverImages: [
      { city: '부산', image: busanImage },
      { city: '오키나와', image: okinawaImage },
    ],
  },
  {
    themeId: 'history_tradition',
    cityPair: '경주 · 교토',
    legacyCityPairs: ['교토 · 경주'],
    description: '불국사, 첨성대, 황리단길 · 사찰, 기온, 전통 거리',
    tag: '역사·전통',
    signals: ['역사 +2', '전통 +1', '산책 +1', '골목 +1'],
    weakSignal: '리조트 휴양 - 약함',
    issue: 'No. 03',
    editorialNote: '경주와 교토처럼 오래된 장소, 골목, 전통의 결을 천천히 따라가요.',
    routeHint: '불국사 · 첨성대 · 기온 거리',
    coverImages: [
      { city: '경주', image: gyeongjuImage },
      { city: '교토', image: kyotoImage },
    ],
  },
  {
    themeId: 'food_local',
    cityPair: '전주 · 오사카',
    legacyCityPairs: ['부산 · 후쿠오카', '후쿠오카 · 부산'],
    description: '한옥마을, 전주비빔밥, 시장 · 도톤보리, 타코야키, 노포',
    tag: '미식·노포',
    signals: ['미식 +2', '노포 +1', '시장 +1', '로컬 음식 +1'],
    weakSignal: '한적한 자연 - 약함',
    issue: 'No. 04',
    editorialNote: '대표 음식과 오래된 가게를 중심으로, 시장과 골목의 식탁을 따라 움직여요.',
    routeHint: '한옥마을 · 전주비빔밥 · 도톤보리 노포',
    coverImages: [
      { city: '전주', image: jeonjuImage },
      { city: '오사카', image: osakaImage },
    ],
  },
  {
    themeId: 'nature_trekking',
    cityPair: '제주 · 닛코',
    legacyCityPairs: ['강원 · 삿포로', '삿포로 · 강원'],
    description: '한라산, 올레길 · 도쇼구, 게곤폭포, 산악',
    tag: '자연·트레킹',
    signals: ['자연 +2', '트레킹 +1', '전망 +1', '계절감 +1'],
    weakSignal: '도심 쇼핑 - 약함',
    issue: 'No. 05',
    editorialNote: '한라산과 닛코처럼 걷는 리듬, 산악 풍경, 폭포와 숲의 장면을 먼저 봅니다.',
    routeHint: '한라산 · 올레길 · 게곤폭포',
    coverImages: [
      { city: '제주', image: jejuImage },
      { city: '닛코', image: nikkoImage },
    ],
  },
  {
    themeId: 'art_emotion',
    cityPair: '강릉 · 가나자와',
    legacyCityPairs: ['서울 · 도쿄', '도쿄 · 서울'],
    description: '감성 카페, 안목해변, 정동진 · 히가시차야, 겐로쿠엔, 공예',
    tag: '예술·감성',
    signals: ['감성 +2', '예술 +1', '카페 +1', '공예 +1'],
    weakSignal: '빠른 도심 쇼핑 - 약함',
    issue: 'No. 06',
    editorialNote: '카페와 해변, 공예와 정원의 분위기를 천천히 보고 기록하는 여행이에요.',
    routeHint: '안목해변 · 정동진 · 히가시차야',
    coverImages: [
      { city: '강릉', image: gangneungImage },
      { city: '가나자와', image: kanazawaImage },
    ],
  },
]

const monthlyRecommendations: MonthlyRecommendation[] = [
  {
    id: 'onyang-beppu-slow-onsen',
    preference: preferences[0],
    title: '온천으로 회복하는 느린 여행',
    summary: '숙소 체류와 스파 시간을 넉넉히 두는 회복형 소도시 루트입니다.',
    badge: '이달의 온천',
    image: onyangImage,
    themes: ['온천', '휴양'],
  },
  {
    id: 'busan-okinawa-blue-coast',
    preference: preferences[1],
    title: '바다색이 선명한 해안 휴식',
    summary: '해변 산책과 리조트 여백을 중심에 둔 바다 테마 추천입니다.',
    badge: '해안 휴식',
    image: busanImage,
    themes: ['바다', '해안'],
  },
  {
    id: 'gyeongju-kyoto-old-street',
    preference: preferences[2],
    title: '오래된 골목과 전통 산책',
    summary: '사찰, 전통 거리, 조용한 산책 리듬이 잘 맞는 코스입니다.',
    badge: '전통 산책',
    image: gyeongjuImage,
    themes: ['역사', '전통'],
  },
  {
    id: 'jeonju-osaka-local-table',
    preference: preferences[3],
    title: '노포와 시장을 따라가는 미식 산책',
    summary: '시장과 오래된 가게를 중심으로 로컬 식탁의 리듬을 따라갑니다.',
    badge: '미식 산책',
    image: jeonjuImage,
    themes: ['미식', '노포'],
  },
  {
    id: 'gangneung-kanazawa-craft-note',
    preference: preferences[5],
    title: '예술과 감성을 기록하는 하루',
    summary: '카페, 해변, 공예와 정원 장면을 천천히 따라갑니다.',
    badge: '감성 기록',
    image: gangneungImage,
    themes: ['예술', '감성'],
  },
]

type View =
  | 'auth'
  | 'onboarding'
  | 'home'
  | 'chat'
  | 'planDetail'
  | 'mypage'
  | 'preferenceEdit'
  | 'themeDetail'

const durationGuidePrompts = ['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일']
const festivalThemePrompts: { label: string; choice: FestivalThemeChoice }[] = [
  { label: '축제 포함', choice: 'include' },
  { label: '축제 제외', choice: 'exclude' },
]

const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && themeDefinitions.some((theme) => theme.id === value)

const isPreferenceProfileSource = (value: unknown): value is PreferenceProfileSource =>
  value === 'onboarding' || value === 'preference_edit' || value === 'legacy_migration'

const normalizeThemeIds = (themeIds: unknown): ThemeId[] => {
  if (!Array.isArray(themeIds)) {
    return []
  }

  return Array.from(new Set(themeIds.filter(isThemeId))).slice(0, 3)
}

const createPreferenceProfile = (
  selectedThemeIds: ThemeId[],
  source: PreferenceProfileSource,
): PreferenceProfile => ({
  version: preferenceProfileVersion,
  selectedThemeIds: normalizeThemeIds(selectedThemeIds).slice(0, 3),
  source,
  updatedAt: new Date().toISOString(),
})

const findPreferenceByCityPair = (cityPair: string | undefined) =>
  preferences.find(
    (preference) =>
      preference.cityPair === cityPair || preference.legacyCityPairs?.includes(cityPair ?? ''),
  ) ?? null

const getThemeDefinition = (themeId: ThemeId) =>
  themeDefinitions.find((theme) => theme.id === themeId) ?? themeDefinitions[0]

const getPreferenceByThemeId = (themeId: ThemeId) =>
  preferences.find((preference) => preference.themeId === themeId) ?? preferences[0]

const getPreferencesForProfile = (profile: PreferenceProfile) => {
  const selectedPreferences = profile.selectedThemeIds
    .map(getPreferenceByThemeId)
    .filter((preference): preference is Preference => Boolean(preference))

  return selectedPreferences.length > 0 ? selectedPreferences : [preferences[0]]
}

const getPrimaryPreference = (profile: PreferenceProfile) => getPreferencesForProfile(profile)[0] ?? preferences[0]

const getDefaultPreferenceProfile = () => createPreferenceProfile([preferences[0].themeId], 'onboarding')

const getThemeLabels = (themeIds: ThemeId[]) =>
  themeIds.map((themeId) => getThemeDefinition(themeId).label)

const readStoredPreferenceProfile = (): PreferenceProfile | null => {
  try {
    const rawPreference = localStorage.getItem(preferenceStorageKey)

    if (!rawPreference) {
      return null
    }

    const parsedPreference = JSON.parse(rawPreference) as Partial<PreferenceProfile & Preference>
    const normalizedThemeIds = normalizeThemeIds(parsedPreference.selectedThemeIds)

    if (parsedPreference.version === preferenceProfileVersion && normalizedThemeIds.length > 0) {
      return {
        version: preferenceProfileVersion,
        selectedThemeIds: normalizedThemeIds,
        source: isPreferenceProfileSource(parsedPreference.source)
          ? parsedPreference.source
          : 'onboarding',
        updatedAt:
          typeof parsedPreference.updatedAt === 'string'
            ? parsedPreference.updatedAt
            : new Date().toISOString(),
      }
    }

    const legacyPreference = findPreferenceByCityPair(parsedPreference.cityPair)

    if (legacyPreference) {
      return createPreferenceProfile([legacyPreference.themeId], 'legacy_migration')
    }

    return null
  } catch {
    return null
  }
}

const readStoredUser = (): LovvUser | null => {
  try {
    const rawUser = localStorage.getItem(authStorageKey)

    if (!rawUser) {
      return null
    }

    const parsedUser = JSON.parse(rawUser) as Partial<LovvUser>

    if (!parsedUser.id || !parsedUser.name || !parsedUser.email || !parsedUser.avatarInitial) {
      return null
    }

    return {
      id: parsedUser.id,
      name: parsedUser.name,
      email: parsedUser.email,
      avatarInitial: parsedUser.avatarInitial,
      provider: parsedUser.provider === 'kakao' ? 'kakao' : 'google',
    }
  } catch {
    return null
  }
}

const readStoredSavedPlans = (): SavedPlan[] => {
  try {
    const rawPlans = localStorage.getItem(savedPlansStorageKey)

    if (!rawPlans) {
      return []
    }

    const parsedPlans = JSON.parse(rawPlans)

    if (!Array.isArray(parsedPlans)) {
      return []
    }

    return parsedPlans.filter(
      (plan): plan is SavedPlan =>
        typeof plan?.id === 'string' &&
        typeof plan?.ownerId === 'string' &&
        typeof plan?.title === 'string' &&
        typeof plan?.cityPair === 'string' &&
        typeof plan?.durationLabel === 'string' &&
        Array.isArray(plan?.stops),
    )
  } catch {
    return []
  }
}

const readStoredLikedPlanIds = (): string[] => {
  try {
    const rawPlanIds = localStorage.getItem(likedPlanIdsStorageKey)

    if (!rawPlanIds) {
      return []
    }

    const parsedPlanIds = JSON.parse(rawPlanIds)

    return Array.isArray(parsedPlanIds)
      ? parsedPlanIds.filter((planId): planId is string => typeof planId === 'string')
      : []
  } catch {
    return []
  }
}

const createMessageId = (role: ChatMessage['role'], index: number) => `${role}-${index}`

const getExplicitDurationLabel = (message: string) => {
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

const getDurationLabel = (message: string) => {
  return getExplicitDurationLabel(message) ?? '1일'
}

const getDurationDayCount = (durationLabel: string) => {
  if (durationLabel === '당일치기') {
    return 1
  }

  const dayMatch = durationLabel.match(/(\d+)일/)

  return dayMatch ? Number(dayMatch[1]) : 1
}

const wantsLessWalking = (message: string) => /덜\s*걷|적게\s*걷|동선|천천|여유|혼자/.test(message)

const resolveFestivalThemeChoice = (
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

const detectExcludedThemes = (query: string) =>
  themeDefinitions
    .filter((theme) => {
      const themeKeywordPattern = new RegExp(theme.keywords.join('|'))

      return themeKeywordPattern.test(query) && /싫|제외|빼고|없이/.test(query)
    })
    .map((theme) => theme.id)

const extractSoftPreferences = (query: string) => {
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

const createMockConditionExtraction = (
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

const formatThemeList = (themeIds: ThemeId[]) => getThemeLabels(themeIds).join(' · ')

const getFestivalThemeSummary = (choice: FestivalThemeChoice) => {
  if (choice === 'include') {
    return '지역 축제나 시즌 행사가 있으면 일정 후보에 함께 넣습니다.'
  }

  if (choice === 'exclude') {
    return '축제보다 식당과 동네 산책을 우선합니다.'
  }

  return '축제 포함 여부는 대화 초반에 먼저 확인합니다.'
}

const getFestivalThemeLabel = (choice: FestivalThemeChoice) => {
  if (choice === 'include') {
    return '축제 포함'
  }

  if (choice === 'exclude') {
    return '축제 제외'
  }

  return '축제 미정'
}

const createPlanDraft = (
  preference: Preference,
  message = '',
  festivalThemeChoice: FestivalThemeChoice = 'undecided',
  cityContext: PlannerCityContext | null = null,
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
  const festivalThemeSummary = getFestivalThemeSummary(festivalThemeChoice)
  const firstRoute = cityRouteSeed[0] ?? preference.routeHint
  const middleRoute = cityRouteSeed.slice(1).join(' · ') || preference.description
  const lastRoute = cityRouteSeed[2] ?? preference.editorialNote

  return {
    durationLabel,
    dayCount,
    intensityLabel,
    festivalThemeLabel: getFestivalThemeLabel(festivalThemeChoice),
    summary: `${baseSummary} ${festivalThemeSummary}`,
    stops: [
      {
        time: '오전',
        move: isLessWalking ? '12분' : '18분',
        title: isLessWalking ? '가볍게 도착하고 가까운 동네부터 보기' : '가볍게 도착하고 동네 감 잡기',
        body: firstRoute,
        reason: cityContext
          ? '선택한 소도시의 첫 동선 단서를 기준으로 여행 분위기를 빠르게 잡습니다.'
          : '첫 장소는 걷는 부담보다 여행 분위기를 잡는 데 집중합니다.',
      },
      {
        time: '오후',
        move: isLessWalking ? '16분' : '24분',
        title: isArtFocused ? '전시와 편집숍을 한 동선 안에 묶기' : '취향에 맞는 핵심 장소 둘러보기',
        body: cityContext
          ? middleRoute
          : isArtFocused
            ? '전시 공간 · 편집숍 · 쉬어가는 카페를 한 구역에 묶어 봅니다.'
            : preference.description,
        reason: cityContext
          ? '상세 패널에서 고른 장소 흐름을 오후 핵심 동선으로 이어갑니다.'
          : isArtFocused
            ? '선택한 예술 취향이 가장 잘 드러나는 장소를 이동이 짧은 순서로 배치합니다.'
            : '선택한 취향이 가장 잘 드러나는 장소를 중간에 배치합니다.',
      },
      {
        time: '저녁',
        move: isLessWalking ? '10분' : '15분',
        title: '무리하지 않는 마무리 동선',
        body: lastRoute,
        reason: '마지막에는 이동을 줄이고 쉬어갈 수 있는 여백을 둡니다.',
      },
    ],
  }
}

const createInitialChatMessages = (
  basisLabel: string,
  cityContext: PlannerCityContext | null = null,
): ChatMessage[] => [
  {
    id: createMessageId('assistant', 0),
    role: 'assistant',
    content: cityContext
      ? `${cityContext.cityName}(${cityContext.countryLabel} ${cityContext.region})를 기준으로 시작할게요. 먼저 축제를 일정 테마에 포함할까요?`
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

const createAssistantReply = (
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

const createPlanId = (
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

const getPlannerCitySeedText = (cityContext: PlannerCityContext | null) =>
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

const compactHashtag = (label: string) =>
  `#${label
    .replace(/[·,/]/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/[()]/g, '')}`

const getThemeHashtags = (profile: PreferenceProfile) =>
  profile.selectedThemeIds.map((themeId) => `#${getThemeDefinition(themeId).shortLabel}`)

const getRecommendationBasisHashtags = (profile: PreferenceProfile) => {
  const themeBasis = getThemeLabels(profile.selectedThemeIds)
    .flatMap((label) => label.split('·'))
    .map((theme) => theme.trim())

  return Array.from(new Set(themeBasis.map(compactHashtag).filter((tag) => tag.length > 1))).slice(0, 6)
}

const getPreferenceProfileLabel = (profile: PreferenceProfile) =>
  getThemeLabels(profile.selectedThemeIds).join(' · ')

const getPlannerStepClassName = (status: PlannerStepStatus) => {
  if (status === 'completed') {
    return 'border-[#A92B10] bg-[#F36B12] text-[#33271E]'
  }

  if (status === 'active') {
    return 'border-[#F36B12] bg-[#FFF0E4] text-[#33271E]'
  }

  return 'border-[#E9D2C2] bg-[#fffffa] text-[#897163]'
}

function App() {
  const cityMapDetailPanelRef = useRef<HTMLDivElement | null>(null)
  const cityMapListDetailPanelRef = useRef<HTMLDivElement | null>(null)
  const [currentUser, setCurrentUser] = useState<LovvUser | null>(() => readStoredUser())
  const [selectedPreferenceProfile, setSelectedPreferenceProfile] = useState(
    () => readStoredPreferenceProfile() ?? getDefaultPreferenceProfile(),
  )
  const selectedPreferences = useMemo(
    () => getPreferencesForProfile(selectedPreferenceProfile),
    [selectedPreferenceProfile],
  )
  const selectedPreference = selectedPreferences[0] ?? preferences[0]
  const selectedPreferenceLabel = getPreferenceProfileLabel(selectedPreferenceProfile)
  const [activeMonthlyRecommendation, setActiveMonthlyRecommendation] = useState(monthlyRecommendations[0])
  const [activeView, setActiveView] = useState<View>(() => {
    if (!readStoredUser()) {
      return 'auth'
    }

    return readStoredPreferenceProfile() ? 'home' : 'onboarding'
  })
  const [pendingPreferenceProfile, setPendingPreferenceProfile] = useState(() => selectedPreferenceProfile)
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [hasSelectedCover, setHasSelectedCover] = useState(false)
  const [festivalThemeChoice, setFestivalThemeChoice] = useState<FestivalThemeChoice>('undecided')
  const [selectedDurationLabel, setSelectedDurationLabel] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false)
  const [savedPlanNotice, setSavedPlanNotice] = useState<string | null>(null)
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null)
  const [themeSelectionNotice, setThemeSelectionNotice] = useState<string | null>(null)
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => readStoredSavedPlans())
  const [likedPlanIds, setLikedPlanIds] = useState<string[]>(() => readStoredLikedPlanIds())
  const [plannerPreferenceProfile, setPlannerPreferenceProfile] = useState(() => selectedPreferenceProfile)
  const plannerPreferences = useMemo(
    () => getPreferencesForProfile(plannerPreferenceProfile),
    [plannerPreferenceProfile],
  )
  const plannerPreference = plannerPreferences[0] ?? selectedPreference
  const plannerPreferenceLabel = getPreferenceProfileLabel(plannerPreferenceProfile)
  const plannerThemeHashtags = getThemeHashtags(plannerPreferenceProfile)
  const [plannerConditionExtraction, setPlannerConditionExtraction] =
    useState<MockConditionExtraction | null>(null)
  const [plannerContextText, setPlannerContextText] = useState('')
  const [plannerCityContext, setPlannerCityContext] = useState<PlannerCityContext | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    createInitialChatMessages(selectedPreferenceLabel),
  )
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => createPlanDraft(selectedPreference))
  const [smallCityCatalogState] = useState(() => createStaticSmallCityCatalogState())
  const [cityMapCountry, setCityMapCountry] = useState<SmallCityCountry>('KR')
  const [cityMapQuery, setCityMapQuery] = useState('')
  const [selectedSmallCityThemes, setSelectedSmallCityThemes] = useState<SmallCityTheme[]>([])
  const [selectedSmallCityId, setSelectedSmallCityId] = useState(() => {
    const firstKoreanCity = smallCityCatalogState.cities.find((city) => city.country === 'KR')

    return firstKoreanCity?.id ?? ''
  })
  const [currentHeroThemeIndex, setCurrentHeroThemeIndex] = useState(0)
  const isPreferenceEditView = activeView === 'preferenceEdit'
  const pendingPreferences = useMemo(
    () => getPreferencesForProfile(pendingPreferenceProfile),
    [pendingPreferenceProfile],
  )
  const activePreferenceProfile = isPreferenceEditView ? pendingPreferenceProfile : selectedPreferenceProfile
  const activeThemeIds =
    isPreferenceEditView || hasSelectedCover ? activePreferenceProfile.selectedThemeIds : []
  const activeThemeLabels = getThemeLabels(activeThemeIds)
  const activeThemePreferences = activeThemeIds.map(getPreferenceByThemeId)
  const hasValidThemeSelection = activeThemeIds.length > 0 && activeThemeIds.length <= 3
  const preferenceSelection = isPreferenceEditView
    ? pendingPreferences[0] ?? preferences[0]
    : selectedPreference
  const selectedCoverImage =
    preferenceSelection.coverImages[coverImageIndex] ?? preferenceSelection.coverImages[0]
  const selectedPreferenceEditorialNotes = selectedPreferences
    .map((preference) => preference.editorialNote)
    .slice(0, 3)
    .join(' ')
  const selectedThemeHashtags = getThemeHashtags(selectedPreferenceProfile)
  const recommendationBasisHashtags = getRecommendationBasisHashtags(selectedPreferenceProfile)
  const currentHeroTheme = heroThemes[currentHeroThemeIndex]
  const shouldShowFestivalPrompt = festivalThemeChoice === 'undecided'
  const shouldShowDurationPrompt = !shouldShowFestivalPrompt && selectedDurationLabel === null
  const hasGuidedPlannerChoices = festivalThemeChoice !== 'undecided' && selectedDurationLabel !== null
  const isPlannerReady = hasGuidedPlannerChoices && plannerConditionExtraction !== null
  const canSubmitChatInput = hasGuidedPlannerChoices && chatInput.trim().length > 0
  const plannerBasisLabel = plannerCityContext
    ? `${plannerCityContext.cityName} · ${plannerCityContext.region}`
    : plannerPreferenceLabel
  const currentPlanId = createPlanId(
    plannerBasisLabel,
    planDraft,
    festivalThemeChoice,
    plannerCityContext,
    plannerConditionExtraction,
  )
  const currentPlanTitle = plannerCityContext
    ? `${plannerBasisLabel} ${planDraft.durationLabel} 초안`
    : `${plannerBasisLabel} ${planDraft.durationLabel} 초안`
  const isCurrentPlanSaved = savedPlans.some((plan) => plan.id === currentPlanId)
  const isCurrentPlanLiked = likedPlanIds.includes(currentPlanId)
  const activeCountrySmallCities = useMemo(
    () => smallCityCatalogState.cities.filter((city) => city.country === cityMapCountry),
    [cityMapCountry, smallCityCatalogState.cities],
  )
  const canUseSmallCityCatalog = smallCityCatalogState.status === 'success'
  const hasSmallCityCatalogError = smallCityCatalogState.status === 'error'
  const isSmallCityCatalogLoading = smallCityCatalogState.status === 'loading'
  const filteredSmallCities = useMemo(
    () => filterSmallCities(activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes),
    [activeCountrySmallCities, cityMapQuery, selectedSmallCityThemes],
  )
  const visibleSmallCityMapMarkers = useMemo(
    () => createSmallCityMapMarkers(filteredSmallCities),
    [filteredSmallCities],
  )
  const selectedSmallCity = useMemo(() => {
    if (filteredSmallCities.length === 0) {
      return null
    }

    return (
      filteredSmallCities.find((city) => city.id === selectedSmallCityId) ??
      filteredSmallCities[0]
    )
  }, [filteredSmallCities, selectedSmallCityId])
  const selectedCountryOption =
    smallCityCountryOptions.find((option) => option.country === cityMapCountry) ??
    smallCityCountryOptions[0]
  const activeCountryTotalCount = activeCountrySmallCities.length
  const plannerStateCityChips = plannerCityContext
    ? [plannerCityContext.cityName, plannerCityContext.region]
    : getThemeLabels(plannerPreferenceProfile.selectedThemeIds)
  const plannerConditionSummary = plannerConditionExtraction
    ? [
        getFestivalThemeLabel(festivalThemeChoice),
        selectedDurationLabel ?? planDraft.durationLabel,
        formatThemeList(plannerConditionExtraction.activeRequiredThemes),
        ...plannerConditionExtraction.softPreferences.slice(0, 2),
      ]
        .filter(Boolean)
        .join(' · ')
    : `${getFestivalThemeLabel(festivalThemeChoice)} · ${selectedDurationLabel ?? '기간 미정'}`
  const plannerStateSteps: {
    id: string
    label: string
    status: PlannerStepStatus
    statusLabel: string
    body: string
    chips: string[]
  }[] = [
    {
      id: 'preference',
      label: '취향 반영',
      status: 'completed',
      statusLabel: '완료',
      body: plannerCityContext
        ? `${plannerPreferenceLabel} 취향은 유지하고 선택한 소도시를 일정 출발점으로 사용합니다.`
        : `${plannerPreferenceLabel} 기준 테마로 시작합니다.`,
      chips: plannerThemeHashtags,
    },
    {
      id: 'candidates',
      label: '후보 탐색',
      status: festivalThemeChoice === 'undecided' ? 'active' : 'completed',
      statusLabel: festivalThemeChoice === 'undecided' ? '진행 중' : '완료',
      body: plannerCityContext
        ? `${plannerCityContext.countryLabel} ${plannerCityContext.region}의 ${plannerCityContext.cityName} 상세 정보를 기준 후보로 고정했습니다.`
        : '선택한 분위기와 가까운 한국·일본 소도시 후보를 좁히고 있어요.',
      chips: plannerStateCityChips,
    },
    {
      id: 'schedule',
      label: '일정 구성',
      status: isPlannerReady ? 'completed' : festivalThemeChoice !== 'undecided' ? 'active' : 'pending',
      statusLabel: isPlannerReady ? '완료' : festivalThemeChoice !== 'undecided' ? '진행 중' : '대기',
      body: isPlannerReady
        ? `${plannerConditionSummary} 조건으로 구성 중입니다.`
        : hasGuidedPlannerChoices
          ? '동행, 관심사, 걷는 정도를 자연어로 입력하면 초안이 완성됩니다.'
          : shouldShowDurationPrompt
            ? '여행 기간을 선택해 주세요.'
            : '축제 포함 여부를 먼저 골라주세요.',
      chips: isPlannerReady
        ? ['초안 준비', planDraft.intensityLabel]
        : hasGuidedPlannerChoices
          ? ['조건 입력 대기', selectedDurationLabel ?? '기간 선택됨']
          : ['대기중'],
    },
  ]

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setCurrentHeroThemeIndex((themeIndex) => (themeIndex + 1) % heroThemes.length)
    }, heroRotationIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const resetPlannerFlow = (
    preference = selectedPreference,
    cityContext: PlannerCityContext | null = plannerCityContext,
    profile: PreferenceProfile = selectedPreferenceProfile,
  ) => {
    const nextPlannerContextText = getPlannerCitySeedText(cityContext)
    const nextPlannerLabel = getPreferenceProfileLabel(profile)

    setChatInput('')
    setFestivalThemeChoice('undecided')
    setSelectedDurationLabel(null)
    setPlannerPreferenceProfile(profile)
    setPlannerConditionExtraction(null)
    setPlannerCityContext(cityContext)
    setPlannerContextText(nextPlannerContextText)
    setChatMessages(createInitialChatMessages(nextPlannerLabel, cityContext))
    setPlanDraft(createPlanDraft(preference, nextPlannerContextText, 'undecided', cityContext))
    setSavedPlanNotice(null)
  }

  const saveGeneratedPlan = () => {
    if (!isPlannerReady) {
      return
    }

    const themeLabels = plannerCityContext
      ? plannerCityContext.themes
      : getThemeLabels(plannerPreferenceProfile.selectedThemeIds)
    const savedAt = new Date().toISOString()
    const nextPlan: SavedPlan = {
      id: currentPlanId,
      ownerId: currentUser?.id ?? 'mock-user',
      title: currentPlanTitle,
      cityPair: plannerBasisLabel,
      themeTag: themeLabels.join('·'),
      themeLabels,
      conditionSummary: plannerConditionSummary,
      durationLabel: planDraft.durationLabel,
      festivalThemeLabel: planDraft.festivalThemeLabel,
      intensityLabel: planDraft.intensityLabel,
      summary: planDraft.summary,
      stops: planDraft.stops,
      createdAt: savedAt,
      savedAt,
    }

    setSavedPlans((currentPlans) => {
      const existingPlan = currentPlans.find((plan) => plan.id === currentPlanId)
      const updatedPlan = existingPlan
        ? {
            ...nextPlan,
            createdAt: existingPlan.createdAt,
          }
        : nextPlan
      const nextPlans = [updatedPlan, ...currentPlans.filter((plan) => plan.id !== currentPlanId)]

      localStorage.setItem(savedPlansStorageKey, JSON.stringify(nextPlans))

      return nextPlans
    })
    setSavedPlanNotice('마이페이지에서 다시 확인할 수 있어요.')
  }

  const toggleGeneratedPlanLike = () => {
    if (!isPlannerReady) {
      return
    }

    setLikedPlanIds((currentPlanIds) => {
      const nextPlanIds = currentPlanIds.includes(currentPlanId)
        ? currentPlanIds.filter((planId) => planId !== currentPlanId)
        : [...currentPlanIds, currentPlanId]

      localStorage.setItem(likedPlanIdsStorageKey, JSON.stringify(nextPlanIds))

      return nextPlanIds
    })
  }

  const openPlanDetailView = () => {
    if (!isPlannerReady) {
      return
    }

    setSavedPlanNotice(null)
    setActiveView('planDetail')
  }

  const returnToChatWorkspace = () => {
    setActiveView('chat')
  }

  const signInWithMockProvider = (provider: AuthProvider) => {
    const mockUser = mockAuthUsers[provider]

    localStorage.setItem(authStorageKey, JSON.stringify(mockUser))
    setCurrentUser(mockUser)
    setActiveView(readStoredPreferenceProfile() ? 'home' : 'onboarding')
  }

  const signOut = () => {
    setIsSessionMenuOpen(false)
    localStorage.removeItem(authStorageKey)
    setCurrentUser(null)
    setActiveView('auth')
  }

  const goHome = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    setIsSessionMenuOpen(false)
    setActiveView('home')
  }

  const openMyPage = () => {
    setIsSessionMenuOpen(false)
    setActiveView('mypage')
  }

  const openPreferenceEdit = () => {
    setPendingPreferenceProfile(selectedPreferenceProfile)
    setCoverImageIndex(0)
    setHasSelectedCover(true)
    setPreferenceNotice(null)
    setThemeSelectionNotice(null)
    setActiveView('preferenceEdit')
  }

  const cancelPreferenceEdit = () => {
    setPendingPreferenceProfile(selectedPreferenceProfile)
    setCoverImageIndex(0)
    setHasSelectedCover(false)
    setThemeSelectionNotice(null)
    setActiveView('mypage')
  }

  const currentProviderLabel =
    currentUser?.provider === 'kakao'
      ? 'Kakao mock'
      : currentUser?.provider === 'google'
        ? 'Google mock'
        : 'Mock session'

  const openChat = (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    setIsSessionMenuOpen(false)
    resetPlannerFlow(selectedPreference, null, selectedPreferenceProfile)
    setActiveView('chat')
  }

  const toggleSessionMenu = () => {
    setIsSessionMenuOpen((isOpen) => !isOpen)
  }

  const openChatFromQuickAction = () => {
    setIsQuickActionsOpen(false)
    openChat()
  }

  const scrollToTop = () => {
    setIsQuickActionsOpen(false)
    setActiveView('home')
    window.scrollTo?.({ behavior: 'smooth', top: 0 })
  }

  const storePreferenceProfile = (profile: PreferenceProfile) => {
    localStorage.setItem(preferenceStorageKey, JSON.stringify(profile))
  }

  const createSinglePreferenceProfile = (
    preference: Preference,
    source: PreferenceProfileSource,
  ) => createPreferenceProfile([preference.themeId], source)

  const openMonthlyRecommendationDetail = (recommendation: MonthlyRecommendation) => {
    setActiveMonthlyRecommendation(recommendation)
    setIsQuickActionsOpen(false)
    setActiveView('themeDetail')
  }

  const openMonthlyRecommendationPlan = (preference: Preference) => {
    const nextProfile = createSinglePreferenceProfile(preference, 'preference_edit')

    resetPlannerFlow(preference, null, nextProfile)
    setIsQuickActionsOpen(false)
    setActiveView('chat')
  }

  const selectCityMapCountry = (country: SmallCityCountry) => {
    const nextCountryCities = smallCityCatalogState.cities.filter((city) => city.country === country)

    setCityMapCountry(country)
    setSelectedSmallCityId(nextCountryCities[0]?.id ?? '')
  }

  const toggleSmallCityThemeFilter = (theme: SmallCityTheme) => {
    setSelectedSmallCityThemes((currentThemes) =>
      currentThemes.includes(theme)
        ? currentThemes.filter((currentTheme) => currentTheme !== theme)
        : [...currentThemes, theme],
    )
  }

  const clearSmallCityFilters = () => {
    setCityMapQuery('')
    setSelectedSmallCityThemes([])
    setSelectedSmallCityId(activeCountrySmallCities[0]?.id ?? '')
  }

  const selectSmallCityFromList = (city: SmallCity) => {
    setSelectedSmallCityId(city.id)

    window.setTimeout(() => {
      if (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 1279px)').matches
      ) {
        cityMapListDetailPanelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 0)
  }

  const selectSmallCityMapMarker = (marker: SmallCityMapMarker) => {
    setSelectedSmallCityId(marker.cityId)
  }

  const openSmallCityPlanner = (city: SmallCity) => {
    const cityContext = createPlannerCityContext(city)

    resetPlannerFlow(selectedPreference, cityContext, selectedPreferenceProfile)
    setIsQuickActionsOpen(false)
    setActiveView('chat')
  }

  const enterMainWithPreference = () => {
    if (!hasValidThemeSelection) {
      setThemeSelectionNotice('원하는 테마를 1개 이상 선택해 주세요.')
      return
    }

    storePreferenceProfile(selectedPreferenceProfile)
    setActiveView('home')
  }

  const savePreferenceEdit = () => {
    if (!hasValidThemeSelection) {
      setThemeSelectionNotice('원하는 테마를 1개 이상 선택해 주세요.')
      return
    }

    storePreferenceProfile(pendingPreferenceProfile)
    setSelectedPreferenceProfile(pendingPreferenceProfile)
    resetPlannerFlow(getPrimaryPreference(pendingPreferenceProfile), null, pendingPreferenceProfile)
    setCoverImageIndex(0)
    setHasSelectedCover(false)
    setThemeSelectionNotice(null)
    setPreferenceNotice('취향이 변경됐어요. 다음 AI 일정부터 반영됩니다.')
    setActiveView('mypage')
  }

  const togglePreferenceTheme = (themeId: ThemeId) => {
    const source = isPreferenceEditView ? 'preference_edit' : 'onboarding'
    const currentThemeIds = activeThemeIds
    const isSelected = currentThemeIds.includes(themeId)
    const nextThemeIds = isSelected
      ? currentThemeIds.filter((currentThemeId) => currentThemeId !== themeId)
      : currentThemeIds.length >= 3
        ? currentThemeIds
        : [...currentThemeIds, themeId]

    if (!isSelected && currentThemeIds.length >= 3) {
      setThemeSelectionNotice('기준 테마는 최대 3개까지 선택할 수 있어요.')
      return
    }

    const nextProfile = createPreferenceProfile(nextThemeIds, source)

    if (isPreferenceEditView) {
      setPendingPreferenceProfile(nextProfile)
    } else {
      setSelectedPreferenceProfile(nextProfile)
    }

    setCoverImageIndex(0)
    setHasSelectedCover(nextThemeIds.length > 0)
    setThemeSelectionNotice(
      nextThemeIds.length > 0
        ? `${nextThemeIds.length}/3개 기준 테마가 선택됐어요.`
        : '원하는 테마를 1개 이상 선택해 주세요.',
    )
  }

  const showNextCoverImage = () => {
    setCoverImageIndex((currentIndex) => (currentIndex + 1) % preferenceSelection.coverImages.length)
  }

  const submitChatMessage = (message: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return
    }

    if (festivalThemeChoice === 'undecided') {
      const nextFestivalThemeChoice = resolveFestivalThemeChoice(trimmedMessage, festivalThemeChoice)

      if (nextFestivalThemeChoice === 'undecided') {
        return
      }

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('user', currentMessages.length),
          role: 'user',
          content: trimmedMessage,
        },
        {
          id: createMessageId('assistant', currentMessages.length + 1),
          role: 'assistant',
          content: `${getFestivalThemeLabel(nextFestivalThemeChoice)} 기준으로 볼게요. 이제 여행 기간을 먼저 골라주세요.`,
        },
      ])
      setFestivalThemeChoice(nextFestivalThemeChoice)
      setSavedPlanNotice(null)
      setChatInput('')

      return
    }

    if (selectedDurationLabel === null) {
      const nextSelectedDurationLabel = getExplicitDurationLabel(trimmedMessage)

      if (!nextSelectedDurationLabel) {
        return
      }

      const nextDraft = createPlanDraft(
        plannerPreference,
        `${nextSelectedDurationLabel} ${plannerContextText}`.trim(),
        festivalThemeChoice,
        plannerCityContext,
      )

      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId('user', currentMessages.length),
          role: 'user',
          content: trimmedMessage,
        },
        {
          id: createMessageId('assistant', currentMessages.length + 1),
          role: 'assistant',
          content: `${nextSelectedDurationLabel}로 잡아둘게요. 이제 동행, 관심사, 걷는 정도를 한 문장으로 알려주세요.`,
        },
      ])
      setSelectedDurationLabel(nextSelectedDurationLabel)
      setPlanDraft(nextDraft)
      setSavedPlanNotice(null)
      setChatInput('')

      return
    }

    const nextPlannerContextText = `${plannerContextText} ${trimmedMessage}`.trim()
    const nextExtraction = createMockConditionExtraction(
      trimmedMessage,
      plannerPreferenceProfile.selectedThemeIds,
    )
    const nextDraft = createPlanDraft(
      plannerPreference,
      `${selectedDurationLabel} ${nextPlannerContextText}`,
      festivalThemeChoice,
      plannerCityContext,
    )
    const assistantContent = createAssistantReply(
      plannerBasisLabel,
      nextDraft,
      nextExtraction,
      plannerCityContext,
    )

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId('user', currentMessages.length),
        role: 'user',
        content: trimmedMessage,
      },
      {
        id: createMessageId('assistant', currentMessages.length + 1),
        role: 'assistant',
        content: assistantContent,
      },
    ])
    setPlannerContextText(nextPlannerContextText)
    setPlannerConditionExtraction(nextExtraction)
    setPlanDraft(nextDraft)
    setSavedPlanNotice(null)
    setChatInput('')
  }

  const submitChatForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitChatMessage(chatInput)
  }

  const renderPlannerStateHeader = () => (
    <section
      aria-label="Planner State"
      data-testid="chat-planner-summary"
      className="min-w-0 rounded-[18px] border border-[#F3B489] bg-[#fffffa] p-6 shadow-[0_18px_42px_-28px_rgba(51,39,30,0.22)]"
    >
      <div className="grid grid-cols-[minmax(220px,0.8fr)_minmax(0,1.45fr)_minmax(220px,0.7fr)] items-start gap-5 max-xl:grid-cols-1">
        <div>
          <p className="text-sm font-semibold text-[#33271E]">Lovv AI Planner</p>
          <h2
            id="chat-title"
            className="mt-3 break-keep text-[28px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
          >
            AI 일정 챗봇
          </h2>
          <p className="mt-4 break-keep text-sm leading-6 text-[#33271E]">
            {plannerCityContext
              ? `${plannerCityContext.cityName} 상세 정보를 기준으로 축제 포함 여부와 여행 기간을 먼저 정리합니다.`
              : `${plannerPreferenceLabel} 기준 테마로 축제 포함 여부와 여행 기간을 먼저 정리합니다.`}
          </p>
        </div>

        <ol aria-label="AI 일정 진행 상태" className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {plannerStateSteps.map((step, index) => (
            <li
              key={step.id}
              className={`min-w-0 rounded-[14px] border px-4 py-3 ${getPlannerStepClassName(step.status)}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-current bg-white/50 text-[12px] font-black"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-keep text-sm font-black leading-5">{step.label}</h3>
                    <span className="rounded-[5px] border border-current bg-white/45 px-2 py-0.5 text-[11px] font-black leading-4">
                      {step.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 break-keep text-[12px] font-semibold leading-5">
                    {step.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {step.chips.slice(0, 2).map((chip) => (
                      <span
                        key={`${step.id}-${chip}`}
                        className="inline-flex min-h-7 items-center rounded-[5px] border border-current bg-white/50 px-2.5 py-0.5 text-[11px] font-black leading-4"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-[14px] border border-[#F3B489] bg-[#FFF8F6] p-5">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#A92B10]">AI Tip</p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E]">
            {plannerCityContext
              ? `${plannerCityContext.cityName}의 첫 동선 단서를 유지한 채 기간과 축제 조건만 좁힙니다.`
              : '취향, 기간, 축제 포함 여부를 먼저 정리하면 일정 초안의 이동 강도와 추천 이유가 더 분명해집니다.'}
          </p>
        </div>
      </div>
    </section>
  )

  const renderAssistantOptionGroup = (
    promptText: string,
    options: {
      key: string
      label: string
      selected?: boolean
      onClick: () => void
    }[],
  ) => (
    <div className="flex max-w-[720px] items-start gap-3">
      <span
        className="mt-6 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F3B489] bg-[#FFF0E4]"
        aria-hidden="true"
      >
        <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#315B3E]">
          Lovv AI
        </p>
        <div className="inline-flex max-w-full rounded-[18px] border border-[#F3B489] bg-white px-5 py-4 text-sm font-bold leading-6 text-[#33271E] shadow-[0_12px_24px_-20px_rgba(51,39,30,0.28)] max-sm:text-[13px] max-sm:leading-6">
          {promptText}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.selected}
              onClick={option.onClick}
              className={`inline-flex min-h-[38px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                option.selected
                  ? 'border-[#A92B10] bg-[#F36B12]'
                  : 'border-[#F3B489] bg-[#FFF8F6]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderChatConversationPanel = () => (
    <section
      aria-labelledby="chat-title"
      data-testid="chat-conversation-panel"
      className="flex min-h-[660px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#F3B489] bg-[#fffffa] shadow-[0_18px_42px_-28px_rgba(51,39,30,0.22)]"
    >
      <header className="border-b border-[#F3B489] bg-[#FFF8F6] px-6 py-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A92B10]">
              Lovv Conversation
            </p>
            <h3 className="mt-2 break-keep text-2xl font-black leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
              여행 조건을 대화로 정리하기
            </h3>
          </div>
          <span
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#A92B10] bg-[#FFF0E4]"
            aria-hidden="true"
          >
            <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
          </span>
        </div>
      </header>
      <div role="log" aria-label="AI 일정 대화" className="flex-1 space-y-5 px-6 py-6">
        {chatMessages.map((message) => {
          const isAssistant = message.role === 'assistant'

          return (
            <article
              key={message.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant ? (
                <span
                  className="mt-6 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F3B489] bg-[#FFF0E4]"
                  aria-hidden="true"
                >
                  <img src={foxFaceImage} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <div className={`min-w-0 max-w-[620px] ${isAssistant ? '' : 'items-end text-right'}`}>
                <p
                  className={`mb-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                    isAssistant ? 'text-[#315B3E]' : 'text-[#A92B10]'
                  }`}
                >
                  {isAssistant ? 'Lovv AI' : '내 조건'}
                </p>
                <div
                  className={`break-keep rounded-[18px] border px-5 py-4 text-sm leading-6 text-[#33271E] shadow-[0_12px_24px_-20px_rgba(51,39,30,0.25)] max-sm:text-[13px] max-sm:leading-6 ${
                    isAssistant
                      ? 'border-[#F3B489] bg-white'
                      : 'ml-auto border-[#A92B10] bg-[#F36B12] font-semibold'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </article>
          )
        })}

        {shouldShowFestivalPrompt
          ? renderAssistantOptionGroup(
              '축제 테마를 일정에 포함할까요?',
              festivalThemePrompts.map((prompt) => ({
                key: prompt.choice,
                label: prompt.label,
                selected: festivalThemeChoice === prompt.choice,
                onClick: () => submitChatMessage(prompt.label),
              })),
            )
          : null}

        {shouldShowDurationPrompt
          ? renderAssistantOptionGroup(
              '일정 기간을 먼저 골라주세요',
              durationGuidePrompts.map((prompt) => ({
                key: prompt,
                label: prompt,
                onClick: () => submitChatMessage(prompt),
              })),
            )
          : null}

        {isPlannerReady ? (
          <div aria-label="조건 해석 결과" className="rounded-[18px] border border-[#F3B489] bg-[#FFF8F6] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[5px] border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                일정 초안
              </span>
              <span className="rounded-[5px] border border-[#F3B489] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                {planDraft.durationLabel}
              </span>
              <span className="rounded-[5px] border border-[#F3B489] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                {planDraft.intensityLabel} 반영
              </span>
              {plannerConditionExtraction?.activeRequiredThemes.map((themeId) => (
                <span
                  key={`active-theme-${themeId}`}
                  className="rounded-[5px] border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-bold text-[#33271E]"
                >
                  {getThemeDefinition(themeId).label}
                </span>
              ))}
            </div>
            <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
              하단 일정 상세에 반영했어요. 시간대별 동선과 추천 이유를 이어서 확인해 주세요.
            </p>
            {plannerConditionExtraction?.softPreferences.length ? (
              <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                추가 조건: {plannerConditionExtraction.softPreferences.join(' · ')}
              </p>
            ) : null}
            {plannerConditionExtraction?.unsupportedConditions.length ? (
              <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#A92B10]">
                아직 반영하지 않는 조건: {plannerConditionExtraction.unsupportedConditions.join(' · ')}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="border-t border-[#F3B489] bg-[#FFF8F6] p-5">
        <form
          onSubmit={submitChatForm}
          className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-full border border-[#F3B489] bg-[#fffffa] p-2 shadow-[0_16px_32px_-26px_rgba(51,39,30,0.35)] max-sm:grid-cols-1 max-sm:rounded-[22px]"
        >
          <input
            aria-label="여행 조건 입력"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            disabled={!hasGuidedPlannerChoices}
            placeholder={
              hasGuidedPlannerChoices
                ? '동행, 관심사, 걷는 정도를 추가로 입력해 주세요'
                : '축제 포함 여부와 여행 기간을 먼저 선택해 주세요'
            }
            className="min-h-11 min-w-0 rounded-full border-0 bg-transparent px-4 py-2 break-keep text-sm leading-5 text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-65 focus:bg-[#FFF8F6] max-sm:text-[13px]"
          />
          <button
            type="submit"
            aria-label="메시지 보내기"
            disabled={!canSubmitChatInput}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-bold text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#A92B10] disabled:hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            보내기
          </button>
        </form>
      </div>
    </section>
  )

  const renderItineraryPanel = () => {
    if (!isPlannerReady) {
      return (
        <section
          aria-label="AI 일정 결과"
          className="flex min-h-[660px] flex-col justify-between rounded-[18px] border border-[#F3B489] bg-[#fffffa] p-6 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
        >
          <div>
            <p className="text-sm font-semibold text-[#33271E]">맞춤 일정 결과</p>
            <h3 className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
              아직 일정이 생성되지 않았어요
            </h3>
            <p className="mt-4 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
              축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.
            </p>
          </div>
          <div className="mt-8 rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-5">
            <p className="text-[12px] font-bold text-[#33271E]">다음 입력</p>
            <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
              {shouldShowFestivalPrompt
                ? '축제 테마를 포함할지 먼저 골라주세요.'
                : shouldShowDurationPrompt
                  ? '당일치기부터 4박 5일까지 여행 기간을 선택해 주세요.'
                  : '동행, 관심사, 걷는 정도를 자연어로 입력해 주세요.'}
            </p>
          </div>
        </section>
      )
    }

    return (
      <section
        aria-labelledby="generated-plan-title"
        className="min-h-[660px] overflow-hidden rounded-[18px] border border-[#F3B489] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
      >
        <div className="border-b border-[#F3B489] bg-[#FFF0E4] px-6 py-6">
          <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
            <div>
              <p className="text-sm font-semibold text-[#33271E]">맞춤 일정 결과</p>
              <h3
                id="generated-plan-title"
                className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7"
              >
                생성된 일정 상세
              </h3>
              <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                챗봇에서 정리된 조건을 바탕으로, 오른쪽 일정 패널에 결과를 보여줍니다.
              </p>
            </div>
            <span className="inline-flex h-10 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-[12px] font-bold text-[#33271E]">
              {planDraft.dayCount}일 구성
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {[
              planDraft.intensityLabel,
              plannerCityContext
                ? `${plannerCityContext.cityName} 중심`
                : `${plannerPreferenceLabel} 중심`,
              `${planDraft.festivalThemeLabel} 반영`,
              `${plannerPreferenceProfile.selectedThemeIds.length}개 테마 반영`,
            ].map((item) => (
              <span
                key={item}
                className="inline-flex min-h-11 min-w-0 items-center rounded-[14px] border border-[#F3B489] bg-[#fffffa] px-4 py-2 break-keep text-sm font-bold leading-5 text-[#33271E] max-sm:text-[13px]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4 max-md:grid-cols-1">
            <div>
              <p className="text-sm font-bold text-[#33271E]">1일차 추천 일정</p>
              <h4 className="mt-2 break-keep text-xl font-bold leading-7 text-[#33271E] max-sm:text-lg max-sm:leading-6">
                {currentPlanTitle}
              </h4>
              <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                장소를 확정하기 전, 취향에 맞는 첫날 흐름과 이동 강도를 먼저 확인합니다.{' '}
                {planDraft.summary}
              </p>
            </div>
            <span className="rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-2 text-[12px] font-bold text-[#33271E]">
              코스 3개
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {planDraft.stops.map((item, index) => (
              <article key={item.time} className="grid grid-cols-[38px_minmax(0,1fr)] gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex size-9 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-sm font-black text-[#33271E]">
                    {index + 1}
                  </span>
                  {index < 2 ? <span className="mt-2 h-full w-px bg-[#F3B489]" /> : null}
                </div>
                <div className="min-w-0 rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                      {item.time}
                    </span>
                    <span className="rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-semibold leading-4 text-[#33271E]">
                      다음 장소까지 {item.move}
                    </span>
                  </div>
                  <h5 className="mt-4 break-keep text-lg font-bold leading-7 text-[#33271E] max-sm:text-base max-sm:leading-6">
                    {item.title}
                  </h5>
                  <p className="mt-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                    {item.body}
                  </p>
                  <div className="mt-4 rounded-[14px] border border-[#F3B489] bg-[#fffffa] px-4 py-3">
                    <p className="text-[12px] font-bold text-[#33271E]">추천 이유</p>
                    <p className="mt-1 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                      {item.reason}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <button
              type="button"
              onClick={openPlanDetailView}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              세부 일정 보기
            </button>
            <button
              type="button"
              aria-pressed={isCurrentPlanLiked}
              onClick={toggleGeneratedPlanLike}
              className={`inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-bold text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                isCurrentPlanLiked
                  ? 'border-[#A92B10] bg-[#F36B12] hover:bg-[#FF8A2A]'
                  : 'border-[#F3B489] bg-[#fffffa] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
              }`}
            >
              {isCurrentPlanLiked ? '좋아요 취소' : '좋아요'}
            </button>
            <button
              type="button"
              onClick={() => resetPlannerFlow()}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              일정 다시짜기
            </button>
          </div>

          <section
            aria-labelledby="save-plan-cta-title"
            className="mt-6 rounded-[20px] border border-[#F3B489] bg-[#FFF0E4] p-5"
          >
            <p className="text-center text-2xl font-black leading-8 text-[#F36B12]" aria-hidden="true">
              ♥
            </p>
            <h5
              id="save-plan-cta-title"
              className="mt-2 break-keep text-center text-xl font-black leading-7 text-[#33271E] max-sm:text-lg"
            >
              추천 일정이 마음에 드세요?
            </h5>
            <p className="mt-2 break-keep text-center text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
              담은 일정은 마이페이지에서 다시 확인하고 리뷰를 남길 수 있어요.
            </p>
            <button
              type="button"
              onClick={saveGeneratedPlan}
              disabled={isCurrentPlanSaved}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-default disabled:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              {isCurrentPlanSaved ? '마이페이지에 저장됨' : '마이페이지에 저장'}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <button
                type="button"
                onClick={() => resetPlannerFlow()}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                새로운 추천받기
              </button>
              <button
                type="button"
                onClick={goHome}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                다시하기
              </button>
            </div>
          </section>
          {savedPlanNotice ? (
            <p aria-live="polite" className="mt-4 break-keep text-sm font-bold leading-6 text-[#33271E]">
              {savedPlanNotice}
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  const renderCityMapDiscoverySection = () => {
    const hasActiveFilters = cityMapQuery.trim().length > 0 || selectedSmallCityThemes.length > 0
    const cityCatalogStatusMessage = isSmallCityCatalogLoading
      ? {
          title: '소도시 데이터를 불러오는 중입니다.',
          body: '국가별 후보를 정리한 뒤 지도에 표시합니다.',
        }
      : hasSmallCityCatalogError
        ? {
            title: '소도시 데이터를 불러오지 못했습니다.',
            body: smallCityCatalogState.errorMessage,
          }
        : smallCityCatalogState.status === 'empty'
          ? {
              title: '표시할 소도시 데이터가 없습니다.',
              body: '데이터 소스가 준비되면 다시 확인할 수 있습니다.',
            }
          : null
    const selectedThemeKeywords = getThemeLabels(selectedPreferenceProfile.selectedThemeIds).flatMap((label) =>
      label.split('·'),
    )
    const selectedCityMatchedThemes =
      selectedSmallCity?.themes.filter((theme) => selectedThemeKeywords.includes(theme)) ?? []

    return (
      <section
        id="city-map-discovery"
        data-testid="city-map-discovery-section"
        aria-labelledby="city-map-discovery-title"
        className="mx-auto max-w-[1440px] px-[55px] pb-14 max-sm:px-5"
      >
        <div className="rounded-[24px] border border-[#F3B489] bg-white/82 shadow-[0_18px_48px_-34px_rgba(51,39,30,0.28)]">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(360px,0.38fr)] gap-0 max-xl:grid-cols-1">
            <div className="min-w-0 border-r border-[#F3B489] p-8 max-xl:border-r-0 max-xl:border-b max-sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 max-lg:grid-cols-1">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F36B12]">
                    Small city map
                  </p>
                  <h2
                    id="city-map-discovery-title"
                    className="mt-3 break-keep text-[34px] font-black leading-10 text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                  >
                    내가 가고 싶은 소도시 찾아보기
                  </h2>
                  <p className="mt-3 max-w-[720px] break-keep text-sm font-semibold leading-6 text-[#33271E]">
                    국가와 도시명으로 지도에서 소도시를 먼저 고르고, 테마는 후보를 좁히는 필터와 선택 이후 일정 소재로 사용합니다.
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="국가 선택"
                  className="inline-grid min-w-[236px] grid-cols-2 rounded-[8px] border border-[#F3B489] bg-[#FFF8F6] p-1 max-sm:min-w-0"
                >
                  {smallCityCountryOptions.map((option) => {
                    const isSelected = option.country === cityMapCountry

                    return (
                      <button
                        key={option.country}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectCityMapCountry(option.country)}
                        className={`min-h-11 rounded-[5px] px-4 text-sm font-black text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                          isSelected
                            ? 'border border-[#A92B10] bg-[#F36B12]'
                            : 'border border-transparent bg-transparent hover:bg-[#FFE0CA]'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-md:grid-cols-1">
                <label className="min-w-0">
                  <span className="sr-only">소도시 검색어</span>
                  <input
                    value={cityMapQuery}
                    onChange={(event) => setCityMapQuery(event.target.value)}
                    disabled={!canUseSmallCityCatalog}
                    placeholder="도시, 지역, 테마 검색"
                    className="min-h-12 w-full rounded-[8px] border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-bold text-[#33271E] outline-none placeholder:text-[#8A7467] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#A92B10] focus:ring-4 focus:ring-[#FF7017]/15"
                  />
                </label>
                <button
                  type="button"
                  onClick={clearSmallCityFilters}
                  disabled={!hasActiveFilters || !canUseSmallCityCatalog}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-default disabled:opacity-45 disabled:hover:border-[#F3B489] disabled:hover:bg-[#fffffa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  필터 초기화
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="소도시 테마 필터">
                {smallCityThemes.map((theme) => {
                  const isSelected = selectedSmallCityThemes.includes(theme)

                  return (
                    <button
                      key={theme}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={!canUseSmallCityCatalog}
                      onClick={() => toggleSmallCityThemeFilter(theme)}
                      className={`inline-flex min-h-9 items-center rounded-[5px] border px-3 py-1 text-[12px] font-black leading-4 text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                        isSelected
                          ? 'border-[#A92B10] bg-[#F36B12]'
                          : 'border-[#F3B489] bg-[#FFF8F6] hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#F3B489] disabled:hover:bg-[#FFF8F6]'
                      }`}
                    >
                      #{theme}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="break-keep text-sm font-black text-[#33271E]">
                      {selectedCountryOption.label} {filteredSmallCities.length}곳 / 전체{' '}
                      {activeCountryTotalCount}곳
                    </p>
                    <span className="rounded-[5px] border border-[#F3B489] bg-[#FFF8F6] px-3 py-1 text-[12px] font-black text-[#33271E]">
                      도시명 마커 {visibleSmallCityMapMarkers.length}개
                    </span>
                  </div>

                  <div
                    data-testid="city-map-marker-layer"
                    className="lovv-city-map-surface relative min-h-[500px] overflow-hidden rounded-[18px] border border-[#F3B489] bg-[#FFF8F6] max-sm:min-h-[380px]"
                    role="region"
                    aria-label={`${selectedCountryOption.label} 소도시 지도. 현재 조건에 맞는 도시명 마커 ${visibleSmallCityMapMarkers.length}개.`}
                  >
                    <SmallCityLeafletMap
                      markers={visibleSmallCityMapMarkers}
                      country={cityMapCountry}
                      countryLabel={selectedCountryOption.label}
                      selectedMarkerCityId={selectedSmallCity?.id ?? null}
                      onSelectMarker={selectSmallCityMapMarker}
                    />
                    <div className="absolute left-5 top-5 z-10 rounded-[5px] border border-[#F3B489] bg-white/88 px-3 py-2 text-[12px] font-black text-[#33271E] backdrop-blur">
                      {selectedCountryOption.description}
                    </div>
                    {cityCatalogStatusMessage ? (
                      <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
                        <div className="rounded-[12px] border border-[#F3B489] bg-white/90 px-5 py-4 shadow-[0_12px_28px_-20px_rgba(51,39,30,0.28)]">
                          <p className="break-keep text-sm font-black text-[#33271E]">
                            {cityCatalogStatusMessage.title}
                          </p>
                          <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                            {cityCatalogStatusMessage.body}
                          </p>
                        </div>
                      </div>
                    ) : filteredSmallCities.length === 0 ? (
                      <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
                        <div className="rounded-[12px] border border-[#F3B489] bg-white/90 px-5 py-4 shadow-[0_12px_28px_-20px_rgba(51,39,30,0.28)]">
                          <p className="break-keep text-sm font-black text-[#33271E]">
                            조건에 맞는 소도시가 없습니다.
                          </p>
                          <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                            검색어를 줄이거나 테마 필터를 초기화해 주세요.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

              </div>

              <div className="mt-5 rounded-[18px] border border-[#F3B489] bg-[#FFF8F6] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p
                      id="city-map-results-title"
                      className="text-sm font-black text-[#33271E]"
                    >
                      표시된 소도시 목록
                    </p>
                    <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                      목록에서 고른 도시는 옆의 상세 패널에 바로 반영됩니다.
                    </p>
                  </div>
                  <span className="rounded-[5px] border border-[#F3B489] bg-white px-3 py-1 text-[12px] font-black text-[#33271E]">
                    {filteredSmallCities.length} / {activeCountryTotalCount}
                  </span>
                </div>

                {filteredSmallCities.length > 0 ? (
                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(280px,0.52fr)] gap-4 max-lg:grid-cols-1">
                    <ol
                      aria-labelledby="city-map-results-title"
                      data-testid="city-map-result-list"
                      className="grid max-h-[460px] grid-cols-2 gap-2 overflow-y-auto pr-1 max-sm:max-h-[360px] max-sm:grid-cols-1"
                    >
                      {filteredSmallCities.map((city) => {
                        const isSelected = city.id === selectedSmallCity?.id

                        return (
                          <li key={`result-${city.id}`}>
                            <button
                              type="button"
                              aria-current={isSelected ? 'true' : undefined}
                              onClick={() => selectSmallCityFromList(city)}
                              className={`min-h-[74px] w-full rounded-[8px] border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                                isSelected
                                  ? 'border-[#A92B10] bg-[#FFE0CA]'
                                  : 'border-[#F3B489] bg-white hover:border-[#F36B12] hover:bg-[#fffffa]'
                              }`}
                            >
                              <span className="block break-keep text-sm font-black leading-5 text-[#33271E]">
                                {city.nameKo}
                              </span>
                              <span className="mt-1 block break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                                {city.countryLabel} · {city.region}
                                {city.nameLocal ? ` · ${city.nameLocal}` : ''}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ol>

                    <div
                      ref={cityMapListDetailPanelRef}
                      data-testid="city-map-list-detail-panel"
                      aria-labelledby="city-map-list-detail-title"
                      aria-live="polite"
                      className="min-w-0 rounded-[12px] border border-[#F3B489] bg-white p-4 shadow-[0_14px_32px_-28px_rgba(51,39,30,0.35)]"
                    >
                      {selectedSmallCity ? (
                        <>
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                            List detail
                          </p>
                          <h3
                            id="city-map-list-detail-title"
                            className="mt-2 break-keep text-xl font-black leading-7 text-[#33271E]"
                          >
                            {selectedSmallCity.nameKo}
                          </h3>
                          <p className="mt-1 break-keep text-[12px] font-black leading-5 text-[#6E5A50]">
                            {selectedSmallCity.countryLabel} · {selectedSmallCity.region}
                            {selectedSmallCity.nameLocal ? ` · ${selectedSmallCity.nameLocal}` : ''}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedSmallCity.themes.map((theme) => (
                              <span
                                key={`list-${selectedSmallCity.id}-${theme}`}
                                className="rounded-[5px] border border-[#F3B489] bg-[#FFF8F6] px-2.5 py-1 text-[11px] font-black text-[#33271E]"
                              >
                                #{theme}
                              </span>
                            ))}
                          </div>
                          <p className="mt-4 break-keep text-[13px] font-semibold leading-6 text-[#33271E]">
                            {selectedSmallCity.summary}
                          </p>
                          <div className="mt-4 rounded-[8px] border border-[#F3B489] bg-[#FFF8F6] p-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#A92B10]">
                              First route note
                            </p>
                            <p className="mt-2 break-keep text-[13px] font-black leading-6 text-[#33271E]">
                              {selectedSmallCity.routeSeed.slice(0, 3).join(' · ')}
                            </p>
                          </div>
                          <div className="mt-3 rounded-[8px] border border-[#F3B489] bg-[#FFF8F6] p-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#A92B10]">
                              추천 근거
                            </p>
                            <p className="mt-2 break-keep text-[13px] font-black leading-6 text-[#33271E]">
                              {selectedCityMatchedThemes.length > 0
                                ? `${selectedCityMatchedThemes.join('·')} 테마와 겹쳐 바로 일정 후보로 볼 만합니다.`
                                : `${selectedSmallCity.themes.slice(0, 2).join('·')} 장면이 뚜렷해서 새 후보로 비교하기 좋습니다.`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openSmallCityPlanner(selectedSmallCity)}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] border border-[#A92B10] bg-[#F36B12] px-4 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            이 소도시로 AI 일정 짜기
                          </button>
                        </>
                      ) : (
                        <div className="flex min-h-[220px] flex-col justify-center">
                          <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                            선택할 수 있는 소도시가 없습니다.
                          </p>
                          <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                            필터를 초기화하면 목록 상세를 다시 볼 수 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 break-keep rounded-[8px] border border-[#F3B489] bg-white px-4 py-4 text-sm font-bold text-[#33271E]">
                    표시할 결과가 없습니다.
                  </p>
                )}

              </div>
            </div>

            <aside
              data-testid="city-map-detail-panel"
              aria-label={selectedSmallCity ? undefined : '선택 소도시 상세 정보'}
              aria-labelledby={selectedSmallCity ? 'city-map-selected-title' : undefined}
              aria-live="polite"
              className="min-w-0 rounded-r-[24px] bg-[#FFF0E4] p-8 max-xl:rounded-b-[24px] max-xl:rounded-r-none max-sm:p-5"
            >
              <div
                ref={cityMapDetailPanelRef}
                data-testid="city-map-detail-sticky-content"
                className="xl:sticky xl:top-24"
              >
                {selectedSmallCity ? (
                  <>
                    <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                      Selected city
                    </p>
                    <h3
                      id="city-map-selected-title"
                      className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
                    >
                      {selectedSmallCity.nameKo}
                    </h3>
                    <p className="mt-2 break-keep text-sm font-black text-[#6E5A50]">
                      {selectedSmallCity.countryLabel} · {selectedSmallCity.region}
                      {selectedSmallCity.nameLocal ? ` · ${selectedSmallCity.nameLocal}` : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedSmallCity.themes.map((theme) => (
                        <span
                          key={`${selectedSmallCity.id}-${theme}`}
                          className="rounded-[5px] border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-black text-[#33271E]"
                        >
                          #{theme}
                        </span>
                      ))}
                    </div>
                    <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {selectedSmallCity.summary}
                    </p>
                    <p className="mt-3 break-keep text-sm leading-6 text-[#33271E]">
                      {selectedSmallCity.detail}
                    </p>
                    <div className="mt-5 rounded-[12px] border border-[#F3B489] bg-[#fffffa] p-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                        추천 근거
                      </p>
                      <p className="mt-2 break-keep text-sm font-black leading-6 text-[#33271E]">
                        {selectedCityMatchedThemes.length > 0
                          ? `선택 취향의 ${selectedCityMatchedThemes.join('·')} 테마와 겹쳐 먼저 볼 만합니다.`
                          : `${selectedSmallCity.themes.slice(0, 2).join('·')} 장면이 뚜렷해서 새로운 후보로 비교하기 좋습니다.`}
                      </p>
                    </div>
                    <div className="mt-5 rounded-[12px] border border-[#F3B489] bg-[#fffffa] p-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                        First route note
                      </p>
                      <p className="mt-2 break-keep text-sm font-black leading-6 text-[#33271E]">
                        {selectedSmallCity.routeSeed.slice(0, 3).join(' · ')}
                      </p>
                    </div>
                    <div className="mt-5">
                      <p className="text-[12px] font-black text-[#33271E]">하이라이트</p>
                      <ul className="mt-2 grid gap-2">
                        {selectedSmallCity.highlights.slice(0, 4).map((highlight) => (
                          <li
                            key={`${selectedSmallCity.id}-${highlight}`}
                            className="break-keep rounded-[5px] border border-[#F3B489] bg-white px-3 py-2 text-[12px] font-bold leading-5 text-[#33271E]"
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSmallCityPlanner(selectedSmallCity)}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[8px] border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      이 소도시로 AI 일정 짜기
                    </button>
                  </>
                ) : (
                  <div className="flex min-h-[320px] flex-col justify-center">
                    <p className="break-keep text-lg font-black leading-7 text-[#33271E]">
                      선택할 수 있는 소도시가 없습니다.
                    </p>
                    <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6E5A50]">
                      필터를 초기화하면 다시 상세 정보를 볼 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    )
  }

  const renderThemeDetailView = () => {
    const recommendation = activeMonthlyRecommendation
    const preference = recommendation.preference
    const detailFacts = [
      {
        label: '기준 테마',
        value: preference.tag,
        body: recommendation.themes.map((theme) => `#${theme}`).join(' '),
      },
      {
        label: '추천 이유',
        value: recommendation.badge,
        body: preference.editorialNote,
      },
      {
        label: '첫 동선 단서',
        value: preference.routeHint,
        body: 'AI 일정은 이 동선 단서를 기준으로 기간과 축제 포함 여부를 좁힙니다.',
      },
    ]

    return (
      <section
        aria-labelledby="theme-detail-title"
        className="mx-auto min-h-dvh max-w-[1440px] px-[55px] pb-16 pt-28 max-lg:px-8 max-sm:px-5"
      >
        <button
          type="button"
          onClick={goHome}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
        >
          ← 추천 카드로 돌아가기
        </button>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-[#F3B489] bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]">
          <div className="grid min-h-[460px] grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] max-lg:grid-cols-1">
            <div className="relative min-h-[460px] overflow-hidden bg-[#33271E] max-sm:min-h-[320px]">
              <img
                src={recommendation.image}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A17]/86 via-[#1F1A17]/18 to-transparent" />
              <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-8 text-white max-sm:p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-[5px] border border-white/70 bg-white/90 px-3 py-1 text-[12px] font-black text-[#33271E]">
                    {recommendation.badge}
                  </span>
                  <span className="rounded-[5px] border border-white/50 bg-white/18 px-3 py-1 text-[12px] font-bold text-white backdrop-blur">
                    {preference.cityPair}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/80">
                    Theme detail
                  </p>
                  <h1
                    id="theme-detail-title"
                    className="mt-3 break-keep text-[42px] font-black leading-[50px] tracking-normal max-sm:text-[30px] max-sm:leading-10"
                  >
                    {recommendation.title}
                  </h1>
                  <p className="mt-4 max-w-[620px] break-keep text-base font-semibold leading-7 text-white/90 max-sm:text-sm max-sm:leading-6">
                    {recommendation.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-between gap-8 p-8 max-sm:p-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F36B12]">
                  Recommendation basis
                </p>
                <h2 className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                  이 테마를 추천하는 기준
                </h2>
                <p className="mt-4 break-keep text-sm font-semibold leading-7 text-[#33271E]">
                  Lovv는 도시 이름보다 먼저 여행 분위기를 정리하고, 해당 테마와 가까운 소도시 후보를 일정 대화로 연결합니다.
                </p>
              </div>

              <div className="grid gap-3">
                {detailFacts.map((fact) => (
                  <article
                    key={fact.label}
                    className="rounded-[8px] border border-[#F3B489] bg-[#FFF0E4] p-5"
                  >
                    <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                      {fact.label}
                    </p>
                    <h3 className="mt-2 break-keep text-lg font-black leading-7 text-[#33271E]">
                      {fact.value}
                    </h3>
                    <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {fact.body}
                    </p>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openMonthlyRecommendationPlan(preference)}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                >
                  이 테마로 일정 계획하기
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[#F3B489] bg-[#fffffa] px-6 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                >
                  다른 추천 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderPlanDetailView = () => {
    if (!isPlannerReady) {
      return (
        <section className="mx-auto min-h-dvh max-w-[1120px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
          <div className="rounded-[22px] border border-[#F3B489] bg-[#fffffa] p-8 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
              Plan detail
            </p>
            <h1
              id="plan-detail-title"
              className="mt-4 break-keep text-[36px] font-black leading-[46px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
            >
              세부 일정 상세
            </h1>
            <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
              아직 확정된 일정 초안이 없어요. 챗봇에서 축제 포함 여부와 여행 기간을 먼저 골라주세요.
            </p>
            <button
              type="button"
              onClick={returnToChatWorkspace}
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              채팅으로 돌아가기
            </button>
          </div>
        </section>
      )
    }

    return (
      <section className="mx-auto min-h-dvh max-w-[1280px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
        <div
          role="region"
          aria-labelledby="plan-detail-title"
          className="overflow-hidden rounded-[24px] border border-[#F3B489] bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]"
        >
          <div className="border-b border-[#F3B489] bg-[#FFF0E4] px-8 py-7 max-sm:px-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                  Plan detail
                </p>
                <h1
                  id="plan-detail-title"
                  className="mt-4 break-keep text-[34px] font-black leading-[44px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                >
                  세부 일정 상세
                </h1>
                <h2 className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                  {currentPlanTitle}
                </h2>
                <p className="mt-4 max-w-[760px] break-keep text-sm font-semibold leading-7 text-[#33271E]">
                  {planDraft.summary}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
                {[
                  plannerBasisLabel,
                  planDraft.durationLabel,
                  planDraft.festivalThemeLabel,
                  planDraft.intensityLabel,
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-9 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 py-1 text-[12px] font-black leading-4 text-[#33271E]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 px-8 py-8 max-lg:grid-cols-1 max-sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#33271E]">시간대별 흐름</p>
                  <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                    현재 대화에서 정리한 조건으로 만든 일정 초안입니다.
                  </p>
                </div>
                <span className="rounded-full border border-[#A92B10] bg-[#F36B12] px-4 py-2 text-[12px] font-black text-[#33271E]">
                  {planDraft.dayCount}일 구성
                </span>
              </div>

              <div className="mt-7 space-y-4">
                {planDraft.stops.map((item, index) => (
                  <article
                    key={`${item.time}-${item.title}`}
                    className="grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex size-10 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-sm font-black text-[#33271E]">
                        {index + 1}
                      </span>
                      {index < planDraft.stops.length - 1 ? (
                        <span className="mt-2 h-full min-h-8 w-px bg-[#F3B489]" />
                      ) : null}
                    </div>
                    <div className="min-w-0 rounded-[20px] border border-[#F3B489] bg-[#FFF0E4] p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                          {item.time}
                        </span>
                        <span className="rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                          다음 장소까지 {item.move}
                        </span>
                      </div>
                      <h3 className="mt-4 break-keep text-xl font-black leading-8 text-[#33271E] max-sm:text-lg max-sm:leading-7">
                        {item.title}
                      </h3>
                      <p className="mt-2 break-keep text-sm font-semibold leading-7 text-[#33271E]">
                        {item.body}
                      </p>
                      <div className="mt-4 rounded-[16px] border border-[#F3B489] bg-[#fffffa] px-4 py-3">
                        <p className="text-[12px] font-black text-[#A92B10]">추천 이유</p>
                        <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[20px] border border-[#F3B489] bg-[#FFF0E4] p-5">
              <p className="text-sm font-black text-[#33271E]">일정 액션</p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]/80">
                마음에 드는 일정은 좋아요로 표시하거나 마이페이지에 저장해 다시 확인할 수 있습니다.
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  aria-pressed={isCurrentPlanLiked}
                  onClick={toggleGeneratedPlanLike}
                  className={`inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-black text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                    isCurrentPlanLiked
                      ? 'border-[#A92B10] bg-[#F36B12] hover:bg-[#FF8A2A]'
                      : 'border-[#F3B489] bg-[#fffffa] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
                  }`}
                >
                  {isCurrentPlanLiked ? '좋아요 취소' : '좋아요'}
                </button>
                <button
                  type="button"
                  onClick={saveGeneratedPlan}
                  disabled={isCurrentPlanSaved}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] disabled:cursor-default disabled:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {isCurrentPlanSaved ? '마이페이지에 저장됨' : '마이페이지에 저장'}
                </button>
                <button
                  type="button"
                  onClick={returnToChatWorkspace}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  채팅으로 돌아가기
                </button>
                <button
                  type="button"
                  onClick={openMyPage}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  마이페이지로 이동
                </button>
              </div>
              {savedPlanNotice ? (
                <p aria-live="polite" className="mt-4 break-keep text-sm font-black leading-6 text-[#33271E]">
                  {savedPlanNotice}
                </p>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    )
  }

  const renderFooter = () => (
    <footer className="mx-auto max-w-[1440px] px-16 pb-10 pt-4 max-lg:px-8 max-sm:px-5" role="contentinfo">
      <div className="grid gap-6 rounded-[24px] border border-[#F3B489] bg-[#fffffa]/90 px-7 py-6 shadow-[0_16px_42px_-30px_rgba(51,39,30,0.32)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-xl font-black leading-6 text-[#33271E]">Lovv</p>
          </div>
          <p className="mt-3 break-keep text-[12px] font-semibold leading-5 text-[#33271E]/70">
            © 2026 Lovv. All rights reserved.
          </p>
        </div>

        <nav aria-label="Lovv footer links" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#33271E]">
          <a
            href="#home"
            onClick={goHome}
            className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            이용약관
          </a>
          <a
            href="#home"
            onClick={goHome}
            className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            개인정보처리방침
          </a>
          <a
            href="#home"
            onClick={goHome}
            className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            문의하기
          </a>
        </nav>
      </div>
    </footer>
  )

  return (
    <main className="lovv-app-shell lovv-warm-pattern lovv-ambient-background min-h-dvh bg-[#fff8ee] text-[#33271E]">
      <div className="lovv-app-content">
        {activeView === 'auth' ? (
        <section
          aria-labelledby="auth-title"
          className="mx-auto grid min-h-dvh max-w-[1440px] grid-cols-[minmax(360px,440px)_minmax(0,1fr)] lg:h-dvh lg:overflow-hidden max-lg:grid-cols-1"
        >
          <div
            data-testid="auth-fixed-panel"
            className="lovv-auth-left-panel flex min-h-dvh min-w-0 flex-col justify-between border-r border-[#A92B10]/70 px-16 py-16 max-lg:min-h-0 max-lg:border-b max-lg:border-r-0 max-lg:px-8 max-lg:py-10 max-sm:px-5"
          >
            <div>
              <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
            </div>

            <div className="my-16 min-w-0 max-lg:my-10">
              <p className="text-sm font-black uppercase tracking-[0.26em] text-[#33271E] max-sm:text-[12px]">
                Social mock signup
              </p>
              <h1
                id="auth-title"
                aria-label="서울/오사카 말고, 지금은 이곳"
                className="mt-7 max-w-[360px] break-keep text-[48px] font-black leading-[58px] text-[#33271E] max-sm:text-[36px] max-sm:leading-[44px]"
              >
                <span className="block">서울/오사카 말고,</span>
                <span className="block text-[#F36B12]">지금은 이곳</span>
              </h1>
              <p className="mt-6 break-keep text-sm font-bold text-[#33271E]">
                회원가입하고 Lovv 시작하기
              </p>
              <div className="mt-8 flex w-full max-w-[340px] flex-col gap-3">
                <button
                  type="button"
                  onClick={() => signInWithMockProvider('google')}
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[14px] border border-[#EAE3E1] bg-[#fffffa] px-6 text-sm font-black text-[#33271E] shadow-[0_14px_32px_-18px_rgba(51,39,30,0.22)] transition hover:-translate-y-0.5 hover:border-[#F36B12] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  Google 간편 로그인으로 시작하기
                </button>
                <button
                  type="button"
                  onClick={() => signInWithMockProvider('kakao')}
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[14px] border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-black text-[#33271E] shadow-[0_14px_32px_-18px_rgba(51,39,30,0.45)] transition hover:-translate-y-0.5 hover:border-[#A92B10] hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  Kakao 간편 로그인으로 시작하기
                </button>
              </div>
              <p className="mt-4 max-w-[340px] break-keep text-[12px] font-bold leading-5 text-[#33271E]/70">
                현재는 OAuth API 없이 mock session만 저장합니다. 실제 연동 시 이 버튼의 로그인
                함수만 교체하면 됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold text-[#33271E]/80">
              <a
                href="#auth-title"
                className="rounded-full hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
              >
                이용약관
              </a>
              <a
                href="#auth-title"
                className="rounded-full hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
              >
                개인정보처리방침
              </a>
              <a
                href="#auth-title"
                className="rounded-full hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
              >
                문의하기
              </a>
            </div>
          </div>

          <div
            data-testid="auth-scroll-panel"
            className="lovv-auth-story-panel min-h-dvh overflow-y-auto px-20 py-20 max-lg:min-h-0 max-lg:overflow-visible max-lg:px-8 max-lg:py-12 max-sm:px-5"
          >
            <div className="mx-auto max-w-[720px] pb-16">
              <div className="inline-flex min-h-[32px] items-center rounded-full bg-[#FFF0E4] px-4 text-[12px] font-black text-[#A92B10]">
                소도시 여행의 새로운 기준
              </div>
              <h2 className="mt-8 max-w-[560px] break-keep text-[44px] font-black leading-[54px] text-[#33271E] max-sm:text-[32px] max-sm:leading-10">
                소도시 여행의 새로운 기준, Lovv
              </h2>
              <p className="mt-7 max-w-[610px] break-keep text-base font-semibold leading-8 text-[#33271E] max-sm:text-sm max-sm:leading-7">
                익숙한 대도시의 화려함 뒤에 숨겨진 진짜 로컬의 매력을 발견하세요.
                Lovv는 한국과 일본의 작지만 보석 같은 도시들을 연결하여 당신만의 특별한 여행
                이야기를 만들어냅니다.
              </p>

              <ul
                aria-label="Lovv 서비스 설명"
                className="mt-8 space-y-3 pl-5 text-sm font-bold leading-7 text-[#33271E]"
                style={{ listStyleType: 'square' }}
              >
                {authServiceBullets.map((item) => (
                  <li key={item} className="break-keep pl-1">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-12 grid grid-cols-2 gap-5 max-md:grid-cols-1">
                {authServiceCards.map((card) => (
                  <article
                    key={card.title}
                    className="min-h-[150px] rounded-[20px] border border-[#F3B489] bg-[#FFE4D4] p-6 shadow-[0_18px_40px_-32px_rgba(51,39,30,0.32)]"
                  >
                    <div className="size-8 rounded-full border border-[#A92B10] bg-[#FFF8EE]" />
                    <h3 className="mt-4 text-base font-black text-[#33271E]">{card.title}</h3>
                    <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {card.body}
                    </p>
                  </article>
                ))}
              </div>

              <section aria-labelledby="auth-journey-title" className="mt-20">
                <h3 id="auth-journey-title" className="text-2xl font-black text-[#33271E]">
                  Lovv의 여정
                </h3>
                <ol className="mt-8 space-y-8 border-l-2 border-[#F36B12] pl-7">
                  {authJourneyItems.map((item) => (
                    <li key={item.date} className="relative">
                      <span className="absolute -left-[37px] top-1 size-4 rounded-full border-2 border-[#FFF8EE] bg-[#A92B10]" />
                      <p className="text-sm font-black text-[#F36B12]">{item.date}</p>
                      <h4 className="mt-1 break-keep text-lg font-black text-[#33271E]">
                        {item.title}
                      </h4>
                      <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </section>
      ) : activeView === 'onboarding' || isPreferenceEditView ? (
        <section
          id="onboarding"
          aria-labelledby="onboarding-title"
          className="mx-auto min-h-dvh max-w-[1440px] px-12 py-9 max-lg:px-8 max-sm:px-5"
        >
          <div className="min-h-[calc(100dvh-72px)]">
            <div className="flex items-center justify-between gap-4">
              <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
            </div>

            <div
              data-testid="onboarding-content-grid"
              className={`mt-10 grid items-stretch gap-10 max-xl:grid-cols-1 ${
                hasSelectedCover ? 'grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'
              }`}
            >
              <div className="min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#33271E]">
                    Lovv City Mood Journal
                  </p>
                  <h1
                    id="onboarding-title"
                    className="mt-4 max-w-[820px] break-keep text-[56px] font-bold leading-[64px] text-[#33271E] max-sm:text-[34px] max-sm:leading-[42px]"
                  >
                    {isPreferenceEditView ? '여행의 분위기를 다시 골라주세요' : '여행의 분위기를 골라주세요'}
                  </h1>
                  <p className="mt-5 max-w-[680px] break-keep text-base leading-7 text-[#33271E] max-sm:text-[15px] max-sm:leading-6">
                    {isPreferenceEditView
                      ? '새 취향은 저장한 뒤 다음 AI 일정부터 반영됩니다.'
                      : '익숙한 대도시 감각을 Lovv가 한국과 일본 소도시 후보로 바꿔둘게요.'}
                  </p>
                </div>

              <section className="mt-9">
                <div className="flex items-end justify-between gap-5 max-md:block">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#33271E]">Choose your cover story</p>
                    <h2 className="mt-2 break-keep text-[28px] font-bold leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                      도시의 분위기로 고르는 여행 취향
                    </h2>
                  </div>
                </div>

                <div
                  data-testid="preference-card-grid"
                  className="mt-5 grid auto-rows-[212px] grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:auto-rows-auto max-md:grid-cols-1"
                >
                  {themeDefinitions.map((theme, index) => {
                    const isSelected = activeThemeIds.includes(theme.id)
                    const isMaxed = !isSelected && activeThemeIds.length >= 3
                    const samplePreference = getPreferenceByThemeId(theme.id)

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        aria-pressed={isSelected}
                        aria-disabled={isMaxed}
                        onClick={() => togglePreferenceTheme(theme.id)}
                        className={`flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-[#A92B10] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:min-h-[212px] ${
                          isSelected
                            ? 'border-[#A92B10] bg-[#FFF0E4] shadow-[0_18px_40px_-28px_rgba(51,39,30,0.55)]'
                            : isMaxed
                              ? 'border-[#F3B489] bg-[#fffffa] opacity-55'
                              : 'border-[#F3B489] bg-[#fffffa]'
                        }`}
                      >
                        <span className="flex shrink-0 items-center justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                            NO. {String(index + 1).padStart(2, '0')}
                          </span>
                          <span
                            className="inline-flex h-[30px] shrink-0 items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-3 text-[12px] font-bold text-[#33271E]"
                          >
                            {theme.shortLabel}
                          </span>
                        </span>
                        <span className="mt-5 min-h-0">
                          <span className="block break-keep text-[23px] font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
                            {theme.label}
                          </span>
                          <span className="mt-2 block line-clamp-2 break-keep text-sm leading-6 text-[#33271E]">
                            {theme.description}
                          </span>
                        </span>
                        <span className="mt-auto block w-full shrink-0 line-clamp-2 break-keep border-t border-[#F3B489] pt-3 text-[12px] font-semibold leading-5 text-[#33271E]">
                          {samplePreference.routeHint}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-5 rounded-[22px] border border-[#F3B489] bg-[#fffffa] px-5 py-4 shadow-[0_18px_50px_-34px_rgba(51,39,30,0.24)] max-md:grid-cols-1">
                  <div className="flex flex-wrap gap-2">
                    {activeThemeLabels.length > 0 ? (
                      activeThemeLabels.map((themeLabel) => (
                        <span
                          key={themeLabel}
                          className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]"
                        >
                          #{themeLabel}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full border border-[#F3B489] bg-[#FFF8F6] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]">
                        원하는 테마를 1개 이상 선택해 주세요
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 max-md:grid max-md:grid-cols-1">
                    {isPreferenceEditView ? (
                      <button
                        type="button"
                        onClick={cancelPreferenceEdit}
                        className="inline-flex h-auto min-h-[48px] items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        취소하고 마이페이지로 돌아가기
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={isPreferenceEditView ? savePreferenceEdit : enterMainWithPreference}
                      disabled={!hasValidThemeSelection}
                      className="inline-flex h-auto min-h-[48px] w-[220px] items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:w-full"
                    >
                      {isPreferenceEditView ? '이 취향으로 저장하기' : '이 취향으로 Lovv 시작하기'}
                    </button>
                  </div>
                </div>
                {themeSelectionNotice ? (
                  <p role="status" className="mt-3 break-keep text-sm font-bold leading-6 text-[#A92B10]">
                    {themeSelectionNotice}
                  </p>
                ) : null}
              </section>
            </div>

            {hasSelectedCover ? (
              <aside
                data-testid="preference-preview-card"
                className="sticky top-[220px] h-fit rounded-[28px] border border-[#F3B489] bg-[#fffffa] p-5 shadow-[0_24px_70px_-42px_rgba(51,39,30,0.45)] max-xl:static"
              >
                <div className="group relative overflow-hidden rounded-[24px] border border-[#F3B489] bg-[#FFF0E4]">
                  <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                      Selected Cover
                    </span>
                    <span className="rounded-full border border-[#F3B489] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                      {preferenceSelection.tag}
                    </span>
                  </div>
                  <img
                    src={selectedCoverImage.image}
                    alt={`${selectedCoverImage.city} 대표 이미지`}
                    className="h-[360px] w-full object-cover max-sm:h-[260px]"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#33271E]/75 via-[#33271E]/20 to-transparent p-5 max-sm:flex-col max-sm:items-start">
                    <span className="rounded-full bg-[#fffffa]/95 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-[0_10px_30px_-22px_rgba(0,0,0,0.5)]">
                      현재 표시: {selectedCoverImage.city}
                    </span>
                    <button
                      type="button"
                      aria-label="다음 도시 이미지 보기"
                      onClick={showNextCoverImage}
                      className="inline-flex min-h-9 items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 text-[12px] font-bold text-[#33271E] opacity-0 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.5)] transition hover:bg-[#FFE0CA] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffffa] group-hover:opacity-100 max-sm:opacity-100"
                    >
                      다음
                    </button>
                  </div>
                </div>

                <div className="px-2 pb-2 pt-5">
                  <p className="text-sm font-semibold text-[#33271E]">오늘의 취향 여정</p>
                  <h2 className="mt-2 break-keep text-[34px] font-bold leading-10 text-[#33271E] max-sm:text-3xl max-sm:leading-9">
                    {activeThemeLabels.join(' · ')}
                  </h2>
                  <p className="mt-4 line-clamp-3 break-keep text-sm leading-6 text-[#33271E]">
                    {activeThemePreferences
                      .map((preference) => preference.editorialNote)
                      .slice(0, 2)
                      .join(' ')}
                  </p>

                  <div className="mt-5 rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-4">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#33271E]">
                      First route note
                    </p>
                    <p className="mt-2 line-clamp-2 break-keep text-sm font-bold leading-6 text-[#33271E]">
                      {activeThemePreferences
                        .map((preference) => preference.routeHint)
                        .slice(0, 2)
                        .join(' · ')}
                    </p>
                  </div>

                  <p className="mt-5 line-clamp-3 break-keep text-[13px] leading-6 text-[#33271E]">
                    {isPreferenceEditView
                      ? '저장하기 전까지 기존 취향은 유지됩니다.'
                      : '현재 MVP는 Google mock 세션과 여행 취향 힌트만 저장하고, 전체 채팅 로그는 저장하지 않습니다.'}
                  </p>
                </div>
              </aside>
            ) : null}
          </div>
          </div>
        </section>
      ) : (
        <>
          <header className="fixed inset-x-0 top-0 z-20 border-b border-[#F3B489] bg-white/95 shadow-[0_3px_10.5px_rgba(51,39,30,0.05)] backdrop-blur">
            <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center gap-3 px-9 py-2 max-lg:px-8 max-sm:px-5">
              <a
                href="#home"
                aria-label="Lovv home"
                onClick={goHome}
                className="flex h-14 w-[104px] shrink-0 items-center overflow-hidden"
              >
                <img src={logoImage} alt="Lovv" className="h-full w-full object-contain" />
              </a>

              <div className="min-w-0 flex-1" />

              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 max-sm:w-auto">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isSessionMenuOpen}
                    aria-label={`현재 세션: ${currentProviderLabel} 메뉴 열기`}
                    onClick={toggleSessionMenu}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_3px_10.5px_rgba(51,39,30,0.05)] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                  >
                    {currentUser?.avatarInitial ?? 'M'}
                  </button>
                  {isSessionMenuOpen ? (
                    <div
                      role="menu"
                      aria-label="세션 메뉴"
                      className="absolute right-0 top-[calc(100%+10px)] z-30 grid min-w-[168px] gap-2 rounded-[18px] border border-[#F3B489] bg-white/95 p-2 shadow-[0_18px_42px_-24px_rgba(51,39,30,0.42)] backdrop-blur"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={openMyPage}
                        className="inline-flex min-h-10 w-full items-center justify-start rounded-[14px] px-4 text-sm font-bold text-[#33271E] transition hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        마이페이지
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={signOut}
                        className="inline-flex min-h-10 w-full items-center justify-start rounded-[14px] px-4 text-sm font-bold text-[#A92B10] transition hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        로그아웃
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          {activeView === 'home' ? (
            <>
              <section
                id="home"
                data-testid="main-entry"
                aria-labelledby="main-entry-title"
                data-theme={currentHeroTheme.id}
                className="lovv-rotating-hero relative mx-auto min-h-[820px] max-w-[1440px] overflow-hidden px-[55px] pb-24 pt-[132px] max-lg:min-h-[780px] max-lg:px-8 max-sm:min-h-[740px] max-sm:px-5 max-sm:pb-20 max-sm:pt-36"
              >
                <div className="absolute inset-0">
                  {heroThemes.map((theme) => {
                    const isActiveTheme = theme.id === currentHeroTheme.id

                    return (
                      <div
                        key={theme.id}
                        data-testid={`hero-theme-${theme.id}`}
                        aria-hidden={!isActiveTheme}
                        className={`lovv-hero-background-layer absolute inset-0 ${
                          isActiveTheme ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <img
                          src={theme.backgroundImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )
                  })}
                  <div className="lovv-hero-tone-veil absolute inset-0" />
                  <div className="lovv-hero-focus-wash absolute inset-0" />
                  <div className="lovv-hero-tone-bridge absolute inset-x-0 bottom-0" />
                </div>

                <div className={`lovv-hero-theme-glow ${currentHeroTheme.glowClassName}`} aria-hidden="true" />

                <div className="relative z-10 mx-auto flex min-h-[600px] max-w-[880px] flex-col items-center justify-center text-center max-lg:min-h-[560px] max-sm:min-h-[510px]">
                  <div className="inline-flex min-h-[58px] items-center gap-3 rounded-full border border-white/80 bg-white/90 px-5 py-2 text-sm font-bold text-[#A92B10] shadow-[0_20px_46px_-30px_rgba(51,39,30,0.55)] backdrop-blur max-sm:min-h-[52px] max-sm:text-[12px]">
                    <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-[#FFF0E4]">
                      <img
                        src={foxFaceImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                    안녕! 나랑 같이 떠날래?
                  </div>

                  <h1
                    id="main-entry-title"
                    aria-label={`${currentHeroTheme.lead} ${currentHeroTheme.accent}`}
                    className="mt-8 break-keep text-[56px] font-black leading-[1.08] tracking-normal text-[#1F1A17] drop-shadow-[0_2px_20px_rgba(255,255,255,0.75)] max-sm:mt-6 max-sm:text-[36px]"
                  >
                    <span className="block">{currentHeroTheme.lead}</span>
                    <span
                      data-testid="hero-slogan-accent"
                      className={`block ${currentHeroTheme.accentClassName}`}
                    >
                      {currentHeroTheme.accent}
                    </span>
                  </h1>

                  <p className="mt-7 max-w-[680px] break-keep text-base font-semibold leading-8 text-[#4A3A31] max-sm:text-sm max-sm:leading-7">
                    {currentHeroTheme.summary}
                  </p>

                  <div aria-label="선택한 여행 테마" className="mt-6 flex max-w-full flex-wrap justify-center gap-2">
                    {selectedThemeHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex min-h-[34px] items-center rounded-full border border-white/80 bg-white/80 px-4 py-1 break-keep text-sm font-bold leading-5 text-[#33271E] shadow-[0_10px_24px_-18px_rgba(51,39,30,0.28)] backdrop-blur max-sm:text-[13px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-9 flex flex-wrap justify-center gap-4 max-sm:w-full max-sm:flex-col">
                    <a
                      href="#monthly-recommendations"
                      className="inline-flex min-h-[58px] min-w-[210px] items-center justify-center rounded-[20px] border border-[#A92B10] bg-[#B64A00] px-8 text-center text-base font-black text-white shadow-[0_18px_42px_-20px_rgba(51,39,30,0.55)] transition hover:-translate-y-0.5 hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                    >
                      여행지 찾아보기
                    </a>
                    <a
                      href="#chat"
                      onClick={openChat}
                      className="inline-flex min-h-[58px] min-w-[190px] items-center justify-center rounded-[20px] border border-white/85 bg-white/90 px-8 text-center text-base font-black text-[#B64A00] shadow-[0_18px_42px_-24px_rgba(51,39,30,0.42)] transition hover:-translate-y-0.5 hover:border-[#F3B489] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                    >
                      AI 일정 짜기
                    </a>
                  </div>

                  <div
                    aria-label="현재 히어로 테마"
                    className="mt-8 flex flex-wrap justify-center gap-2"
                  >
                    {heroThemes.map((theme) => (
                      <span
                        key={theme.id}
                        aria-current={theme.id === currentHeroTheme.id ? 'true' : undefined}
                        className={`inline-flex h-2.5 w-8 rounded-full transition ${
                          theme.id === currentHeroTheme.id ? 'bg-[#F36B12]' : 'bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </section>

              <section className="mx-auto max-w-[1440px] px-[55px] pb-8 max-sm:px-5">
                <div
                  data-testid="proof-summary-panel"
                  className="grid min-h-[126px] grid-cols-[1fr_auto] items-center gap-8 rounded-3xl border border-[#F3B489] bg-white/80 px-[31px] py-7 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] max-lg:grid-cols-1"
                >
                  <div>
                    <h2 className="break-keep text-[22px] font-semibold leading-7 text-[#33271E] max-sm:text-xl">
                      처음엔 작게, 추천은 명확하게
                    </h2>
                    <p className="mt-2 break-keep text-sm leading-5 text-[#33271E]">
                      Lovv는 선택한 기준 테마를 먼저 보고, 같은 분위기의 소도시 후보를 좁힙니다.
                    </p>
                  </div>
                  <ul
                    aria-label="추천 근거 해시태그"
                    className="flex max-w-[560px] flex-wrap justify-end gap-2 max-lg:justify-start"
                  >
                    {recommendationBasisHashtags.map((tag, index) => (
                      <li key={tag}>
                        <span
                          className={`inline-flex min-h-[34px] items-center rounded-[5px] border px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E] ${
                            index === 0
                              ? 'border-[#A92B10] bg-[#F36B12]'
                              : 'border-[#F3B489] bg-[#FFF0E4]'
                          }`}
                        >
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section
                id="monthly-recommendations"
                aria-labelledby="monthly-recommendations-title"
                className="mx-auto max-w-[1440px] px-[55px] pb-12 max-sm:px-5"
              >
                <div className="mb-6 flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
                  <div className="min-w-0">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F36B12]">
                      Monthly picks
                    </p>
                    <h2
                      id="monthly-recommendations-title"
                      className="mt-3 break-keep text-[34px] font-black leading-10 text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                    >
                      이번 달 추천 소도시
                    </h2>
                    <p className="mt-3 max-w-[660px] break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      계절감과 선택 테마가 잘 맞는 한국과 일본의 소도시 후보를 먼저 골랐습니다.
                    </p>
                  </div>
                  <p className="rounded-[5px] border border-[#F3B489] bg-white/80 px-4 py-2 text-[12px] font-bold leading-5 text-[#33271E]">
                    카드를 선택하면 테마 상세 정보를 먼저 확인할 수 있습니다.
                  </p>
                </div>

                <div
                  data-testid="monthly-recommendation-grid"
                  className="grid auto-rows-[296px] grid-cols-4 gap-5 max-lg:grid-cols-2 max-md:auto-rows-[306px] max-sm:grid-cols-1 max-sm:auto-rows-auto"
                >
                  {monthlyRecommendations.map((recommendation, index) => {
                    const isFeatured = index === 0
                    const isCurrentRecommendation =
                      selectedPreferenceProfile.selectedThemeIds.includes(recommendation.preference.themeId)

                    return (
                      <button
                        key={recommendation.id}
                        type="button"
                        aria-current={isCurrentRecommendation ? 'true' : undefined}
                        aria-label={`${recommendation.preference.cityPair} 이달 추천 상세 보기`}
                        onClick={() => openMonthlyRecommendationDetail(recommendation)}
                        className={`group relative min-w-0 overflow-hidden rounded-[8px] border border-[#F3B489] bg-[#33271E] text-left shadow-[0_18px_50px_-34px_rgba(51,39,30,0.45)] transition hover:-translate-y-1 hover:border-[#A92B10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E] ${
                          isFeatured
                            ? 'col-span-2 row-span-2 min-h-[612px] max-lg:col-span-2 max-sm:col-span-1 max-sm:row-span-1 max-sm:min-h-[410px]'
                            : 'min-h-[296px] max-sm:min-h-[350px]'
                        }`}
                      >
                        <img
                          src={recommendation.image}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.hidden = true
                          }}
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A17]/88 via-[#1F1A17]/28 to-transparent" />
                        <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between gap-5 p-7 text-white max-sm:p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-[5px] border border-white/70 bg-white/90 px-3 py-1 text-[12px] font-black text-[#33271E]">
                              {recommendation.badge}
                            </span>
                            {isCurrentRecommendation ? (
                              <span className="rounded-[5px] border border-[#F36B12] bg-[#F36B12] px-3 py-1 text-[12px] font-black text-[#33271E]">
                                현재 기준
                              </span>
                            ) : null}
                          </div>

                          <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/80">
                              {recommendation.preference.cityPair}
                            </p>
                            <h3
                              className={`mt-2 break-keep font-black tracking-normal ${
                                isFeatured
                                  ? 'text-[34px] leading-10 max-sm:text-[28px] max-sm:leading-9'
                                  : 'text-[21px] leading-7'
                              }`}
                            >
                              {recommendation.title}
                            </h3>
                            <p className="mt-3 line-clamp-2 break-keep text-sm font-semibold leading-6 text-white/90">
                              {recommendation.summary}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {recommendation.themes.map((theme) => (
                                <span
                                  key={`${recommendation.id}-${theme}`}
                                  className="rounded-[5px] border border-white/60 bg-white/18 px-3 py-1 text-[12px] font-bold text-white backdrop-blur"
                                >
                                  #{theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>

              {renderCityMapDiscoverySection()}

              <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 max-sm:bottom-4 max-sm:right-4">
                {isQuickActionsOpen ? (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      aria-label="AI 일정 짜기 바로가기"
                      onClick={openChatFromQuickAction}
                      className="inline-flex min-h-11 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-20px_rgba(51,39,30,0.55)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      AI 일정 짜기
                    </button>
                    <button
                      type="button"
                      aria-label="맨 위로 이동"
                      onClick={scrollToTop}
                      className="inline-flex min-h-11 items-center rounded-full border border-[#F3B489] bg-white px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-22px_rgba(51,39,30,0.45)] transition hover:-translate-y-0.5 hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      맨 위로
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  aria-label={isQuickActionsOpen ? '빠른 이동 메뉴 닫기' : '빠른 이동 메뉴 열기'}
                  aria-expanded={isQuickActionsOpen}
                  onClick={() => setIsQuickActionsOpen((isOpen) => !isOpen)}
                  className="flex size-14 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-xl font-black text-[#33271E] shadow-[0_18px_42px_-20px_rgba(51,39,30,0.65)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {isQuickActionsOpen ? '×' : '↥'}
                </button>
              </div>
            </>
          ) : activeView === 'themeDetail' ? (
            renderThemeDetailView()
          ) : activeView === 'planDetail' ? (
            renderPlanDetailView()
          ) : activeView === 'mypage' ? (
            <section
              aria-labelledby="mypage-title"
              className="mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
            >
              <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(320px,0.55fr)] gap-6 max-lg:grid-cols-1">
                <section className="rounded-[22px] border border-[#F3B489] bg-[#fffffa] p-7 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                    My Lovv
                  </p>
                  <h1
                    id="mypage-title"
                    className="mt-4 break-keep text-[42px] font-black leading-[52px] text-[#33271E] max-sm:text-[32px] max-sm:leading-10"
                  >
                    마이페이지
                  </h1>
                  <p className="mt-5 max-w-[680px] break-keep text-base font-semibold leading-8 text-[#33271E] max-sm:text-sm max-sm:leading-7">
                    현재는 실제 회원 API 없이 mock session으로 로그인 상태만 확인합니다. 실제
                    Kakao/Google 연동이 붙으면 이 페이지에서 저장 일정과 취향 데이터를 계정 기준으로
                    매핑하면 됩니다.
                  </p>
                  {preferenceNotice ? (
                    <p
                      role="status"
                      className="mt-5 rounded-[16px] border border-[#F3B489] bg-[#FFF0E4] px-5 py-3 text-sm font-black leading-6 text-[#33271E]"
                    >
                      {preferenceNotice}
                    </p>
                  ) : null}

                  <div className="mt-8 grid grid-cols-3 gap-4 max-md:grid-cols-1">
                    {[
                      { label: '로그인 방식', value: currentProviderLabel },
                      { label: '선택 취향', value: selectedPreferenceLabel },
                      { label: '저장 일정', value: savedPlanNotice ? '1개 준비됨' : '아직 없음' },
                    ].map((item) => (
                      <article
                        key={item.label}
                        className="rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-5"
                      >
                        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                          {item.label}
                        </p>
                        <p className="mt-3 break-keep text-lg font-black leading-7 text-[#33271E]">
                          {item.value}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[20px] border border-[#F3B489] bg-[#FFF0E4] p-6">
                    <p className="text-sm font-black text-[#33271E]">선택한 여행 분위기</p>
                    <h2 className="mt-3 break-keep text-[30px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                      {selectedPreferenceLabel}
                    </h2>
                    <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {selectedPreferenceEditorialNotes}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedThemeHashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex min-h-[34px] items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 py-1 text-[12px] font-bold text-[#33271E]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={openPreferenceEdit}
                      className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                    >
                      취향 다시 고르기
                    </button>
                  </div>
                </section>

                <aside className="rounded-[22px] border border-[#F3B489] bg-[#fffffa] p-7 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                    Mock account
                  </p>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="flex size-14 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-xl font-black text-[#33271E]">
                      {currentUser?.avatarInitial ?? 'M'}
                    </span>
                    <div className="min-w-0">
                      <p className="break-keep text-lg font-black text-[#33271E]">
                        {currentUser?.name ?? 'Mock User'}
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-[#33271E]/70">
                        {currentUser?.email ?? 'mock@lovv.local'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-7 rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-5">
                    <p className="text-sm font-black text-[#33271E]">연동 상태</p>
                    <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      API 호출 없이 더미 사용자만 저장 중입니다. 실제 OAuth 연동 시 mock auth
                      adapter만 provider API 호출로 교체합니다.
                    </p>
                  </div>
                  <div className="mt-7 grid gap-3">
                    <button
                      type="button"
                      onClick={goHome}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      메인으로 돌아가기
                    </button>
                    <button
                      type="button"
                      onClick={signOut}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      로그아웃
                    </button>
                  </div>
                </aside>
              </div>
            </section>
          ) : (
            <section
              id="chat"
              aria-labelledby="chat-title"
              className="mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
            >
              <div data-testid="chat-workspace" className="space-y-5">
                <button
                  type="button"
                  onClick={goHome}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  ← 이전으로 돌아가기
                </button>
                {renderPlannerStateHeader()}
                <div
                  data-testid="chat-top-grid"
                  className="grid min-h-[660px] grid-cols-[minmax(0,0.96fr)_minmax(360px,0.82fr)] items-start gap-6 max-xl:grid-cols-1"
                >
                  {renderChatConversationPanel()}
                  {renderItineraryPanel()}
                </div>
              </div>
            </section>
          )}

          {renderFooter()}
        </>
        )}
      </div>
    </main>
  )
}

export default App
