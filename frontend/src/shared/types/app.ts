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
  cityId?: string
  cityName?: string
  region?: string
  month?: number
  timingTag?: string
  source?: 'static' | 'api'
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

export type ChatClarificationOption = {
  optionId: string
  label: string
  description?: string
  helperText?: string
  apply?: unknown
  then?: unknown
}

export type ChatClarification = {
  threadId: string
  recommendationId?: string
  reasonCode?: string
  prompt: string
  selectedOptionId?: string
  options: ChatClarificationOption[]
}

export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  clarification?: ChatClarification
}

export type PlannerStepStatus = 'completed' | 'active' | 'pending'

export type PlanStop = {
  itemId?: string
  itemType?: 'attraction' | 'festival' | string
  day?: number
  order?: number
  time: '아침' | '점심' | '저녁'
  move: string
  title: string
  body: string
  reason: string
  source?: 'agent' | 'wishlist' | 'manual'
  lockLevel?: 'none' | 'user_added' | 'pinned'
  wishlistRestaurantId?: string
  contentId?: string
  isSeed?: boolean
  cityId?: string
  theme?: string
  indoorOutdoor?: string
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
  recommendationReasons?: string[]
  confidence?: number | string
  links?: Record<string, string | undefined>
  festivalDateVerifications?: unknown
  alternativeItinerary?: unknown
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
  links?: Record<string, string | undefined>
  alternativeItinerary?: unknown
  isLiked?: boolean
  isPublic?: boolean
  copiedFromItineraryId?: string
  likeCount?: number

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
