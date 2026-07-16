/**
 * @file MyPageView.tsx
 * @description My Page view for profile, saved itineraries, reactions, and admin access.
 * @author JJonyeok2
 * @lastModified 2026-07-16
 */

import { useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  LovvUser,
  SavedPlanLike,
  SavedPlan,
  SocialAccountSummary,
  SocialAuthProvider,
} from '../../shared/types/app'
import type { ProfileUpdateRequest } from '../../shared/api/authApi'


const socialProviderLabels: Record<SocialAuthProvider, string> = {
  google: 'Google',
  kakao: 'Kakao',
}

const SAVED_PLANS_PAGE_SIZE = 5

const resolveProviderTone = (label: string): SocialAuthProvider | null => {
  const normalizedLabel = label.toLowerCase()

  if (normalizedLabel.includes('kakao')) {
    return 'kakao'
  }

  if (normalizedLabel.includes('google')) {
    return 'google'
  }

  return null
}

const formatJoinDate = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return `${String(parsed.getFullYear()).slice(-2)}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`
}

type MyPageViewProps = {
  goHome: (event?: MouseEvent<HTMLElement>) => void
  currentProviderLabel: string
  selectedPreferenceLabel: string
  savedPlanNotice: string | null
  preferenceNotice: string | null
  currentUser: LovvUser | null
  savedPlans: SavedPlan[]
  getSavedPlanLike: (planId: string) => SavedPlanLike
  onSelectSavedPlanLike: (planId: string, like: Exclude<SavedPlanLike, null>) => void
  getSavedPlanLikeError: (planId: string) => string | null
  isSavedPlanLikePending: (planId: string) => boolean
  isSavedPlanDeletePending: (planId: string) => boolean
  isSavedPlanSharePending?: (planId: string) => boolean
  openSavedPlanDetail: (planId: string) => void
  onDeleteSavedPlan: (planId: string) => void
  onShareSavedPlan?: (planId: string, isPublic: boolean) => Promise<boolean>
  openPreferenceEdit: () => void
  signOut: () => void
  canLinkSocialAccounts: boolean
  socialAccounts: SocialAccountSummary[]
  linkingProvider: SocialAuthProvider | null
  accountLinkNotice: string | null
  onLinkProvider: (provider: SocialAuthProvider) => void
  onUpdateProfile: (update: ProfileUpdateRequest) => Promise<boolean>
  isUpdatingProfile: boolean
  profileUpdateError: string | null
}

export function MyPageView({
  goHome,
  currentProviderLabel,
  selectedPreferenceLabel,
  savedPlanNotice,
  preferenceNotice,
  currentUser,
  savedPlans,
  getSavedPlanLike,
  isSavedPlanDeletePending,
  isSavedPlanSharePending,
  openSavedPlanDetail,
  onDeleteSavedPlan,
  onShareSavedPlan,
  openPreferenceEdit,
  signOut,
  canLinkSocialAccounts,
  socialAccounts,
  linkingProvider,
  accountLinkNotice,
  onLinkProvider,
  onUpdateProfile,
  isUpdatingProfile,
  profileUpdateError,
}: MyPageViewProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  const [nameInput, setNameInput] = useState(currentUser?.name ?? '')
  const [birthDateInput, setBirthDateInput] = useState(currentUser?.birthDate ?? '')
  const [genderInput, setGenderInput] = useState<string | null>(currentUser?.gender ?? null)
  const [profileSavedNotice, setProfileSavedNotice] = useState<string | null>(null)
  const [shareNotice, setShareNotice] = useState<string | null>(null)
  const [savedPlansPage, setSavedPlansPage] = useState(1)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNameInput(currentUser?.name ?? '')
    setBirthDateInput(currentUser?.birthDate ?? '')
    setGenderInput(currentUser?.gender ?? null)
  }, [currentUser?.name, currentUser?.birthDate, currentUser?.gender])

  const savedPlansPageCount = Math.max(1, Math.ceil(savedPlans.length / SAVED_PLANS_PAGE_SIZE))
  const currentSavedPlansPage = Math.min(savedPlansPage, savedPlansPageCount)

  useEffect(() => {
    if (savedPlansPage > savedPlansPageCount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedPlansPage(savedPlansPageCount)
    }
  }, [savedPlansPage, savedPlansPageCount])

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileSavedNotice(null)

    const trimmedName = nameInput.trim()
    const trimmedBirthDate = birthDateInput.trim()
    const succeeded = await onUpdateProfile({
      ...(trimmedName ? { displayName: trimmedName } : {}),
      birthDate: trimmedBirthDate ? trimmedBirthDate : null,
      gender: genderInput ?? null,
    })

    if (succeeded) {
      setProfileSavedNotice('프로필이 저장되었어요.')
    }
  }

  const currentUserName = currentUser?.name?.trim() || '사용자'
  const joinDateLabel = formatJoinDate(currentUser?.createdAt)
  const reactedSavedPlanCount = savedPlans.filter((plan) => getSavedPlanLike(plan.id) !== null).length
  const visibleSavedPlans = savedPlans.slice(
    (currentSavedPlansPage - 1) * SAVED_PLANS_PAGE_SIZE,
    currentSavedPlansPage * SAVED_PLANS_PAGE_SIZE,
  )
  const currentProviderTone = resolveProviderTone(currentProviderLabel)
  const isProviderLinked = (provider: SocialAuthProvider) =>
    currentUser?.provider === provider || socialAccounts.some((account) => account.provider === provider)
  const getSavedPlanShareUrl = (planId: string) => `${window.location.origin}/plans/${encodeURIComponent(planId)}`

  const shareSavedPlan = async (plan: SavedPlan) => {
    const shareUrl = getSavedPlanShareUrl(plan.id)

    try {
      if (!plan.isPublic) {
        const shouldPublish = window.confirm(
          '공유하려면 이 일정을 공개 일정으로 전환해야 합니다. 공개하면 링크를 가진 로그인 사용자가 읽기 전용으로 볼 수 있어요. 공유할까요?',
        )

        if (!shouldPublish) {
          return
        }

        if (!onShareSavedPlan) {
          setShareNotice('공유 설정을 변경할 수 없습니다. 잠시 후 다시 시도해 주세요.')
          return
        }

        const isPublished = await onShareSavedPlan(plan.id, true)

        if (!isPublished) {
          setShareNotice('공개 전환에 실패해 공유를 중단했어요.')
          return
        }
      }

      if (navigator.share) {
        await navigator.share({
          title: plan.title,
          text: `${plan.title} - Lovv 저장 일정`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }
      setShareNotice('공유 링크를 준비했어요.')
    } catch {
      setShareNotice('공유 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <section
                  aria-labelledby="mypage-title"
                  className="lovv-page-mypage mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
                >
                  <div className="mb-5 flex justify-start">
                    <button
                      type="button"
                      onClick={goHome}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      ← 이전으로 돌아가기
                    </button>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(320px,0.55fr)] gap-6 max-lg:grid-cols-1">
                    <section className="rounded-[24px] border border-white/70 bg-gradient-to-br from-[#fffffa]/92 via-[#FFF8F1]/82 to-[#EEF7F2]/62 p-7 shadow-[0_24px_58px_-42px_rgba(51,39,30,0.32)] backdrop-blur-xl">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                        My Lovv
                      </p>
                      <h1
                        id="mypage-title"
                        className="mt-4 break-keep text-[42px] font-black leading-[52px] text-[#33271E] max-sm:text-[32px] max-sm:leading-10"
                      >
                        마이페이지
                      </h1>
                      <p className="mt-5 max-w-[680px] break-keep text-base font-semibold leading-8 text-[#33271E] max-sm:text-sm max-sm:leading-7">
                        {currentUserName}님, 밑에 생성된 일정을 확인해보세요.
                      </p>
                      {preferenceNotice ? (
                        <p
                          role="status"
                          className="mt-5 rounded-[16px] border border-transparent bg-[#FFF0E4] px-5 py-3 text-sm font-black leading-6 text-[#33271E]"
                        >
                          {preferenceNotice}
                        </p>
                      ) : null}
                      {savedPlanNotice ? (
                        <p
                          role="status"
                          className="mt-5 rounded-[16px] border border-transparent bg-[#FFF0E4] px-5 py-3 text-sm font-black leading-6 text-[#33271E]"
                        >
                          {savedPlanNotice}
                        </p>
                      ) : null}

                      <div className="mt-8 grid grid-cols-2 gap-4 max-md:grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
                        <article className="flex min-h-[150px] flex-col justify-between rounded-[20px] border border-white/70 bg-gradient-to-br from-[#EEF7F2] to-[#fffffa] p-5 shadow-[0_18px_38px_-30px_rgba(45,90,61,0.28)] md:col-span-2 xl:col-span-1">
                          <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#2D5A3D]">
                              선택 테마
                            </p>
                            <p className="mt-3 break-keep text-lg font-black leading-7 text-[#33271E]">
                              {selectedPreferenceLabel}
                            </p>
                          </div>
                          <div className="mt-4 border-t border-[#2D5A3D]/10 pt-2">
                            <button
                              type="button"
                              onClick={openPreferenceEdit}
                              className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#2D5A3D]/20 bg-[#2D5A3D] px-3.5 text-xs font-black text-[#fffffa] transition hover:bg-[#3E704D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              테마 변경
                            </button>
                          </div>
                        </article>

                        <article className="flex min-h-[150px] flex-col justify-between rounded-[20px] border border-white/70 bg-gradient-to-br from-[#FFF0E4] to-[#fffffa] p-5 shadow-[0_18px_38px_-30px_rgba(243,107,18,0.28)]">
                          <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                              저장 일정
                            </p>
                            <p className="mt-3 break-keep text-2xl font-black leading-8 text-[#33271E]">
                              {savedPlans.length > 0 ? `${savedPlans.length}개` : '아직 없음'}
                            </p>
                          </div>
                        </article>

                        <article className="flex min-h-[150px] flex-col justify-between rounded-[20px] border border-white/70 bg-gradient-to-br from-[#F7EFE6] to-[#fffffa] p-5 shadow-[0_18px_38px_-30px_rgba(156,106,67,0.3)]">
                          <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#7A4D2A]">
                              반응 남긴 일정
                            </p>
                            <p className="mt-3 break-keep text-2xl font-black leading-8 text-[#33271E]">
                              {reactedSavedPlanCount > 0 ? `${reactedSavedPlanCount}개` : '아직 없음'}
                            </p>
                          </div>
                        </article>

                        <article className="flex min-h-[150px] flex-col justify-between rounded-[20px] border border-white/70 bg-gradient-to-br from-[#F8F3EA] to-[#fffffa] p-5 shadow-[0_18px_38px_-30px_rgba(51,39,30,0.18)]">
                          <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#6E5A50]">
                              가입일
                            </p>
                            <p className="mt-3 break-keep text-lg font-black leading-7 text-[#33271E]">
                              {joinDateLabel ?? '확인 불가'}
                            </p>
                          </div>
                        </article>
                      </div>

                      <section className="mt-8 rounded-[24px] border border-white/60 bg-gradient-to-br from-[#FFF7F0]/78 to-[#fffffa]/72 p-6 shadow-[0_18px_44px_-36px_rgba(51,39,30,0.22)] backdrop-blur-md">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#33271E]">저장한 일정</p>
                          </div>
                          <span className="rounded-[8px] border border-white/70 bg-[#fffffa]/90 px-3 py-1 text-[12px] font-black text-[#33271E] shadow-sm">
                            {savedPlans.length}개
                          </span>
                        </div>
                        {shareNotice ? (
                          <p aria-live="polite" className="mt-4 break-keep text-[12px] font-black leading-5 text-[#A92B10]">
                            {shareNotice}
                          </p>
                        ) : null}

                        {savedPlans.length > 0 ? (
                          <ol className="mt-5 grid gap-3" aria-label="저장 일정 목록">
                            {visibleSavedPlans.map((plan) => {
                              const isDeletePending = isSavedPlanDeletePending(plan.id)
                              const isSharePending = isSavedPlanSharePending?.(plan.id) ?? false

                              return (
                                <li
                                  key={plan.id}
                                  className="rounded-[16px] border border-white/40 bg-[#fffffa]/85 p-4 shadow-[0_12px_24px_-22px_rgba(51,39,30,0.2)] transition-colors hover:bg-[#fffffa]/95"
                                >
                                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-md:grid-cols-1">
                                    <div className="min-w-0">
                                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#A92B10]">
                                        Saved itinerary
                                      </p>
                                      <h3 className="mt-2 break-keep text-lg font-black leading-7 text-[#33271E]">
                                        {plan.title}
                                      </h3>
                                      <p className="mt-1 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                                        {plan.cityPair} · {plan.durationLabel} · {plan.themeTag}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
                                      <button
                                        type="button"
                                        onClick={() => openSavedPlanDetail(plan.id)}
                                        className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-white/60 bg-[#FFF8F6]/85 px-4 text-sm font-black text-[#33271E] transition hover:border-[#F36B12]/40 hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                      >
                                        상세 보기
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={`${plan.title} 삭제`}
                                        disabled={isDeletePending}
                                        onClick={() => onDeleteSavedPlan(plan.id)}
                                        className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-white/60 bg-[#fffffa]/70 px-4 text-sm font-black text-[#A92B10] transition hover:border-[#A92B10]/40 hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                      >
                                        {isDeletePending ? '삭제 중' : '삭제'}
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isSharePending}
                                    onClick={() => {
                                      void shareSavedPlan(plan)
                                    }}
                                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-[10px] border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                  >
                                    {isSharePending ? '공개 전환 중' : '공유하기'}
                                  </button>
                                </li>
                              )
                            })}
                          </ol>
                        ) : (
                          <div className="mt-5 rounded-[16px] border border-white/45 bg-[#fffffa]/80 p-5 shadow-sm">
                            <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                              저장한 일정이 아직 없습니다.
                            </p>
                            <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                              AI 일정 챗봇에서 마음에 드는 일정을 저장하면 이곳에서 다시 보고 공유할 수 있어요.
                            </p>
                          </div>
                        )}
                        {savedPlansPageCount > 1 ? (
                          <nav
                            aria-label="저장 일정 페이지 이동"
                            className="mt-5 flex items-center justify-center gap-3"
                          >
                            <button
                              type="button"
                              aria-label="이전 저장 일정 페이지"
                              disabled={currentSavedPlansPage === 1}
                              onClick={() => setSavedPlansPage((page) => Math.max(1, page - 1))}
                              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.5} />
                            </button>
                            <span
                              aria-live="polite"
                              className="min-w-16 text-center text-sm font-black tabular-nums text-[#33271E]"
                            >
                              {currentSavedPlansPage} / {savedPlansPageCount}
                            </span>
                            <button
                              type="button"
                              aria-label="다음 저장 일정 페이지"
                              disabled={currentSavedPlansPage === savedPlansPageCount}
                              onClick={() =>
                                setSavedPlansPage((page) => Math.min(savedPlansPageCount, page + 1))
                              }
                              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              <ChevronRight aria-hidden="true" size={18} strokeWidth={2.5} />
                            </button>
                          </nav>
                        ) : null}
                      </section>


                    </section>

                    <aside className="rounded-[24px] border border-white/60 bg-white/40 p-7 shadow-[0_22px_50px_-24px_rgba(51,39,30,0.25)] backdrop-blur-2xl">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                        My Account
                      </p>
                      <div className="mt-5 flex items-center gap-4">
                        <span className="flex size-14 items-center justify-center rounded-full border border-white/60 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-xl font-black text-[#33271E] shadow-[0_10px_22px_-16px_rgba(51,39,30,0.5)]">
                          {currentUser?.avatarInitial ?? 'M'}
                        </span>
                        <div className="min-w-0">
                          <p className="break-keep text-lg font-black text-[#33271E]">
                            {currentUser?.name ?? 'Mock User'}
                          </p>
                          <p className="mt-1 break-all text-sm font-semibold text-[#33271E]/70">
                            {currentUser?.email ?? 'mock@lovv.local'}
                          </p>
                        </div>
                      </div>
                      
                      {/* 연동 상태 */}
                      <div className="mt-7 rounded-[20px] border border-white/60 bg-gradient-to-br from-[#fffffa]/82 to-[#FFF0E4]/54 p-5 shadow-[0_12px_30px_-24px_rgba(51,39,30,0.15)] backdrop-blur-md">
                        <p className="text-sm font-black text-[#33271E]">연동 상태</p>
                        <div
                          className={`mt-3 inline-flex min-h-10 max-w-full min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-sm font-black shadow-sm ${
                            currentProviderTone === 'kakao'
                              ? 'border-[#F2D741] bg-[#FEE500] text-[#191600]'
                              : currentProviderTone === 'google'
                                ? 'border-white/80 bg-[#fffffa] text-[#33271E]'
                                : 'border-white/70 bg-[#FFF0E4] text-[#33271E]'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
                              currentProviderTone === 'kakao'
                                ? 'bg-[#191600] text-[#FEE500]'
                                : currentProviderTone === 'google'
                                  ? 'bg-white text-[#4285F4] shadow-[inset_0_0_0_1px_rgba(51,39,30,0.12)]'
                                  : 'bg-[#F36B12] text-[#33271E]'
                            }`}
                          >
                            {currentProviderTone === 'kakao' ? 'k' : currentProviderTone === 'google' ? 'G' : 'L'}
                          </span>
                          <span className="min-w-0 truncate">{currentProviderLabel}</span>
                        </div>
                        <p className="mt-3 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                          소셜 로그인 정보는 Lovv 계정 식별에만 사용합니다.
                        </p>
                      </div>

                      {/* 계정 연결 */}
                      {canLinkSocialAccounts ? (
                        <div className="mt-5 rounded-[20px] border border-white/50 bg-white/50 p-5 shadow-[0_12px_30px_-24px_rgba(51,39,30,0.15)] backdrop-blur-md">
                          <p className="text-sm font-black text-[#33271E]">계정 연결</p>
                          <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                            Google과 Kakao 계정을 함께 연결하면 어느 쪽으로 로그인해도 같은 계정을 사용할 수 있어요.
                          </p>
                          <div className="mt-4 grid gap-2">
                            {(['google', 'kakao'] as const).map((provider) => {
                              const linked = isProviderLinked(provider)
                              const isLinking = linkingProvider === provider

                              return (
                                <div
                                  key={provider}
                                  className="flex items-center justify-between gap-3 rounded-[14px] border border-white/60 bg-[#fffffa]/80 px-4 py-3"
                                >
                                  <span className="text-sm font-black text-[#33271E]">
                                    {socialProviderLabels[provider]}
                                  </span>
                                  {linked ? (
                                    <span className="rounded-full bg-[#FFE0CA] px-3 py-1 text-[12px] font-black text-[#A92B10]">
                                      연결됨
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isLinking}
                                      onClick={() => onLinkProvider(provider)}
                                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/70 bg-[#fffffa]/80 px-4 text-[12px] font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                    >
                                      {isLinking ? '연결 중' : '연결하기'}
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          {accountLinkNotice ? (
                            <p role="status" className="mt-3 break-keep text-[12px] font-bold leading-5 text-[#A92B10]">
                              {accountLinkNotice}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {/* 프로필 수정 폼 */}
                      <form
                        onSubmit={handleProfileSubmit}
                        className="mt-5 rounded-[20px] border border-white/50 bg-white/50 p-5 shadow-[0_12px_30px_-24px_rgba(51,39,30,0.15)] backdrop-blur-md"
                      >
                        <p className="text-sm font-black text-[#33271E]">프로필 수정</p>
                        <label className="mt-4 block text-[12px] font-black text-[#33271E]" htmlFor="mypage-profile-name">
                          이름
                        </label>
                        <input
                          id="mypage-profile-name"
                          type="text"
                          value={nameInput}
                          onChange={(event) => setNameInput(event.target.value)}
                          className="mt-2 w-full rounded-[12px] border border-white/80 bg-[#fffffa]/80 px-3 py-2.5 text-sm font-semibold text-[#33271E] transition-all focus:border-[#F36B12] focus:bg-white focus-visible:outline-none"
                        />
                        <label
                          className="mt-4 block text-[12px] font-black text-[#33271E]"
                          htmlFor="mypage-profile-birth-date"
                        >
                          생년월일 (선택)
                        </label>
                        <input
                          id="mypage-profile-birth-date"
                          type="date"
                          value={birthDateInput ?? ''}
                          onChange={(event) => setBirthDateInput(event.target.value)}
                          className="mt-2 w-full rounded-[12px] border border-white/80 bg-[#fffffa]/80 px-3 py-2.5 text-sm font-semibold text-[#33271E] transition-all focus:border-[#F36B12] focus:bg-white focus-visible:outline-none"
                        />
                        <span className="mt-4 block text-[12px] font-black text-[#33271E]">성별 (선택)</span>
                        <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="성별">
                          {(['남', '여'] as const).map((option) => {
                            const isActive = genderInput === option
                            return (
                              <button
                                key={option}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setGenderInput(isActive ? null : option)}
                                className={`inline-flex min-h-10 items-center justify-center rounded-[12px] border px-3 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                                  isActive
                                    ? 'border-[#A92B10] bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-[#33271E]'
                                    : 'border-white/80 bg-[#fffffa]/80 text-[#33271E] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
                                }`}
                              >
                                {option}
                              </button>
                            )
                          })}
                        </div>
                        {profileUpdateError ? (
                          <p role="alert" className="mt-3 break-keep text-[12px] font-bold leading-5 text-[#A92B10]">
                            {profileUpdateError}
                          </p>
                        ) : null}
                        {profileSavedNotice ? (
                          <p role="status" className="mt-3 break-keep text-[12px] font-bold leading-5 text-[#33271E]">
                            {profileSavedNotice}
                          </p>
                        ) : null}
                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-sm font-black text-[#33271E] transition shadow-sm hover:scale-[1.01] hover:shadow-md disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          {isUpdatingProfile ? '저장 중' : '저장하기'}
                        </button>
                      </form>

                      {/* 하단 이동/로그아웃 버튼 */}
                      <div className="mt-7 grid gap-3">
                        <button
                          type="button"
                          onClick={goHome}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-5 text-sm font-black text-[#33271E] transition shadow-sm hover:scale-[1.01] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          메인으로 돌아가기
                        </button>
                        <button
                          type="button"
                          onClick={signOut}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/70 bg-white/60 px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          로그아웃
                        </button>
                      </div>
                      {currentUser?.roles?.includes('R-ADMIN') ? (
                        <a
                          href="https://admin.lovv.site/"
                          className="mt-5 block text-center text-[10px] font-semibold text-[#6E5A50]/55 underline-offset-2 transition hover:text-[#A92B10] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          aria-label="Lovv 관리자 콘솔로 이동"
                        >
                          Admin
                        </a>
                      ) : null}
                    </aside>
                  </div>
                </section>
  )
}

// EOF: MyPageView.tsx
