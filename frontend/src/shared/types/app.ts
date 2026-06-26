/**
 * @file app.ts
 * @description Global type definitions for the Lovv frontend application.
 * @lastModified 2026-06-23
 */

export type CityCoverImage = {
  city: string
  image: string
}

export type FestivalThemeChoice = 'undecided' | 'include' | 'exclude'

export type ThemeId =
  | 'healing_rest'
  | 'sea_coast'
  | 'history_tradition'
  | 'food_local'
  | 'nature_trekking'
  | 'art_sense'

export type PreferenceProfileSource = 'onboarding' | 'preference_edit' | 'legacy_migration'

export type CountryTrack = 'KR' | 'JP'

export type ThemeDefinition = {
  id: ThemeId
  label: string
  shortLabel: string
  description: string
  keywords: string[]
}

export type PreferenceProfile = {
  version: 2
  countryTrack: CountryTrack
  selectedThemeIds: ThemeId[]
  source: PreferenceProfileSource
  updatedAt: string
}

export type Preference = {
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

export type MonthlyRecommendation = {
  id: string
  preference: Preference
  title: string
  summary: string
  badge: string
  image?: string | null
  themes: string[]
}

export type HeroTheme = {
  id: 'mountain' | 'sea' | 'festival'
  label: string
  lead: string
  accent: string
  summary: string
  backgroundImage: string
  accentClassName: string
  glowClassName: string
}

export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

export type PlannerStepStatus = 'completed' | 'active' | 'pending'

export type PlanStop = {
  time: '아침' | '점심' | '저녁'
  move: string
  title: string
  body: string
  reason: string
  source?: 'agent' | 'wishlist' | 'manual'
  lockLevel?: 'none' | 'user_added' | 'pinned'
  wishlistRestaurantId?: string
  contentId?: string
  imageUrl?: string
  latitude?: number | null
  longitude?: number | null
  moveDurationSeconds?: number | null
  moveDistanceMeters?: number | null
}

export type RoutePathCoordinate = [number, number]

export type PlanRoute = {
  provider?: string
  profile?: string
  geometry?: {
    type?: string
    coordinates?: RoutePathCoordinate[]
  }
  distanceMeters?: number
  durationSeconds?: number
  segments?: Array<{
    distanceMeters?: number
    durationSeconds?: number
  }>
}

export type SelectedMealPlace = {
  id: string
  placeName: string
  roadAddressName?: string
  addressName?: string
  phone?: string
  placeUrl?: string
  source: 'kakao'
  lat?: number
  lng?: number
}

export type PlanDay = {
  day: number
  title: string
  summary: string
  stops: PlanStop[]
  route?: PlanRoute
}

export type PlanDraft = {
  durationLabel: string
  dayCount: number
  intensityLabel: string
  festivalThemeLabel: string
  summary: string
  days: PlanDay[]
  stops: PlanStop[]
  selectedRestaurants?: SelectedMealPlace[]
  userNotice?: string[]
}

export type SavedPlanLike = 'like' | null

export type MockConditionExtraction = {
  activeRequiredThemes: ThemeId[]
  softPreferences: string[]
  cleanedRawQuery: string
  unsupportedConditions: string[]
  excludedThemes: ThemeId[]
  backupThemes: ThemeId[]
}

export type SavedPlan = {
  id: string
  sourceRecommendationId?: string
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
  days?: PlanDay[]
  stops: PlanStop[]
  selectedRestaurants?: SelectedMealPlace[]
  destinationId?: string
  isLiked?: boolean
  isPublic?: boolean
  copiedFromItineraryId?: string

  createdAt: string
  savedAt: string
}

export type SocialAuthProvider = 'google' | 'kakao'

export type AuthProvider = SocialAuthProvider | 'cognito'

export type LovvRole = 'R-USER' | 'R-ADMIN'

export type LovvUser = {
  id: string
  name: string
  email: string
  avatarInitial: string
  provider: AuthProvider
  roles?: LovvRole[]
  birthDate?: string | null
  gender?: string | null
  createdAt?: string | null
}

export type SocialAccountSummary = {
  provider: SocialAuthProvider
  nickname: string | null
  avatarUrl: string | null
  linkedAt: string | null
  lastLoginAt: string | null
}

export type View =
  | 'auth'
  | 'onboarding'
  | 'home'
  | 'map'
  | 'planner'
  | 'chat'
  | 'planDetail'
  | 'mypage'
  | 'preferences'
  | 'preferenceEdit'
  | 'themeDetail'
  | 'recommendation'
  | 'admin'

// EOF: app.ts
