/**
 * @file CityMapListPanel.test.tsx
 * @description Tests for small-city result pagination and selection.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CityMapListPanel } from './CityMapListPanel'
import { smallCities, type SmallCity } from './smallCities'

const cities: SmallCity[] = Array.from({ length: 12 }, (_, index) => ({
  ...smallCities[0],
  id: `city-${index + 1}`,
  nameKo: `도시 ${index + 1}`,
}))

describe('CityMapListPanel', () => {
  it('moves through filtered city results ten at a time', () => {
    const onSelectCityFromList = vi.fn()

    render(
      <CityMapListPanel
        filteredSmallCities={cities}
        activeCountryTotalCount={cities.length}
        selectedSmallCity={null}
        onSelectCityFromList={onSelectCityFromList}
      />,
    )

    expect(screen.getByText('도시 1')).toBeInTheDocument()
    expect(screen.getByText('도시 10')).toBeInTheDocument()
    expect(screen.queryByText('도시 11')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }))

    expect(screen.queryByText('도시 1')).not.toBeInTheDocument()
    expect(screen.getByText('도시 11')).toBeInTheDocument()
    expect(screen.getByText('도시 12')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
  })
})

// EOF: CityMapListPanel.test.tsx
