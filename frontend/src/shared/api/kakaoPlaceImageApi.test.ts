/**
 * @file kakaoPlaceImageApi.test.ts
 * @description Tests for Kakao place image lookup and response validation.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { describe, expect, it, vi } from 'vitest'
import { requestKakaoPlaceImage } from './kakaoPlaceImageApi'


describe('Kakao place image API', () => {
  it('loads a representative image for a numeric Kakao place id', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ placeId: '26338954', imageUrl: 'https://img1.kakaocdn.net/place.jpg' }),
    }))

    await expect(requestKakaoPlaceImage('26338954', { baseUrl: 'https://api.lovv.test/', fetchImpl })).resolves.toBe(
      'https://img1.kakaocdn.net/place.jpg',
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.lovv.test/api/v1/kakao-places/26338954/image',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    )
  })

  it('does not request invalid or synthetic place ids', async () => {
    const fetchImpl = vi.fn()

    await expect(requestKakaoPlaceImage('restaurant-name-kakao', { fetchImpl })).resolves.toBeUndefined()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('keeps restaurant selection usable when image lookup fails', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 502 }))

    await expect(requestKakaoPlaceImage('26338954', { fetchImpl })).resolves.toBeUndefined()
  })

  it('rejects an image URL outside the Kakao CDN allowlist', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ imageUrl: 'https://attacker.example/place.jpg' }),
    }))

    await expect(requestKakaoPlaceImage('26338954', { fetchImpl })).resolves.toBeUndefined()
  })
})

// EOF: kakaoPlaceImageApi.test.ts
