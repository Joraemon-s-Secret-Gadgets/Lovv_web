import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthView } from './AuthView'

describe('AuthView', () => {
  it('keeps the story summary line break responsive', () => {
    render(<AuthView onSignIn={vi.fn()} />)

    const summary = screen.getByTestId('auth-story-summary')

    expect(summary).toHaveTextContent(
      '익숙한 대도시의 화려함 뒤에 숨겨진 진짜 로컬의 매력을 발견하세요. Lovv는 한국과 일본의 작지만 보석 같은 도시들을 연결하여 당신만의 특별한 여행 이야기를 만들어냅니다.',
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

    expect(screen.getByRole('button', { name: 'Google 로그인 페이지로 이동 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Google 로그인 페이지로 이동 중...' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Kakao 간편 로그인으로 시작하기' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Google 로그인 페이지로 이동 중...' }))
    expect(onSignIn).not.toHaveBeenCalled()
  })
})
