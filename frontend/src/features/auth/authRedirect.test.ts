import { describe, expect, it, vi } from 'vitest'
import {
  authCallbackPath,
  clearPendingOAuthLogin,
  createAuthLoginRequestFromCallback,
  createCognitoAuthorizationRequest,
  createCognitoTokenRequestFromCallback,
  createOAuthAuthorizationRequest,
  cognitoAuthCallbackPath,
  getAuthCallbackProvider,
  isCognitoAuthCallbackPath,
  readOAuthCallbackParams,
  readPendingOAuthLogin,
  readPendingOAuthLoginByState,
  writePendingOAuthLogin,
} from './authRedirect'

const createCryptoMock = () => {
  const digest = vi.fn().mockResolvedValue(new Uint8Array([2, 3, 4]).buffer)

  return {
    getRandomValues: <T extends ArrayBufferView>(array: T) => {
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(1)

      return array
    },
    subtle: {
      digest,
    },
  } as unknown as Crypto
}

describe('OAuth redirect helpers', () => {
  it('matches backend callback routes by provider', () => {
    expect(authCallbackPath('google')).toBe('/auth/callback/google')
    expect(authCallbackPath('kakao')).toBe('/auth/callback/kakao')
    expect(cognitoAuthCallbackPath).toBe('/auth/callback')
    expect(isCognitoAuthCallbackPath('/auth/callback')).toBe(true)
    expect(isCognitoAuthCallbackPath('/auth/callback/')).toBe(true)
    expect(isCognitoAuthCallbackPath('/auth/callback/google')).toBe(false)
    expect(getAuthCallbackProvider('/auth/callback/google')).toBe('google')
    expect(getAuthCallbackProvider('/auth/callback/kakao')).toBe('kakao')
    expect(getAuthCallbackProvider('/auth/callback/naver')).toBeNull()
    expect(getAuthCallbackProvider('/auth')).toBeNull()
  })

  it('reads provider callback query params without keeping provider credentials', () => {
    expect(
      readOAuthCallbackParams(
        '?code=provider-auth-code&state=state-1&error=access_denied&error_description=User+cancelled',
      ),
    ).toEqual({
      code: 'provider-auth-code',
      state: 'state-1',
      error: 'access_denied',
      errorDescription: 'User cancelled',
    })
  })

  it('stores only pending OAuth state and redirect metadata in session storage', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
    })

    expect(readPendingOAuthLogin(sessionStorage, 'google')).toEqual({
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
    })

    clearPendingOAuthLogin(sessionStorage, 'google')
    expect(readPendingOAuthLogin(sessionStorage, 'google')).toBeNull()
  })

  it('finds a pending OAuth login by callback state for single Cognito callback routes', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'kakao',
      state: 'state-2',
      redirectUri: 'https://lovv.example/auth/callback',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    })

    expect(readPendingOAuthLoginByState(sessionStorage, 'state-2')).toEqual({
      provider: 'kakao',
      state: 'state-2',
      redirectUri: 'https://lovv.example/auth/callback',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    })
    expect(readPendingOAuthLoginByState(sessionStorage, 'missing-state')).toBeNull()
  })

  it('builds Google authorization URLs with state and PKCE verifier metadata', async () => {
    const crypto = createCryptoMock()
    const request = await createOAuthAuthorizationRequest('google', {
      origin: 'https://lovv.example',
      env: {
        VITE_GOOGLE_OAUTH_CLIENT_ID: 'lovv-google-client-id',
      },
      storage: sessionStorage,
      crypto,
      now: 1_800_000_000_000,
    })
    const authorizeUrl = new URL(request.authorizationUrl)

    expect(`${authorizeUrl.origin}${authorizeUrl.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(authorizeUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizeUrl.searchParams.get('client_id')).toBe('lovv-google-client-id')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://lovv.example/auth/callback/google')
    expect(authorizeUrl.searchParams.get('scope')).toBe('openid email profile')
    expect(authorizeUrl.searchParams.get('state')).toBe(request.pending.state)
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(authorizeUrl.searchParams.get('code_challenge')).toBe('AgME')
    expect(request.pending.codeVerifier).toBeTruthy()
    expect(readPendingOAuthLogin(sessionStorage, 'google')).toEqual(request.pending)
  })

  it('builds Kakao authorization URLs without frontend client secrets', async () => {
    const request = await createOAuthAuthorizationRequest('kakao', {
      origin: 'https://lovv.example',
      env: {
        VITE_KAKAO_OAUTH_CLIENT_ID: 'lovv-kakao-client-id',
      },
      storage: sessionStorage,
      crypto: createCryptoMock(),
      now: 1_800_000_000_000,
    })
    const authorizeUrl = new URL(request.authorizationUrl)

    expect(`${authorizeUrl.origin}${authorizeUrl.pathname}`).toBe('https://kauth.kakao.com/oauth/authorize')
    expect(authorizeUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizeUrl.searchParams.get('client_id')).toBe('lovv-kakao-client-id')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://lovv.example/auth/callback/kakao')
    expect(authorizeUrl.searchParams.get('scope')).toBe('openid')
    expect(authorizeUrl.searchParams.has('client_secret')).toBe(false)
    expect(authorizeUrl.searchParams.has('code_challenge')).toBe(false)
    expect(request.pending.codeVerifier).toBeUndefined()
    expect(readPendingOAuthLogin(sessionStorage, 'kakao')).toEqual(request.pending)
  })

  it('builds Cognito Hosted UI authorization URLs with identity provider and PKCE metadata', async () => {
    const request = await createCognitoAuthorizationRequest('google', {
      origin: 'https://lovv.example',
      env: {
        VITE_COGNITO_HOSTED_UI_BASE_URL: 'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/',
        VITE_COGNITO_CLIENT_ID: 'lovv-cognito-client-id',
      },
      storage: sessionStorage,
      crypto: createCryptoMock(),
      now: 1_800_000_000_000,
    })
    const authorizeUrl = new URL(request.authorizationUrl)

    expect(`${authorizeUrl.origin}${authorizeUrl.pathname}`).toBe(
      'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/oauth2/authorize',
    )
    expect(authorizeUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizeUrl.searchParams.get('client_id')).toBe('lovv-cognito-client-id')
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://lovv.example/auth/callback')
    expect(authorizeUrl.searchParams.get('scope')).toBe('openid email profile')
    expect(authorizeUrl.searchParams.get('identity_provider')).toBe('Google')
    expect(authorizeUrl.searchParams.get('state')).toBe(request.pending.state)
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(authorizeUrl.searchParams.get('code_challenge')).toBe('AgME')
    expect(request.pending.provider).toBe('google')
    expect(request.pending.codeVerifier).toBeTruthy()
    expect(readPendingOAuthLogin(sessionStorage, 'google')).toEqual(request.pending)
  })

  it('creates backend authorization_code login payloads from verified callbacks', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
    })

    expect(
      createAuthLoginRequestFromCallback('google', '?code=google-auth-code&state=state-1', sessionStorage),
    ).toEqual({
      status: 'success',
      request: {
        credentialType: 'authorization_code',
        credential: 'google-auth-code',
        redirectUri: 'https://lovv.example/auth/callback/google',
        codeVerifier: 'google-pkce-verifier',
      },
    })
  })

  it('creates Cognito token requests from verified single callback routes', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    })

    expect(createCognitoTokenRequestFromCallback('?code=cognito-code&state=state-1', sessionStorage)).toEqual({
      status: 'success',
      provider: 'google',
      request: {
        code: 'cognito-code',
        redirectUri: 'https://lovv.example/auth/callback',
        codeVerifier: 'cognito-pkce-verifier',
      },
    })
  })

  it('rejects callbacks with mismatched OAuth state', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'kakao',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/kakao',
      createdAt: 1_800_000_000_000,
    })

    expect(
      createAuthLoginRequestFromCallback('kakao', '?code=kakao-auth-code&state=state-2', sessionStorage),
    ).toEqual({
      status: 'error',
      errorCode: 'OAUTH_STATE_INVALID',
      errorDescription: 'OAuth callback state is invalid.',
    })
  })
})
