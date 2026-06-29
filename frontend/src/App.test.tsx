import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthApiState } from './shared/api/authApi'
import {
  requestAuthLogin,
  requestAuthLogout,
  requestAuthSession,
  requestCognitoBridgeSession,
  requestUpdateProfile,
} from './shared/api/authApi'
import {
  requestCreateSavedPlan,
  requestDeleteSavedPlan,
  requestGetSavedPlan,
  requestLikeSavedPlan,
  requestListSavedPlans,
  requestUnlikeSavedPlan,
  requestUpdateSavedPlanShareStatus,
} from './shared/api/savedPlansApi'
import { requestUpdatePreference } from './shared/api/preferencesApi'
import { requestCreateRecommendation } from './shared/api/recommendationsApi'
import {
  adaptSmallCityApiResponse,
  adaptSmallCityDetailApiResponse,
  adaptSmallCityPlacesApiResponse,
  requestListSmallCities,
  requestGetSmallCityDetail,
  requestGetSmallCityPlaces,
  type SmallCityApiPlaceGroups,
} from './shared/api/smallCityApi'
import './i18n'
import App from './App'
import { requestCognitoToken } from './features/auth/cognitoAuth'
import { socialAuthProviderStorageKey } from './features/auth/authModel'
import { writePendingOAuthLogin } from './features/auth/authRedirect'
import {
  createStaticSmallCityApiResponse,
  createStaticSmallCityDetailApiResponse,
} from './features/map-city/smallCityDataSource'
import {
  createSmallCityMapMarkers,
  smallCities,
  smallCityCounts,
  smallCityPlaceCategories,
  type SmallCityPlaceGroups,
} from './data/smallCities'
import type { SavedPlan } from './shared/types/app'

vi.mock('./shared/api/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./shared/api/authApi')>()

  return {
    ...actual,
    requestAuthLogin: vi.fn(),
    requestAuthLogout: vi.fn(),
    requestAuthSession: vi.fn(),
    requestCognitoBridgeSession: vi.fn(),
    requestUpdateProfile: vi.fn(),
  }
})

vi.mock('./shared/api/savedPlansApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./shared/api/savedPlansApi')>()

  return {
    ...actual,
    requestCreateSavedPlan: vi.fn(),
    requestDeleteSavedPlan: vi.fn(),
    requestGetSavedPlan: vi.fn(),
    requestLikeSavedPlan: vi.fn(),
    requestListSavedPlans: vi.fn(),
    requestUnlikeSavedPlan: vi.fn(),
    requestUpdateSavedPlanShareStatus: vi.fn(),
  }
})

vi.mock('./shared/api/preferencesApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./shared/api/preferencesApi')>()

  return {
    ...actual,
    requestUpdatePreference: vi.fn(),
  }
})

vi.mock('./shared/api/recommendationsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./shared/api/recommendationsApi')>()

  return {
    ...actual,
    requestCreateRecommendation: vi.fn().mockRejectedValue(new Error('fetch not available in test')),
  }
})

vi.mock('./features/auth/cognitoAuth', () => ({
  requestCognitoToken: vi.fn(),
}))

vi.mock('./shared/api/smallCityApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./shared/api/smallCityApi')>()

  return {
    ...actual,
    requestListSmallCities: vi.fn(),
    requestGetSmallCityDetail: vi.fn(),
    requestGetSmallCityPlaces: vi.fn(),
  }
})

const authStorageKey = 'lovv.auth.user'
const preferenceStorageKey = 'lovv.preference'

const renderApp = (path = '/') => {
  window.history.replaceState(null, '', path)

  // A fresh QueryClient per render avoids cached query results leaking across tests,
  // and disabling retries keeps default-rejected mocks (e.g. requestCreateRecommendation)
  // failing deterministically on the first attempt.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>,
  )
}

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

const themeIdsByCityPair: Record<string, string> = {
  '아산/온양 · 벳푸': 'healing_rest',
  '부산 · 오키나와': 'sea_coast',
  '경주 · 교토': 'history_tradition',
  '전주 · 오사카': 'food_local',
  '제주 · 닛코': 'nature_trekking',
  '강릉 · 가나자와': 'art_sense',
}

const seedUser = () => {
  localStorage.setItem(
    authStorageKey,
    JSON.stringify({
      id: 'mock-google-user',
      name: 'Lovv Google User',
      email: 'google@lovv.local',
      avatarInitial: 'G',
      provider: 'google',
    }),
  )
}

const seedPreference = (cityPair = '아산/온양 · 벳푸') => {
  localStorage.setItem(
    preferenceStorageKey,
    JSON.stringify({
      version: 2,
      countryTrack: 'KR',
      selectedThemeIds: [themeIdsByCityPair[cityPair] ?? 'healing_rest'],
      source: 'onboarding',
      updatedAt: '2026-06-05T00:00:00.000Z',
    }),
  )
}

const seedLegacyPreference = (cityPair = '아산/온양 · 벳푸') => {
  localStorage.setItem(preferenceStorageKey, JSON.stringify({ cityPair }))
}

const readPreferenceProfile = () => JSON.parse(localStorage.getItem(preferenceStorageKey) ?? '{}')

const createOAuthCryptoMock = () =>
  ({
    getRandomValues: <T extends ArrayBufferView>(array: T) => {
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(1)

      return array
    },
    subtle: {
      digest: vi.fn().mockResolvedValue(new Uint8Array([2, 3, 4]).buffer),
    },
  }) as unknown as Crypto

const expectStoredThemeIds = (themeIds: string[], countryTrack = 'KR') => {
  expect(readPreferenceProfile()).toMatchObject({
    version: 2,
    countryTrack,
    selectedThemeIds: themeIds,
  })
}

const openSessionMenu = () => {
  const sessionMenuButton = screen.getByRole('button', {
    name: '현재 세션: Google 메뉴 열기',
  })

  fireEvent.click(sessionMenuButton)

  return sessionMenuButton
}

const openMyPageFromSessionMenu = () => {
  openSessionMenu()
  fireEvent.click(screen.getByRole('menuitem', { name: '마이페이지' }))
}

const signOutFromSessionMenu = () => {
  openSessionMenu()
  fireEvent.click(screen.getByRole('menuitem', { name: '로그아웃' }))
}

// The login modal is closed (and inert / aria-hidden) on the auth landing; a
// real user opens it via the "시작하기" trigger before the social buttons appear.
const openAuthModal = () => {
  fireEvent.click(screen.getByRole('button', { name: '회원가입하고 Lovv 시작하기' }))
}

const completeGuidedPlanner = async ({
  duration = '1박 2일',
  query = '동행 없이 여유롭게 덜 걷고 싶어요',
}: {
  duration?: '당일치기' | '1박 2일' | '2박 3일' | '3박 4일' | '4박 5일'
  query?: string
} = {}) => {
  fireEvent.click(screen.getByRole('button', { name: duration }))

  // Preference-based planning now asks for a travel month (1~12 buttons) after the duration,
  // before free-text conditions. City-context flows call the recommendation API after duration.
  const travelMonthButton = screen.queryByRole('button', { name: '6월' })
  if (travelMonthButton) {
    fireEvent.click(travelMonthButton)
  }

  const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
  const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

  fireEvent.change(input, { target: { value: query } })
  fireEvent.click(sendButton)

  // Wait for the async state updates to settle
  await screen.findByRole('button', { name: '좋아요' })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.stubEnv('VITE_LOVV_AUTH_MODE', 'mock')
  vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', '')
  vi.stubEnv('VITE_KAKAO_OAUTH_CLIENT_ID', '')
  vi.stubEnv('VITE_COGNITO_DOMAIN', '')
  vi.stubEnv('VITE_COGNITO_HOSTED_UI_BASE_URL', '')
  vi.stubEnv('VITE_COGNITO_CLIENT_ID', '')
  vi.stubEnv('VITE_COGNITO_REDIRECT_URI', '')
  vi.stubEnv('VITE_COGNITO_LOGOUT_URI', '')
  vi.mocked(requestListSavedPlans).mockResolvedValue({ savedPlans: [], likes: {} })
  vi.mocked(requestUpdatePreference).mockImplementation(async (profile) => profile)
  vi.mocked(requestCreateRecommendation).mockRejectedValue(new Error('fetch not available in test'))
  vi.mocked(requestListSmallCities).mockResolvedValue(
    adaptSmallCityApiResponse(createStaticSmallCityApiResponse(smallCities)),
  )
  vi.mocked(requestGetSmallCityDetail).mockImplementation(async (cityId) => {
    const city = smallCities.find((c) => c.id === cityId)
    if (!city) return { detail: null, rejectedRecords: [] }
    return adaptSmallCityDetailApiResponse(createStaticSmallCityDetailApiResponse(city))
  })
  vi.mocked(requestGetSmallCityPlaces).mockImplementation(async (cityId) => {
    const city = smallCities.find((c) => c.id === cityId)
    const emptyPlaceGroups: SmallCityPlaceGroups = { 관광지: [], 음식점: [], 카페: [], 숙소: [] }
    if (!city) return { placesByCategory: emptyPlaceGroups, festivals: [], festivalCount: 0, rejectedRecords: [] }
    const detail = createStaticSmallCityDetailApiResponse(city)
    return adaptSmallCityPlacesApiResponse({
      cityId: city.id,
      cityName: city.nameKo,
      summary: detail.summary,
      places: detail.places as SmallCityApiPlaceGroups,
    }, cityId)
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  sessionStorage.clear()
})

const restoredGoogleAuthState: AuthApiState = {
  authenticated: true,
  accessToken: 'restored-access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  sessionId: 'session-1',
  sessionExpiresAt: '2026-06-25T00:00:00Z',
  user: {
    id: 'api-google-user',
    name: 'API Google User',
    email: 'api-google@example.com',
    avatarInitial: 'A',
    provider: 'google',
  },
  preferenceProfile: {
    version: 2,
    countryTrack: 'KR',
    selectedThemeIds: ['history_tradition'],
    source: 'onboarding',
    updatedAt: '2026-06-11T00:00:00.000Z',
  },
  onboardingCompleted: true,
}

const newCognitoAuthState: AuthApiState = {
  authenticated: true,
  accessToken: 'new-cognito-access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  sessionId: 'session-new',
  sessionExpiresAt: '2026-06-25T00:00:00Z',
  user: {
    id: 'api-cognito-user',
    name: 'New Cognito User',
    email: 'new-cognito@example.com',
    avatarInitial: 'N',
    provider: 'cognito',
  },
  preferenceProfile: null,
  onboardingCompleted: false,
}

const newApiAuthState: AuthApiState = {
  ...newCognitoAuthState,
  accessToken: 'new-api-access-token',
  sessionId: 'session-new-api',
  user: {
    id: 'api-new-google-user',
    name: 'New API Google User',
    email: 'new-api-google@example.com',
    avatarInitial: 'N',
    provider: 'google',
  },
}

const unauthenticatedApiState: AuthApiState = {
  authenticated: false,
  accessToken: null,
  tokenType: 'Bearer',
  expiresIn: null,
  sessionId: null,
  sessionExpiresAt: null,
  user: null,
  preferenceProfile: null,
  onboardingCompleted: false,
}

const serverSavedPlan: SavedPlan = {
  id: 'server-plan-1',
  sourceRecommendationId: 'server-rec-1',
  ownerId: 'api-google-user',
  title: '서버 저장 일정',
  cityPair: '강릉',
  themeTag: '바다',
  themeLabels: ['바다'],
  conditionSummary: '1박 2일 · 바다',
  durationLabel: '1박 2일',
  festivalThemeLabel: '축제 제외',
  intensityLabel: '가볍게 걷기',
  summary: '서버에서 복구한 저장 일정입니다.',
  days: [
    {
      day: 1,
      title: '1일차',
      summary: '바다 산책',
      stops: [
        {
          time: '아침',
          move: '도보 10분',
          title: '안목해변',
          body: '바다를 먼저 봅니다.',
          reason: '바다 테마와 맞습니다.',
        },
      ],
    },
  ],
  stops: [
    {
      time: '아침',
      move: '도보 10분',
      title: '안목해변',
      body: '바다를 먼저 봅니다.',
      reason: '바다 테마와 맞습니다.',
    },
  ],
  isLiked: true,
  createdAt: '2026-06-13T00:00:00Z',
  savedAt: '2026-06-13T00:00:00Z',
}

describe('MVP main entry screen', () => {
  it('shows social mock signup before onboarding on first entry', () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'mock')
    renderApp('/auth')

    expect(screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
    expect(screen.getByText('회원가입하고 Lovv 시작하기')).toBeInTheDocument()
    expect(screen.queryByText(/저장한 취향과 여행 일정/)).not.toBeInTheDocument()

    // Closed modal is hidden from assistive tech; controls appear only once opened.
    expect(screen.getByTestId('auth-fixed-panel')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('button', { name: 'Google로 계속하기' })).not.toBeInTheDocument()
    openAuthModal()
    expect(screen.getByRole('heading', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Google로 계속하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kakao로 계속하기' })).toBeInTheDocument()
    expect(screen.getByText(/로컬 세션으로 로그인 흐름을 확인합니다/)).toBeInTheDocument()
    expect(screen.queryByText('MVP mock session')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByText('Next step')).not.toBeInTheDocument()
    expect(screen.queryByText(/회원가입 후 여행의 분위기/)).not.toBeInTheDocument()
    expect(screen.getByTestId('auth-fixed-panel')).toHaveClass('lovv-auth-left-panel')
    expect(screen.getByTestId('auth-fixed-panel')).toHaveClass('lovv-liquid-panel')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('lovv-auth-story-panel')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('lovv-liquid-panel')
    expect(screen.queryByRole('img', { name: '손을 흔드는 오렌지색 캐리어 캐릭터' })).not.toBeInTheDocument()
    expect(screen.getByText('간편 로그인')).toHaveClass('text-[#F36B12]')
    fireEvent.click(screen.getByRole('button', { name: '문의하기' }))
    expect(screen.getByRole('dialog', { name: '문의하기' })).toBeInTheDocument()
    expect(screen.getByText('문의가 필요한 경우 joramong711@gmail.com 으로 연락해 주세요.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '문의하기 닫기' }))
    expect(screen.getByRole('heading', { name: '소도시 여행의 새로운 기준, Lovv' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Lovv 서비스 설명' })).toHaveStyle({
      listStyleType: 'square',
    })
    expect(
      screen.getByText('Lovv는 소도시 여행 추천 큐레이션 서비스를 제공합니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('숨겨진 장소')).toBeInTheDocument()
    expect(screen.getByText('취향 큐레이션')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lovv의 여정' })).toBeInTheDocument()

    openAuthModal()
    fireEvent.click(screen.getByRole('button', { name: 'Google로 계속하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Google User')
    expect(localStorage.getItem(authStorageKey)).toContain('google')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
  })

  it('starts onboarding through Kakao mock signup without an API call', () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'mock')
    renderApp('/auth')

    openAuthModal()
    fireEvent.click(screen.getByRole('button', { name: 'Kakao로 계속하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Kakao User')
    expect(localStorage.getItem(authStorageKey)).toContain('kakao')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
  })

  it('restores backend auth sessions in API mode without writing mock auth storage', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({ savedPlans: [], likes: {} })

    renderApp('/auth')

    await waitFor(() => {
      expect(requestAuthSession).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })

    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(
      await screen.findByRole('button', { name: '현재 세션: Google 메뉴 열기' }),
    ).toBeInTheDocument()
    expect(screen.getByText('붐비는 유명지 대신, 취향에 맞는 소도시')).toBeInTheDocument()
  })

  it('loads backend saved itineraries into My Page after API-mode session restore', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({
      savedPlans: [serverSavedPlan],
      likes: {
        'server-plan-1': 'like',
      },
    })

    renderApp('/mypage')

    await waitFor(() => {
      expect(requestListSavedPlans).toHaveBeenCalledWith({
        accessToken: 'restored-access-token',
      })
    })

    expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '공유하기' })).toBeInTheDocument()
    expect(screen.queryByText('리뷰할 여정')).not.toBeInTheDocument()
    expect(screen.queryByText('이 일정은 어땠나요?')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toMatchObject([
      {
        id: 'server-plan-1',
        title: '서버 저장 일정',
      },
    ])
    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).toEqual({
      'server-plan-1': 'like',
    })
  })

  it('keeps backend protected routes on auth loading without showing stale saved-plan storage', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    const authSession = createDeferred<AuthApiState>()
    vi.mocked(requestAuthSession).mockReturnValue(authSession.promise)
    localStorage.setItem(
      'lovv.savedPlans',
      JSON.stringify([{ ...serverSavedPlan, id: 'stale-plan-1', title: '이전 사용자 저장 일정' }]),
    )
    localStorage.setItem('lovv.savedPlanLikes', JSON.stringify({ 'stale-plan-1': 'like' }))

    renderApp('/mypage')

    expect(screen.getByRole('status')).toHaveTextContent('로그인 정보를 확인하고 있어요')
    expect(screen.queryByText('이전 사용자 저장 일정')).not.toBeInTheDocument()

    authSession.resolve(restoredGoogleAuthState)

    await waitFor(() => {
      expect(requestListSavedPlans).toHaveBeenCalledWith({
        accessToken: 'restored-access-token',
      })
    })
    expect(screen.queryByText('이전 사용자 저장 일정')).not.toBeInTheDocument()
  })

  it('clears backend saved-plan storage when session restore fails', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockRejectedValue(new Error('session expired'))
    localStorage.setItem(
      'lovv.savedPlans',
      JSON.stringify([{ ...serverSavedPlan, id: 'stale-plan-1', title: '이전 사용자 저장 일정' }]),
    )
    localStorage.setItem('lovv.savedPlanLikes', JSON.stringify({ 'stale-plan-1': 'like' }))

    renderApp('/mypage')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })
    expect(localStorage.getItem('lovv.savedPlans')).toBeNull()
    expect(localStorage.getItem('lovv.savedPlanLikes')).toBeNull()
  })

  it('requires login before opening a shared plan link', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(unauthenticatedApiState)
    vi.mocked(requestGetSavedPlan).mockResolvedValue({
      ...serverSavedPlan,
      ownerId: 'other-user',
      isPublic: true,
    })

    renderApp('/plans/server-plan-1')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })
    expect(await screen.findByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
  })

  it('keeps direct saved-plan detail routes open while loading backend detail fallback', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({ savedPlans: [], likes: {} })
    vi.mocked(requestGetSavedPlan).mockResolvedValue(serverSavedPlan)

    renderApp('/plans/server-plan-1')

    await waitFor(() => {
      expect(requestGetSavedPlan).toHaveBeenCalledWith('server-plan-1', {
        accessToken: 'restored-access-token',
      })
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/plans/server-plan-1')
    })

    expect(screen.getByRole('region', { name: '세부 일정 상세' })).toBeInTheDocument()
    expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    expect(screen.getByText('안목해변')).toBeInTheDocument()
  })

  it('shows a backend saved-plan detail loading state before direct route detail resolves', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    const savedPlanDetail = createDeferred<SavedPlan>()
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({ savedPlans: [], likes: {} })
    vi.mocked(requestGetSavedPlan).mockReturnValue(savedPlanDetail.promise)

    renderApp('/plans/server-plan-1')

    await waitFor(() => {
      expect(requestGetSavedPlan).toHaveBeenCalledWith('server-plan-1', {
        accessToken: 'restored-access-token',
      })
    })
    expect(screen.getByRole('status')).toHaveTextContent('일정 상세를 불러오고 있어요')
    expect(screen.queryByText(/아직 확정된 일정 초안이 없어요/)).not.toBeInTheDocument()

    savedPlanDetail.resolve(serverSavedPlan)

    await waitFor(() => {
      expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    })
  })

  it('does not fall back to mock social login when API auth mode lacks OAuth client config', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', '')
    vi.mocked(requestAuthSession).mockResolvedValue(unauthenticatedApiState)

    renderApp('/auth')

    await waitFor(() => {
      expect(requestAuthSession).toHaveBeenCalledTimes(1)
    })

    openAuthModal()
    const googleButton = screen.getByRole('button', { name: 'Google로 계속하기' })

    // Session restore now settles through a query (an extra render/effect cycle versus the prior
    // direct promise chain), so the button's disabled state lags one tick behind the
    // requestAuthSession call count check above.
    await waitFor(() => {
      expect(googleButton).toBeEnabled()
    })
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(screen.getByText('로그인 설정이 필요합니다.')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('현재 환경에서 소셜 로그인을 시작할 수 없습니다.')

    expect(requestAuthLogin).not.toHaveBeenCalled()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(window.location.pathname).toBe('/auth')
  })

  it('keeps the auth entry screen visible during passive backend session restore', () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    vi.mocked(requestAuthSession).mockReturnValue(new Promise<AuthApiState>(() => {}))

    renderApp('/auth')

    expect(screen.queryByText('로그인 정보를 확인하고 있어요')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
    openAuthModal()
    expect(screen.getByRole('button', { name: 'Google로 계속하기' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Kakao로 계속하기' })).toBeDisabled()
  })

  it('prepares Cognito redirect metadata before the first social login click', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://lovv-test.auth.ap-northeast-2.amazoncognito.com')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'lovv-cognito-client-id')
    vi.stubGlobal('crypto', createOAuthCryptoMock())
    vi.mocked(requestAuthSession).mockResolvedValue(unauthenticatedApiState)

    renderApp('/auth')

    await waitFor(() => {
      expect(sessionStorage.getItem('lovv.auth.oauth.google')).toContain('"provider":"google"')
      expect(sessionStorage.getItem('lovv.auth.oauth.google')).toContain('"codeVerifier"')
      expect(sessionStorage.getItem('lovv.auth.oauth.kakao')).toContain('"provider":"kakao"')
      expect(sessionStorage.getItem('lovv.auth.oauth.kakao')).toContain('"codeVerifier"')
    })
  })

  it('exchanges OAuth callback authorization_code through the backend auth API', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthLogin).mockResolvedValue(restoredGoogleAuthState)
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/google?code=google-auth-code&state=state-1')

    expect(screen.getByText('로그인 정보를 확인하고 있어요')).toBeInTheDocument()
    expect(screen.getByText('잠시만 기다려주세요')).toBeInTheDocument()

    await waitFor(() => {
      expect(requestAuthLogin).toHaveBeenCalledWith('google', {
        credentialType: 'authorization_code',
        credential: 'google-auth-code',
        redirectUri: 'http://localhost/auth/callback/google',
        codeVerifier: 'google-pkce-verifier',
      })
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })

    expect(requestAuthSession).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('lovv.auth.oauth.google')).toBeNull()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
  })

  it('routes first API-mode login to onboarding after committing auth state', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthLogin).mockResolvedValue(newApiAuthState)
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/google',
      codeVerifier: 'google-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/google?code=google-auth-code&state=state-1')

    await waitFor(() => {
      expect(requestAuthLogin).toHaveBeenCalledWith('google', {
        credentialType: 'authorization_code',
        credential: 'google-auth-code',
        redirectUri: 'http://localhost/auth/callback/google',
        codeVerifier: 'google-pkce-verifier',
      })
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding')
    })

    expect(
      await screen.findByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('회원가입하고 Lovv 시작하기')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('lovv.auth.oauth.google')).toBeNull()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
  })

  it('rejects OAuth callbacks with mismatched state before calling the backend', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    writePendingOAuthLogin(sessionStorage, {
      provider: 'kakao',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/kakao',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/kakao?code=kakao-auth-code&state=state-2')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })

    expect(requestAuthLogin).not.toHaveBeenCalled()
    expect(requestAuthSession).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('lovv.auth.oauth.kakao')).toBeNull()
    expect(await screen.findByText('로그인 요청이 만료되었습니다.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('이전 로그인 요청을 더 이상 사용할 수 없습니다. 다시 시도해 주세요.')
  })

  it('exchanges Cognito callbacks through Hosted UI token exchange and backend bridge session', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    vi.mocked(requestCognitoToken).mockResolvedValue({
      accessToken: 'cognito-access-token',
      idToken: 'cognito-id-token',
      refreshToken: null,
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    vi.mocked(requestCognitoBridgeSession).mockResolvedValue({
      ...restoredGoogleAuthState,
      user: restoredGoogleAuthState.user
        ? {
            ...restoredGoogleAuthState.user,
            provider: 'cognito',
          }
        : null,
    })
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/cognito?code=cognito-auth-code&state=state-1')

    expect(screen.getByText('로그인 정보를 확인하고 있어요')).toBeInTheDocument()
    expect(screen.getByText('잠시만 기다려주세요')).toBeInTheDocument()

    await waitFor(() => {
      expect(requestCognitoToken).toHaveBeenCalledWith({
        code: 'cognito-auth-code',
        redirectUri: 'http://localhost/auth/callback/cognito',
        codeVerifier: 'cognito-pkce-verifier',
      })
    })
    await waitFor(() => {
      expect(requestCognitoBridgeSession).toHaveBeenCalledWith('cognito-id-token')
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })

    expect(requestAuthLogin).not.toHaveBeenCalled()
    expect(requestAuthSession).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('lovv.auth.oauth.google')).toBeNull()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
  })

  it('routes first Cognito login to onboarding after committing auth state', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    vi.mocked(requestCognitoToken).mockResolvedValue({
      accessToken: 'cognito-access-token',
      idToken: 'cognito-id-token',
      refreshToken: null,
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    vi.mocked(requestCognitoBridgeSession).mockResolvedValue(newCognitoAuthState)
    writePendingOAuthLogin(sessionStorage, {
      provider: 'kakao',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/cognito?code=cognito-auth-code&state=state-1')

    await waitFor(() => {
      expect(requestCognitoBridgeSession).toHaveBeenCalledWith('cognito-id-token')
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding')
    })

    expect(
      await screen.findByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('회원가입하고 Lovv 시작하기')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('lovv.auth.oauth.kakao')).toBeNull()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
  })

  it('persists Cognito onboarding preferences before entering the app', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    vi.mocked(requestCognitoToken).mockResolvedValue({
      accessToken: 'cognito-access-token',
      idToken: 'cognito-id-token',
      refreshToken: null,
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    vi.mocked(requestCognitoBridgeSession).mockResolvedValue(newCognitoAuthState)
    vi.mocked(requestUpdatePreference).mockImplementation(async (profile) => ({
      ...profile,
      updatedAt: '2026-06-13T00:00:00.000Z',
    }))
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/cognito?code=cognito-auth-code&state=state-1')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding')
    })

    fireEvent.click(screen.getByRole('button', { name: /바다·해안/ }))
    fireEvent.click(screen.getByRole('button', { name: '이 취향으로 Lovv 시작하기' }))

    await waitFor(() => {
      expect(requestUpdatePreference).toHaveBeenCalledWith(
        expect.objectContaining({
          countryTrack: 'KR',
          selectedThemeIds: ['sea_coast'],
        }),
        { accessToken: 'new-cognito-access-token' },
      )
    })
    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })
    expectStoredThemeIds(['sea_coast'], 'KR')
  })

  it('rejects invalid Cognito callback state without falling back to mock auth', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    writePendingOAuthLogin(sessionStorage, {
      provider: 'kakao',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/cognito?code=cognito-auth-code&state=state-2')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })

    expect(requestCognitoToken).not.toHaveBeenCalled()
    expect(requestCognitoBridgeSession).not.toHaveBeenCalled()
    expect(requestAuthLogin).not.toHaveBeenCalled()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(await screen.findByText('로그인 요청이 만료되었습니다.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('이전 로그인 요청을 더 이상 사용할 수 없습니다. 다시 시도해 주세요.')
  })

  it('shows a retryable Cognito session notice when PKCE metadata is missing', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/cognito',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/cognito?code=cognito-auth-code&state=state-1')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })

    expect(requestCognitoToken).not.toHaveBeenCalled()
    expect(requestCognitoBridgeSession).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('lovv.auth.oauth.google')).toBeNull()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(await screen.findByText('로그인 세션 정보가 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('브라우저의 로그인 세션 정보를 확인할 수 없습니다. 다시 시도해 주세요.')
  })

  it('shows a friendly backend Auth notice when Cognito bridge session fails', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    vi.mocked(requestCognitoToken).mockResolvedValue({
      accessToken: 'cognito-access-token',
      idToken: 'cognito-id-token',
      refreshToken: null,
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    vi.mocked(requestCognitoBridgeSession).mockRejectedValue({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'upstream token endpoint unavailable',
    })
    writePendingOAuthLogin(sessionStorage, {
      provider: 'google',
      state: 'state-1',
      redirectUri: 'http://localhost/auth/callback/cognito',
      codeVerifier: 'cognito-pkce-verifier',
      createdAt: 1_800_000_000_000,
    mode: 'login',
    })

    renderApp('/auth/callback/cognito?code=cognito-auth-code&state=state-1')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })

    expect(requestCognitoBridgeSession).toHaveBeenCalledWith('cognito-id-token')
    expect(sessionStorage.getItem('lovv.auth.oauth.google')).toBeNull()
    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(await screen.findByText('외부 로그인 서버 응답이 지연되고 있습니다.')).toBeInTheDocument()
    expect(screen.getByText('잠시 후 다시 시도해 주세요.')).toBeInTheDocument()
  })

  it('renders the Lovv landing content from the MVP Figma frame', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp()

    expect(window.location.pathname).toBe('/home')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.queryByText('Lovv Google User')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '새 여정 만들기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '마이페이지' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현재 세션: Google 메뉴 열기' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '당신이 몰랐던 소도시의 숨은 매력' })).toBeInTheDocument()
    expect(screen.getByTestId('main-entry')).toHaveClass('lovv-rotating-hero')
    expect(screen.getByTestId('main-entry')).toHaveClass('min-h-[820px]')
    expect(screen.getByTestId('main-entry').querySelector('.lovv-hero-tone-bridge')).toBeInTheDocument()
    expect(screen.getByTestId('hero-theme-mountain')).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('hero-slogan-accent')).toHaveClass('lovv-text-mountain')
    ;['#바다'].forEach((tag) => {
      expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('부산 · 오키나와 감성으로 시작합니다')).not.toBeInTheDocument()
    expect(screen.queryByText('Next action')).not.toBeInTheDocument()
    const proofHeading = screen.getByText('붐비는 유명지 대신, 취향에 맞는 소도시')
    const proofSummaryPanel = screen.getByTestId('proof-summary-panel')
    const recommendationBasis = screen.getByRole('list', { name: '추천 근거 해시태그' })
    const monthlyHeading = screen.getByRole('heading', { name: '이번 달 추천 소도시' })

    expect(proofSummaryPanel).toHaveClass('border')
    expect(proofSummaryPanel).toHaveClass('border-white/60')
    expect(screen.getByText(/어디로 갈지 못정했어도 괜찮아요/)).toBeInTheDocument()
    expect(within(recommendationBasis).getAllByRole('listitem')).toHaveLength(2)
    ;['#바다', '#해안'].forEach((tag) => {
      expect(within(recommendationBasis).getByText(tag)).toBeInTheDocument()
    })
    ;['#바다해안', '#바다+2', '#리조트+1', '#산악트레킹약함'].forEach((tag) => {
      expect(within(recommendationBasis).queryByText(tag)).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('link', { name: 'AI 일정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '챗봇' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '소도시 보기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '소도시 지도 프리뷰' })).not.toBeInTheDocument()
    expect(screen.queryByText('이번 주 추천 소도시')).not.toBeInTheDocument()
    expect(monthlyHeading).toBeInTheDocument()
    expect(Boolean(proofHeading.compareDocumentPosition(monthlyHeading) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      true,
    )
    expect(screen.queryByRole('heading', { name: '내가 가고 싶은 소도시 찾아보기' })).not.toBeInTheDocument()
    const monthlyGrid = screen.getByTestId('monthly-recommendation-grid')

    expect(monthlyGrid.className).toContain('grid-cols-[minmax(160px,0.58fr)_minmax(0,1.45fr)_minmax(160px,0.58fr)]')
    expect(within(monthlyGrid).getAllByRole('button')).toHaveLength(5)
    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      '아산/온양 · 벳푸 이달 추천 상세 보기',
    )
    expect(screen.getByTestId('monthly-recommendation-next')).toHaveAttribute(
      'aria-label',
      '부산 · 오키나와 이달 추천 상세 보기',
    )
    ;[
      '이전 추천 보기',
      '다음 추천 보기',
      '아산/온양 · 벳푸 이달 추천 상세 보기',
      '부산 · 오키나와 이달 추천 상세 보기',
      '강릉 · 가나자와 이달 추천 상세 보기',
    ].forEach((buttonName) => {
      expect(within(monthlyGrid).getByRole('button', { name: buttonName })).toBeInTheDocument()
    })
    expect(screen.queryByTestId('city-map-discovery-section')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '빠른 이동 메뉴 열기' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '여행지 찾아보기' })).toHaveAttribute('href', '/map')
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveAttribute('href', '/planner')
    expect(screen.getByText('붐비는 유명지 대신, 취향에 맞는 소도시')).toBeInTheDocument()
  })

  it('keeps route changes in browser history for back navigation', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp()

    expect(screen.getByTestId('main-entry')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/home')

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/planner')

    act(() => {
      window.history.back()
    })

    await waitFor(() => {
      expect(screen.getByTestId('main-entry')).toBeInTheDocument()
    })
    expect(window.location.pathname).toBe('/home')
  })

  it('replaces legacy view query URLs with canonical routes', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    const chatLegacyApp = renderApp('/?view=chat')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/planner')
    })
    expect(window.location.search).toBe('')
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    chatLegacyApp.unmount()

    const mapLegacyApp = renderApp('/?view=map')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/map')
    })
    expect(window.location.search).toBe('')
    await waitFor(() => {
      expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    })
    mapLegacyApp.unmount()

    const preferenceLegacyApp = renderApp('/?view=preferenceEdit')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/preferences')
    })
    expect(window.location.search).toBe('')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 다시 골라주세요' })).toBeInTheDocument()
    preferenceLegacyApp.unmount()

    renderApp('/?view=planDetail')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/planner')
    })
    expect(window.location.search).toBe('')
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
  })

  it('guards auth, onboarding, protected, and unknown routes', async () => {
    const unauthenticatedApp = renderApp('/map')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })
    expect(screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
    unauthenticatedApp.unmount()

    seedUser()
    const noPreferenceApp = renderApp('/mypage')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding')
    })
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
    noPreferenceApp.unmount()

    seedPreference('경주 · 교토')
    const authenticatedApp = renderApp('/auth')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })
    expect(screen.getByRole('heading', { name: /당신이 몰랐던/ })).toBeInTheDocument()
    authenticatedApp.unmount()

    renderApp('/missing-route')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })

    cleanup()
    seedUser()
    seedPreference('경주 · 교토')
    renderApp('/saved-plans')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/saved-plans')
    })
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
  })

  it('opens monthly recommendation detail before starting the planner', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: '부산 · 오키나와 이달 추천 상세 보기' }))
    await waitFor(() => {
      expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
        'aria-label',
        '부산 · 오키나와 이달 추천 상세 보기',
      )
    })
    await waitFor(() => {
      expect(screen.getByTestId('monthly-recommendation-grid')).toHaveAttribute('data-motion', 'idle')
    })
    fireEvent.click(screen.getByTestId('monthly-recommendation-featured'))

    expectStoredThemeIds(['healing_rest'])
    expect(screen.getByRole('heading', { name: '바다색이 선명한 해안 휴식' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '이 테마를 추천하는 기준' })).toBeInTheDocument()
    expect(screen.getByText('부산 · 오키나와')).toBeInTheDocument()
    expect(screen.getByText('해운대 · 광안리')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'AI 일정 챗봇' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '이 테마로 일정 계획하기' }))

    expectStoredThemeIds(['healing_rest'])
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByText(/바다·해안 기준 테마로 축제 포함 여부/)).toBeInTheDocument()
    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('바다·해안 기준 테마')
    expect(screen.queryByRole('heading', { name: '소도시 지도 프리뷰' })).not.toBeInTheDocument()
  })

  it('renders the small-city map fixture corpus and country switcher', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    await waitFor(() => {
      expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    })

    expect(window.location.pathname).toBe('/map')
    expect(smallCityCounts.KR).toBe(40)
    expect(smallCityCounts.JP).toBe(40)
    expect(smallCities).toHaveLength(80)
    const koreanCityNames = smallCities
      .filter((city) => city.country === 'KR')
      .map((city) => city.nameKo)
    expect(new Set(koreanCityNames).size).toBe(40)
    expect(
      smallCities
        .filter((city) => city.country === 'JP')
        .every((city) => city.region.length > 0),
    ).toBe(true)
    const japaneseCityNames = smallCities
      .filter((city) => city.country === 'JP')
      .map((city) => city.nameKo)
    expect(new Set(japaneseCityNames).size).toBe(japaneseCityNames.length)
    expect(
      smallCities
        .filter((city) => city.country === 'JP')
        .some((city) => /\s(해안|온천|구시가|축제|공예|숲길|시장|산책)$/.test(city.nameKo)),
    ).toBe(false)

    const cityMapSection = screen.getByTestId('city-map-discovery-section')
    const layoutShell = within(cityMapSection).getByTestId('city-map-layout-shell')
    const cityThemeFilter = within(cityMapSection).getByRole('group', { name: '소도시 테마 필터' })

    expect(within(cityMapSection).getByRole('heading', { name: '내가 가고 싶은 소도시 찾아보기' })).toBeInTheDocument()
    expect(layoutShell.className).toContain('grid-cols-[minmax(0,1.7fr)_minmax(380px,0.82fr)]')
    expect(layoutShell.className).toContain('xl:h-[min(900px,calc(100vh-112px))]')
    expect(layoutShell.className).toContain('xl:overflow-hidden')
    expect(within(cityMapSection).getByRole('button', { name: '한국' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(cityThemeFilter).getAllByRole('button')).toHaveLength(6)
    ;['#온천', '#바다', '#미식', '#전통', '#자연', '#예술'].forEach((themeLabel) => {
      expect(within(cityThemeFilter).getByRole('button', { name: themeLabel })).toBeInTheDocument()
    })
    expect(within(cityThemeFilter).queryByRole('button', { name: '#축제' })).not.toBeInTheDocument()
    expect(within(cityThemeFilter).queryByRole('button', { name: '#산책' })).not.toBeInTheDocument()
    expect(within(cityMapSection).getByText('한국 40곳 / 전체 40곳')).toBeInTheDocument()
    const googleMap = within(cityMapSection).getByTestId('city-map-google-map')

    expect(googleMap).toHaveAttribute('data-marker-count', '40')
    expect(['fallback', 'loading', 'ready']).toContain(googleMap.getAttribute('data-runtime-status'))
    expect(googleMap).toHaveTextContent(/Google Maps (fallback|loading)/)
    expect(within(googleMap).getAllByRole('button', { name: /지도 마커:/ })).toHaveLength(40)
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button')).toHaveLength(40)
    expect(within(cityMapSection).queryByText(/Open\s?Street\s?Map/)).not.toBeInTheDocument()

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '일본' }))

    expect(within(cityMapSection).getByRole('button', { name: '일본' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(cityMapSection).getByText('일본 40곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button')).toHaveLength(40)

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '한국' }))

    expect(within(cityMapSection).getByRole('button', { name: '한국' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(cityMapSection).getByText('한국 40곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button')).toHaveLength(40)

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '일본' }))

    expect(within(cityMapSection).getByRole('button', { name: '일본' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(cityMapSection).getByText('일본 40곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).queryByText(/내부 후보 데이터/)).not.toBeInTheDocument()
    expect(within(cityMapSection).queryByText(/Backend-ready/)).not.toBeInTheDocument()
    expect(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /오타루/ })).toBeInTheDocument()
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button', { name: /가마쿠라/ })).toHaveLength(1)
    expect(
      within(screen.getByTestId('city-map-result-list')).queryByRole('button', { name: /가마쿠라 공예/ }),
    ).not.toBeInTheDocument()

    const citySearchInput = within(cityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')

    fireEvent.change(citySearchInput, {
      target: { value: '게곤폭포' },
    })

    expect(within(cityMapSection).getByText('일본 0곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '0')
    expect(screen.queryByTestId('city-map-result-list')).not.toBeInTheDocument()

    fireEvent.change(citySearchInput, {
      target: { value: '닛코' },
    })

    expect(within(cityMapSection).getByText('일본 1곳 / 전체 40곳')).toBeInTheDocument()
    const filteredGoogleMap = within(cityMapSection).getByTestId('city-map-google-map')

    expect(filteredGoogleMap).toHaveAttribute('data-marker-count', '1')
    expect(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /닛코/ })).toBeInTheDocument()
    expect(within(screen.getByTestId('city-map-result-list')).queryByRole('button', { name: /닛코 시장/ })).not.toBeInTheDocument()

    fireEvent.click(within(filteredGoogleMap).getByRole('button', { name: '지도 마커: 닛코' }))

    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('닛코')
    await within(cityMapSection).findByLabelText('관광지 장소 후보')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel').className).toContain('overflow-hidden')
    expect(within(cityMapSection).getByTestId('city-map-detail-sticky-content').className).toContain('overflow-y-auto')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('게곤폭포')
    expect(filteredGoogleMap).toHaveAttribute('data-selected-city-id', 'jp-011')
    expect(within(cityMapSection).queryByTestId('city-map-list-detail-panel')).not.toBeInTheDocument()
    smallCityPlaceCategories.forEach((category) => {
      expect(within(cityMapSection).getAllByText(category).length).toBeGreaterThan(0)
    })
    const kakaoPlaceLinks = within(cityMapSection).getAllByRole('link', { name: 'Kakao 장소 보기' })
    expect(kakaoPlaceLinks.length).toBeGreaterThan(0)
    expect(kakaoPlaceLinks[0]).toHaveAttribute('href', expect.stringContaining('https://map.kakao.com/link/search/'))
    fireEvent.click(within(filteredGoogleMap).getByRole('button', { name: '지도 마커: 닛코' }))
    expect(filteredGoogleMap).toHaveAttribute('data-selected-city-id', '')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('표시된 소도시')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).not.toHaveTextContent('장소 정보')
    fireEvent.click(within(filteredGoogleMap).getByRole('button', { name: '지도 마커: 닛코' }))
    fireEvent.click(within(cityMapSection).getByRole('button', { name: '← 목록으로' }))
    expect(within(cityMapSection).getByTestId('city-map-result-list')).toHaveTextContent('닛코')
  })

  it('normalizes map markers to city identity without theme or route payloads', () => {
    const japaneseMarkers = createSmallCityMapMarkers(
      smallCities.filter((city) => city.country === 'JP'),
    )

    expect(japaneseMarkers).toHaveLength(40)
    expect(japaneseMarkers.every((marker) => marker.label.length > 0)).toBe(true)
    expect(japaneseMarkers.some((marker) => /\s(해안|온천|구시가|축제|공예|숲길|시장|산책)$/.test(marker.label))).toBe(false)
    expect(japaneseMarkers[0]).not.toHaveProperty('themes')
    expect(japaneseMarkers[0]).not.toHaveProperty('summary')
    expect(japaneseMarkers[0]).not.toHaveProperty('detail')
    expect(japaneseMarkers[0]).not.toHaveProperty('routeSeed')
  })

  it('filters small-city markers by search and theme with an empty state', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    await waitFor(() => {
      expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    })

    const cityMapSection = screen.getByTestId('city-map-discovery-section')
    const searchInput = within(cityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')

    fireEvent.change(searchInput, { target: { value: '경주' } })

    expect(within(cityMapSection).getByText('한국 1곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '1')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('경주')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('표시된 소도시')
    fireEvent.click(
      within(within(cityMapSection).getByTestId('city-map-result-list')).getByRole('button', { name: /경주/ }),
    )
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('장소 정보')
    expect(within(cityMapSection).getAllByText('#전통').length).toBeGreaterThan(0)
    expect(within(cityMapSection).queryByText('#산책')).not.toBeInTheDocument()
    fireEvent.click(within(cityMapSection).getByRole('button', { name: '← 목록으로' }))
    const gyeongjuListButton = within(within(cityMapSection).getByTestId('city-map-result-list')).getByRole('button', {
      name: /경주/,
    })
    expect(gyeongjuListButton).toHaveAttribute('aria-current', 'true')
    fireEvent.click(gyeongjuListButton)
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-selected-city-id', '')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('표시된 소도시')

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '#온천' }))

    expect(within(cityMapSection).getByText('한국 0곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '0')
    expect(within(cityMapSection).getByText('조건에 맞는 소도시가 없습니다.')).toBeInTheDocument()

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '필터 초기화' }))

    expect(within(cityMapSection).getByText('한국 40곳 / 전체 40곳')).toBeInTheDocument()
  })

  it('opens the AI planner from a selected map city without mutating the stored preference', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    await waitFor(() => {
      expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    })

    const cityMapSection = screen.getByTestId('city-map-discovery-section')
    const searchInput = within(cityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')
    const storedPreferenceBefore = localStorage.getItem('lovv.preference')

    fireEvent.change(searchInput, { target: { value: '경주' } })
    fireEvent.click(
      within(screen.getByTestId('city-map-result-list')).getByRole('button', {
        name: /경주/,
      }),
    )

    const cityDetailPanel = within(cityMapSection).getByTestId('city-map-detail-panel')
    expect(cityDetailPanel).toHaveTextContent('경주')
    expect(cityDetailPanel).toHaveTextContent('황리단길 · 첨성대 · 동궁과 월지')

    fireEvent.click(within(cityDetailPanel).getByRole('button', { name: '이 소도시로 AI 일정 짜기' }))

    expect(window.location.pathname).toBe('/planner')
    expect(localStorage.getItem('lovv.preference')).toBe(storedPreferenceBefore)
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-planner-summary')).toHaveTextContent('경주 상세 정보를 기준으로')
    expect(screen.getByTestId('chat-planner-summary')).toHaveTextContent('여행 기간만 먼저 정리합니다')
    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('경주(한국 경북)를 기준으로 시작할게요.')
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '축제 제외' })).not.toBeInTheDocument()
    expect(screen.getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('여행 기간을 먼저 선택해 주세요')).toBeInTheDocument()
    expect(
      screen.getByText('여행 기간을 고른 뒤 해당 소도시의 동선 단서를 기준으로 일정 초안이 여기에 표시됩니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.')).not.toBeInTheDocument()

    vi.mocked(requestCreateRecommendation).mockResolvedValueOnce({
      destination: {
        destinationId: 'KR-Gyeongju',
        name: '경주',
        country: 'KR',
        region: '경북',
      },
      itinerary: {
        tripType: '2d1n',
        title: '경주 1박 2일',
        summary: '경주 API 일정 요약입니다.',
        durationLabel: '1박 2일',
        days: [
          {
            day: 1,
            title: '1일차 경주 산책',
            summary: '황리단길과 첨성대',
            items: [
              { itemId: 'g1', sortOrder: 1, timeOfDay: 'morning', title: '황리단길', body: '골목 산책', reason: '역사 테마', moveMinutes: 10 },
            ],
          },
        ],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    await waitFor(() => {
      expect(requestCreateRecommendation).toHaveBeenCalledWith(
        expect.objectContaining({
          entryType: 'map_marker',
          destinationId: expect.any(String),
          tripType: '2d1n',
        }),
      )
    })
    await waitFor(() => {
      expect(screen.getAllByText(/경주 API 일정 요약입니다/).length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('heading', { name: '경주' })).toBeInTheDocument()
    expect(screen.getByText(/경주 · 경북 1박 2일 초안/)).toBeInTheDocument()
    expect(screen.queryByText(/경주 중심으로 알맞은 1박 2일 일정을 구성해 보겠습니다/)).not.toBeInTheDocument()
    expect(screen.queryByText('축제 제외 반영')).not.toBeInTheDocument()
    expect(screen.queryByText('축제 조건 없음 반영')).not.toBeInTheDocument()
    expect(screen.getByLabelText('조건 해석 결과')).toHaveTextContent('역사·전통')
    expect(screen.getByPlaceholderText('추가로 원하는 조건을 입력해 주세요')).toBeInTheDocument()
  })

  it('skips the selected-city festival prompt when only the city theme has a festival tag', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    await waitFor(() => {
      expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    })

    const cityMapSection = screen.getByTestId('city-map-discovery-section')
    const searchInput = within(cityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')

    fireEvent.change(searchInput, { target: { value: '양양' } })
    fireEvent.click(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /양양/ }))
    fireEvent.click(
      within(within(cityMapSection).getByTestId('city-map-detail-panel')).getByRole('button', {
        name: '이 소도시로 AI 일정 짜기',
      }),
    )

    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('양양(한국 강원)를 기준으로 시작할게요.')
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(screen.getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
  })

  it('asks the selected-city festival prompt from real festival data and checks the travel month', async () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    await waitFor(() => {
      expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    })

    const nextCityMapSection = screen.getByTestId('city-map-discovery-section')
    const nextSearchInput = within(nextCityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')

    fireEvent.change(nextSearchInput, { target: { value: '진주' } })
    fireEvent.click(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /진주/ }))
    const cityDetailPanel = within(nextCityMapSection).getByTestId('city-map-detail-panel')
    const placePanel = within(nextCityMapSection).getByTestId('city-map-detail-place-panel')
    const tourismPlaces = await within(placePanel).findByLabelText('관광지 장소 후보')
    const festivalInfo = within(placePanel).getByLabelText('축제 정보')

    expect(cityDetailPanel).toHaveTextContent('진주남강유등축제')
    expect(within(tourismPlaces).getByText('진주성 중심 산책')).toBeInTheDocument()
    expect(within(tourismPlaces).queryByText('진주남강유등축제')).not.toBeInTheDocument()
    expect(within(tourismPlaces).getByText('1')).toBeInTheDocument()
    expect(within(festivalInfo).getByText('진주남강유등축제')).toBeInTheDocument()
    expect(within(festivalInfo).getByText('2026.10.01 - 2026.10.12')).toBeInTheDocument()
    fireEvent.click(
      within(cityDetailPanel).getByRole('button', {
        name: '이 소도시로 AI 일정 짜기',
      }),
    )

    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('진주(한국 경남)를 기준으로 시작할게요.')
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    vi.mocked(requestCreateRecommendation).mockResolvedValueOnce({
      destination: {
        destinationId: 'KR-Jinju',
        name: '진주',
        country: 'KR',
        region: '경남',
      },
      itinerary: {
        tripType: '2d1n',
        title: '진주 1박 2일',
        summary: '진주 API 일정 요약입니다.',
        durationLabel: '1박 2일',
        days: [
          {
            day: 1,
            title: '1일차 진주 산책',
            summary: '진주성과 남강',
            items: [
              { itemId: 'j1', sortOrder: 1, timeOfDay: 'morning', title: '진주성', body: '성곽 산책', reason: '축제와 역사', moveMinutes: 12 },
            ],
          },
        ],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(screen.queryByText('여행 예정 월을 골라주세요')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '진주 · 경남 1박 2일 초안' })).toBeInTheDocument()
    expect(screen.getAllByText(/진주 API 일정 요약입니다/).length).toBeGreaterThan(0)
  })

  it('rotates the main hero theme every 10 seconds with theme-specific slogan styling', () => {
    vi.useFakeTimers()
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp()

    expect(screen.getByRole('heading', { name: '당신이 몰랐던 소도시의 숨은 매력' })).toBeInTheDocument()
    expect(screen.getByTestId('hero-theme-mountain')).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('hero-theme-mountain').querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('hero-town'),
    )
    expect(screen.getByTestId('hero-theme-sea')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('hero-theme-sea').querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('hero-sea'),
    )

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByRole('heading', { name: '당신이 몰랐던 소도시의 푸른 바다' })).toBeInTheDocument()
    expect(screen.getByTestId('hero-theme-mountain')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('hero-theme-sea')).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('hero-slogan-accent')).toHaveClass('lovv-text-sea')

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByRole('heading', { name: '당신이 몰랐던 소도시의 화려한 축제' })).toBeInTheDocument()
    expect(screen.getByTestId('hero-theme-festival')).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByTestId('hero-theme-festival').querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('hero-firework'),
    )
    expect(screen.getByTestId('hero-slogan-accent')).toHaveClass('lovv-text-festival-gradient')
  })

  it('renders the refreshed product shell with a minimal session header and footer', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp()

    const banner = screen.getByRole('banner')
    expect(within(banner).queryByRole('navigation', { name: 'Lovv 주요 내비게이션' })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('button', { name: '여행지' })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('button', { name: '일정 짜기' })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('button', { name: '커뮤니티' })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('button', { name: '소도시 검색 열기' })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('button', { name: '마이페이지' })).not.toBeInTheDocument()
    const sessionMenuButton = within(banner).getByRole('button', {
      name: '현재 세션: Google 메뉴 열기',
    })

    expect(sessionMenuButton).toHaveTextContent('G')
    expect(sessionMenuButton).toHaveAttribute('aria-expanded', 'false')
    expect(within(banner).queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument()

    fireEvent.click(sessionMenuButton)

    expect(sessionMenuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: '세션 메뉴' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeInTheDocument()

    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByText('Lovv')).toBeInTheDocument()
    expect(within(footer).getByText(/© 2026 Lovv. All rights reserved./)).toBeInTheDocument()
    fireEvent.click(within(footer).getByRole('button', { name: '이용약관' }))
    expect(screen.getByRole('dialog', { name: '이용약관' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '서비스 이용' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '이용약관 닫기' }))

    expect(within(footer).getByRole('button', { name: '개인정보처리방침' })).toBeInTheDocument()
    expect(within(footer).getByRole('button', { name: '문의하기' })).toBeInTheDocument()
    expect(within(footer).queryByRole('button', { name: 'Lovv Instagram 열기' })).not.toBeInTheDocument()
    expect(within(footer).queryByRole('button', { name: 'Lovv YouTube 열기' })).not.toBeInTheDocument()
    expect(within(footer).queryByRole('button', { name: 'Lovv Blog 열기' })).not.toBeInTheDocument()
    expect(within(footer).queryByLabelText('Lovv social links')).not.toBeInTheDocument()
  })

  it('opens My Page from the header while keeping logout available', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    expect(screen.queryByRole('link', { name: '새 여정 만들기' })).not.toBeInTheDocument()

    openMyPageFromSessionMenu()

    expect(window.location.pathname).toBe('/mypage')
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByText('Lovv Google User님, 밑에 생성된 일정을 확인해보세요.')).toBeInTheDocument()
    expect(screen.getAllByText('Google').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('역사·전통').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('소셜 로그인 정보는 Lovv 계정 식별에만 사용합니다.')).toBeInTheDocument()
    expect(screen.getByText('반응 남긴 일정')).toBeInTheDocument()
    expect(screen.getByText('저장한 일정이 아직 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '테마 변경' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: '← 이전으로 돌아가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메인으로 돌아가기' })).toBeInTheDocument()
  })

  it('shows the selected social provider instead of Cognito on restored My Page sessions', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'cognito')
    localStorage.setItem(socialAuthProviderStorageKey, 'kakao')
    vi.mocked(requestAuthSession).mockResolvedValue({
      ...restoredGoogleAuthState,
      user: restoredGoogleAuthState.user
        ? {
            ...restoredGoogleAuthState.user,
            name: 'Restored Social User',
            provider: 'cognito',
          }
        : null,
    })

    renderApp('/mypage')

    expect(await screen.findByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현재 세션: Kakao 메뉴 열기' })).toBeInTheDocument()
    expect(screen.getAllByText('Kakao').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('소셜 로그인 정보는 Lovv 계정 식별에만 사용합니다.')).toBeInTheDocument()
    expect(screen.queryByText('Cognito')).not.toBeInTheDocument()
  })

  it('returns from My Page to the home view from the top action', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    openMyPageFromSessionMenu()
    fireEvent.click(screen.getByRole('button', { name: '← 이전으로 돌아가기' }))

    expect(window.location.pathname).toBe('/home')
    expect(screen.getByRole('heading', { name: /당신이 몰랐던/ })).toBeInTheDocument()
  })

  it('opens preference edit from My Page and keeps the old preference when canceled', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    openMyPageFromSessionMenu()
    fireEvent.click(screen.getByRole('button', { name: '테마 변경' }))

    expect(window.location.pathname).toBe('/preferences')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 다시 골라주세요' })).toBeInTheDocument()
    expect(screen.getByText('새 취향은 저장한 뒤 다음 AI 일정부터 반영됩니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /역사·전통/ })).toHaveAttribute('aria-pressed', 'true')
    expectStoredThemeIds(['history_tradition'])

    fireEvent.click(screen.getByRole('button', { name: /바다·해안/ }))

    expect(screen.getByRole('button', { name: /바다·해안/ })).toHaveAttribute('aria-pressed', 'true')
    expectStoredThemeIds(['history_tradition'])

    fireEvent.click(screen.getByRole('button', { name: '취소하고 마이페이지로 돌아가기' }))

    expect(window.location.pathname).toBe('/mypage')
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getAllByText('역사·전통').length).toBeGreaterThanOrEqual(1)
    expectStoredThemeIds(['history_tradition'])
  })

  it('saves a reselected preference and uses it for the next planner session', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    openMyPageFromSessionMenu()
    fireEvent.click(screen.getByRole('button', { name: '테마 변경' }))
    fireEvent.click(screen.getByRole('button', { name: /역사·전통/ }))
    fireEvent.click(screen.getByRole('button', { name: /바다·해안/ }))
    fireEvent.click(screen.getByRole('button', { name: '이 취향으로 저장하기' }))

    expect(window.location.pathname).toBe('/mypage')
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('취향이 변경됐어요. 다음 AI 일정부터 반영됩니다.')
    expect(screen.getAllByText('바다·해안').length).toBeGreaterThanOrEqual(1)
    expectStoredThemeIds(['sea_coast'])

    fireEvent.click(screen.getByRole('button', { name: '메인으로 돌아가기' }))
    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(window.location.pathname).toBe('/planner')
    expect(screen.getByText('취향 반영')).toBeInTheDocument()
    expect(screen.queryByText('바다·해안 기준 테마로 시작합니다.')).toBeNull()
    expect(screen.queryByText('#바다')).toBeNull()
  })

  it('shows planner state header and updates schedule status after choices', async () => {
    seedUser()
    seedPreference('제주 · 닛코')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const summary = screen.getByTestId('chat-planner-summary')

    expect(summary).toHaveClass('rounded-[18px]')
    expect(summary.querySelector('ol')).toHaveClass('grid-cols-3')
    expect(within(summary).getByText('취향 반영')).toBeInTheDocument()
    expect(within(summary).getAllByText('완료')[0]).toBeInTheDocument()
    expect(within(summary).queryByText('자연·트레킹 기준 테마로 시작합니다.')).toBeNull()
    expect(within(summary).queryByText('#자연')).toBeNull()
    expect(within(summary).getByText('후보 탐색')).toBeInTheDocument()
    expect(within(summary).getByText('진행 중')).toBeInTheDocument()
    expect(within(summary).queryByText('자연·트레킹')).toBeNull()
    expect(within(summary).getByText('일정 구성')).toBeInTheDocument()
    expect(within(summary).queryByText('여행 기간을 선택해 주세요.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    // Travel month selection buttons are shown
    expect(screen.getByRole('button', { name: '6월' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    expect(within(summary).queryByText('동행, 관심사, 걷는 정도를 자연어로 입력하면 초안이 완성됩니다.')).toBeNull()
    expect(within(summary).queryByText('조건 입력 대기')).toBeNull()

    fireEvent.change(screen.getByRole('textbox', { name: '여행 조건 입력' }), {
      target: { value: '숲길 위주로 덜 걷고 싶어요' },
    })
    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }))

    await screen.findByRole('button', { name: '좋아요' })
    expect(within(summary).queryByText(/1박 2일 · 6월 · 자연·트레킹/)).toBeNull()
  })

  it('opens floating quick actions for chat and top navigation', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: '빠른 이동 메뉴 열기' }))

    expect(screen.getByRole('button', { name: 'AI 일정 짜기 바로가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '맨 위로 이동' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'AI 일정 짜기 바로가기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
  })

  it('uses the logo orange palette across primary controls', () => {
    seedUser()
    seedPreference()
    renderApp()

    expect(screen.getByRole('button', { name: '현재 세션: Google 메뉴 열기' })).toHaveClass('bg-[#F36B12]')
    expect(screen.getByRole('link', { name: '여행지 찾아보기' })).toHaveClass(
      'from-[#B64A00]',
      'to-[#F36B12]',
      'border-white/40',
      'text-white',
    )
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveClass(
      'bg-white/80',
      'border-white/70',
      'text-[#B64A00]',
      'hover:bg-[#FFF0E4]',
    )

    const recommendationBasis = screen.getByRole('list', { name: '추천 근거 해시태그' })

    expect(within(recommendationBasis).getAllByRole('listitem')).toHaveLength(2)
    expect(within(recommendationBasis).getByText('#온천')).toHaveClass(
      'rounded-[5px]',
      'from-[#F36B12]',
      'to-[#FF8A2A]',
      'border-white/40',
    )
    expect(within(recommendationBasis).getByText('#온천')).not.toHaveClass('rounded-full')
    expect(within(recommendationBasis).getByText('#휴양')).toHaveClass(
      'rounded-[5px]',
      'bg-[#fffffa]/60',
      'border-white/60',
    )
    expect(within(recommendationBasis).getByText('#휴양')).not.toHaveClass('rounded-full')
  })

  it('uses a warm patterned app background', () => {
    renderApp()

    const appRoot = screen.getByRole('main')

    expect(appRoot).toHaveClass('lovv-app-shell')
    expect(appRoot).toHaveClass('lovv-warm-pattern')
    expect(appRoot).toHaveClass('lovv-ambient-background')
    expect(appRoot).toHaveClass('text-[#33271E]')
    expect(appRoot.firstElementChild).toHaveClass('lovv-app-content')
  })

  it('keeps dense text responsive on narrow screens', async () => {
    seedUser()
    seedPreference('제주 · 닛코')
    renderApp()

    expect(screen.getByRole('heading', { name: '당신이 몰랐던 소도시의 숨은 매력' })).toHaveClass(
      'break-keep',
      'max-sm:text-[36px]',
    )
    ;['#자연'].forEach((tag) => {
      expect(screen.getAllByText(tag).some((tagElement) => tagElement.className.includes('max-sm:text-[13px]'))).toBe(
        true,
      )
    })
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveClass(
      'max-sm:w-full',
    )

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: '여행 조건을 대화로 정리하기' })).toHaveClass(
      'break-keep',
      'max-sm:text-xl',
      'max-sm:leading-7',
    )
    expect(screen.getByRole('heading', { name: '아직 일정이 생성되지 않았어요' })).toHaveClass(
      'break-keep',
      'max-sm:text-xl',
      'max-sm:leading-7',
    )
    expect(screen.getByText('여행 기간을 고른 뒤 해당 소도시의 동선 단서를 기준으로 일정 초안이 여기에 표시됩니다.')).toHaveClass(
      'break-keep',
      'max-sm:text-[13px]',
    )

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '숲길 위주로 덜 걷고 싶어요',
    })

    expect(screen.getByRole('heading', { name: '자연·트레킹 1박 2일 초안' })).toHaveClass(
      'break-keep',
      'max-sm:text-lg',
      'max-sm:leading-6',
    )
    expect(screen.getByText('챗봇에서 정리된 조건을 바탕으로, 핵심 흐름만 압축해서 보여줍니다.')).toHaveClass(
      'break-keep',
      'max-sm:text-[13px]',
    )
  })

  it('shows onboarding after signup before the main screen on first entry', () => {
    renderApp()
    openAuthModal()
    fireEvent.click(screen.getByRole('button', { name: 'Google로 계속하기' }))

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).not.toBeInTheDocument()
    expect(screen.getByText('Lovv City Mood Journal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
    expect(screen.getByText(/익숙한 대도시 감각을 Lovv가 한국 소도시 후보로 바꿔둘게요/)).toBeInTheDocument()
    expect(screen.queryByText(/이번 선택으로 AI 일정의 말투와 지도 후보/)).not.toBeInTheDocument()
    expect(screen.queryByText(/도시 이름을 고르는 게 아니라/)).not.toBeInTheDocument()
    expect(screen.queryByText('First Issue')).not.toBeInTheDocument()
    expect(screen.queryByText('Before the map')).not.toBeInTheDocument()
    expect(screen.queryByText(/마음에 가까운 장면을 고르면/)).not.toBeInTheDocument()
    ;[
      '온천·휴양',
      '바다·해안',
      '역사·전통',
      '미식·노포',
      '자연·트레킹',
      '예술·감성',
      '숙소 체류, 온천, 스파처럼 회복감이 있는 장면',
      '바다색, 해변 산책, 리조트 여백',
      '시장, 로컬 식탁, 오래된 가게',
      '공예, 정원, 카페, 전시',
    ].forEach((copy) => {
      expect(screen.getByText(new RegExp(copy.replace('/', '\\/')))).toBeInTheDocument()
    })
    expect(screen.getByRole('region', { name: '여행의 분위기를 골라주세요' })).toHaveClass(
      'lovv-onboarding-liquid-shell',
    )
    expect(screen.getByTestId('onboarding-hero-panel')).toHaveClass('lovv-liquid-panel')
    expect(screen.getByTestId('onboarding-content-grid')).toHaveClass('mt-10', 'items-stretch')
    expect(screen.getByTestId('preference-card-grid')).toHaveClass('auto-rows-[212px]')
    expect(screen.getByRole('button', { name: /온천·휴양/ })).toHaveClass(
      'lovv-onboarding-theme-card',
    )
    expect(screen.getByTestId('onboarding-action-bar')).toHaveClass('lovv-liquid-panel')
    expect(screen.getByText('온양온천 · 스파 휴양')).toHaveClass(
      'mt-auto',
      'w-full',
      'rounded-[12px]',
      'shrink-0',
    )

    expect(screen.getByRole('button', { name: '이 취향으로 Lovv 시작하기' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /바다·해안/ }))
    fireEvent.click(screen.getByRole('button', { name: /자연·트레킹/ }))
    fireEvent.click(screen.getByRole('button', { name: /예술·감성/ }))
    fireEvent.click(screen.getByRole('button', { name: /역사·전통/ }))

    expect(screen.getByRole('status')).toHaveTextContent('기준 테마는 최대 3개까지 선택할 수 있어요.')
    expect(screen.getByRole('button', { name: /역사·전통/ })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: '이 취향으로 Lovv 시작하기' }))

    expectStoredThemeIds(['sea_coast', 'nature_trekking', 'art_sense'])
    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    ;['#바다', '#자연', '#예술'].forEach((tag) => {
      expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
    })
  })

  it('shows every selected theme image in the preview tray', () => {
    seedUser()
    renderApp()

    expect(screen.queryByText('Selected Theme')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '아산/온양 대표 이미지' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /온천·휴양/ })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: /온천·휴양/ }))

    expect(screen.getByRole('button', { name: /온천·휴양/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('preference-preview-card')).toHaveClass(
      'lovv-onboarding-preview-card',
      'lovv-liquid-panel',
      'top-[220px]',
      'h-fit',
      'max-xl:static',
    )
    expect(screen.getByRole('img', { name: '아산/온양 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 아산/온양')).toBeInTheDocument()
    expect(screen.getByText('1 / 1 · 온천·휴양')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /이미지 목록 펼치기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '선택한 테마 이미지 목록' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /미식·노포/ }))

    expect(screen.getByText('1 / 2 · 온천·휴양')).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 아산/온양')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전주 +1 이미지 목록 펼치기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '전주 +1 이미지 목록 펼치기' }))
    expect(screen.getByRole('group', { name: '선택한 테마 이미지 목록' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '전주 이미지로 크게 보기' }))

    expect(screen.getByRole('img', { name: '전주 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 전주')).toBeInTheDocument()
    expect(screen.getByText('2 / 2 · 미식·노포')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '아산/온양 +1 이미지 목록 펼치기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /자연·트레킹/ }))

    expect(screen.getByText('1 / 3 · 온천·휴양')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전주 +2 이미지 목록 펼치기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '전주 +2 이미지 목록 펼치기' }))

    expect(screen.getAllByRole('button', { name: /이미지로 크게 보기/ })).toHaveLength(2)
    expect(screen.getByRole('img', { name: '제주 썸네일 이미지' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '제주 이미지로 크게 보기' }))

    expect(screen.getByRole('img', { name: '제주 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('3 / 3 · 자연·트레킹')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '아산/온양 +2 이미지 목록 펼치기' })).toBeInTheDocument()
    expect(screen.getByText('오늘의 취향 여정')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '온천·휴양 · 미식·노포 · 자연·트레킹' })).toBeInTheDocument()
  })

  it('skips onboarding for returning users and opens the chat workspace without a map', () => {
    seedUser()
    seedPreference('제주 · 닛코')
    renderApp()

    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    ;['#자연'].forEach((tag) => {
      expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← 이전으로 돌아가기' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-workspace')).toHaveClass('space-y-5')
    expect(screen.getByTestId('chat-planner-summary')).toHaveClass('rounded-[18px]')
    expect(screen.getByTestId('chat-top-grid')).toHaveClass('grid-cols-[minmax(0,1.6fr)_minmax(360px,0.74fr)]')
    expect(screen.getByRole('region', { name: 'Planner State' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-conversation-panel')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'AI 일정 결과' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '생성된 일정 요약' })).not.toBeInTheDocument()
    expect(screen.getByText('여행 기간을 고른 뒤 해당 소도시의 동선 단서를 기준으로 일정 초안이 여기에 표시됩니다.')).toBeInTheDocument()
    expect(screen.queryByText('자연·트레킹 1일 초안')).not.toBeInTheDocument()
    expect(screen.queryByText('일정 다시짜기')).not.toBeInTheDocument()
    expect(screen.queryByText('마이페이지에 저장')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여행 지도' })).not.toBeInTheDocument()
    expect(screen.queryByText('제주 · 닛코 기반 지도')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '← 이전으로 돌아가기' }))

    expect(screen.getByRole('heading', { name: '당신이 몰랐던 소도시의 숨은 매력' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'AI 일정 챗봇' })).not.toBeInTheDocument()
  })

  it('maps legacy Japan-first stored preference to the Korea-first display order', () => {
    seedUser()
    seedLegacyPreference('오키나와 · 제주')
    renderApp()

    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    ;['#바다'].forEach((tag) => {
      expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
    })
  })

  it('asks whether to include festivals when the chat starts', async () => {
    seedUser()
    seedPreference('전주 · 오사카')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })
    const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
    const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

    expect(within(chatLog).queryByText('축제 테마를 일정에 포함할까요?')).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '축제 제외' })).not.toBeInTheDocument()
    expect(within(chatLog).getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '1박 2일' })).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    // Pick the travel month before entering free-text conditions.
    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '1박 2일' })).not.toBeInTheDocument()
    expect(input).not.toBeDisabled()
    expect(screen.queryByRole('region', { name: '생성된 일정 요약' })).not.toBeInTheDocument()
    expect(screen.getByText('동행, 관심사, 걷는 정도를 자연어로 입력해 주세요.')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '시장과 노포 중심으로 덜 걷고 싶어요' } })
    fireEvent.click(sendButton)

    await screen.findByRole('region', { name: '생성된 일정 요약' })
    expect(screen.getByRole('heading', { name: '미식·노포 1박 2일 초안' })).toBeInTheDocument()
    expect(screen.queryByText('축제 포함 반영')).not.toBeInTheDocument()
    expect(screen.getByLabelText('조건 해석 결과')).toHaveTextContent('미식·노포')
    expect(screen.getByRole('button', { name: '일정 다시짜기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '마이페이지에 저장' })).toBeInTheDocument()
  })

  it('turns a chat message into an assistant response and updated itinerary detail', async () => {
    seedUser()
    seedPreference('강릉 · 가나자와')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
    const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

    expect(sendButton).toBeDisabled()
    expect(input).toBeDisabled()

    fireEvent.change(input, { target: { value: '2박 3일, 전시랑 편집숍 위주로 덜 걷고 싶어요' } })
    expect(sendButton).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '2박 3일' }))

    // Pick the travel month before free-text conditions.
    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    expect(input).not.toBeDisabled()
    fireEvent.change(input, { target: { value: '전시랑 편집숍 위주로 덜 걷고 싶어요' } })
    expect(sendButton).not.toBeDisabled()
    fireEvent.click(sendButton)
    expect(input).toHaveValue('')
    expect(screen.getByText('전시랑 편집숍 위주로 덜 걷고 싶어요')).toBeInTheDocument()
    await screen.findByText('추천 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.')
    expect(screen.getByRole('heading', { name: '예술·감성 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.queryByText('덜 걷는 일정')).toBeNull()
    expect(screen.getByText(/전시와 편집숍 사이 이동을 줄이는 쪽/)).toBeInTheDocument()
  })

  it('submits a duration guide chip without storing the full chat transcript', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    // Pick the travel month before free-text conditions.
    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).getAllByText('1박 2일')[0]).toBeInTheDocument()
    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '온천·휴양 1박 2일 초안' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: '여행 조건 입력' }), {
      target: { value: '온천 숙소에서 천천히 쉬고 싶어요' },
    })
    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }))
    await screen.findByRole('heading', { name: '온천·휴양 1박 2일 초안' })
    expect(localStorage.getItem('lovv.chat')).toBeNull()
    expect(localStorage.getItem('lovv.messages')).toBeNull()
  })

  it('accepts guided duration chips from day trip through two nights three days', async () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    const expectedDurations = [
      ['당일치기', '역사·전통 당일치기 초안'],
      ['2박 3일', '역사·전통 2박 3일 초안'],
    ] as const

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    for (let index = 0; index < expectedDurations.length; index++) {
      const [duration, heading] = expectedDurations[index]
      await completeGuidedPlanner({
        duration,
        query: '역사 골목 산책 위주로 여유 있게 보고 싶어요',
      })
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      if (index < expectedDurations.length - 1) {
        fireEvent.click(screen.getByRole('button', { name: '일정 다시짜기' }))
      }
    }
    expect(screen.getByText('3일 구성')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '일차별 일정 요약' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '1일차' })).not.toBeInTheDocument()
    expect(screen.getByText('3일차 추천 일정')).toBeInTheDocument()
    expect(screen.getByText('총 9개 코스')).toBeInTheDocument()
    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    ;['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일'].forEach((duration) => {
      expect(within(chatLog).queryByRole('button', { name: duration })).not.toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('추가로 원하는 조건을 입력해 주세요')).toBeInTheDocument()
  })

  it('renders API-response plan draft when requestCreateRecommendation succeeds', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    vi.mocked(requestCreateRecommendation).mockResolvedValue({
      itinerary: {
        tripType: '2d1n',
        title: '아산 온천 힐링 여행',
        summary: 'API에서 받은 온천 일정 요약입니다.',
        durationLabel: '1박 2일',
        days: [
          {
            day: 1,
            title: '1일차 온천 힐링',
            summary: '온천과 휴식',
            items: [
              { itemId: 'i1', sortOrder: 1, timeOfDay: 'morning', title: '신정호 관광지', body: '아름다운 호수 산책', reason: '온천 테마', moveMinutes: 10 },
              { itemId: 'i2', sortOrder: 2, timeOfDay: 'afternoon', title: '아산 온천', body: '온천욕으로 피로 해소', reason: '힐링 테마', moveMinutes: 15 },
              { itemId: 'i3', sortOrder: 3, timeOfDay: 'evening', title: '외암민속마을', body: '전통 마을 산책', reason: '문화 체험', moveMinutes: 20 },
            ],
          },
          {
            day: 2,
            title: '2일차 문화 탐방',
            summary: '역사와 자연',
            items: [
              { itemId: 'i4', sortOrder: 1, timeOfDay: 'morning', title: '현충사', body: '이순신 장군 기념관', reason: '역사 테마', moveMinutes: 12 },
              { itemId: 'i5', sortOrder: 2, timeOfDay: 'afternoon', title: '파라다이스 스파 도고', body: '온천 스파', reason: '힐링 테마', moveMinutes: 8 },
              { itemId: 'i6', sortOrder: 3, timeOfDay: 'evening', title: '온양전통시장', body: '로컬 시장 탐방', reason: '미식 테마', moveMinutes: 5 },
            ],
          },
        ],
      },
    })
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '온천 위주로 쉬고 싶어요',
    })

    expect(requestCreateRecommendation).toHaveBeenCalledTimes(1)
    expect(requestCreateRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({ entryType: 'chat', tripType: '2d1n' }),
    )
    // API 응답 기반 채팅 메시지 확인
    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })
    expect(within(chatLog).getByText(/API에서 받은 온천 일정 요약입니다/)).toBeInTheDocument()
    expect(screen.getByText('2일 구성')).toBeInTheDocument()
    expect(screen.getByText('총 6개 코스')).toBeInTheDocument()

    // API 응답 기반 일정 초안 확인 (fallback local stops 아님)
    fireEvent.click(screen.getByRole('button', { name: '세부 일정 보기' }))
    expect(screen.getByText('신정호 관광지')).toBeInTheDocument()
    expect(screen.getByText('아산 온천')).toBeInTheDocument()
    // 현충사 is a day-2 stop — now behind the 2일차 tab instead of one long scroll.
    expect(screen.queryByText('현충사')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: '2일차' }))
    expect(screen.getByText('현충사')).toBeInTheDocument()
  })

  it('saves and likes a generated itinerary without duplicate mock storage records', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    await completeGuidedPlanner({
      duration: '2박 3일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })

    expect(screen.getByRole('heading', { name: '온천·휴양 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '세부 일정 보기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '좋아요' }))

    expect(screen.getByRole('button', { name: '좋아요 취소' })).toBeInTheDocument()
    expect(Object.values(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}'))).toEqual(['like'])
    expect(localStorage.getItem('lovv.likedPlanIds')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    expect(screen.getByRole('button', { name: '마이페이지에 저장됨' })).toBeInTheDocument()
    expect(screen.getByText('마이페이지에서 다시 확인할 수 있어요.')).toBeInTheDocument()

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')

    expect(savedPlans).toHaveLength(1)
    expect(savedPlans[0].days).toHaveLength(3)
    expect(savedPlans[0].stops).toHaveLength(9)
    expect(savedPlans[0]).toMatchObject({
      ownerId: 'mock-google-user',
      title: '온천·휴양 2박 3일 초안',
      cityPair: '온천·휴양',
      durationLabel: '2박 3일',
      festivalThemeLabel: '축제 미정',
      themeTag: '온천·휴양',
      themeLabels: ['온천·휴양'],
      conditionSummary: expect.stringContaining('온천·휴양'),
    })

    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장됨' }))

    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '일정 다시짜기' }))

    expect(screen.queryByRole('heading', { name: '온천·휴양 2박 3일 초안' })).not.toBeInTheDocument()
    expect(screen.getByText('여행 기간을 고른 뒤 해당 소도시의 동선 단서를 기준으로 일정 초안이 여기에 표시됩니다.')).toBeInTheDocument()
  })

  it('opens a generated itinerary detail view and preserves like/save actions when returning to chat', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    await completeGuidedPlanner({
      duration: '2박 3일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    // Click "좋아요" on the chat workspace first
    fireEvent.click(screen.getByRole('button', { name: '좋아요' }))
    fireEvent.click(screen.getByRole('button', { name: '세부 일정 보기' }))

    expect(window.location.pathname).toMatch(/^\/plans\/.+/)
    const detailView = screen.getByRole('region', { name: '세부 일정 상세' })

    expect(within(detailView).getByRole('heading', { name: '온천·휴양 2박 3일 초안' })).toBeInTheDocument()
    expect(within(detailView).getByText('온천·휴양')).toBeInTheDocument()
    expect(within(detailView).getByText('2박 3일')).toBeInTheDocument()
    expect(within(detailView).queryByText('축제 포함')).not.toBeInTheDocument()
    expect(within(detailView).getByText('덜 걷는 일정')).toBeInTheDocument()
    // Day 1 is shown by default; days 2-3 live behind day tabs (no long scroll).
    expect(within(detailView).getByText('1일차 추천 일정')).toBeInTheDocument()
    expect(within(detailView).getByText('가볍게 도착하고 가까운 동네부터 보기')).toBeInTheDocument()
    expect(within(detailView).getByText('취향에 맞는 핵심 장소 둘러보기')).toBeInTheDocument()
    expect(within(detailView).getByText('무리하지 않는 마무리 동선')).toBeInTheDocument()
    expect(within(detailView).getAllByText('추천 이유')).toHaveLength(3)
    expect(within(detailView).getAllByText('다음 장소까지 12분').length).toBeGreaterThanOrEqual(1)
    expect(within(detailView).queryByText('2일차 추천 일정')).not.toBeInTheDocument()
    expect(within(detailView).queryByText('3일차 추천 일정')).not.toBeInTheDocument()

    fireEvent.click(within(detailView).getByRole('tab', { name: '2일차' }))
    expect(within(detailView).getByText('2일차 추천 일정')).toBeInTheDocument()
    fireEvent.click(within(detailView).getByRole('tab', { name: '3일차' }))
    expect(within(detailView).getByText('3일차 추천 일정')).toBeInTheDocument()
    fireEvent.click(within(detailView).getByRole('tab', { name: '1일차' }))

    // PlanDetailView does not have "좋아요" button anymore
    expect(within(detailView).queryByRole('button', { name: '좋아요' })).toBeNull()
    expect(within(detailView).queryByRole('button', { name: '좋아요 선택됨' })).toBeNull()

    fireEvent.click(within(detailView).getByRole('button', { name: '마이페이지에 저장' }))

    expect(within(detailView).getByRole('button', { name: '마이페이지에 저장됨' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).toEqual(
      expect.objectContaining({
        [decodeURIComponent(window.location.pathname.replace('/plans/', ''))]: 'like',
      }),
    )
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)

    fireEvent.click(within(detailView).getByRole('button', { name: '채팅으로 돌아가기' }))

    expect(window.location.pathname).toBe('/planner')
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '온천·휴양 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '좋아요 취소' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '마이페이지에 저장됨' })).toBeInTheDocument()
  })

  it('renders a saved plan from a direct plan detail route and redirects missing plans', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    const plannerApp = renderApp('/planner')

    await completeGuidedPlanner({
      duration: '2박 3일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanId = savedPlans[0]?.id

    expect(savedPlanId).toEqual(expect.any(String))
    plannerApp.unmount()

    const savedPlanApp = renderApp(`/plans/${savedPlanId}`)

    expect(screen.getByRole('region', { name: '세부 일정 상세' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '온천·휴양 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '마이페이지에 저장됨' })).toBeInTheDocument()
    savedPlanApp.unmount()

    renderApp('/plans/missing-plan')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/planner')
    })
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
  })

  it('shows saved itinerary share action in My Page and keeps detail likes hidden', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp('/planner')

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanId = savedPlans[0]?.id

    expect(savedPlanId).toEqual(expect.any(String))

    openMyPageFromSessionMenu()

    const savedPlanList = screen.getByRole('list', { name: '저장 일정 목록' })
    const savedPlanCard = within(savedPlanList).getByText('온천·휴양 1박 2일 초안').closest('li')

    expect(savedPlanCard).not.toBeNull()
    expect(within(savedPlanCard!).queryByText(/현재 좋아요/)).not.toBeInTheDocument()
    expect(within(savedPlanCard!).queryByText('없음')).not.toBeInTheDocument()
    expect(within(savedPlanCard!).getByRole('button', { name: '공유하기' })).toBeInTheDocument()
    expect(within(savedPlanCard!).queryByRole('button', { name: '좋아요' })).not.toBeInTheDocument()
    expect(within(savedPlanCard!).queryByRole('button', { name: '싫어요' })).not.toBeInTheDocument()

    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).not.toHaveProperty(savedPlanId)

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '상세 보기' }))

    expect(window.location.pathname).toBe(`/plans/${encodeURIComponent(savedPlanId)}`)
    const detailView = screen.getByRole('region', { name: '세부 일정 상세' })

    expect(within(detailView).queryByRole('button', { name: '좋아요' })).toBeNull()
    expect(within(detailView).queryByRole('button', { name: '좋아요 선택됨' })).toBeNull()
    expect(within(detailView).queryByRole('button', { name: '싫어요' })).toBeNull()
  })

  it('keeps a saved itinerary when My Page deletion is not confirmed', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    vi.stubGlobal('confirm', vi.fn(() => false))
    renderApp('/planner')

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanTitle = savedPlans[0]?.title

    openMyPageFromSessionMenu()

    const savedPlanList = screen.getByRole('list', { name: '저장 일정 목록' })
    const savedPlanCard = within(savedPlanList).getByText(savedPlanTitle).closest('li')

    expect(savedPlanCard).not.toBeNull()
    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: `${savedPlanTitle} 삭제` }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining(savedPlanTitle))
    expect(screen.getByText(savedPlanTitle)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)
  })

  it('deletes a saved itinerary from My Page and clears like storage', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderApp('/planner')

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanId = savedPlans[0]?.id

    expect(savedPlanId).toEqual(expect.any(String))

    openMyPageFromSessionMenu()

    const savedPlanList = screen.getByRole('list', { name: '저장 일정 목록' })
    const savedPlanCard = within(savedPlanList).getByText('온천·휴양 1박 2일 초안').closest('li')

    expect(savedPlanCard).not.toBeNull()
    localStorage.setItem('lovv.savedPlanLikes', JSON.stringify({ [savedPlanId]: 'like' }))

    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).toMatchObject({
      [savedPlanId]: 'like',
    })
    expect(localStorage.getItem('lovv.likedPlanIds')).toBeNull()

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '온천·휴양 1박 2일 초안 삭제' }))

    expect(screen.getByText('저장한 일정이 삭제됐어요.')).toBeInTheDocument()
    expect(screen.getByText('저장한 일정이 아직 없습니다.')).toBeInTheDocument()
    const savedPlanStat = screen.getByText('저장 일정').closest('article')
    expect(savedPlanStat).not.toBeNull()
    expect(within(savedPlanStat!).getByText('아직 없음')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).not.toHaveProperty(savedPlanId)
    expect(localStorage.getItem('lovv.likedPlanIds')).toBeNull()
  })

  it('calls the backend saved itinerary delete API once and disables repeated deletion while pending', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.stubGlobal('confirm', vi.fn(() => true))
    const deleteRequest = createDeferred<boolean>()
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestCreateSavedPlan).mockResolvedValue({
      itineraryId: 'server-plan-1',
      sourceRecommendationId: 'draft-plan-1',
      savedAt: '2026-06-13T00:00:00Z',
      duplicate: false,
    })
    vi.mocked(requestDeleteSavedPlan).mockReturnValue(deleteRequest.promise)

    renderApp('/planner')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    })

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '전통 골목을 여유롭게 보고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    await waitFor(() => {
      expect(requestCreateSavedPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceRecommendationId: expect.any(String),
          idempotencyKey: expect.any(String),
          title: expect.any(String),
          destination: expect.objectContaining({
            destinationId: expect.any(String),
          }),
          durationLabel: '1박 2일',
          itinerary: expect.objectContaining({
            days: expect.any(Array),
          }),
        }),
        { accessToken: 'restored-access-token' },
      )
    })

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanId = savedPlans[0]?.id
    const savedPlanTitle = savedPlans[0]?.title

    expect(savedPlanId).toBe('server-plan-1')
    expect(savedPlans[0]?.sourceRecommendationId).toEqual(expect.any(String))
    expect(savedPlanTitle).toEqual(expect.any(String))

    openMyPageFromSessionMenu()

    const savedPlanList = screen.getByRole('list', { name: '저장 일정 목록' })
    const savedPlanCard = within(savedPlanList).getByText(savedPlanTitle).closest('li')

    expect(savedPlanCard).not.toBeNull()

    const deleteButton = within(savedPlanCard!).getByRole('button', { name: `${savedPlanTitle} 삭제` })

    fireEvent.click(deleteButton)
    fireEvent.click(deleteButton)

    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveTextContent('삭제 중')

    // The delete call now runs through useMutation, which defers the mutationFn call by a
    // microtask (it always hits an internal await before calling mutationFn, even with no
    // onMutate configured), so the call-count assertion needs a tick to settle.
    await waitFor(() => {
      expect(requestDeleteSavedPlan).toHaveBeenCalledTimes(1)
    })

    deleteRequest.resolve(true)

    await waitFor(() => {
      expect(requestDeleteSavedPlan).toHaveBeenCalledWith('server-plan-1', {
        accessToken: 'restored-access-token',
      })
    })
    await waitFor(() => {
      expect(screen.getByText('저장한 일정이 아직 없습니다.')).toBeInTheDocument()
    })

    expect(screen.getByText('저장한 일정이 삭제됐어요.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(0)
  })

  it('shows My Page share action without calling backend saved itinerary like APIs in API mode', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({
      savedPlans: [{ ...serverSavedPlan, isLiked: false }],
      likes: {},
    })
    vi.mocked(requestLikeSavedPlan).mockResolvedValue(true)
    vi.mocked(requestUnlikeSavedPlan).mockResolvedValue(true)

    renderApp('/mypage')

    await waitFor(() => {
      expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: '공유하기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '좋아요' })).not.toBeInTheDocument()
    expect(requestLikeSavedPlan).not.toHaveBeenCalled()
    expect(requestUnlikeSavedPlan).not.toHaveBeenCalled()
  })

  it('publishes a private saved itinerary before sharing from My Page', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.stubGlobal('confirm', vi.fn(() => true))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
      share: undefined,
    })
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({
      savedPlans: [{ ...serverSavedPlan, isPublic: false }],
      likes: {},
    })
    vi.mocked(requestUpdateSavedPlanShareStatus).mockResolvedValue({
      ...serverSavedPlan,
      isPublic: true,
    })

    renderApp('/mypage')

    await waitFor(() => {
      expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '공유하기' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('공개 일정으로 전환해야 합니다'))
    await waitFor(() => {
      expect(requestUpdateSavedPlanShareStatus).toHaveBeenCalledWith('server-plan-1', true, {
        accessToken: 'restored-access-token',
      })
    })
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/plans/server-plan-1`)
    })
    expect(screen.getByText('공유 링크를 준비했어요.')).toBeInTheDocument()
  })

  it('keeps a private saved itinerary unshared when publish confirmation is cancelled', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.stubGlobal('confirm', vi.fn(() => false))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
      share: undefined,
    })
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({
      savedPlans: [{ ...serverSavedPlan, isPublic: false }],
      likes: {},
    })

    renderApp('/mypage')

    await waitFor(() => {
      expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '공유하기' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('공개 일정으로 전환해야 합니다'))
    expect(requestUpdateSavedPlanShareStatus).not.toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('keeps saved itinerary share action independent from API-mode like failures', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({
      savedPlans: [{ ...serverSavedPlan, isLiked: false }],
      likes: {},
    })
    vi.mocked(requestLikeSavedPlan).mockRejectedValue(new Error('like failed'))

    renderApp('/mypage')

    await waitFor(() => {
      expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: '공유하기' })).toBeInTheDocument()
    expect(screen.queryByText('좋아요를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')).not.toBeInTheDocument()
    expect(requestLikeSavedPlan).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).toEqual({})
  })

  it('keeps a saved itinerary visible when API-mode backend deletion fails', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestCreateSavedPlan).mockResolvedValue({
      itineraryId: 'server-plan-1',
      sourceRecommendationId: 'draft-plan-1',
      savedAt: '2026-06-13T00:00:00Z',
      duplicate: false,
    })
    vi.mocked(requestDeleteSavedPlan).mockRejectedValue(new Error('delete failed'))

    renderApp('/planner')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    })

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '전통 골목을 여유롭게 보고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    await waitFor(() => {
      expect(requestCreateSavedPlan).toHaveBeenCalled()
    })

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanId = savedPlans[0]?.id
    const savedPlanTitle = savedPlans[0]?.title

    expect(savedPlanId).toBe('server-plan-1')

    openMyPageFromSessionMenu()

    const savedPlanList = screen.getByRole('list', { name: '저장 일정 목록' })
    const savedPlanCard = within(savedPlanList).getByText(savedPlanTitle).closest('li')

    expect(savedPlanCard).not.toBeNull()

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: `${savedPlanTitle} 삭제` }))

    await waitFor(() => {
      expect(requestDeleteSavedPlan).toHaveBeenCalledWith('server-plan-1', {
        accessToken: 'restored-access-token',
      })
    })
    await waitFor(() => {
      expect(screen.getByText('저장 일정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument()
    })

    expect(screen.getByText(savedPlanTitle)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)
  })

  it('deletes a saved itinerary from detail and returns safely to My Page', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderApp('/planner')

    await completeGuidedPlanner({
      duration: '1박 2일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))
    fireEvent.click(screen.getByRole('button', { name: '세부 일정 보기' }))

    const savedPlans = JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')
    const savedPlanId = savedPlans[0]?.id
    const detailView = screen.getByRole('region', { name: '세부 일정 상세' })

    expect(savedPlanId).toEqual(expect.any(String))
    expect(within(detailView).getByRole('button', { name: '저장 일정 삭제' })).toBeInTheDocument()

    fireEvent.click(within(detailView).getByRole('button', { name: '저장 일정 삭제' }))

    expect(window.location.pathname).toBe('/mypage')
    expect(screen.getByText('저장한 일정이 삭제됐어요.')).toBeInTheDocument()
    expect(screen.getByText('저장한 일정이 아직 없습니다.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}')).not.toHaveProperty(savedPlanId)
    expect(localStorage.getItem('lovv.likedPlanIds')).toBeNull()
  })

  it('ignores invalid saved and liked plan storage when using generated plan actions', async () => {
    seedUser()
    seedPreference('제주 · 닛코')
    localStorage.setItem('lovv.savedPlans', '{broken')
    localStorage.setItem('lovv.likedPlanIds', '{"bad":true}')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    await completeGuidedPlanner({
      duration: '당일치기',
      query: '숲길과 자연을 보고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '좋아요' }))
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    expect(Object.values(JSON.parse(localStorage.getItem('lovv.savedPlanLikes') ?? '{}'))).toEqual(['like'])
    expect(localStorage.getItem('lovv.likedPlanIds')).toBeNull()
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)
  })

  it('logs out to the signup gate without removing the selected preference', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    signOutFromSessionMenu()

    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expectStoredThemeIds(['history_tradition'])
    expect(screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByText('경주 · 교토 감성으로 시작합니다')).not.toBeInTheDocument()
  })

  it('calls backend logout before clearing API auth state', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestAuthLogout).mockResolvedValue(true)

    renderApp('/home')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '현재 세션: Google 메뉴 열기' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '현재 세션: Google 메뉴 열기' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '로그아웃' }))

    await waitFor(() => {
      expect(requestAuthLogout).toHaveBeenCalledWith({ accessToken: 'restored-access-token' })
    })
    expect(localStorage.getItem(authStorageKey)).toBeNull()
    await waitFor(() => {
      expect(screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toBeInTheDocument()
    })
  })

  it('hydrates the planner active profile from the restored session when sessionStorage is empty', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({ savedPlans: [], likes: {} })

    expect(sessionStorage.getItem('lovv.planner_active_profile')).toBeNull()

    renderApp('/auth')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/home')
    })

    // The server profile (history_tradition) must overwrite the local default and
    // be persisted to sessionStorage so reloads keep the restored preference.
    await waitFor(() => {
      const stored = sessionStorage.getItem('lovv.planner_active_profile')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored ?? '{}')).toMatchObject({
        version: 2,
        countryTrack: 'KR',
        selectedThemeIds: ['history_tradition'],
        source: 'onboarding',
      })
    })
    expect(JSON.parse(localStorage.getItem(preferenceStorageKey) ?? '{}')).toMatchObject({
      selectedThemeIds: ['history_tradition'],
    })
  })

  it('submits the selected gender through the profile update API from My Page', async () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    vi.mocked(requestUpdateProfile).mockResolvedValue(restoredGoogleAuthState)

    renderApp('/mypage')

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '남' }))
    expect(screen.getByRole('button', { name: '남' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(requestUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ gender: '남' }),
        expect.anything(),
      )
    })
    expect(await screen.findByText('프로필이 저장되었어요.')).toBeInTheDocument()
  })

  it('exposes WAI-ARIA tab semantics on the saved-plan day tabs', async () => {
    vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
    vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
    vi.mocked(requestListSavedPlans).mockResolvedValue({ savedPlans: [], likes: {} })
    vi.mocked(requestGetSavedPlan).mockResolvedValue(serverSavedPlan)

    renderApp('/plans/server-plan-1')

    await waitFor(() => {
      expect(screen.getByText('서버 저장 일정')).toBeInTheDocument()
    })

    const tab = screen.getByRole('tab')
    expect(tab).toHaveAttribute('id', 'day-tab-1')
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(tab).toHaveAttribute('aria-controls', 'day-panel-1')

    const tabPanel = screen.getByRole('tabpanel')
    expect(tabPanel).toHaveAttribute('id', 'day-panel-1')
    expect(tabPanel).toHaveAttribute('aria-labelledby', 'day-tab-1')
  })
})
