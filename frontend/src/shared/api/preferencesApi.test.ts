import { describe, expect, it, vi } from 'vitest'
import {
  adaptPreferenceApiRecord,
  preferencesApiEndpoints,
  requestUpdatePreference,
  serializePreferenceProfileForApi,
} from './preferencesApi'

describe('preferences API adapter', () => {
  it('adapts the backend preference shape into the frontend profile model', () => {
    expect(
      adaptPreferenceApiRecord({
        countryTrack: 'JP',
        selected_theme_ids: ['sea_coast', 'food_local', 'sea_coast', 'unknown'],
        source: 'preference_edit',
        updated_at: '2026-06-11T00:00:00.000Z',
      }),
    ).toEqual({
      version: 2,
      countryTrack: 'JP',
      selectedThemeIds: ['sea_coast', 'food_local'],
      source: 'preference_edit',
      updatedAt: '2026-06-11T00:00:00.000Z',
    })
  })

  it('keeps preference endpoint names aligned with the current API boundary', () => {
    expect(preferencesApiEndpoints.get).toBe('/api/v1/me/preferences')
    expect(preferencesApiEndpoints.update).toBe('/api/v1/me/preferences')
  })

  it('serializes only DB-backed preference choices for future PUT calls', () => {
    expect(
      serializePreferenceProfileForApi({
        version: 2,
        countryTrack: 'KR',
        selectedThemeIds: ['history_tradition', 'art_emotion'],
        source: 'preference_edit',
        updatedAt: '2026-06-11T00:00:00.000Z',
      }),
    ).toEqual({
      countryTrack: 'KR',
      selectedThemeIds: ['history_tradition', 'art_emotion'],
    })
  })

  it('defaults missing or unsupported countryTrack to KR instead of sending BOTH', () => {
    expect(
      adaptPreferenceApiRecord({
        countryTrack: 'BOTH',
        mappedThemes: ['history_tradition'],
      }),
    ).toMatchObject({
      countryTrack: 'KR',
      selectedThemeIds: ['history_tradition'],
    })
  })

  it('ignores unusable preference records', () => {
    expect(adaptPreferenceApiRecord({ selected_theme_ids: ['not-a-theme'] })).toBeNull()
  })

  it('updates backend preferences with cookie credentials and bearer auth', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        preferences: {
          countryTrack: 'JP',
          mappedThemes: ['sea_coast'],
          source: 'onboarding',
          updatedAt: '2026-06-13T00:00:00.000Z',
        },
      }),
    })

    await expect(
      requestUpdatePreference(
        {
          version: 2,
          countryTrack: 'JP',
          selectedThemeIds: ['sea_coast'],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        },
        {
          baseUrl: 'https://api.example.com',
          accessToken: 'access-token',
          fetchImpl,
        },
      ),
    ).resolves.toEqual({
      version: 2,
      countryTrack: 'JP',
      selectedThemeIds: ['sea_coast'],
      source: 'onboarding',
      updatedAt: '2026-06-13T00:00:00.000Z',
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/me/preferences',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
        },
        body: JSON.stringify({ countryTrack: 'JP', selectedThemeIds: ['sea_coast'] }),
        credentials: 'include',
      }),
    )
  })
})
