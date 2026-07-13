import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
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

describe('RecommendationView', () => {
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
})
