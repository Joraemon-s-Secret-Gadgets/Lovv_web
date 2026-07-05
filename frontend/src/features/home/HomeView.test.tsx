import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HomeView,
  MonthlyRecommendationMedia,
  monthlyRecommendationRotationIntervalMs,
  monthlyRecommendationTransitionDurationMs,
} from './HomeView'
import { heroThemes, monthlyRecommendations } from './homeContent'

afterEach(() => {
  vi.useRealTimers()
})

describe('MonthlyRecommendationMedia', () => {
  it('shows a calm placeholder when the image is null', () => {
    render(<MonthlyRecommendationMedia image={null} altText="강릉 추천 소도시 이미지" />)

    expect(screen.getByText('이미지 준비 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows a calm placeholder when the image is blank', () => {
    render(<MonthlyRecommendationMedia image="   " altText="강릉 추천 소도시 이미지" />)

    expect(screen.getByText('이미지 준비 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('falls back to the placeholder when the image fails to load', () => {
    render(
      <MonthlyRecommendationMedia
        image="https://example.com/city.jpg"
        altText="강릉 추천 소도시 이미지"
      />,
    )

    const image = screen.getByRole('img', { name: '강릉 추천 소도시 이미지' })
    expect(image).toHaveAttribute('src', 'https://example.com/city.jpg')

    fireEvent.error(image)

    expect(screen.getByText('이미지 준비 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('HomeView hero summary', () => {
  it('keeps responsive line breaks between hero summary sentences', () => {
    render(
      <HomeView
        currentHeroTheme={heroThemes[1]}
        selectedPreferenceProfile={{
          version: 2,
          countryTrack: 'KR',
          selectedThemeIds: [monthlyRecommendations[0].preference.themeId],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        }}
        selectedThemeHashtags={[]}
        recommendationBasisHashtags={[]}
        openChat={vi.fn()}
        openMap={vi.fn()}
        onOpenMonthlyRecommendationDetail={vi.fn()}
        onOpenChatFromQuickAction={vi.fn()}
        onScrollToTop={vi.fn()}
      />,
    )

    const summary = screen.getByTestId('hero-summary')
    expect(summary).toHaveTextContent(
      '탁 트인 바다와 청량한 바람이 머무는 곳. Lovv와 함께 파도 소리에 맞춰 걷는 특별한 여정을 찾아보세요.',
    )

    const responsiveBreak = summary.querySelector('br')
    expect(responsiveBreak).toHaveClass('max-sm:hidden')

    const mobileSpacer = summary.querySelector('br + span')
    expect(mobileSpacer).toHaveClass('hidden')
    expect(mobileSpacer).toHaveClass('max-sm:inline')
  })
})

describe('HomeView monthly recommendations', () => {
  it('rotates recommendations through one featured card with side cards', () => {
    vi.useFakeTimers()

    render(
      <HomeView
        currentHeroTheme={heroThemes[0]}
        selectedPreferenceProfile={{
          version: 2,
          countryTrack: 'KR',
          selectedThemeIds: [monthlyRecommendations[0].preference.themeId],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        }}
        selectedThemeHashtags={[]}
        recommendationBasisHashtags={[]}
        openChat={vi.fn()}
        openMap={vi.fn()}
        onOpenMonthlyRecommendationDetail={vi.fn()}
        onOpenChatFromQuickAction={vi.fn()}
        onScrollToTop={vi.fn()}
      />,
    )

    const grid = screen.getByTestId('monthly-recommendation-grid')
    const getFeaturedRecommendationButton = () => screen.getByTestId('monthly-recommendation-featured')

    expect(getFeaturedRecommendationButton()).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[0].preference.cityPair} 이달 추천 상세 보기`,
    )
    expect(screen.getByTestId('monthly-recommendation-previous')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[monthlyRecommendations.length - 1].preference.cityPair} 이달 추천 상세 보기`,
    )
    expect(screen.getByTestId('monthly-recommendation-next')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[1].preference.cityPair} 이달 추천 상세 보기`,
    )
    expect(grid).toHaveAttribute('data-featured-index', '0')
    expect(screen.queryByText('이달의 온천')).not.toBeInTheDocument()
    expect(screen.getAllByText('온천·휴양').length).toBeGreaterThan(0)
    expect(monthlyRecommendations.find(({ id }) => id === 'jeonju-osaka-local-table')?.badge).toBe(
      '미식·노포',
    )

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationRotationIntervalMs)
    })

    expect(getFeaturedRecommendationButton()).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[1].preference.cityPair} 이달 추천 상세 보기`,
    )
    expect(grid).toHaveAttribute('data-featured-index', '1')
    expect(grid).toHaveAttribute('data-motion', 'next')

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationTransitionDurationMs)
    })

    expect(grid).toHaveAttribute('data-motion', 'idle')

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationRotationIntervalMs)
    })

    expect(getFeaturedRecommendationButton()).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[2].preference.cityPair} 이달 추천 상세 보기`,
    )
  })

  it('moves the monthly carousel with hover-only navigation controls and side cards', () => {
    vi.useFakeTimers()

    render(
      <HomeView
        currentHeroTheme={heroThemes[0]}
        selectedPreferenceProfile={{
          version: 2,
          countryTrack: 'KR',
          selectedThemeIds: [monthlyRecommendations[0].preference.themeId],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        }}
        selectedThemeHashtags={[]}
        recommendationBasisHashtags={[]}
        openChat={vi.fn()}
        openMap={vi.fn()}
        onOpenMonthlyRecommendationDetail={vi.fn()}
        onOpenChatFromQuickAction={vi.fn()}
        onScrollToTop={vi.fn()}
      />,
    )

    const grid = screen.getByTestId('monthly-recommendation-grid')
    const previousControl = within(grid).getByRole('button', { name: '이전 추천 보기' })
    const nextControl = within(grid).getByRole('button', { name: '다음 추천 보기' })

    expect(previousControl.className).toContain('opacity-0')
    expect(previousControl.className).toContain('group-hover/carousel:opacity-100')
    expect(nextControl.className).toContain('group-hover/carousel:opacity-100')

    fireEvent.click(nextControl)
    expect(grid).toHaveAttribute('data-motion', 'next')
    expect(nextControl).toBeDisabled()
    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'data-motion',
      'next',
    )
    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[1].preference.cityPair} 이달 추천 상세 보기`,
    )

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationTransitionDurationMs)
    })

    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[1].preference.cityPair} 이달 추천 상세 보기`,
    )

    fireEvent.click(previousControl)
    expect(grid).toHaveAttribute('data-motion', 'previous')
    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[0].preference.cityPair} 이달 추천 상세 보기`,
    )

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationTransitionDurationMs)
    })

    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[0].preference.cityPair} 이달 추천 상세 보기`,
    )

    fireEvent.click(screen.getByTestId('monthly-recommendation-previous'))
    expect(grid).toHaveAttribute('data-motion', 'previous')
    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[monthlyRecommendations.length - 1].preference.cityPair} 이달 추천 상세 보기`,
    )

    act(() => {
      vi.advanceTimersByTime(monthlyRecommendationTransitionDurationMs)
    })

    expect(screen.getByTestId('monthly-recommendation-featured')).toHaveAttribute(
      'aria-label',
      `${monthlyRecommendations[monthlyRecommendations.length - 1].preference.cityPair} 이달 추천 상세 보기`,
    )
  })

  it('does not render the old mock personalized card when there is no backend reaction data', () => {
    render(
      <HomeView
        currentHeroTheme={heroThemes[0]}
        selectedPreferenceProfile={{
          version: 2,
          countryTrack: 'KR',
          selectedThemeIds: [monthlyRecommendations[0].preference.themeId],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        }}
        selectedThemeHashtags={[]}
        recommendationBasisHashtags={[]}
        openChat={vi.fn()}
        openMap={vi.fn()}
        onOpenMonthlyRecommendationDetail={vi.fn()}
        onOpenChatFromQuickAction={vi.fn()}
        onScrollToTop={vi.fn()}
        savedPlansCount={2}
        likedPlansCount={0}
        personalizedRecommendations={[]}
      />,
    )

    expect(screen.queryByText('곡성 취향 벡터')).not.toBeInTheDocument()
    expect(screen.queryByText('지난번 ❤ 곡성과 비슷')).not.toBeInTheDocument()
    expect(screen.getByText('7월 날씨·축제 경향이 맞는 소도시를 먼저 보여드려요')).toBeInTheDocument()
  })

  it('renders a personalized card only from backend reaction recommendation data', () => {
    render(
      <HomeView
        currentHeroTheme={heroThemes[0]}
        selectedPreferenceProfile={{
          version: 2,
          countryTrack: 'KR',
          selectedThemeIds: [monthlyRecommendations[0].preference.themeId],
          source: 'onboarding',
          updatedAt: '2026-06-12T00:00:00.000Z',
        }}
        selectedThemeHashtags={[]}
        recommendationBasisHashtags={[]}
        openChat={vi.fn()}
        openMap={vi.fn()}
        onOpenMonthlyRecommendationDetail={vi.fn()}
        onOpenChatFromQuickAction={vi.fn()}
        onScrollToTop={vi.fn()}
        savedPlansCount={2}
        likedPlansCount={1}
        personalizedRecommendations={[
          {
            ...monthlyRecommendations[0],
            id: 'reaction-gurye',
            preference: {
              ...monthlyRecommendations[0].preference,
              cityPair: '구례 · 전남',
            },
            title: '좋아한 자연 일정과 비슷한 구례',
            summary: '최근 반응 남긴 일정의 자연·산책 테마와 유사',
            badge: '자연·산책',
            image: null,
            themes: ['자연', '산책'],
            cityId: 'KR-Gurye',
            cityName: '구례',
            region: '전남',
            timingTag: '반응 기반',
            source: 'api',
          },
        ]}
      />,
    )

    expect(screen.getByText('반응 기반')).toBeInTheDocument()
    expect(screen.getByText('좋아한 자연 일정과 비슷한 구례')).toBeInTheDocument()
    expect(screen.getByText('지난번 다녀오신 소도시의 분위기를 기억해, 비슷한 곳을 골랐어요')).toBeInTheDocument()
  })
})
