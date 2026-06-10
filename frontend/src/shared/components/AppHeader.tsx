import logoImage from '../../assets/lovv-logo.png'
import type { MouseEvent } from 'react'
import type { LovvUser } from '../types/app'

type AppHeaderProps = {
  goHome: (event?: MouseEvent<HTMLElement>) => void
  currentProviderLabel: string
  currentUser: LovvUser | null
  isSessionMenuOpen: boolean
  toggleSessionMenu: () => void
  openMyPage: () => void
  signOut: () => void
}

export function AppHeader({
  goHome,
  currentProviderLabel,
  currentUser,
  isSessionMenuOpen,
  toggleSessionMenu,
  openMyPage,
  signOut,
}: AppHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-[#F3B489]/35 bg-white/95 shadow-[0_3px_10.5px_rgba(51,39,30,0.05)] backdrop-blur">
                <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center gap-3 px-9 py-2 max-lg:px-8 max-sm:px-5">
                  <a
                    href="/home"
                    aria-label="Lovv home"
                    onClick={goHome}
                    className="flex h-14 w-[104px] shrink-0 items-center overflow-hidden"
                  >
                    <img src={logoImage} alt="Lovv" className="h-full w-full object-contain" />
                  </a>

                  <div className="min-w-0 flex-1" />

                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 max-sm:w-auto">
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={isSessionMenuOpen}
                        aria-label={`현재 세션: ${currentProviderLabel} 메뉴 열기`}
                        onClick={toggleSessionMenu}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_3px_10.5px_rgba(51,39,30,0.05)] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        {currentUser?.avatarInitial ?? 'M'}
                      </button>
                      {isSessionMenuOpen ? (
                        <div
                          role="menu"
                          aria-label="세션 메뉴"
                          className="absolute right-0 top-[calc(100%+10px)] z-30 grid min-w-[168px] gap-2 rounded-[18px] border border-transparent bg-white/95 p-2 shadow-[0_18px_42px_-24px_rgba(51,39,30,0.42)] backdrop-blur"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={openMyPage}
                            className="inline-flex min-h-10 w-full items-center justify-start rounded-[14px] px-4 text-sm font-bold text-[#33271E] transition hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            마이페이지
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={signOut}
                            className="inline-flex min-h-10 w-full items-center justify-start rounded-[14px] px-4 text-sm font-bold text-[#A92B10] transition hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            로그아웃
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </header>
  )
}
