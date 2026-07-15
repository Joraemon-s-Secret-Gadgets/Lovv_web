/**
 * @file authFlow.ts
 * @description Auth runtime mode and session snapshot helpers.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import type { AuthApiState } from '../../shared/api/authApi'
import type { LovvUser, PreferenceProfile, SocialAuthProvider } from '../../shared/types/app'
import { mockAuthUsers } from './authModel'

export const authRuntimeModeEnvName = 'VITE_LOVV_AUTH_MODE'
export const authSessionRefreshLeadTimeMs = 60_000

export type AuthRuntimeMode = 'mock' | 'api' | 'cognito'

export type AuthSessionSnapshot = {
  mode: AuthRuntimeMode
  user: LovvUser | null
  preferenceProfile: PreferenceProfile | null
  onboardingCompleted: boolean
  accessToken: string | null
  tokenType: string
  expiresIn: number | null
  sessionId: string | null
  sessionExpiresAt: string | null
}

export const resolveAuthRuntimeMode = (value: unknown): AuthRuntimeMode => {
  if (value === 'mock' || value === 'api' || value === 'cognito') {
    return value
  }

  return 'cognito'
}

export const getDefaultAuthRuntimeMode = () =>
  resolveAuthRuntimeMode(import.meta.env.VITE_LOVV_AUTH_MODE?.trim())

export const getAuthTokenExpiresAtMs = (
  expiresInSeconds: number | null,
  nowMs: number,
): number | null => {
  if (expiresInSeconds === null || !Number.isFinite(expiresInSeconds)) {
    return null
  }

  return nowMs + Math.max(0, expiresInSeconds * 1000)
}

export const getAuthSessionRefreshDelayMs = (
  expiresAtMs: number | null,
  nowMs: number,
  refreshLeadTimeMs = authSessionRefreshLeadTimeMs,
): number | null => {
  if (expiresAtMs === null || !Number.isFinite(expiresAtMs)) {
    return null
  }

  return Math.max(0, expiresAtMs - nowMs - Math.max(0, refreshLeadTimeMs))
}

export const isAuthSessionRefreshDue = (
  expiresAtMs: number | null,
  nowMs: number,
  refreshLeadTimeMs = authSessionRefreshLeadTimeMs,
) => getAuthSessionRefreshDelayMs(expiresAtMs, nowMs, refreshLeadTimeMs) === 0

// Mock mode remains available for local UI checks, but production defaults to Cognito.
export const createMockAuthSessionSnapshot = (
  provider: SocialAuthProvider,
  options: { onboardingCompleted: boolean },
): AuthSessionSnapshot => ({
  mode: 'mock',
  user: mockAuthUsers[provider],
  preferenceProfile: null,
  onboardingCompleted: options.onboardingCompleted,
  accessToken: null,
  tokenType: 'Bearer',
  expiresIn: null,
  sessionId: null,
  sessionExpiresAt: null,
})

export const adaptApiAuthSessionSnapshot = (
  state: AuthApiState,
  mode: Extract<AuthRuntimeMode, 'api' | 'cognito'> = 'api',
): AuthSessionSnapshot => {
  if (!state.authenticated || !state.user) {
    return {
      mode,
      user: null,
      preferenceProfile: null,
      onboardingCompleted: false,
      accessToken: null,
      tokenType: 'Bearer',
      expiresIn: null,
      sessionId: null,
      sessionExpiresAt: null,
    }
  }

  return {
    mode,
    user: state.user,
    preferenceProfile: state.preferenceProfile,
    onboardingCompleted: state.onboardingCompleted,
    accessToken: state.accessToken,
    tokenType: state.tokenType,
    expiresIn: state.expiresIn,
    sessionId: state.sessionId,
    sessionExpiresAt: state.sessionExpiresAt,
  }
}

// EOF: authFlow.ts
