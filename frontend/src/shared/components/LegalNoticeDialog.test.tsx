import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LegalNoticeDialog } from './LegalNoticeDialog'
import { useUiToggleStore } from '../store/uiToggleStore'

describe('LegalNoticeDialog', () => {
  it('renders the selected legal notice content', () => {
    act(() => {
      useUiToggleStore.getState().openLegalNotice('terms')
    })
    render(<LegalNoticeDialog />)

    expect(screen.getByRole('dialog', { name: '이용약관' })).toBeInTheDocument()
    expect(screen.getByText(/소도시 여행지를 탐색하고/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '서비스 이용' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '계정과 저장 정보' })).toBeInTheDocument()
  })

  it('renders privacy and contact notices without exposing empty placeholder links', () => {
    act(() => {
      useUiToggleStore.getState().openLegalNotice('privacy')
    })
    render(<LegalNoticeDialog />)

    expect(screen.getByRole('dialog', { name: '개인정보 처리방침' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '수집 및 이용 항목' })).toBeInTheDocument()

    act(() => {
      useUiToggleStore.getState().openLegalNotice('contact')
    })

    expect(screen.getByRole('dialog', { name: '문의하기' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '접수 채널' })).toBeInTheDocument()
    expect(screen.getByText('현재 데모 버전에서는 별도 문의 접수 폼을 제공하지 않습니다.')).toBeInTheDocument()
  })

  it('closes from the close button, confirm button, backdrop, and Escape key', () => {
    act(() => {
      useUiToggleStore.getState().openLegalNotice('contact')
    })
    render(<LegalNoticeDialog />)

    fireEvent.click(screen.getByRole('button', { name: '문의하기 닫기' }))
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBeNull()

    act(() => {
      useUiToggleStore.getState().openLegalNotice('contact')
    })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBeNull()

    act(() => {
      useUiToggleStore.getState().openLegalNotice('contact')
    })
    fireEvent.click(screen.getByTestId('legal-notice-backdrop'))
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBeNull()

    act(() => {
      useUiToggleStore.getState().openLegalNotice('contact')
    })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useUiToggleStore.getState().activeLegalNoticeType).toBeNull()
  })
})
