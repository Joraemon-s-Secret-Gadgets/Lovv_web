import type { View } from '../types/app'

export const viewSearchParam = 'view'

export const canonicalRoutePaths = {
  auth: '/auth',
  onboarding: '/onboarding',
  home: '/home',
  map: '/map',
  planner: '/planner',
  mypage: '/mypage',
  preferences: '/preferences',
} as const

const canonicalPathViews = new Map<string, View>([
  [canonicalRoutePaths.auth, 'auth'],
  [canonicalRoutePaths.onboarding, 'onboarding'],
  [canonicalRoutePaths.home, 'home'],
  [canonicalRoutePaths.map, 'map'],
  [canonicalRoutePaths.planner, 'planner'],
  [canonicalRoutePaths.mypage, 'mypage'],
  [canonicalRoutePaths.preferences, 'preferences'],
])

export const createPlanDetailPath = (planId: string) => `/plans/${encodeURIComponent(planId)}`

export const getPlanDetailRouteId = (pathname: string) => {
  const match = /^\/plans\/([^/]+)$/.exec(pathname)

  return match ? decodeURIComponent(match[1]) : null
}

export const getCanonicalViewFromPath = (pathname: string): View | null => {
  const canonicalView = canonicalPathViews.get(pathname)

  if (canonicalView) {
    return canonicalView
  }

  return getPlanDetailRouteId(pathname) ? 'planDetail' : null
}

export const getDefaultRoutePath = (isAuthenticated: boolean, hasCompletedPreference: boolean) => {
  if (!isAuthenticated) {
    return canonicalRoutePaths.auth
  }

  return hasCompletedPreference ? canonicalRoutePaths.home : canonicalRoutePaths.onboarding
}

export const getPathForView = (view: View, planId?: string) => {
  switch (view) {
    case 'auth':
    case 'onboarding':
    case 'home':
    case 'map':
    case 'planner':
    case 'mypage':
    case 'preferences':
      return canonicalRoutePaths[view]
    case 'chat':
      return canonicalRoutePaths.planner
    case 'preferenceEdit':
      return canonicalRoutePaths.preferences
    case 'planDetail':
      return planId ? createPlanDetailPath(planId) : canonicalRoutePaths.planner
    case 'themeDetail':
      return canonicalRoutePaths.home
    default:
      return canonicalRoutePaths.home
  }
}

export const getLegacyViewRedirectPath = (search: string, readyPlanId?: string | null) => {
  const legacyView = new URLSearchParams(search).get(viewSearchParam)

  switch (legacyView) {
    case 'auth':
    case 'onboarding':
    case 'home':
    case 'map':
    case 'mypage':
      return getPathForView(legacyView)
    case 'chat':
      return canonicalRoutePaths.planner
    case 'preferenceEdit':
      return canonicalRoutePaths.preferences
    case 'planDetail':
      return readyPlanId ? createPlanDetailPath(readyPlanId) : canonicalRoutePaths.planner
    case 'themeDetail':
      return canonicalRoutePaths.home
    default:
      return null
  }
}

export const getGuardRedirectPath = ({
  pathname,
  isAuthenticated,
  hasCompletedPreference,
  hasRoutePlan,
}: {
  pathname: string
  isAuthenticated: boolean
  hasCompletedPreference: boolean
  hasRoutePlan: boolean
}) => {
  const canonicalView = getCanonicalViewFromPath(pathname)

  if (!canonicalView || pathname === '/') {
    return getDefaultRoutePath(isAuthenticated, hasCompletedPreference)
  }

  if (canonicalView === 'auth') {
    return isAuthenticated ? getDefaultRoutePath(true, hasCompletedPreference) : null
  }

  if (!isAuthenticated) {
    return canonicalRoutePaths.auth
  }

  if (canonicalView === 'onboarding') {
    return hasCompletedPreference ? canonicalRoutePaths.home : null
  }

  if (!hasCompletedPreference) {
    return canonicalRoutePaths.onboarding
  }

  if (canonicalView === 'planDetail' && !hasRoutePlan) {
    return canonicalRoutePaths.planner
  }

  return null
}
