/**
 * @file authFlow.ts
 * @description Auth runtime mode and session snapshot helpers.
 * @lastModified 2026-06-12
 */

import type { AuthApiState } from '../../shared/api/authApi'
import type { AuthProvider, LovvUser, PreferenceProfile } from '../../shared/types/app'
import { mockAuthUsers } from './authModel'

export const authRuntimeModeEnvName = 'VITE_LOVV_AUTH_MODE'

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

// Mock mode remains available for local UI checks, but production defaults to Cognito.
export const createMockAuthSessionSnapshot = (
  provider: AuthProvider,
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

export const adaptApiAuthSessionSnapshot = (state: AuthApiState): AuthSessionSnapshot => {
  if (!state.authenticated || !state.user) {
    return {
      mode: 'api',
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
    mode: 'api',
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
