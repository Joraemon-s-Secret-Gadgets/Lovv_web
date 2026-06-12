/**
 * @file authRedirect.ts
 * @description OAuth authorization-code redirect and callback helpers.
 * @lastModified 2026-06-12
 */

import type { AuthLoginRequest } from '../../shared/api/authApi'
import type { SocialAuthProvider } from '../../shared/types/app'

export type OAuthClientEnv = {
  readonly [key: string]: unknown
  VITE_GOOGLE_OAUTH_CLIENT_ID?: string
  VITE_KAKAO_OAUTH_CLIENT_ID?: string
  VITE_COGNITO_DOMAIN?: string
  VITE_COGNITO_HOSTED_UI_BASE_URL?: string
  VITE_COGNITO_CLIENT_ID?: string
  VITE_COGNITO_REDIRECT_URI?: string
  VITE_COGNITO_LOGOUT_URI?: string
}

export type PendingOAuthLogin = {
  provider: SocialAuthProvider
  state: string
  redirectUri: string
  codeVerifier?: string
  createdAt: number
}

export type OAuthCallbackParams = {
  code: string
  state: string
  error: string
  errorDescription: string
}

export type OAuthCallbackLoginResult =
  | {
      status: 'success'
      request: AuthLoginRequest
    }
  | {
      status: 'error'
      errorCode: string
      errorDescription: string
    }

export type CognitoTokenRequest = {
  code: string
  redirectUri: string
  codeVerifier: string
}

export type CognitoCallbackTokenResult =
  | {
      status: 'success'
      provider: SocialAuthProvider
      request: CognitoTokenRequest
    }
  | {
      status: 'error'
      provider?: SocialAuthProvider
      errorCode: string
      errorDescription: string
    }

type OAuthCrypto = Pick<Crypto, 'getRandomValues' | 'subtle'>

export class OAuthRedirectConfigError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'OAuthRedirectConfigError'
    this.code = code
  }
}

const oauthClientEnvNames = {
  google: 'VITE_GOOGLE_OAUTH_CLIENT_ID',
  kakao: 'VITE_KAKAO_OAUTH_CLIENT_ID',
} as const

const oauthProviderConfig = {
  google: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    usesPkce: true,
  },
  kakao: {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    scope: 'openid',
    usesPkce: false,
  },
} as const

const cognitoIdentityProviderNames: Record<SocialAuthProvider, string> = {
  google: 'Google',
  kakao: 'Kakao',
}

const cognitoScope = 'openid email profile'

// Stored only until callback validation; this is not the Lovv app session.
const pendingOAuthLoginStoragePrefix = 'lovv.auth.oauth'

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

const base64UrlEncodeBytes = (bytes: Uint8Array) => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const randomBytes = (length: number, crypto: OAuthCrypto = globalThis.crypto) => {
  if (!crypto?.getRandomValues) {
    throw new OAuthRedirectConfigError('OAUTH_CRYPTO_UNAVAILABLE', 'OAuth state generation requires Web Crypto.')
  }

  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  return bytes
}

export const authCallbackPath = (provider: SocialAuthProvider) => `/auth/callback/${provider}`

export const cognitoAuthCallbackPath = '/auth/callback/cognito'
export const legacyCognitoAuthCallbackPath = '/auth/callback'

export const isCognitoAuthCallbackPath = (pathname: string) =>
  /^\/auth\/callback\/?$/.test(pathname) || /^\/auth\/callback\/cognito\/?$/.test(pathname)

export const getAuthCallbackProvider = (pathname: string): SocialAuthProvider | null => {
  const match = /^\/auth\/callback\/(google|kakao)\/?$/.exec(pathname)

  return match ? (match[1] as SocialAuthProvider) : null
}

export const getOAuthClientId = (
  provider: SocialAuthProvider,
  env: OAuthClientEnv = import.meta.env,
) => readString(env[oauthClientEnvNames[provider]])

export const hasOAuthClientConfig = (provider: SocialAuthProvider, env: OAuthClientEnv = import.meta.env) =>
  getOAuthClientId(provider, env).length > 0

export const readOAuthCallbackParams = (search: string): OAuthCallbackParams => {
  const params = new URLSearchParams(search)

  return {
    code: readString(params.get('code')),
    state: readString(params.get('state')),
    error: readString(params.get('error')),
    errorDescription: readString(params.get('error_description')),
  }
}

export const getPendingOAuthLoginStorageKey = (provider: SocialAuthProvider) =>
  `${pendingOAuthLoginStoragePrefix}.${provider}`

export const writePendingOAuthLogin = (storage: Storage, pendingLogin: PendingOAuthLogin) => {
  storage.setItem(getPendingOAuthLoginStorageKey(pendingLogin.provider), JSON.stringify(pendingLogin))
}

export const readPendingOAuthLogin = (storage: Storage, provider: SocialAuthProvider): PendingOAuthLogin | null => {
  const rawPendingLogin = storage.getItem(getPendingOAuthLoginStorageKey(provider))

  if (!rawPendingLogin) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPendingLogin) as Partial<PendingOAuthLogin>
    const state = readString(parsed.state)
    const redirectUri = readString(parsed.redirectUri)
    const codeVerifier = readString(parsed.codeVerifier)

    if (parsed.provider !== provider || !state || !redirectUri || typeof parsed.createdAt !== 'number') {
      return null
    }

    return {
      provider,
      state,
      redirectUri,
      ...(codeVerifier ? { codeVerifier } : {}),
      createdAt: parsed.createdAt,
    }
  } catch {
    return null
  }
}

export const clearPendingOAuthLogin = (storage: Storage, provider: SocialAuthProvider) => {
  storage.removeItem(getPendingOAuthLoginStorageKey(provider))
}

export const clearPendingOAuthLogins = (storage: Storage) => {
  clearPendingOAuthLogin(storage, 'google')
  clearPendingOAuthLogin(storage, 'kakao')
}

export const readPendingOAuthLoginByState = (
  storage: Storage,
  state: string,
): PendingOAuthLogin | null => {
  const normalizedState = readString(state)

  if (!normalizedState) {
    return null
  }

  for (const provider of ['google', 'kakao'] as const) {
    const pendingLogin = readPendingOAuthLogin(storage, provider)

    if (pendingLogin?.state === normalizedState) {
      return pendingLogin
    }
  }

  return null
}

export const createOAuthState = (crypto?: OAuthCrypto) => base64UrlEncodeBytes(randomBytes(16, crypto))

export const createPkceCodeVerifier = (crypto?: OAuthCrypto) => base64UrlEncodeBytes(randomBytes(32, crypto))

export const createPkceCodeChallenge = async (verifier: string, crypto: OAuthCrypto = globalThis.crypto) => {
  if (!crypto?.subtle?.digest) {
    throw new OAuthRedirectConfigError('OAUTH_CRYPTO_UNAVAILABLE', 'OAuth PKCE challenge requires Web Crypto.')
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))

  return base64UrlEncodeBytes(new Uint8Array(digest))
}

export const createOAuthAuthorizeUrl = ({
  provider,
  clientId,
  redirectUri,
  state,
  codeChallenge,
}: {
  provider: SocialAuthProvider
  clientId: string
  redirectUri: string
  state: string
  codeChallenge?: string
}) => {
  const providerConfig = oauthProviderConfig[provider]
  const authorizeUrl = new URL(providerConfig.authorizationEndpoint)

  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', providerConfig.scope)
  authorizeUrl.searchParams.set('state', state)

  if (providerConfig.usesPkce && codeChallenge) {
    authorizeUrl.searchParams.set('code_challenge', codeChallenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  }

  return authorizeUrl.toString()
}

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '')

const getCognitoHostedUiBaseUrl = (env: OAuthClientEnv = import.meta.env) =>
  readString(env.VITE_COGNITO_DOMAIN, env.VITE_COGNITO_HOSTED_UI_BASE_URL).replace(/\/+$/, '')

const getCognitoClientId = (env: OAuthClientEnv = import.meta.env) =>
  readString(env.VITE_COGNITO_CLIENT_ID)

const getCognitoRedirectUri = ({
  origin,
  env = import.meta.env,
}: {
  origin: string
  env?: OAuthClientEnv
}) => readString(env.VITE_COGNITO_REDIRECT_URI) || `${normalizeOrigin(origin)}${cognitoAuthCallbackPath}`

const getCognitoLogoutUri = ({
  origin,
  env = import.meta.env,
}: {
  origin: string
  env?: OAuthClientEnv
}) => readString(env.VITE_COGNITO_LOGOUT_URI) || `${normalizeOrigin(origin)}/`

export const createCognitoAuthorizeUrl = ({
  hostedUiBaseUrl,
  clientId,
  redirectUri,
  state,
  identityProvider,
  codeChallenge,
}: {
  hostedUiBaseUrl: string
  clientId: string
  redirectUri: string
  state: string
  identityProvider: string
  codeChallenge: string
}) => {
  const authorizeUrl = new URL(`${hostedUiBaseUrl.replace(/\/+$/, '')}/oauth2/authorize`)

  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', cognitoScope)
  authorizeUrl.searchParams.set('identity_provider', identityProvider)
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')

  return authorizeUrl.toString()
}

export const createCognitoLogoutUrl = ({
  origin,
  env = import.meta.env,
}: {
  origin: string
  env?: OAuthClientEnv
}) => {
  const hostedUiBaseUrl = getCognitoHostedUiBaseUrl(env)
  const clientId = getCognitoClientId(env)
  const logoutUri = getCognitoLogoutUri({ origin, env })

  if (!hostedUiBaseUrl) {
    throw new OAuthRedirectConfigError(
      'COGNITO_HOSTED_UI_BASE_URL_MISSING',
      'VITE_COGNITO_DOMAIN is required for Cognito logout.',
    )
  }

  if (!clientId) {
    throw new OAuthRedirectConfigError(
      'COGNITO_CLIENT_ID_MISSING',
      'VITE_COGNITO_CLIENT_ID is required for Cognito logout.',
    )
  }

  const logoutUrl = new URL(`${hostedUiBaseUrl}/logout`)
  logoutUrl.searchParams.set('client_id', clientId)
  logoutUrl.searchParams.set('logout_uri', logoutUri)

  return logoutUrl.toString()
}

export const createCognitoAuthorizationRequest = async (
  provider: SocialAuthProvider,
  {
    origin,
    env = import.meta.env,
    storage,
    crypto = globalThis.crypto,
    now = Date.now(),
  }: {
    origin: string
    env?: OAuthClientEnv
    storage: Storage
    crypto?: OAuthCrypto
    now?: number
  },
) => {
  const hostedUiBaseUrl = getCognitoHostedUiBaseUrl(env)
  const clientId = getCognitoClientId(env)

  if (!hostedUiBaseUrl) {
    throw new OAuthRedirectConfigError(
      'COGNITO_HOSTED_UI_BASE_URL_MISSING',
      'VITE_COGNITO_DOMAIN is required for Cognito login.',
    )
  }

  if (!clientId) {
    throw new OAuthRedirectConfigError(
      'COGNITO_CLIENT_ID_MISSING',
      'VITE_COGNITO_CLIENT_ID is required for Cognito login.',
    )
  }

  const redirectUri = getCognitoRedirectUri({ origin, env })
  const state = createOAuthState(crypto)
  const codeVerifier = createPkceCodeVerifier(crypto)
  const codeChallenge = await createPkceCodeChallenge(codeVerifier, crypto)
  const pending: PendingOAuthLogin = {
    provider,
    state,
    redirectUri,
    codeVerifier,
    createdAt: now,
  }
  const authorizationUrl = createCognitoAuthorizeUrl({
    hostedUiBaseUrl,
    clientId,
    redirectUri,
    state,
    identityProvider: cognitoIdentityProviderNames[provider],
    codeChallenge,
  })

  writePendingOAuthLogin(storage, pending)

  return {
    authorizationUrl,
    pending,
  }
}

export const createOAuthAuthorizationRequest = async (
  provider: SocialAuthProvider,
  {
    origin,
    env = import.meta.env,
    storage,
    crypto = globalThis.crypto,
    now = Date.now(),
  }: {
    origin: string
    env?: OAuthClientEnv
    storage: Storage
    crypto?: OAuthCrypto
    now?: number
  },
) => {
  const clientId = getOAuthClientId(provider, env)

  if (!clientId) {
    throw new OAuthRedirectConfigError(
      'OAUTH_CLIENT_ID_MISSING',
      `${oauthClientEnvNames[provider]} is required for OAuth login.`,
    )
  }

  const normalizedOrigin = origin.replace(/\/+$/, '')
  const redirectUri = `${normalizedOrigin}${authCallbackPath(provider)}`
  const state = createOAuthState(crypto)
  const codeVerifier = oauthProviderConfig[provider].usesPkce ? createPkceCodeVerifier(crypto) : undefined
  const codeChallenge = codeVerifier ? await createPkceCodeChallenge(codeVerifier, crypto) : undefined
  const pending: PendingOAuthLogin = {
    provider,
    state,
    redirectUri,
    ...(codeVerifier ? { codeVerifier } : {}),
    createdAt: now,
  }
  const authorizationUrl = createOAuthAuthorizeUrl({
    provider,
    clientId,
    redirectUri,
    state,
    codeChallenge,
  })

  writePendingOAuthLogin(storage, pending)

  return {
    authorizationUrl,
    pending,
  }
}

export const createAuthLoginRequestFromCallback = (
  provider: SocialAuthProvider,
  search: string,
  storage: Storage,
): OAuthCallbackLoginResult => {
  const callbackParams = readOAuthCallbackParams(search)

  if (callbackParams.error) {
    return {
      status: 'error',
      errorCode: callbackParams.error,
      errorDescription: callbackParams.errorDescription || 'OAuth provider returned an error.',
    }
  }

  if (!callbackParams.code || !callbackParams.state) {
    return {
      status: 'error',
      errorCode: 'OAUTH_CALLBACK_INVALID',
      errorDescription: 'OAuth callback is missing code or state.',
    }
  }

  const pendingLogin = readPendingOAuthLogin(storage, provider)

  // State binds this callback to the browser-initiated login attempt.
  if (!pendingLogin || pendingLogin.state !== callbackParams.state) {
    return {
      status: 'error',
      errorCode: 'OAUTH_STATE_INVALID',
      errorDescription: 'OAuth callback state is invalid.',
    }
  }

  return {
    status: 'success',
    request: {
      credentialType: 'authorization_code',
      credential: callbackParams.code,
      redirectUri: pendingLogin.redirectUri,
      ...(pendingLogin.codeVerifier ? { codeVerifier: pendingLogin.codeVerifier } : {}),
    },
  }
}

export const createCognitoTokenRequestFromCallback = (
  search: string,
  storage: Storage,
): CognitoCallbackTokenResult => {
  const callbackParams = readOAuthCallbackParams(search)

  if (callbackParams.error) {
    return {
      status: 'error',
      errorCode: callbackParams.error,
      errorDescription: callbackParams.errorDescription || 'OAuth provider returned an error.',
    }
  }

  if (!callbackParams.code || !callbackParams.state) {
    return {
      status: 'error',
      errorCode: 'OAUTH_CALLBACK_INVALID',
      errorDescription: 'OAuth callback is missing code or state.',
    }
  }

  const pendingLogin = readPendingOAuthLoginByState(storage, callbackParams.state)

  if (!pendingLogin) {
    return {
      status: 'error',
      errorCode: 'OAUTH_STATE_INVALID',
      errorDescription: 'OAuth callback state is invalid.',
    }
  }

  if (!pendingLogin.codeVerifier) {
    return {
      status: 'error',
      provider: pendingLogin.provider,
      errorCode: 'COGNITO_PKCE_MISSING',
      errorDescription: 'OAuth PKCE verifier is missing.',
    }
  }

  return {
    status: 'success',
    provider: pendingLogin.provider,
    request: {
      code: callbackParams.code,
      redirectUri: pendingLogin.redirectUri,
      codeVerifier: pendingLogin.codeVerifier,
    },
  }
}

// EOF: authRedirect.ts
