/**
 * @file kakaoPlaceImageApi.ts
 * @description Client adapter for Kakao place image lookup.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

export type KakaoPlaceImageFetchResponse = {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
}

export type KakaoPlaceImageFetch = (
  input: string,
  init: RequestInit,
) => Promise<KakaoPlaceImageFetchResponse>

export type KakaoPlaceImageRequestOptions = {
  baseUrl?: string
  fetchImpl?: KakaoPlaceImageFetch
  timeoutMs?: number
}

const defaultApiBaseUrl =
  import.meta.env.VITE_LOVV_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  ''

const placeIdPattern = /^[1-9][0-9]{0,19}$/
const allowedImageHostSuffixes = ['.kakaocdn.net', '.daumcdn.net']

const readImageUrl = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return undefined
  const imageUrl = (payload as { imageUrl?: unknown }).imageUrl
  if (typeof imageUrl !== 'string') return undefined

  try {
    const parsedUrl = new URL(imageUrl)
    return parsedUrl.protocol === 'https:' && allowedImageHostSuffixes.some((suffix) => parsedUrl.hostname.endsWith(suffix))
      ? parsedUrl.toString()
      : undefined
  } catch {
    return undefined
  }
}

export const requestKakaoPlaceImage = async (
  placeId: string,
  options: KakaoPlaceImageRequestOptions = {},
): Promise<string | undefined> => {
  const normalizedPlaceId = placeId.trim()
  if (!placeIdPattern.test(normalizedPlaceId)) return undefined

  const baseUrl = (options.baseUrl ?? defaultApiBaseUrl).trim().replace(/\/+$/, '')
  const endpoint = `/api/v1/kakao-places/${encodeURIComponent(normalizedPlaceId)}/image`
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 4500)

  try {
    const response = await (options.fetchImpl ?? fetch)(`${baseUrl}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })
    if (!response.ok || !response.json) return undefined
    return readImageUrl(await response.json())
  } catch {
    return undefined
  } finally {
    window.clearTimeout(timeoutId)
  }
}

// EOF: kakaoPlaceImageApi.ts
