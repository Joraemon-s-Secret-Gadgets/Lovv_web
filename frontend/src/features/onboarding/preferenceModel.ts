import beppuImage from '../../assets/cities/beppu.jpg'
import busanImage from '../../assets/cities/busan.jpg'
import gangneungImage from '../../assets/cities/gangneung.jpg'
import gyeongjuImage from '../../assets/cities/gyeongju.jpg'
import jejuImage from '../../assets/cities/jeju.jpg'
import jeonjuImage from '../../assets/cities/jeonju.jpg'
import kanazawaImage from '../../assets/cities/kanazawa.jpg'
import kyotoImage from '../../assets/cities/kyoto.jpg'
import nikkoImage from '../../assets/cities/nikko.jpg'
import okinawaImage from '../../assets/cities/okinawa.jpg'
import onyangImage from '../../assets/cities/onyang.jpg'
import osakaImage from '../../assets/cities/osaka.jpg'
import type {
  Preference,
  PreferenceProfile,
  PreferenceProfileSource,
  ThemeDefinition,
  ThemeId,
} from '../../shared/types/app'

export const preferenceStorageKey = 'lovv.preference'
export const preferenceProfileVersion = 2

export const themeDefinitions: ThemeDefinition[] = [
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

export const preferences: Preference[] = [
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

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && themeDefinitions.some((theme) => theme.id === value)

export const isPreferenceProfileSource = (value: unknown): value is PreferenceProfileSource =>
  value === 'onboarding' || value === 'preference_edit' || value === 'legacy_migration'

export const normalizeThemeIds = (themeIds: unknown): ThemeId[] => {
  if (!Array.isArray(themeIds)) {
    return []
  }

  return Array.from(new Set(themeIds.filter(isThemeId))).slice(0, 3)
}

export const createPreferenceProfile = (
  selectedThemeIds: ThemeId[],
  source: PreferenceProfileSource,
): PreferenceProfile => ({
  version: preferenceProfileVersion,
  selectedThemeIds: normalizeThemeIds(selectedThemeIds).slice(0, 3),
  source,
  updatedAt: new Date().toISOString(),
})

export const findPreferenceByCityPair = (cityPair: string | undefined) =>
  preferences.find(
    (preference) =>
      preference.cityPair === cityPair || preference.legacyCityPairs?.includes(cityPair ?? ''),
  ) ?? null

export const getThemeDefinition = (themeId: ThemeId) =>
  themeDefinitions.find((theme) => theme.id === themeId) ?? themeDefinitions[0]

export const getPreferenceByThemeId = (themeId: ThemeId) =>
  preferences.find((preference) => preference.themeId === themeId) ?? preferences[0]

export const getPreferencesForProfile = (profile: PreferenceProfile) => {
  const selectedPreferences = profile.selectedThemeIds
    .map(getPreferenceByThemeId)
    .filter((preference): preference is Preference => Boolean(preference))

  return selectedPreferences.length > 0 ? selectedPreferences : [preferences[0]]
}

export const getPrimaryPreference = (profile: PreferenceProfile) =>
  getPreferencesForProfile(profile)[0] ?? preferences[0]

export const getDefaultPreferenceProfile = () =>
  createPreferenceProfile([preferences[0].themeId], 'onboarding')

export const getThemeLabels = (themeIds: ThemeId[]) =>
  themeIds.map((themeId) => getThemeDefinition(themeId).label)

export const readStoredPreferenceProfile = (): PreferenceProfile | null => {
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

export const storePreferenceProfile = (profile: PreferenceProfile) => {
  localStorage.setItem(preferenceStorageKey, JSON.stringify(profile))
}
