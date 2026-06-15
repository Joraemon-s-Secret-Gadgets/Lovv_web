/**
 * @file authApi.ts
 * @description Frontend adapter and client for Lovv backend auth APIs.
 * @lastModified 2026-06-12
 */

import type { AuthProvider, LovvRole, LovvUser, PreferenceProfile, SocialAuthProvider } from '../types/app'
import { adaptPreferenceApiRecord, type PreferenceApiRecord } from './preferencesApi'

export const authApiEndpoints = {
  google: '/api/v1/auth/google',
  kakao: '/api/v1/auth/kakao',
  cognitoSession: '/api/v1/auth/cognito/session',
  me: '/api/v1/auth/me',
  session: '/api/v1/auth/session',
  logout: '/api/v1/auth/logout',
} as const

export type AuthCredentialType = 'id_token' | 'authorization_code' | 'access_token'

export type AuthLoginRequest = {
  credentialType: AuthCredentialType
  credential: string
  nonce?: string
  redirectUri?: string
  codeVerifier?: string
}

export type AuthApiUserRecord = {
  userId?: unknown
  user_id?: unknown
  id?: unknown
  displayName?: unknown
  display_name?: unknown
  name?: unknown
  email?: unknown
  avatarUrl?: unknown
  avatar_url?: unknown
  provider?: unknown
  roles?: unknown
  isNewUser?: unknown
  is_new_user?: unknown
}

export type AuthApiSessionRecord = {
  sessionId?: unknown
  session_id?: unknown
  expiresAt?: unknown
  expires_at?: unknown
}

export type AuthApiResponse = {
  authenticated?: unknown
  accessToken?: unknown
  access_token?: unknown
  tokenType?: unknown
  token_type?: unknown
  expiresIn?: unknown
  expires_in?: unknown
  session?: AuthApiSessionRecord | null
  user?: AuthApiUserRecord | null
  preferences?: PreferenceApiRecord | null
  onboardingCompleted?: unknown
  onboarding_completed?: unknown
  linkedProvider?: unknown
  linked_provider?: unknown
}

export type AuthApiState = {
  accessToken: string | null
  tokenType: string
  expiresIn: number | null
  sessionId: string | null
  sessionExpiresAt: string | null
  user: LovvUser | null
  preferenceProfile: PreferenceProfile | null
  onboardingCompleted: boolean
  authenticated: boolean
}

const validAuthProviders = new Set<AuthProvider>(['google', 'kakao', 'cognito'])
const validRoles = new Set<LovvRole>(['R-USER', 'R-ADMIN'])

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

const readNumber = (...values: unknown[]) => {
  const value = values.find((item): item is number => typeof item === 'number' && Number.isFinite(item))

  return value ?? null
}

const readBoolean = (...values: unknown[]) =>
  values.find((value): value is boolean => typeof value === 'boolean') ?? null

const readProvider = (...values: unknown[]) => {
  const provider = values.find(
    (value): value is AuthProvider => typeof value === 'string' && validAuthProviders.has(value as AuthProvider),
  )

  return provider ?? null
}

const readRoles = (...values: unknown[]): LovvRole[] => {
  const roles = values.find(Array.isArray) ?? []

  return roles.filter((role): role is LovvRole => typeof role === 'string' && validRoles.has(role as LovvRole))
}

const avatarInitialFrom = (...values: unknown[]) => {
  const source = readString(...values)
  const firstCharacter = Array.from(source)[0]

  return firstCharacter ? firstCharacter.toUpperCase() : 'L'
}

export const serializeAuthLoginRequest = (request: AuthLoginRequest) => ({
  credentialType: request.credentialType,
  credential: request.credential,
  ...(request.nonce ? { nonce: request.nonce } : {}),
  ...(request.redirectUri ? { redirectUri: request.redirectUri } : {}),
  ...(request.codeVerifier ? { codeVerifier: request.codeVerifier } : {}),
})

export const adaptAuthApiUserRecord = (
  record: AuthApiUserRecord | null | undefined,
  providerHint: AuthProvider | null = null,
): LovvUser | null => {
  if (!record) {
    return null
  }

  const id = readString(record.id, record.userId, record.user_id)
  const provider = readProvider(providerHint, record.provider)

  if (!id || !provider) {
    return null
  }

  const name = readString(record.name, record.displayName, record.display_name, record.email) || 'Lovv User'
  const email = readString(record.email)

  const roles = readRoles(record.roles)

  return {
    id,
    name,
    email,
    avatarInitial: avatarInitialFrom(name, email, provider),
    provider,
    ...(roles.length > 0 ? { roles } : {}),
  }
}

export const adaptAuthApiResponse = (response: AuthApiResponse): AuthApiState => {
  // Backend may return either direct login or restored-session shapes; normalize both here.
  const providerHint = readProvider(response.linkedProvider, response.linked_provider, response.user?.provider)
  const user = adaptAuthApiUserRecord(response.user, providerHint)
  const preferenceProfile = response.preferences ? adaptPreferenceApiRecord(response.preferences) : null
  const authenticated = Boolean(user) && (readBoolean(response.authenticated) ?? true)
  const onboardingCompleted = readBoolean(response.onboardingCompleted, response.onboarding_completed) ?? Boolean(preferenceProfile)

  return {
    accessToken: readString(response.accessToken, response.access_token) || null,
    tokenType: readString(response.tokenType, response.token_type) || 'Bearer',
    expiresIn: readNumber(response.expiresIn, response.expires_in),
    sessionId: readString(response.session?.sessionId, response.session?.session_id) || null,
    sessionExpiresAt: readString(response.session?.expiresAt, response.session?.expires_at) || null,
    user,
    preferenceProfile,
    onboardingCompleted,
    authenticated,
  }
}

export const isSuccessfulAuthLogoutStatus = (statusCode: number) => statusCode >= 200 && statusCode < 300

export type AuthApiFetchResponse = {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
}

export type AuthApiFetch = (input: string, init: RequestInit) => Promise<AuthApiFetchResponse>

export type AuthApiRequestOptions = {
  baseUrl?: string
  accessToken?: string | null
  fetchImpl?: AuthApiFetch
}

export class AuthApiRequestError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'AuthApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

const defaultAuthApiBaseUrl = import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ?? ''

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const buildAuthApiUrl = (endpoint: string, baseUrl = defaultAuthApiBaseUrl) => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')

  return normalizedBaseUrl ? `${normalizedBaseUrl}${endpoint}` : endpoint
}

const createAuthHeaders = (options: AuthApiRequestOptions, hasJsonBody = false) => {
  const headers: Record<string, string> = {}
  const accessToken = options.accessToken?.trim()

  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers.Authorization = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
  }

  return headers
}

const readResponseJson = async (response: AuthApiFetchResponse) => {
  if (!response.json) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

const createAuthApiRequestError = async (response: AuthApiFetchResponse) => {
  const payload = await readResponseJson(response)
  const errorPayload = isRecord(payload) && isRecord(payload.error) ? payload.error : null
  const code = readString(errorPayload?.code) || `HTTP_${response.status}`
  const message = readString(errorPayload?.message) || 'Auth API request failed'

  return new AuthApiRequestError(response.status, code, message)
}

const requestAuthApi = async (
  endpoint: string,
  init: RequestInit,
  options: AuthApiRequestOptions,
) => {
  const fetchImpl = options.fetchImpl ?? fetch
  const response = await fetchImpl(buildAuthApiUrl(endpoint, options.baseUrl), {
    ...init,
    // Refresh-session continuity is cookie-backed; tokens are not persisted in browser storage.
    credentials: 'include',
  })

  if (!response.ok) {
    throw await createAuthApiRequestError(response)
  }

  return response
}

const requestAuthApiJson = async (
  endpoint: string,
  init: RequestInit,
  options: AuthApiRequestOptions,
) => {
  const response = await requestAuthApi(endpoint, init, options)
  const payload = await readResponseJson(response)

  return isRecord(payload) ? (payload as AuthApiResponse) : {}
}

export const requestAuthLogin = async (
  provider: SocialAuthProvider,
  request: AuthLoginRequest,
  options: AuthApiRequestOptions = {},
) => {
  const payload = await requestAuthApiJson(
    authApiEndpoints[provider],
    {
      method: 'POST',
      headers: createAuthHeaders(options, true),
      body: JSON.stringify(serializeAuthLoginRequest(request)),
    },
    options,
  )

  return adaptAuthApiResponse(payload)
}

export const requestCognitoBridgeSession = async (
  cognitoAccessToken: string,
  options: AuthApiRequestOptions = {},
) => {
  const bridgeOptions = {
    ...options,
    accessToken: cognitoAccessToken,
  }
  const payload = await requestAuthApiJson(
    authApiEndpoints.cognitoSession,
    {
      method: 'POST',
      headers: createAuthHeaders(bridgeOptions),
    },
    bridgeOptions,
  )

  return adaptAuthApiResponse(payload)
}

export const requestAuthSession = async (options: AuthApiRequestOptions = {}) => {
  const payload = await requestAuthApiJson(
    authApiEndpoints.session,
    {
      method: 'GET',
      headers: createAuthHeaders(options),
    },
    options,
  )

  return adaptAuthApiResponse(payload)
}

export const requestAuthMe = async (options: AuthApiRequestOptions = {}) => {
  const payload = await requestAuthApiJson(
    authApiEndpoints.me,
    {
      method: 'GET',
      headers: createAuthHeaders(options),
    },
    options,
  )

  return adaptAuthApiResponse(payload)
}

export const requestAuthLogout = async (options: AuthApiRequestOptions = {}) => {
  const response = await requestAuthApi(
    authApiEndpoints.logout,
    {
      method: 'POST',
      headers: createAuthHeaders(options),
    },
    options,
  )

  return isSuccessfulAuthLogoutStatus(response.status)
}

// EOF: authApi.ts
