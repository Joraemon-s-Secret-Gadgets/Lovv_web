import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthView } from './AuthView'
import { useUiToggleStore } from '../../shared/store/uiToggleStore'

describe('AuthView', () => {
  it('keeps the story summary line break responsive', () => {
    render(<AuthView onSignIn={vi.fn()} />)

    const summary = screen.getByTestId('auth-story-summary')
    const authRegion = screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })

    expect(authRegion).toHaveClass('lovv-auth-liquid-shell')
    expect(screen.getByTestId('auth-fixed-panel')).toHaveClass('lovv-liquid-panel')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('lovv-liquid-panel')
    expect(screen.getByRole('button', { name: 'Google로 계속하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kakao로 계속하기' })).toBeInTheDocument()
    expect(screen.getByTestId('google-brand-mark')).toBeInTheDocument()
    expect(screen.getByTestId('kakao-brand-mark')).toBeInTheDocument()
    expect(summary).toHaveTextContent(
      '익숙한 대도시의 화려함 뒤에 숨겨진 진짜 로컬의 매력을 발견하세요. Lovv는 작지만 보석 같은 도시들을 연결하여 당신만의 특별한 여행 이야기를 만들어냅니다.',
    )

    const responsiveBreak = summary.querySelector('br')
    expect(responsiveBreak).toHaveClass('max-sm:hidden')

    const mobileSpacer = summary.querySelector('br + span')
    expect(mobileSpacer).toHaveClass('hidden')
    expect(mobileSpacer).toHaveClass('max-sm:inline')
  })

  it('shows immediate pending feedback while moving to a social login page', () => {
    const onSignIn = vi.fn()

    render(<AuthView onSignIn={onSignIn} signInPendingProvider="google" />)

    expect(screen.getByRole('button', { name: 'Google로 이동 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Google로 이동 중...' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('region', { name: '서울/오사카 말고, 간편 로그인' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByTestId('auth-button-spinner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kakao로 계속하기' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Google로 이동 중...' }))
    expect(onSignIn).not.toHaveBeenCalled()
  })

  it('routes legal notice actions through the shared ui toggle store', () => {
    render(<AuthView onSignIn={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '이용약관' }))
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBe('terms')

    fireEvent.click(screen.getByRole('button', { name: '개인정보처리방침' }))
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBe('privacy')

    fireEvent.click(screen.getByRole('button', { name: '문의하기' }))
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBe('contact')
  })
})
