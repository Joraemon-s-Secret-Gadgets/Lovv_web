import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

const seedPreference = (cityPair = '교토 · 경주') => {
  localStorage.setItem('lovv.preference', JSON.stringify({ cityPair }))
}

describe('MVP main entry screen', () => {
  it('renders the Lovv landing content from the MVP Figma frame', () => {
    seedPreference()
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveAttribute('href', '#chat')
    expect(screen.getByText('처음엔 작게, 추천은 정확하게')).toBeInTheDocument()
  })

  it('uses a grounded pale green button color that turns yellow on hover', () => {
    seedPreference()
    render(<App />)

    const buttonLabels = ['새 여정 만들기', 'AI 일정 짜기', 'AI 일정', '챗봇', '소도시 보기']

    buttonLabels.forEach((label) => {
      const button = screen.getByRole('link', { name: label })

      expect(button).toHaveClass('bg-[#dbe8d3]')
      expect(button).toHaveClass('border-[#b8c9aa]')
      expect(button).toHaveClass('hover:bg-[#ffe55f]')
    })
  })

  it('keeps dense text responsive on narrow screens', () => {
    seedPreference('오키나와 · 제주')
    render(<App />)

    expect(screen.getByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).toHaveClass(
      'break-keep',
      'max-sm:text-[36px]',
      'max-sm:leading-[44px]',
    )
    expect(screen.getByText('오키나와 · 제주 감성으로 시작합니다')).toHaveClass(
      'max-w-full',
      'break-keep',
      'max-sm:text-[13px]',
    )
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveClass(
      'max-sm:w-full',
      'max-sm:min-h-[48px]',
      'max-sm:whitespace-normal',
    )

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: '여행 조건을 대화로 정리하기' })).toHaveClass(
      'break-keep',
      'max-sm:text-xl',
      'max-sm:leading-7',
    )
    expect(screen.getByRole('heading', { name: '오키나와 · 제주 감성 1일 초안' })).toHaveClass(
      'break-keep',
      'max-sm:text-lg',
      'max-sm:leading-6',
    )
    expect(screen.getByText(/장소를 확정하기 전/)).toHaveClass('line-clamp-2', 'max-sm:text-[13px]')
  })

  it('shows onboarding before the main screen on first entry', () => {
    render(<App />)

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).not.toBeInTheDocument()
    expect(screen.getByText('Lovv City Mood Journal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '이번 여행의 첫 분위기를 골라주세요' })).toBeInTheDocument()
    expect(screen.getByText('이번 선택으로 AI 일정의 말투와 지도 후보가 먼저 정리됩니다')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /후쿠오카 · 부산/ }))
    fireEvent.click(screen.getByRole('button', { name: '이 취향으로 Lovv 시작하기' }))

    expect(localStorage.getItem('lovv.preference')).toContain('후쿠오카 · 부산')
    expect(
      screen.queryByRole('heading', { name: '이번 여행의 첫 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('후쿠오카 · 부산 감성으로 시작합니다')).toBeInTheDocument()
  })

  it('skips onboarding for returning users and opens the chat workspace without a map', () => {
    seedPreference('오키나와 · 제주')
    render(<App />)

    expect(
      screen.queryByRole('heading', { name: '이번 여행의 첫 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('오키나와 · 제주 감성으로 시작합니다')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByText('1일차 추천 일정')).toBeInTheDocument()
    expect(screen.getByText('오키나와 · 제주 감성 1일 초안')).toBeInTheDocument()
    expect(screen.getByText('동선이 느슨한 일정')).toBeInTheDocument()
    expect(screen.getAllByText('추천 이유')).toHaveLength(3)
    expect(screen.getAllByText(/다음 장소까지/)).toHaveLength(3)
    expect(screen.getByText('오전')).toBeInTheDocument()
    expect(screen.getByText('오후')).toBeInTheDocument()
    expect(screen.getByText('저녁')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여행 지도' })).not.toBeInTheDocument()
    expect(screen.queryByText('오키나와 · 제주 기반 지도')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '이번 여행의 첫 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
  })
})
