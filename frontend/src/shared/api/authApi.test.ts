import { describe, expect, it, vi } from 'vitest'
import {
  adaptAuthApiResponse,
  authApiEndpoints,
  isSuccessfulAuthLogoutStatus,
  requestCognitoBridgeSession,
  requestAuthLogin,
  requestAuthLogout,
  requestAuthMe,
  requestAuthSession,
  serializeAuthLoginRequest,
} from './authApi'

describe('auth API adapter', () => {
  it('keeps auth endpoint names aligned with the backend contract', () => {
    expect(authApiEndpoints.google).toBe('/api/v1/auth/google')
    expect(authApiEndpoints.kakao).toBe('/api/v1/auth/kakao')
    expect(authApiEndpoints.cognitoSession).toBe('/api/v1/auth/cognito/session')
    expect(authApiEndpoints.me).toBe('/api/v1/auth/me')
    expect(authApiEndpoints.session).toBe('/api/v1/auth/session')
    expect(authApiEndpoints.logout).toBe('/api/v1/auth/logout')
  })

  it('serializes social login credentials for backend login calls', () => {
    expect(
      serializeAuthLoginRequest({
        credentialType: 'id_token',
        credential: 'provider-token',
        nonce: 'nonce-1',
        redirectUri: 'https://lovv.example/auth/callback',
      }),
    ).toEqual({
      credentialType: 'id_token',
      credential: 'provider-token',
      nonce: 'nonce-1',
      redirectUri: 'https://lovv.example/auth/callback',
    })
  })

  it('serializes authorization_code login fields for backend code exchange', () => {
    expect(
      serializeAuthLoginRequest({
        credentialType: 'authorization_code',
        credential: 'google-auth-code',
        redirectUri: 'https://lovv.example/auth/callback/google',
        codeVerifier: 'google-pkce-verifier',
      }),
    ).toEqual({
      credentialType: 'authorization_code',
      credential: 'google-auth-code',
      redirectUri: 'https://lovv.example/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
    })
  })

  it('adapts a Google login success response into the frontend auth state', () => {
    expect(
      adaptAuthApiResponse({
        accessToken: 'access-token-1',
        tokenType: 'Bearer',
        expiresIn: 3600,
        session: {
          sessionId: 'session-1',
          expiresAt: '2026-06-25T00:00:00Z',
        },
        linkedProvider: 'google',
        user: {
          userId: 'user-1',
          id: 'user-1',
          displayName: 'Mina Kim',
          name: 'Mina Kim',
          email: 'mina@example.com',
          avatarUrl: null,
          provider: 'google',
          roles: ['R-USER'],
          isNewUser: true,
        },
        preferences: null,
        onboardingCompleted: false,
      }),
    ).toEqual({
      accessToken: 'access-token-1',
      tokenType: 'Bearer',
      expiresIn: 3600,
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
      authenticated: true,
    })
  })

  it('adapts session preferences with selectedThemeIds into a PreferenceProfile', () => {
    const result = adaptAuthApiResponse({
      authenticated: true,
      accessToken: 'access-token-2',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        userId: 'user-2',
        displayName: 'Kakao User',
        email: null,
        provider: 'kakao',
      },
      preferences: {
        countryTrack: 'BOTH',
        mappedThemes: ['history_tradition'],
        selectedThemeIds: ['history_tradition', 'unknown'],
        onboardingCompleted: true,
        updatedAt: '2026-06-11T00:00:00Z',
      },
      onboardingCompleted: true,
    })

    expect(result.user).toEqual({
      id: 'user-2',
      name: 'Kakao User',
      email: '',
      avatarInitial: 'K',
      provider: 'kakao',
    })
    expect(result.preferenceProfile).toEqual({
      version: 2,
      selectedThemeIds: ['history_tradition'],
      source: 'onboarding',
      updatedAt: '2026-06-11T00:00:00Z',
    })
    expect(result.onboardingCompleted).toBe(true)
    expect(result.authenticated).toBe(true)
  })

  it('adapts auth/me user responses without requiring a refreshed access token', () => {
    expect(
      adaptAuthApiResponse({
        user: {
          userId: 'user-3',
          displayName: 'Me User',
          email: 'me@example.com',
          provider: 'google',
        },
        preferences: null,
        onboardingCompleted: false,
      }).authenticated,
    ).toBe(true)
  })

  it('rejects unusable user records without a backend provider', () => {
    const result = adaptAuthApiResponse({
      accessToken: 'access-token-3',
      user: {
        userId: 'user-4',
        displayName: 'Missing Provider',
      },
    })

    expect(result.user).toBeNull()
    expect(result.authenticated).toBe(false)
  })

  it('treats backend logout 2xx statuses as successful logout responses', () => {
    expect(isSuccessfulAuthLogoutStatus(200)).toBe(true)
    expect(isSuccessfulAuthLogoutStatus(204)).toBe(true)
    expect(isSuccessfulAuthLogoutStatus(401)).toBe(false)
  })

  it('posts social login credentials with cookie credentials enabled', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'access-token-1',
        tokenType: 'Bearer',
        expiresIn: 900,
        linkedProvider: 'google',
        user: {
          userId: 'user-1',
          displayName: 'Mina Kim',
          email: 'mina@example.com',
          provider: 'google',
        },
        onboardingCompleted: false,
        preferences: null,
      }),
    })

    const result = await requestAuthLogin(
      'google',
      {
        credentialType: 'id_token',
        credential: 'provider-token',
        nonce: 'nonce-1',
      },
      { baseUrl: 'https://api.lovv.example/', fetchImpl },
    )

    expect(fetchImpl).toHaveBeenCalledWith('https://api.lovv.example/api/v1/auth/google', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentialType: 'id_token',
        credential: 'provider-token',
        nonce: 'nonce-1',
      }),
    })
    expect(result.user?.id).toBe('user-1')
    expect(result.accessToken).toBe('access-token-1')
  })

  it('restores a session through the refresh cookie without requiring bearer storage', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        accessToken: 'restored-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          userId: 'user-2',
          displayName: 'Kakao User',
          email: null,
          provider: 'kakao',
        },
        onboardingCompleted: false,
        preferences: null,
      }),
    })

    const result = await requestAuthSession({ fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: {},
    })
    expect(result.authenticated).toBe(true)
    expect(result.accessToken).toBe('restored-access-token')
  })

  it('bridges a Cognito access token into a Lovv backend session', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        accessToken: 'lovv-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          userId: 'user-5',
          displayName: 'Cognito User',
          email: 'cognito@example.com',
          provider: 'google',
        },
        onboardingCompleted: false,
        preferences: null,
      }),
    })

    const result = await requestCognitoBridgeSession('cognito-access-token', {
      baseUrl: 'https://api.lovv.example/',
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith('https://api.lovv.example/api/v1/auth/cognito/session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer cognito-access-token',
      },
    })
    expect(result.user?.id).toBe('user-5')
    expect(result.accessToken).toBe('lovv-access-token')
  })

  it('adapts Cognito bridge user records with provider cognito', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        accessToken: 'lovv-access-token',
        user: {
          userId: 'user-6',
          displayName: 'Cognito User',
          email: 'cognito@example.com',
          provider: 'cognito',
        },
        linkedProvider: 'cognito',
        onboardingCompleted: true,
      }),
    })

    const result = await requestCognitoBridgeSession('cognito-id-token', {
      baseUrl: 'https://api.lovv.example',
      fetchImpl,
    })

    expect(result.authenticated).toBe(true)
    expect(result.user).toEqual({
      id: 'user-6',
      name: 'Cognito User',
      email: 'cognito@example.com',
      avatarInitial: 'C',
      provider: 'cognito',
    })
  })

  it('prefers linked social provider over Cognito wrapper provider when present', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        accessToken: 'lovv-access-token',
        user: {
          userId: 'user-7',
          displayName: 'Kakao Cognito User',
          email: 'kakao-cognito@example.com',
          provider: 'cognito',
        },
        linkedProvider: 'kakao',
        onboardingCompleted: true,
      }),
    })

    const result = await requestCognitoBridgeSession('cognito-id-token', {
      baseUrl: 'https://api.lovv.example',
      fetchImpl,
    })

    expect(result.user?.provider).toBe('kakao')
  })

  it('passes an in-memory bearer token for auth/me without persisting it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          userId: 'user-3',
          displayName: 'Me User',
          email: 'me@example.com',
          provider: 'google',
        },
        onboardingCompleted: false,
        preferences: null,
      }),
    })

    const result = await requestAuthMe({ accessToken: 'access-token-3', fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer access-token-3',
      },
    })
    expect(result.user?.id).toBe('user-3')
  })

  it('posts logout with credentials and accepts empty 204 responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    await expect(requestAuthLogout({ fetchImpl })).resolves.toBe(true)
    expect(fetchImpl).toHaveBeenCalledWith('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {},
    })
  })

  it('throws backend auth errors without exposing credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'PROVIDER_TOKEN_INVALID',
          message: 'Provider credential is invalid',
        },
      }),
    })

    await expect(
      requestAuthLogin('google', { credentialType: 'id_token', credential: 'bad-provider-token' }, { fetchImpl }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'PROVIDER_TOKEN_INVALID',
      message: 'Provider credential is invalid',
    })
  })
})
