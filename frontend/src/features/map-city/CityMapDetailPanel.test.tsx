import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getDefaultPreferenceProfile } from '../onboarding/preferenceModel'
import { CityMapDetailPanel } from './CityMapDetailPanel'
import { smallCities, type SmallCityPlace } from './smallCities'
import type { SmallCityDetailState } from './smallCityDataSource'

const city = smallCities[0]
const attractions: SmallCityPlace[] = Array.from({ length: 7 }, (_, index) => ({
  id: `attraction-${index + 1}`,
  cityId: city.id,
  category: '관광지',
  categoryName: '관광지',
  name: `관광지 ${index + 1}`,
  summary: `관광지 ${index + 1} 설명`,
}))

const detailState: SmallCityDetailState = {
  status: 'success',
  source: 'static-catalog',
  cityId: city.id,
  detail: {
    city,
    placesByCategory: {
      관광지: attractions,
      음식점: [],
      카페: [],
      숙소: [],
    },
    festivals: [],
    festivalCount: 0,
  },
  rejectedRecords: [],
  errorMessage: null,
}

describe('CityMapDetailPanel', () => {
  it('expands and collapses place candidates beyond the initial five', () => {
    render(
      <CityMapDetailPanel
        selectedSmallCity={city}
        selectedSmallCityDetailState={detailState}
        selectedPreferenceProfile={getDefaultPreferenceProfile()}
        onSetPanelMode={vi.fn()}
        onOpenPlanner={vi.fn()}
      />,
    )

    const placeSection = screen.getByRole('region', { name: '관광지 장소 후보' })
    expect(within(placeSection).getByText('관광지 5')).toBeInTheDocument()
    expect(within(placeSection).queryByText('관광지 6')).not.toBeInTheDocument()

    const expandButton = within(placeSection).getByRole('button', { name: '2곳 더 보기' })
    expect(expandButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(expandButton)

    expect(within(placeSection).getByText('관광지 6')).toBeInTheDocument()
    expect(within(placeSection).getByText('관광지 7')).toBeInTheDocument()
    const collapseButton = within(placeSection).getByRole('button', { name: '접기' })
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(collapseButton)

    expect(within(placeSection).queryByText('관광지 6')).not.toBeInTheDocument()
  })
})
