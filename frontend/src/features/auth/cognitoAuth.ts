/**
 * @file cognitoAuth.ts
 * @description Cognito Hosted UI token exchange client for public PKCE flows.
 * @lastModified 2026-06-12
 */

import type { CognitoTokenRequest } from './authRedirect'

export type CognitoTokenResponse = {
  accessToken: string
  idToken: string | null
  refreshToken: string | null
  tokenType: string
  expiresIn: number | null
}

export type CognitoTokenFetchResponse = {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
}

export type CognitoTokenFetch = (input: string, init: RequestInit) => Promise<CognitoTokenFetchResponse>

export type CognitoTokenRequestOptions = {
  hostedUiBaseUrl?: string
  clientId?: string
  fetchImpl?: CognitoTokenFetch
}

export class CognitoTokenRequestError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'CognitoTokenRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

const defaultHostedUiBaseUrl = import.meta.env.VITE_COGNITO_HOSTED_UI_BASE_URL?.trim() ?? ''
const defaultClientId = import.meta.env.VITE_COGNITO_CLIENT_ID?.trim() ?? ''

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

const readNumber = (...values: unknown[]) => {
  const value = values.find((item): item is number => typeof item === 'number' && Number.isFinite(item))

  return value ?? null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const buildCognitoTokenUrl = (hostedUiBaseUrl: string) =>
  `${hostedUiBaseUrl.trim().replace(/\/+$/, '')}/oauth2/token`

const readResponseJson = async (response: CognitoTokenFetchResponse) => {
  if (!response.json) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

const createCognitoTokenRequestError = async (response: CognitoTokenFetchResponse) => {
  const payload = await readResponseJson(response)
  const errorCode = isRecord(payload) ? readString(payload.error) : ''
  const errorDescription = isRecord(payload) ? readString(payload.error_description) : ''

  return new CognitoTokenRequestError(
    response.status,
    errorCode || `HTTP_${response.status}`,
    errorDescription || 'Cognito token request failed',
  )
}

export const requestCognitoToken = async (
  request: CognitoTokenRequest,
  options: CognitoTokenRequestOptions = {},
): Promise<CognitoTokenResponse> => {
  const hostedUiBaseUrl = options.hostedUiBaseUrl?.trim() || defaultHostedUiBaseUrl
  const clientId = options.clientId?.trim() || defaultClientId

  if (!hostedUiBaseUrl || !clientId) {
    throw new CognitoTokenRequestError(
      0,
      'COGNITO_TOKEN_CONFIG_MISSING',
      'Cognito Hosted UI base URL and client ID are required.',
    )
  }

  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('client_id', clientId)
  body.set('code', request.code)
  body.set('redirect_uri', request.redirectUri)
  body.set('code_verifier', request.codeVerifier)

  const fetchImpl = options.fetchImpl ?? fetch
  const response = await fetchImpl(buildCognitoTokenUrl(hostedUiBaseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw await createCognitoTokenRequestError(response)
  }

  const payload = await readResponseJson(response)

  if (!isRecord(payload)) {
    throw new CognitoTokenRequestError(200, 'COGNITO_TOKEN_RESPONSE_INVALID', 'Cognito token response is invalid.')
  }

  const accessToken = readString(payload.access_token)

  if (!accessToken) {
    throw new CognitoTokenRequestError(
      200,
      'COGNITO_ACCESS_TOKEN_MISSING',
      'Cognito token response does not include an access token.',
    )
  }

  return {
    accessToken,
    idToken: readString(payload.id_token) || null,
    refreshToken: readString(payload.refresh_token) || null,
    tokenType: readString(payload.token_type) || 'Bearer',
    expiresIn: readNumber(payload.expires_in),
  }
}

// EOF: cognitoAuth.ts
