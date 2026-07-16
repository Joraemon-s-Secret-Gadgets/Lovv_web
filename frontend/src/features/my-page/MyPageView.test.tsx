/**
 * @file MyPageView.test.tsx
 * @description Tests for saved plans, personalization, and admin access in My Page.
 * @author JJonyeok2
 * @lastModified 2026-07-16
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LovvUser, SavedPlan } from '../../shared/types/app'
import { MyPageView } from './MyPageView'

const baseUser: LovvUser = {
  id: 'user-1',
  name: 'Lovv User',
  email: 'user@lovv.site',
  avatarInitial: 'L',
  provider: 'google',
  roles: ['R-USER'],
}

const createSavedPlan = (index: number): SavedPlan => ({
  id: `plan-${index}`,
  ownerId: baseUser.id,
  title: `저장 일정 ${index}`,
  cityPair: `도시 ${index}`,
  themeTag: '#자연',
  themeLabels: ['자연'],
  conditionSummary: '자연 중심 일정',
  durationLabel: '1박 2일',
  festivalThemeLabel: '축제 제외',
  intensityLabel: '보통',
  summary: `저장 일정 ${index} 요약`,
  stops: [],
  createdAt: '2026-07-16T00:00:00.000Z',
  savedAt: '2026-07-16T00:00:00.000Z',
})

const renderMyPage = (currentUser: LovvUser, savedPlans: SavedPlan[] = []) =>
  render(
    <MyPageView
      goHome={vi.fn()}
      currentProviderLabel="Google"
      selectedPreferenceLabel="자연"
      savedPlanNotice={null}
      preferenceNotice={null}
      currentUser={currentUser}
      savedPlans={savedPlans}
      getSavedPlanLike={() => null}
      onSelectSavedPlanLike={vi.fn()}
      getSavedPlanLikeError={() => null}
      isSavedPlanLikePending={() => false}
      isSavedPlanDeletePending={() => false}
      openSavedPlanDetail={vi.fn()}
      onDeleteSavedPlan={vi.fn()}
      openPreferenceEdit={vi.fn()}
      signOut={vi.fn()}
      canLinkSocialAccounts={false}
      socialAccounts={[]}
      linkingProvider={null}
      accountLinkNotice={null}
      onLinkProvider={vi.fn()}
      onUpdateProfile={vi.fn().mockResolvedValue(true)}
      isUpdatingProfile={false}
      profileUpdateError={null}
    />,
  )

describe('MyPageView admin console access', () => {
  it('shows the admin console link to an R-ADMIN user', () => {
    renderMyPage({ ...baseUser, roles: ['R-USER', 'R-ADMIN'] })

    expect(screen.getByRole('link', { name: 'Lovv 관리자 콘솔로 이동' })).toHaveAttribute(
      'href',
      'https://admin.lovv.site/',
    )
  })

  it('does not show the admin console link to a regular user', () => {
    renderMyPage(baseUser)

    expect(screen.queryByRole('link', { name: 'Lovv 관리자 콘솔로 이동' })).not.toBeInTheDocument()
  })
})

describe('MyPageView saved plan pagination', () => {
  it('shows saved plans five at a time and moves between pages', () => {
    const savedPlans = Array.from({ length: 6 }, (_, index) => createSavedPlan(index + 1))

    renderMyPage(baseUser, savedPlans)

    expect(screen.getByText('저장 일정 1')).toBeInTheDocument()
    expect(screen.getByText('저장 일정 5')).toBeInTheDocument()
    expect(screen.queryByText('저장 일정 6')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 저장 일정 페이지' }))

    expect(screen.queryByText('저장 일정 1')).not.toBeInTheDocument()
    expect(screen.getByText('저장 일정 6')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 저장 일정 페이지' })).toBeDisabled()
  })

  it('does not show pagination when there are exactly five saved plans', () => {
    const savedPlans = Array.from({ length: 5 }, (_, index) => createSavedPlan(index + 1))

    renderMyPage(baseUser, savedPlans)

    expect(screen.queryByRole('navigation', { name: '저장 일정 페이지 이동' })).not.toBeInTheDocument()
  })
})

// EOF: MyPageView.test.tsx
