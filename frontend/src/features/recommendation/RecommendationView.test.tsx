import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestListPublicItineraries } from '../../shared/api/savedPlansApi'
import type { SavedPlan } from '../../shared/types/app'
import { RecommendationView } from './RecommendationView'

vi.mock('../../shared/api/recommendationsApi', () => ({
  requestListPopularDestinations: vi.fn().mockResolvedValue({
    items: [
      {
        cityId: 'KR-Gangneung',
        name: '강릉',
        country: 'KR',
        countryLabel: '한국',
        region: '강원',
        themes: ['바다', '자연'],
        reactionCount: 8,
        savedPlanCount: 3,
      },
    ],
    ageGroups: [],
  }),
}))

vi.mock('../../shared/api/savedPlansApi', () => ({
  requestListPublicItineraries: vi.fn().mockResolvedValue({ savedPlans: [] }),
}))

const renderRecommendationView = (onOpenDestinationOnMap = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RecommendationView onOpenDestinationOnMap={onOpenDestinationOnMap} />
      </BrowserRouter>
    </QueryClientProvider>,
  )

  return { onOpenDestinationOnMap }
}

const createPublicPlan = (index: number): SavedPlan => ({
  id: `public-plan-${index}`,
  ownerId: `owner-${index}`,
  title: `게시 일정 ${index}`,
  cityPair: `도시 ${index}`,
  themeTag: '#자연',
  themeLabels: ['자연'],
  conditionSummary: '자연 중심 일정',
  durationLabel: '1박 2일',
  festivalThemeLabel: '축제 제외',
  intensityLabel: '보통',
  summary: `게시 일정 ${index} 요약`,
  stops: [],
  isPublic: true,
  createdAt: '2026-07-16T00:00:00.000Z',
  savedAt: '2026-07-16T00:00:00.000Z',
})

describe('RecommendationView', () => {
  beforeEach(() => {
    vi.mocked(requestListPublicItineraries).mockResolvedValue({ savedPlans: [], likes: {} })
  })

  it('opens a ranked destination on the map with its city target', async () => {
    const { onOpenDestinationOnMap } = renderRecommendationView()
    const rankedDestination = await screen.findByRole('button', {
      name: '강릉 여행지 찾아보기에서 보기',
    })

    fireEvent.click(rankedDestination)

    expect(onOpenDestinationOnMap).toHaveBeenCalledWith({
      cityId: 'KR-Gangneung',
      name: '강릉',
      country: 'KR',
    })
  })

  it('shows published plans six at a time and moves between pages', async () => {
    vi.mocked(requestListPublicItineraries).mockResolvedValue({
      savedPlans: Array.from({ length: 7 }, (_, index) => createPublicPlan(index + 1)),
      likes: {},
    })

    renderRecommendationView()

    expect(await screen.findByText('게시 일정 1')).toBeInTheDocument()
    expect(screen.getByText('게시 일정 6')).toBeInTheDocument()
    expect(screen.queryByText('게시 일정 7')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 게시 일정 페이지' }))

    expect(screen.queryByText('게시 일정 1')).not.toBeInTheDocument()
    expect(screen.getByText('게시 일정 7')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('does not show pagination for six published plans', async () => {
    vi.mocked(requestListPublicItineraries).mockResolvedValue({
      savedPlans: Array.from({ length: 6 }, (_, index) => createPublicPlan(index + 1)),
      likes: {},
    })

    renderRecommendationView()

    expect(await screen.findByText('게시 일정 6')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '게시 일정 페이지 이동' })).not.toBeInTheDocument()
  })
})
