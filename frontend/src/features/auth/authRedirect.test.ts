import { describe, expect, it, vi } from 'vitest'
import {
  authCallbackPath,
  clearPendingOAuthLogin,
  createAuthLoginRequestFromCallback,
  createCognitoAuthorizationRequest,
  createCognitoLogoutUrl,
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

const createCryptoMock = ({ digestDelayMs = 0 }: { digestDelayMs?: number } = {}) => {
  const digestResult = new Uint8Array([2, 3, 4]).buffer
  const digest = vi.fn(() =>
    digestDelayMs > 0
      ? new Promise<ArrayBuffer>((resolve) => {
          setTimeout(() => resolve(digestResult), digestDelayMs)
        })
      : Promise.resolve(digestResult),
  )

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
    expect(cognitoAuthCallbackPath).toBe('/auth/callback/cognito')
    expect(isCognitoAuthCallbackPath('/auth/callback/cognito')).toBe(true)
    expect(isCognitoAuthCallbackPath('/auth/callback/cognito/')).toBe(true)
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
      mode: 'login',
    })

    expect(readPendingOAuthLogin(sessionStorage, 'google')).toEqual({
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
      mode: 'login',
    })

    clearPendingOAuthLogin(sessionStorage, 'google')
    expect(readPendingOAuthLogin(sessionStorage, 'google')).toBeNull()
  })

  it('finds a pending OAuth login by callback state for single Cognito callback routes', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'kakao',
      state: 'state-2',
      redirectUri: 'https://lovv.example/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
      mode: 'login',
    })

    expect(readPendingOAuthLoginByState(sessionStorage, 'state-2')).toEqual({
      provider: 'kakao',
      state: 'state-2',
      redirectUri: 'https://lovv.example/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
      mode: 'login',
    })
    expect(readPendingOAuthLoginByState(sessionStorage, 'missing-state')).toBeNull()
  })

  it('builds a link-mode Google authorization request and round-trips it through callback resolution', async () => {
    const crypto = createCryptoMock()
    const request = await createOAuthAuthorizationRequest('google', {
      origin: 'https://lovv.example',
      env: {
        VITE_GOOGLE_OAUTH_CLIENT_ID: 'lovv-google-client-id',
      },
      storage: sessionStorage,
      crypto,
      now: 1_800_000_000_000,
      mode: 'link',
    })

    expect(request.pending.mode).toBe('link')
    expect(readPendingOAuthLogin(sessionStorage, 'google')).toEqual(request.pending)

    const result = createAuthLoginRequestFromCallback(
      'google',
      `?code=google-auth-code&state=${request.pending.state}`,
      sessionStorage,
    )

    expect(result.status).toBe('success')
    expect(result.status === 'success' && result.mode).toBe('link')
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
        VITE_COGNITO_DOMAIN: 'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/',
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
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://lovv.example/auth/callback/cognito')
    expect(authorizeUrl.searchParams.get('scope')).toBe('openid email profile')
    expect(authorizeUrl.searchParams.get('identity_provider')).toBe('Google')
    expect(authorizeUrl.searchParams.get('state')).toBe(request.pending.state)
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(authorizeUrl.searchParams.get('code_challenge')).toBe('AgME')
    expect(request.pending.provider).toBe('google')
    expect(request.pending.codeVerifier).toBeTruthy()
    expect(readPendingOAuthLogin(sessionStorage, 'google')).toEqual(request.pending)
  })

  it('keeps Cognito authorization creation pending while PKCE digest is delayed', async () => {
    vi.useFakeTimers()

    try {
      let isResolved = false
      const requestPromise = createCognitoAuthorizationRequest('google', {
        origin: 'https://lovv.example',
        env: {
          VITE_COGNITO_DOMAIN: 'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/',
          VITE_COGNITO_CLIENT_ID: 'lovv-cognito-client-id',
        },
        storage: sessionStorage,
        crypto: createCryptoMock({ digestDelayMs: 1_500 }),
        now: 1_800_000_000_000,
      }).then((request) => {
        isResolved = true

        return request
      })

      await vi.advanceTimersByTimeAsync(1_499)
      expect(isResolved).toBe(false)

      await vi.advanceTimersByTimeAsync(1)
      const request = await requestPromise

      expect(isResolved).toBe(true)
      expect(new URL(request.authorizationUrl).searchParams.get('identity_provider')).toBe('Google')
    } finally {
      vi.useRealTimers()
    }
  })

  it('builds Cognito Hosted UI logout URLs without provider secrets', () => {
    const logoutUrl = new URL(
      createCognitoLogoutUrl({
        origin: 'https://lovv.example',
        env: {
          VITE_COGNITO_DOMAIN: 'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/',
          VITE_COGNITO_CLIENT_ID: 'lovv-cognito-client-id',
          VITE_COGNITO_LOGOUT_URI: 'https://lovv.example/',
        },
      }),
    )

    expect(`${logoutUrl.origin}${logoutUrl.pathname}`).toBe(
      'https://lovv-test.auth.ap-northeast-2.amazoncognito.com/logout',
    )
    expect(logoutUrl.searchParams.get('client_id')).toBe('lovv-cognito-client-id')
    expect(logoutUrl.searchParams.get('logout_uri')).toBe('https://lovv.example/')
    expect(logoutUrl.searchParams.has('client_secret')).toBe(false)
  })

  it('creates backend authorization_code login payloads from verified callbacks', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
      mode: 'login',
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
      mode: 'login',
    })
  })

  it('creates Cognito token requests from verified single callback routes', () => {
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'https://lovv.example/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
      mode: 'login',
    })

    expect(createCognitoTokenRequestFromCallback('?code=cognito-code&state=state-1', sessionStorage)).toEqual({
      status: 'success',
      provider: 'google',
      request: {
        code: 'cognito-code',
        redirectUri: 'https://lovv.example/auth/callback/cognito',
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
      mode: 'login',
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
