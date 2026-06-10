import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  createSmallCityMapMarkers,
  smallCities,
  smallCityCounts,
  smallCityPlaceCategories,
} from './data/smallCities'

const authStorageKey = 'lovv.auth.user'
const preferenceStorageKey = 'lovv.preference'

const renderApp = (path = '/') => {
  window.history.replaceState(null, '', path)

  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  )
}

const themeIdsByCityPair: Record<string, string> = {
  '아산/온양 · 벳푸': 'hot_spring_rest',
  '부산 · 오키나와': 'sea_coast',
  '경주 · 교토': 'history_tradition',
  '전주 · 오사카': 'food_local',
  '제주 · 닛코': 'nature_trekking',
  '강릉 · 가나자와': 'art_emotion',
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
      selectedThemeIds: [themeIdsByCityPair[cityPair] ?? 'hot_spring_rest'],
      source: 'onboarding',
      updatedAt: '2026-06-05T00:00:00.000Z',
    }),
  )
}

const seedLegacyPreference = (cityPair = '아산/온양 · 벳푸') => {
  localStorage.setItem(preferenceStorageKey, JSON.stringify({ cityPair }))
}

const readPreferenceProfile = () => JSON.parse(localStorage.getItem(preferenceStorageKey) ?? '{}')

const expectStoredThemeIds = (themeIds: string[]) => {
  expect(readPreferenceProfile()).toMatchObject({
    version: 2,
    selectedThemeIds: themeIds,
  })
}

const openSessionMenu = () => {
  const sessionMenuButton = screen.getByRole('button', {
    name: '현재 세션: Google mock 메뉴 열기',
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

const completeGuidedPlanner = ({
  festival = '축제 제외',
  duration = '1박 2일',
  query = '동행 없이 여유롭게 덜 걷고 싶어요',
}: {
  festival?: '축제 포함' | '축제 제외'
  duration?: '당일치기' | '1박 2일' | '2박 3일' | '3박 4일' | '4박 5일'
  query?: string
} = {}) => {
  fireEvent.click(screen.getByRole('button', { name: festival }))
  fireEvent.click(screen.getByRole('button', { name: duration }))

  const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
  const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

  fireEvent.change(input, { target: { value: query } })
  fireEvent.click(sendButton)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('MVP main entry screen', () => {
  it('shows social mock signup before onboarding on first entry', () => {
    renderApp('/auth')

    expect(screen.getByRole('heading', { name: '서울/오사카 말고, 지금은 이곳' })).toBeInTheDocument()
    expect(screen.getByText('회원가입하고 Lovv 시작하기')).toBeInTheDocument()
    expect(screen.queryByText(/저장한 취향과 여행 일정/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kakao 간편 로그인으로 시작하기' })).toBeInTheDocument()
    expect(screen.getByText(/OAuth API 없이 mock session만 저장합니다/)).toBeInTheDocument()
    expect(screen.queryByText('MVP mock session')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByText('Next step')).not.toBeInTheDocument()
    expect(screen.queryByText(/회원가입 후 여행의 분위기/)).not.toBeInTheDocument()
    expect(screen.getByTestId('auth-fixed-panel')).toHaveClass('border-r')
    expect(screen.getByTestId('auth-fixed-panel')).toHaveClass('lovv-auth-left-panel')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('lovv-auth-story-panel')
    expect(screen.queryByRole('img', { name: '손을 흔드는 오렌지색 캐리어 캐릭터' })).not.toBeInTheDocument()
    expect(screen.getByText('지금은 이곳')).toHaveClass('text-[#F36B12]')
    expect(screen.getByRole('link', { name: '문의하기' })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Google User')
    expect(localStorage.getItem(authStorageKey)).toContain('google')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
  })

  it('starts onboarding through Kakao mock signup without an API call', () => {
    renderApp('/auth')

    fireEvent.click(screen.getByRole('button', { name: 'Kakao 간편 로그인으로 시작하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Kakao User')
    expect(localStorage.getItem(authStorageKey)).toContain('kakao')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: '현재 세션: Google mock 메뉴 열기' })).toBeInTheDocument()
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
    const proofHeading = screen.getByText('처음엔 작게, 추천은 명확하게')
    const proofSummaryPanel = screen.getByTestId('proof-summary-panel')
    const recommendationBasis = screen.getByRole('list', { name: '추천 근거 해시태그' })
    const monthlyHeading = screen.getByRole('heading', { name: '이번 달 추천 소도시' })

    expect(proofSummaryPanel).toHaveClass('border')
    expect(proofSummaryPanel).toHaveClass('border-transparent')
    expect(screen.getByText(/선택한 기준 테마를 먼저 보고/)).toBeInTheDocument()
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

    expect(monthlyGrid).toHaveClass('grid-cols-4')
    expect(within(monthlyGrid).getAllByRole('button')).toHaveLength(5)
    ;[
      '아산/온양 · 벳푸 이달 추천 상세 보기',
      '부산 · 오키나와 이달 추천 상세 보기',
      '경주 · 교토 이달 추천 상세 보기',
      '전주 · 오사카 이달 추천 상세 보기',
      '강릉 · 가나자와 이달 추천 상세 보기',
    ].forEach((buttonName) => {
      expect(within(monthlyGrid).getByRole('button', { name: buttonName })).toBeInTheDocument()
    })
    expect(screen.queryByTestId('city-map-discovery-section')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '빠른 이동 메뉴 열기' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '여행지 찾아보기' })).toHaveAttribute('href', '/map')
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveAttribute('href', '/planner')
    expect(screen.getByText('처음엔 작게, 추천은 명확하게')).toBeInTheDocument()
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
    expect(screen.getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
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
    expect(screen.getByRole('heading', { name: '서울/오사카 말고, 지금은 이곳' })).toBeInTheDocument()
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
  })

  it('opens monthly recommendation detail before starting the planner', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: '부산 · 오키나와 이달 추천 상세 보기' }))

    expectStoredThemeIds(['hot_spring_rest'])
    expect(screen.getByRole('heading', { name: '바다색이 선명한 해안 휴식' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '이 테마를 추천하는 기준' })).toBeInTheDocument()
    expect(screen.getByText('부산 · 오키나와')).toBeInTheDocument()
    expect(screen.getByText('해운대 · 광안리 · 에메랄드 바다')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'AI 일정 챗봇' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '이 테마로 일정 계획하기' }))

    expectStoredThemeIds(['hot_spring_rest'])
    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByText(/바다·해안 기준 테마로 축제 포함 여부/)).toBeInTheDocument()
    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('바다·해안 기준 테마')
    expect(screen.queryByRole('heading', { name: '소도시 지도 프리뷰' })).not.toBeInTheDocument()
  })

  it('renders the small-city map fixture corpus and country switcher', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    expect(window.location.pathname).toBe('/map')
    expect(smallCityCounts.KR).toBe(40)
    expect(smallCityCounts.JP).toBe(6)
    expect(smallCities).toHaveLength(46)
    const koreanCityNames = smallCities
      .filter((city) => city.country === 'KR')
      .map((city) => city.nameKo)
    expect(new Set(koreanCityNames).size).toBe(40)
    expect(
      smallCities
        .filter((city) => city.country === 'JP')
        .every((city) => ['이바라키', '도치기', '군마', '사이타마', '치바', '가나가와'].includes(city.region)),
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
    expect(layoutShell.className).toContain('grid-cols-[minmax(0,2fr)_minmax(440px,0.52fr)]')
    expect(layoutShell.className).toContain('xl:h-[min(900px,calc(100vh-72px))]')
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
    expect(within(cityMapSection).getByText('일본 6곳 / 전체 6곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '6')
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button')).toHaveLength(6)

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '한국' }))

    expect(within(cityMapSection).getByRole('button', { name: '한국' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(cityMapSection).getByText('한국 40곳 / 전체 40곳')).toBeInTheDocument()
    expect(within(cityMapSection).getByTestId('city-map-google-map')).toHaveAttribute('data-marker-count', '40')
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button')).toHaveLength(40)

    fireEvent.click(within(cityMapSection).getByRole('button', { name: '일본' }))

    expect(within(cityMapSection).getByRole('button', { name: '일본' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(cityMapSection).getByText('일본 6곳 / 전체 6곳')).toBeInTheDocument()
    expect(within(cityMapSection).queryByText(/내부 후보 데이터/)).not.toBeInTheDocument()
    expect(within(cityMapSection).queryByText(/Backend-ready/)).not.toBeInTheDocument()
    expect(within(screen.getByTestId('city-map-result-list')).queryByRole('button', { name: /오타루/ })).not.toBeInTheDocument()
    expect(within(screen.getByTestId('city-map-result-list')).getAllByRole('button', { name: /가마쿠라/ })).toHaveLength(1)
    expect(
      within(screen.getByTestId('city-map-result-list')).queryByRole('button', { name: /가마쿠라 공예/ }),
    ).not.toBeInTheDocument()

    fireEvent.change(within(cityMapSection).getByPlaceholderText('도시, 지역, 테마 검색'), {
      target: { value: '게곤폭포' },
    })

    expect(within(cityMapSection).getByText('일본 1곳 / 전체 6곳')).toBeInTheDocument()
    const filteredGoogleMap = within(cityMapSection).getByTestId('city-map-google-map')

    expect(filteredGoogleMap).toHaveAttribute('data-marker-count', '1')
    expect(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /닛코/ })).toBeInTheDocument()
    expect(within(screen.getByTestId('city-map-result-list')).queryByRole('button', { name: /닛코 시장/ })).not.toBeInTheDocument()

    fireEvent.click(within(filteredGoogleMap).getByRole('button', { name: '지도 마커: 닛코' }))

    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('닛코')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel').className).toContain('overflow-hidden')
    expect(within(cityMapSection).getByTestId('city-map-detail-sticky-content').className).toContain('overflow-y-auto')
    expect(within(cityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('게곤폭포')
    expect(filteredGoogleMap).toHaveAttribute('data-selected-city-id', 'jp-002')
    expect(within(cityMapSection).queryByTestId('city-map-list-detail-panel')).not.toBeInTheDocument()
    smallCityPlaceCategories.forEach((category) => {
      expect(within(cityMapSection).getAllByText(category).length).toBeGreaterThan(0)
    })
    expect(within(cityMapSection).getAllByRole('link', { name: 'Kakao 장소 보기' }).length).toBeGreaterThan(0)
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

    expect(japaneseMarkers).toHaveLength(6)
    expect(japaneseMarkers.every((marker) => marker.label.length > 0)).toBe(true)
    expect(japaneseMarkers.some((marker) => /\s(해안|온천|구시가|축제|공예|숲길|시장|산책)$/.test(marker.label))).toBe(false)
    expect(japaneseMarkers[0]).not.toHaveProperty('themes')
    expect(japaneseMarkers[0]).not.toHaveProperty('summary')
    expect(japaneseMarkers[0]).not.toHaveProperty('detail')
    expect(japaneseMarkers[0]).not.toHaveProperty('routeSeed')
  })

  it('filters small-city markers by search and theme with an empty state', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

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

  it('opens the AI planner from a selected map city without mutating the stored preference', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

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
    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('경주로 세부 일정을 짜고 싶어요.')
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '축제 제외' })).not.toBeInTheDocument()
    expect(screen.getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('여행 기간을 먼저 선택해 주세요')).toBeInTheDocument()
    expect(
      screen.getByText('여행 기간을 고른 뒤 해당 소도시의 동선 단서를 기준으로 일정 초안이 여기에 표시됩니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(screen.getByText(/경주 중심으로 1박 2일 흐름을 잡아볼게요/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByText(/경주 · 경북 1박 2일 초안/)).toBeInTheDocument()
    expect(screen.getByText(/선택한 소도시의 장소 단서와 여행 기간을 중심으로 구성합니다/)).toBeInTheDocument()
    expect(screen.queryByText('축제 제외 반영')).not.toBeInTheDocument()
    expect(screen.queryByText('축제 조건 없음 반영')).not.toBeInTheDocument()
    expect(screen.getByLabelText('조건 해석 결과')).toHaveTextContent('역사·전통')
    expect(screen.getByPlaceholderText('추가로 원하는 조건을 입력해 주세요')).toBeInTheDocument()
  })

  it('skips the selected-city festival prompt when only the city theme has a festival tag', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    const cityMapSection = screen.getByTestId('city-map-discovery-section')
    const searchInput = within(cityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')

    fireEvent.change(searchInput, { target: { value: '양양' } })
    fireEvent.click(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /양양/ }))
    fireEvent.click(
      within(within(cityMapSection).getByTestId('city-map-detail-panel')).getByRole('button', {
        name: '이 소도시로 AI 일정 짜기',
      }),
    )

    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('양양로 세부 일정을 짜고 싶어요.')
    expect(screen.queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(screen.getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
  })

  it('asks the selected-city festival prompt from real festival data and checks the travel month', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    renderApp('/map')

    const nextCityMapSection = screen.getByTestId('city-map-discovery-section')
    const nextSearchInput = within(nextCityMapSection).getByPlaceholderText('도시, 지역, 테마 검색')

    fireEvent.change(nextSearchInput, { target: { value: '진주' } })
    fireEvent.click(within(screen.getByTestId('city-map-result-list')).getByRole('button', { name: /진주/ }))
    expect(within(nextCityMapSection).getByTestId('city-map-detail-panel')).toHaveTextContent('진주남강유등축제')
    fireEvent.click(
      within(within(nextCityMapSection).getByTestId('city-map-detail-panel')).getByRole('button', {
        name: '이 소도시로 AI 일정 짜기',
      }),
    )

    expect(screen.getByRole('log', { name: 'AI 일정 대화' })).toHaveTextContent('진주로 세부 일정을 짜고 싶어요.')
    expect(screen.getByRole('button', { name: '축제 포함' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '축제 포함' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(screen.getByText('여행 예정 월을 골라주세요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('여행 예정 월을 먼저 선택해 주세요')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '6월' }))

    expect(screen.getByRole('heading', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByText(/선택한 기간에 맞는 축제는 없어 일반 코스로 구성합니다/)).toBeInTheDocument()
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
      name: '현재 세션: Google mock 메뉴 열기',
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
    expect(within(footer).getByText('© 2026 Lovv. All rights reserved.')).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: '이용약관' })).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: '개인정보처리방침' })).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: '문의하기' })).toBeInTheDocument()
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
    expect(screen.getByText('Google mock')).toBeInTheDocument()
    expect(screen.getAllByText('역사·전통').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/API 호출 없이 더미 사용자만 저장 중입니다/)).toBeInTheDocument()
    expect(screen.getByText('저장한 일정이 아직 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취향 다시 고르기' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: '← 이전으로 돌아가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메인으로 돌아가기' })).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: '취향 다시 고르기' }))

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
    fireEvent.click(screen.getByRole('button', { name: '취향 다시 고르기' }))
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
    expect(screen.getByText('바다·해안 기준 테마로 시작합니다.')).toBeInTheDocument()
    expect(screen.getByText('#바다')).toBeInTheDocument()
  })

  it('shows planner state header and updates schedule status after choices', () => {
    seedUser()
    seedPreference('제주 · 닛코')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const summary = screen.getByTestId('chat-planner-summary')

    expect(summary).toHaveClass('rounded-[18px]')
    expect(summary.querySelector('ol')).toHaveClass('grid-cols-3')
    expect(within(summary).getByText('취향 반영')).toBeInTheDocument()
    expect(within(summary).getByText('완료')).toBeInTheDocument()
    expect(within(summary).getByText('자연·트레킹 기준 테마로 시작합니다.')).toBeInTheDocument()
    expect(within(summary).getByText('#자연')).toBeInTheDocument()
    expect(within(summary).getByText('후보 탐색')).toBeInTheDocument()
    expect(within(summary).getByText('진행 중')).toBeInTheDocument()
    expect(within(summary).getByText('자연·트레킹')).toBeInTheDocument()
    expect(within(summary).getByText('일정 구성')).toBeInTheDocument()
    expect(within(summary).getByText('축제 포함 여부를 먼저 골라주세요.')).toBeInTheDocument()
    expect(within(summary).getByText('대기')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(within(summary).getByText('동행, 관심사, 걷는 정도를 자연어로 입력하면 초안이 완성됩니다.')).toBeInTheDocument()
    expect(within(summary).getByText('조건 입력 대기')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: '여행 조건 입력' }), {
      target: { value: '숲길 위주로 덜 걷고 싶어요' },
    })
    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(within(summary).getByText(/축제 제외 · 1박 2일 · 자연·트레킹/)).toBeInTheDocument()
    expect(within(summary).getByText('초안 준비')).toBeInTheDocument()
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

    expect(screen.getByRole('button', { name: '현재 세션: Google mock 메뉴 열기' })).toHaveClass('bg-[#F36B12]')
    expect(screen.getByRole('link', { name: '여행지 찾아보기' })).toHaveClass(
      'bg-[#B64A00]',
      'border-[#A92B10]',
      'text-white',
      'hover:bg-[#F36B12]',
    )
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveClass(
      'bg-white/90',
      'text-[#B64A00]',
      'hover:bg-[#FFF0E4]',
    )

    const recommendationBasis = screen.getByRole('list', { name: '추천 근거 해시태그' })

    expect(within(recommendationBasis).getAllByRole('listitem')).toHaveLength(2)
    expect(within(recommendationBasis).getByText('#온천')).toHaveClass(
      'rounded-[5px]',
      'bg-[#F36B12]',
      'border-[#A92B10]',
    )
    expect(within(recommendationBasis).getByText('#온천')).not.toHaveClass('rounded-full')
    expect(within(recommendationBasis).getByText('#휴양')).toHaveClass(
      'rounded-[5px]',
      'bg-[#FFF0E4]',
      'border-transparent',
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

  it('keeps dense text responsive on narrow screens', () => {
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
    expect(screen.getByText('축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.')).toHaveClass(
      'break-keep',
      'max-sm:text-[13px]',
    )

    completeGuidedPlanner({
      festival: '축제 제외',
      duration: '1박 2일',
      query: '숲길 위주로 덜 걷고 싶어요',
    })

    expect(screen.getByRole('heading', { name: '자연·트레킹 1박 2일 초안' })).toHaveClass(
      'break-keep',
      'max-sm:text-lg',
      'max-sm:leading-6',
    )
    expect(screen.getByText(/장소를 확정하기 전/)).toHaveClass('break-keep', 'max-sm:text-[13px]')
  })

  it('shows onboarding after signup before the main screen on first entry', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' }))

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).not.toBeInTheDocument()
    expect(screen.getByText('Lovv City Mood Journal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
    expect(screen.getByText(/익숙한 대도시 감각을 Lovv가 한국과 일본 소도시 후보로 바꿔둘게요/)).toBeInTheDocument()
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
    expect(screen.getByTestId('onboarding-content-grid')).toHaveClass('mt-10', 'items-stretch')
    expect(screen.getByTestId('preference-card-grid')).toHaveClass('auto-rows-[212px]')
    expect(screen.getByText('온양온천 · 스파 휴양 · 지옥 순례')).toHaveClass(
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

    expectStoredThemeIds(['sea_coast', 'nature_trekking', 'art_emotion'])
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
      'top-[220px]',
      'h-fit',
      'max-xl:static',
    )
    expect(screen.getByRole('img', { name: '아산/온양 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '벳푸 썸네일 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 아산/온양')).toBeInTheDocument()
    expect(screen.getByText('1 / 2 · 온천·휴양')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '벳푸 +1 이미지 목록 펼치기' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '선택한 테마 이미지 목록' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 선택 테마 보기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '벳푸 +1 이미지 목록 펼치기' }))
    expect(screen.getByRole('group', { name: '선택한 테마 이미지 목록' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '벳푸 이미지로 크게 보기' }))

    expect(screen.getByRole('img', { name: '벳푸 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '아산/온양 썸네일 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 벳푸')).toBeInTheDocument()
    expect(screen.getByText('2 / 2 · 온천·휴양')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '아산/온양 +1 이미지 목록 펼치기' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '선택한 테마 이미지 목록' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /미식·노포/ }))

    expect(screen.getByText('1 / 4 · 온천·휴양')).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 아산/온양')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '벳푸 +3 이미지 목록 펼치기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 선택 테마 보기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /자연·트레킹/ }))

    expect(screen.getByText('1 / 6 · 온천·휴양')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '벳푸 +5 이미지 목록 펼치기' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '제주 썸네일 이미지' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '벳푸 +5 이미지 목록 펼치기' }))

    expect(screen.getAllByRole('button', { name: /이미지로 크게 보기/ })).toHaveLength(5)
    expect(screen.getByRole('img', { name: '제주 썸네일 이미지' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '닛코 썸네일 이미지' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '닛코 이미지로 크게 보기' }))

    expect(screen.getByRole('img', { name: '닛코 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('6 / 6 · 자연·트레킹')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '아산/온양 +5 이미지 목록 펼치기' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '선택한 테마 이미지 목록' })).not.toBeInTheDocument()
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
    expect(screen.getByTestId('chat-top-grid')).toHaveClass('grid-cols-[minmax(0,0.96fr)_minmax(360px,0.82fr)]')
    expect(screen.getByRole('region', { name: 'Planner State' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-conversation-panel')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'AI 일정 결과' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '생성된 일정 상세' })).not.toBeInTheDocument()
    expect(screen.getByText('축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.')).toBeInTheDocument()
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

  it('asks whether to include festivals when the chat starts', () => {
    seedUser()
    seedPreference('전주 · 오사카')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })
    const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
    const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

    expect(within(chatLog).getByText('축제 테마를 일정에 포함할까요?')).toBeInTheDocument()
    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '축제 포함' })).toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '축제 제외' })).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '축제 포함' }))

    expect(within(chatLog).getAllByText('축제 포함')[0]).toBeInTheDocument()
    expect(within(chatLog).queryByText('축제 테마를 일정에 포함할까요?')).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(within(chatLog).getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '1박 2일' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '1박 2일' })).not.toBeInTheDocument()
    expect(input).not.toBeDisabled()
    expect(screen.queryByRole('region', { name: '생성된 일정 상세' })).not.toBeInTheDocument()
    expect(screen.getByText('동행, 관심사, 걷는 정도를 자연어로 입력해 주세요.')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '시장과 노포 중심으로 덜 걷고 싶어요' } })
    fireEvent.click(sendButton)

    expect(screen.getByRole('region', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '미식·노포 1박 2일 초안' })).toBeInTheDocument()
    expect(screen.getByText('축제 포함 반영')).toBeInTheDocument()
    expect(screen.getByText(/지역 축제나 시즌 행사가 있으면 일정 후보에 함께 넣습니다/)).toBeInTheDocument()
    expect(screen.getByLabelText('조건 해석 결과')).toHaveTextContent('미식·노포')
    expect(screen.getByRole('button', { name: '일정 다시짜기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '마이페이지에 저장' })).toBeInTheDocument()
  })

  it('turns a chat message into an assistant response and updated itinerary detail', () => {
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

    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))
    fireEvent.click(screen.getByRole('button', { name: '2박 3일' }))

    expect(input).not.toBeDisabled()
    fireEvent.change(input, { target: { value: '전시랑 편집숍 위주로 덜 걷고 싶어요' } })
    expect(sendButton).not.toBeDisabled()
    fireEvent.click(sendButton)
    expect(input).toHaveValue('')
    expect(screen.getByText('전시랑 편집숍 위주로 덜 걷고 싶어요')).toBeInTheDocument()
    expect(screen.getByText(/예술·감성 기준으로 2박 3일 흐름을 잡아볼게요/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '예술·감성 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getAllByText('덜 걷는 일정').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/전시와 편집숍 사이 이동을 줄이는 쪽/)).toBeInTheDocument()
  })

  it('submits a duration guide chip without storing the full chat transcript', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).getAllByText('1박 2일')[0]).toBeInTheDocument()
    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '온천·휴양 1박 2일 초안' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: '여행 조건 입력' }), {
      target: { value: '온천 숙소에서 천천히 쉬고 싶어요' },
    })
    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }))
    expect(screen.getByRole('heading', { name: '온천·휴양 1박 2일 초안' })).toBeInTheDocument()
    expect(localStorage.getItem('lovv.chat')).toBeNull()
    expect(localStorage.getItem('lovv.messages')).toBeNull()
  })

  it('accepts guided duration chips from day trip through four nights five days', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    const expectedDurations = [
      ['당일치기', '역사·전통 당일치기 초안'],
      ['3박 4일', '역사·전통 3박 4일 초안'],
      ['4박 5일', '역사·전통 4박 5일 초안'],
    ] as const

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    expectedDurations.forEach(([duration, heading], index) => {
      completeGuidedPlanner({
        festival: '축제 제외',
        duration,
        query: '역사 골목 산책 위주로 여유 있게 보고 싶어요',
      })
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      if (index < expectedDurations.length - 1) {
        fireEvent.click(screen.getByRole('button', { name: '새로운 추천받기' }))
      }
    })
    expect(screen.getByText('5일 구성')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '1일차' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '5일차' })).toHaveAttribute('aria-selected', 'false')
    fireEvent.click(screen.getByRole('tab', { name: '5일차' }))
    expect(screen.getByRole('tab', { name: '5일차' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('5일차 추천 일정')).toBeInTheDocument()
    expect(screen.getByText('총 15개 코스')).toBeInTheDocument()
    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    ;['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일'].forEach((duration) => {
      expect(within(chatLog).queryByRole('button', { name: duration })).not.toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('추가로 원하는 조건을 입력해 주세요')).toBeInTheDocument()
  })

  it('saves and likes a generated itinerary without duplicate mock storage records', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    completeGuidedPlanner({
      festival: '축제 포함',
      duration: '2박 3일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })

    expect(screen.getByRole('heading', { name: '온천·휴양 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '세부 일정 보기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '좋아요' }))

    expect(screen.getByRole('button', { name: '좋아요 취소' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.likedPlanIds') ?? '[]')).toHaveLength(1)

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
      festivalThemeLabel: '축제 포함',
      themeTag: '온천·휴양',
      themeLabels: ['온천·휴양'],
      conditionSummary: expect.stringContaining('온천·휴양'),
    })

    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장됨' }))

    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '새로운 추천받기' }))

    expect(screen.queryByRole('heading', { name: '온천·휴양 2박 3일 초안' })).not.toBeInTheDocument()
    expect(screen.getByText('축제 포함 여부와 여행 기간을 고른 뒤 이번 여행 조건을 입력하면 일정 초안이 여기에 표시됩니다.')).toBeInTheDocument()
    expect(screen.getByText('축제 테마를 일정에 포함할까요?')).toBeInTheDocument()
  })

  it('opens a generated itinerary detail view and preserves like/save actions when returning to chat', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    completeGuidedPlanner({
      festival: '축제 포함',
      duration: '2박 3일',
      query: '온천 숙소에 오래 머물고 덜 걷고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '세부 일정 보기' }))

    expect(window.location.pathname).toMatch(/^\/plans\/.+/)
    const detailView = screen.getByRole('region', { name: '세부 일정 상세' })

    expect(within(detailView).getByRole('heading', { name: '온천·휴양 2박 3일 초안' })).toBeInTheDocument()
    expect(within(detailView).getByText('온천·휴양')).toBeInTheDocument()
    expect(within(detailView).getByText('2박 3일')).toBeInTheDocument()
    expect(within(detailView).getByText('축제 포함')).toBeInTheDocument()
    expect(within(detailView).getByText('덜 걷는 일정')).toBeInTheDocument()
    expect(within(detailView).getByText('1일차 추천 일정')).toBeInTheDocument()
    expect(within(detailView).getByText('2일차 추천 일정')).toBeInTheDocument()
    expect(within(detailView).getByText('3일차 추천 일정')).toBeInTheDocument()
    expect(within(detailView).getByText('가볍게 도착하고 가까운 동네부터 보기')).toBeInTheDocument()
    expect(within(detailView).getByText('취향에 맞는 핵심 장소 둘러보기')).toBeInTheDocument()
    expect(within(detailView).getByText('무리하지 않는 마무리 동선')).toBeInTheDocument()
    expect(within(detailView).getAllByText('추천 이유')).toHaveLength(9)
    expect(within(detailView).getAllByText('다음 장소까지 12분').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(within(detailView).getByRole('button', { name: '좋아요' }))
    fireEvent.click(within(detailView).getByRole('button', { name: '마이페이지에 저장' }))

    expect(within(detailView).getByRole('button', { name: '좋아요 선택됨' })).toBeInTheDocument()
    expect(within(detailView).getByRole('button', { name: '마이페이지에 저장됨' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lovv.planReactions') ?? '{}')).toEqual(
      expect.objectContaining({
        [decodeURIComponent(window.location.pathname.replace('/plans/', ''))]: 'like',
      }),
    )
    expect(JSON.parse(localStorage.getItem('lovv.likedPlanIds') ?? '[]')).toHaveLength(1)
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

    completeGuidedPlanner({
      festival: '축제 포함',
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

  it('keeps saved itinerary like and dislike reactions mutually exclusive across My Page and detail', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    renderApp('/planner')

    completeGuidedPlanner({
      festival: '축제 제외',
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
    expect(within(savedPlanCard!).queryByText(/현재 반응/)).not.toBeInTheDocument()
    expect(within(savedPlanCard!).queryByText('없음')).not.toBeInTheDocument()
    expect(within(savedPlanCard!).getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(savedPlanCard!).getByRole('button', { name: '싫어요' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '좋아요' }))

    expect(within(savedPlanCard!).getByRole('button', { name: '좋아요 선택됨' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('lovv.planReactions') ?? '{}')).toMatchObject({
      [savedPlanId]: 'like',
    })

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '싫어요' }))

    expect(within(savedPlanCard!).getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(savedPlanCard!).getByRole('button', { name: '싫어요 선택됨' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('lovv.planReactions') ?? '{}')).toMatchObject({
      [savedPlanId]: 'dislike',
    })

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '싫어요 선택됨' }))

    expect(within(savedPlanCard!).queryByText(/현재 반응/)).not.toBeInTheDocument()
    expect(within(savedPlanCard!).queryByText('없음')).not.toBeInTheDocument()
    expect(within(savedPlanCard!).getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(savedPlanCard!).getByRole('button', { name: '싫어요' })).toHaveAttribute('aria-pressed', 'false')
    expect(JSON.parse(localStorage.getItem('lovv.planReactions') ?? '{}')).not.toHaveProperty(savedPlanId)

    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '좋아요' }))
    fireEvent.click(within(savedPlanCard!).getByRole('button', { name: '상세 보기' }))

    expect(window.location.pathname).toBe(`/plans/${encodeURIComponent(savedPlanId)}`)
    const detailView = screen.getByRole('region', { name: '세부 일정 상세' })

    expect(within(detailView).getByRole('button', { name: '좋아요 선택됨' })).toBeInTheDocument()
    fireEvent.click(within(detailView).getByRole('button', { name: '싫어요' }))

    expect(within(detailView).getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(detailView).getByRole('button', { name: '싫어요 선택됨' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('lovv.planReactions') ?? '{}')).toMatchObject({
      [savedPlanId]: 'dislike',
    })
  })

  it('ignores invalid saved and liked plan storage when using generated plan actions', () => {
    seedUser()
    seedPreference('제주 · 닛코')
    localStorage.setItem('lovv.savedPlans', '{broken')
    localStorage.setItem('lovv.likedPlanIds', '{"bad":true}')
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    completeGuidedPlanner({
      festival: '축제 제외',
      duration: '당일치기',
      query: '숲길과 자연을 보고 싶어요',
    })
    fireEvent.click(screen.getByRole('button', { name: '좋아요' }))
    fireEvent.click(screen.getByRole('button', { name: '마이페이지에 저장' }))

    expect(JSON.parse(localStorage.getItem('lovv.likedPlanIds') ?? '[]')).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('lovv.savedPlans') ?? '[]')).toHaveLength(1)
  })

  it('logs out to the signup gate without removing the selected preference', () => {
    seedUser()
    seedPreference('경주 · 교토')
    renderApp()

    signOutFromSessionMenu()

    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expectStoredThemeIds(['history_tradition'])
    expect(screen.getByRole('heading', { name: '서울/오사카 말고, 지금은 이곳' })).toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByText('경주 · 교토 감성으로 시작합니다')).not.toBeInTheDocument()
  })
})
