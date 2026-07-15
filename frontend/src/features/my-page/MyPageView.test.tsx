/**
 * @file MyPageView.test.tsx
 * @description Tests for saved plans, personalization, and admin access in My Page.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LovvUser } from '../../shared/types/app'
import { MyPageView } from './MyPageView'

const baseUser: LovvUser = {
  id: 'user-1',
  name: 'Lovv User',
  email: 'user@lovv.site',
  avatarInitial: 'L',
  provider: 'google',
  roles: ['R-USER'],
}

const renderMyPage = (currentUser: LovvUser) =>
  render(
    <MyPageView
      goHome={vi.fn()}
      currentProviderLabel="Google"
      selectedPreferenceLabel="자연"
      savedPlanNotice={null}
      preferenceNotice={null}
      currentUser={currentUser}
      savedPlans={[]}
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

// EOF: MyPageView.test.tsx
