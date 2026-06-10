export type CityCoverImage = {
  city: string
  image: string
}

export type FestivalThemeChoice = 'undecided' | 'include' | 'exclude'

export type ThemeId =
  | 'hot_spring_rest'
  | 'sea_coast'
  | 'history_tradition'
  | 'food_local'
  | 'nature_trekking'
  | 'art_emotion'

export type PreferenceProfileSource = 'onboarding' | 'preference_edit' | 'legacy_migration'

export type ThemeDefinition = {
  id: ThemeId
  label: string
  shortLabel: string
  description: string
  keywords: string[]
}

export type PreferenceProfile = {
  version: 2
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
  image: string
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
}

export type PlanDay = {
  day: number
  title: string
  summary: string
  stops: PlanStop[]
}

export type PlanDraft = {
  durationLabel: string
  dayCount: number
  intensityLabel: string
  festivalThemeLabel: string
  summary: string
  days: PlanDay[]
  stops: PlanStop[]
}

export type PlanReactionType = 'like' | 'dislike' | null

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
  createdAt: string
  savedAt: string
}

export type AuthProvider = 'google' | 'kakao'

export type LovvUser = {
  id: string
  name: string
  email: string
  avatarInitial: string
  provider: AuthProvider
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
