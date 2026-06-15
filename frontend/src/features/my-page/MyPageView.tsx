import { useEffect } from 'react'
import type { MouseEvent } from 'react'
import type { LovvUser, SavedPlanLike, SavedPlan } from '../../shared/types/app'
import { SavedPlanLikeControls } from '../saved-plans/SavedPlanLikeControls'

type MyPageViewProps = {
  goHome: (event?: MouseEvent<HTMLElement>) => void
  currentProviderLabel: string
  selectedPreferenceLabel: string
  savedPlanNotice: string | null
  preferenceNotice: string | null
  selectedPreferenceEditorialNotes: string
  selectedThemeHashtags: string[]
  currentUser: LovvUser | null
  savedPlans: SavedPlan[]
  getSavedPlanLike: (planId: string) => SavedPlanLike
  onSelectSavedPlanLike: (planId: string, like: Exclude<SavedPlanLike, null>) => void
  getSavedPlanLikeError: (planId: string) => string | null
  isSavedPlanLikePending: (planId: string) => boolean
  isSavedPlanDeletePending: (planId: string) => boolean
  openSavedPlanDetail: (planId: string) => void
  onDeleteSavedPlan: (planId: string) => void
  openPreferenceEdit: () => void
  signOut: () => void
}

export function MyPageView({
  goHome,
  currentProviderLabel,
  selectedPreferenceLabel,
  savedPlanNotice,
  preferenceNotice,
  selectedPreferenceEditorialNotes,
  selectedThemeHashtags,
  currentUser,
  savedPlans,
  getSavedPlanLike,
  onSelectSavedPlanLike,
  getSavedPlanLikeError,
  isSavedPlanLikePending,
  isSavedPlanDeletePending,
  openSavedPlanDetail,
  onDeleteSavedPlan,
  openPreferenceEdit,
  signOut,
}: MyPageViewProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const currentUserName = currentUser?.name?.trim() || '사용자'

  return (
    <section
                  aria-labelledby="mypage-title"
                  className="mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
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
                    <section className="rounded-[22px] border border-transparent bg-[#fffffa] p-7 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
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

                      <div className="mt-8 grid grid-cols-3 gap-4 max-md:grid-cols-1">
                        {[
                          { label: '로그인 방식', value: currentProviderLabel },
                          { label: '선택 취향', value: selectedPreferenceLabel },
                          { label: '저장 일정', value: savedPlans.length > 0 ? `${savedPlans.length}개` : '아직 없음' },
                        ].map((item) => (
                          <article
                            key={item.label}
                            className="rounded-[18px] border border-transparent bg-[#FFF0E4] p-5"
                          >
                            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                              {item.label}
                            </p>
                            <p className="mt-3 break-keep text-lg font-black leading-7 text-[#33271E]">
                              {item.value}
                            </p>
                          </article>
                        ))}
                      </div>

                      <section className="mt-8 rounded-[20px] border border-transparent bg-[#FFF0E4] p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#33271E]">저장한 일정</p>
                            <h2 className="mt-3 break-keep text-[28px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                              리뷰할 여정
                            </h2>
                          </div>
                          <span className="rounded-[5px] bg-[#fffffa] px-3 py-1 text-[12px] font-black text-[#33271E]">
                            {savedPlans.length}개
                          </span>
                        </div>

                        {savedPlans.length > 0 ? (
                          <ol className="mt-5 grid gap-3" aria-label="저장 일정 목록">
                            {savedPlans.map((plan) => {
                              const likeTitleId = `saved-plan-like-${plan.id}`
                              const isDeletePending = isSavedPlanDeletePending(plan.id)

                              return (
                                <li
                                  key={plan.id}
                                  className="rounded-[14px] border border-transparent bg-[#fffffa] p-4 shadow-[0_12px_24px_-22px_rgba(51,39,30,0.28)]"
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
                                        className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-[#F3B489] bg-[#FFF8F6] px-4 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                      >
                                        상세 보기
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={`${plan.title} 삭제`}
                                        disabled={isDeletePending}
                                        onClick={() => onDeleteSavedPlan(plan.id)}
                                        className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-black text-[#A92B10] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                      >
                                        {isDeletePending ? '삭제 중' : '삭제'}
                                      </button>
                                    </div>
                                  </div>
                                  <p
                                    id={likeTitleId}
                                    className="mt-4 break-keep text-[12px] font-black text-[#33271E]"
                                  >
                                    이 일정은 어땠나요?
                                  </p>
                                  <div className="mt-2">
                                    <SavedPlanLikeControls
                                      planId={plan.id}
                                      like={getSavedPlanLike(plan.id)}
                                      onSelectLike={onSelectSavedPlanLike}
                                      pending={isSavedPlanLikePending(plan.id)}
                                      errorMessage={getSavedPlanLikeError(plan.id)}
                                      compact
                                      labelledBy={likeTitleId}
                                    />
                                  </div>
                                </li>
                              )
                            })}
                          </ol>
                        ) : (
                          <div className="mt-5 rounded-[14px] border border-transparent bg-[#fffffa] p-5">
                            <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                              저장한 일정이 아직 없습니다.
                            </p>
                            <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                              AI 일정 챗봇에서 마음에 드는 일정을 저장하면 이곳에서 좋아요 피드백을 남길 수 있어요.
                            </p>
                          </div>
                        )}
                      </section>

                      <div className="mt-8 rounded-[20px] border border-transparent bg-[#FFF0E4] p-6">
                        <p className="text-sm font-black text-[#33271E]">선택한 여행 분위기</p>
                        <h2 className="mt-3 break-keep text-[30px] font-black leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                          {selectedPreferenceLabel}
                        </h2>
                        <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                          {selectedPreferenceEditorialNotes}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {selectedThemeHashtags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex min-h-[34px] items-center rounded-full bg-[#fffffa] px-4 py-1 text-[12px] font-bold text-[#33271E]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={openPreferenceEdit}
                          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                        >
                          취향 다시 고르기
                        </button>
                      </div>
                    </section>

                    <aside className="rounded-[22px] border border-transparent bg-[#fffffa] p-7 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                        My Account
                      </p>
                      <div className="mt-5 flex items-center gap-4">
                        <span className="flex size-14 items-center justify-center rounded-full bg-[#F36B12] text-xl font-black text-[#33271E] shadow-[0_10px_22px_-16px_rgba(51,39,30,0.5)]">
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
                      <div className="mt-7 rounded-[18px] border border-transparent bg-[#FFF0E4] p-5">
                        <p className="text-sm font-black text-[#33271E]">연동 상태</p>
                        <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                          {currentProviderLabel}로 로그인되어 있습니다.
                        </p>
                      </div>
                      <div className="mt-7 grid gap-3">
                        <button
                          type="button"
                          onClick={goHome}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          메인으로 돌아가기
                        </button>
                        <button
                          type="button"
                          onClick={signOut}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          로그아웃
                        </button>
                      </div>
                    </aside>
                  </div>
                </section>
  )
}
