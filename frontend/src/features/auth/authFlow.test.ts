import { describe, expect, it } from 'vitest'
import type { AuthApiState } from '../../shared/api/authApi'
import {
  adaptApiAuthSessionSnapshot,
  authRuntimeModeEnvName,
  createMockAuthSessionSnapshot,
  getDefaultAuthRuntimeMode,
  resolveAuthRuntimeMode,
} from './authFlow'

describe('auth flow orchestration helpers', () => {
  it('uses Cognito as the production runtime while keeping mock and API modes explicit', () => {
    expect(authRuntimeModeEnvName).toBe('VITE_LOVV_AUTH_MODE')
    expect(resolveAuthRuntimeMode(undefined)).toBe('cognito')
    expect(resolveAuthRuntimeMode('')).toBe('cognito')
    expect(resolveAuthRuntimeMode('mock')).toBe('mock')
    expect(resolveAuthRuntimeMode('api')).toBe('api')
    expect(resolveAuthRuntimeMode('cognito')).toBe('cognito')
    expect(resolveAuthRuntimeMode('production')).toBe('cognito')
    expect(getDefaultAuthRuntimeMode()).toBe('cognito')
  })

  it('creates a mock session snapshot without adding API tokens', () => {
    expect(createMockAuthSessionSnapshot('google', { onboardingCompleted: true })).toEqual({
      mode: 'mock',
      user: {
        id: 'mock-google-user',
        name: 'Lovv Google User',
        email: 'google@lovv.local',
        avatarInitial: 'G',
        provider: 'google',
      },
      preferenceProfile: null,
      onboardingCompleted: true,
      accessToken: null,
      tokenType: 'Bearer',
      expiresIn: null,
      sessionId: null,
      sessionExpiresAt: null,
    })
  })

  it('adapts authenticated backend auth state into an API session snapshot', () => {
    const authState: AuthApiState = {
      authenticated: true,
      accessToken: 'access-token-1',
      tokenType: 'Bearer',
      expiresIn: 900,
      sessionId: 'session-1',
      sessionExpiresAt: '2026-06-25T00:00:00Z',
      user: {
        id: 'user-1',
        name: 'Mina Kim',
        email: 'mina@example.com',
        avatarInitial: 'M',
        provider: 'google',
      },
      preferenceProfile: null,
      onboardingCompleted: false,
    }

    expect(adaptApiAuthSessionSnapshot(authState)).toEqual({
      mode: 'api',
      user: authState.user,
      preferenceProfile: null,
      onboardingCompleted: false,
      accessToken: 'access-token-1',
      tokenType: 'Bearer',
      expiresIn: 900,
      sessionId: 'session-1',
      sessionExpiresAt: '2026-06-25T00:00:00Z',
    })
  })

  it('clears API session data when backend auth state is unauthenticated', () => {
    expect(
      adaptApiAuthSessionSnapshot({
        authenticated: false,
        accessToken: 'ignored-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        sessionId: 'session-1',
        sessionExpiresAt: '2026-06-25T00:00:00Z',
        user: null,
        preferenceProfile: null,
        onboardingCompleted: false,
      }),
    ).toEqual({
      mode: 'api',
      user: null,
      preferenceProfile: null,
      onboardingCompleted: false,
      accessToken: null,
      tokenType: 'Bearer',
      expiresIn: null,
      sessionId: null,
      sessionExpiresAt: null,
    })
  })
})
