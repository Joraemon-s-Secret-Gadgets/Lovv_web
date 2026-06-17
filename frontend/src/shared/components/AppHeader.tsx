import logoImage from '../../assets/lovv-logo.png'
import type { MouseEvent } from 'react'
import type { LovvUser } from '../types/app'
import { useUiToggleStore } from '../store/uiToggleStore'
import { User, LogOut } from 'lucide-react'

type AppHeaderProps = {
  goHome: (event?: MouseEvent<HTMLElement>) => void
  currentProviderLabel: string
  currentUser: LovvUser | null
  openMyPage: () => void
  signOut: () => void
}

export function AppHeader({
  goHome,
  currentProviderLabel,
  currentUser,
  openMyPage,
  signOut,
}: AppHeaderProps) {
  const isSessionMenuOpen = useUiToggleStore((state) => state.isSessionMenuOpen)
  const toggleSessionMenu = useUiToggleStore((state) => state.toggleSessionMenu)

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/60 bg-white/40 shadow-[0_12px_40px_-30px_rgba(51,39,30,0.3)] backdrop-blur-2xl">
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
            {/* 아바타 단독 버튼으로 구성하여 Figma 디자인 유지 및 테스트 호환성 확보 */}
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isSessionMenuOpen}
              aria-label={`현재 세션: ${currentProviderLabel} 메뉴 열기`}
              onClick={toggleSessionMenu}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/50 bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_4px_14px_-4px_rgba(243,107,18,0.4)] transition-all duration-200 hover:scale-105 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#fffffa]/95 text-[12px] font-black text-[#A92B10] shadow-sm">
                {currentUser?.avatarInitial ?? 'M'}
              </span>
            </button>

            {/* 세션 메뉴 (리퀴드 글래스 질감 반영) */}
            <div
              role="menu"
              aria-label="세션 메뉴"
              className={`absolute right-0 top-[calc(100%+10px)] z-30 grid min-w-[180px] gap-1.5 rounded-[20px] border border-white/70 bg-white/75 p-2 shadow-[0_20px_50px_-24px_rgba(51,39,30,0.35)] backdrop-blur-xl transition-all duration-150 origin-top-right ${
                isSessionMenuOpen
                  ? 'visible opacity-100 scale-100 translate-y-0'
                  : 'invisible opacity-0 scale-95 -translate-y-1'
              }`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={openMyPage}
                className="inline-flex min-h-10 w-full items-center justify-start gap-2.5 rounded-[14px] px-3.5 text-sm font-bold text-[#33271E] transition-colors hover:bg-[#FFF0E4]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33271E]"
              >
                <User className="size-4 shrink-0 text-[#A92B10]" />
                마이페이지
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="inline-flex min-h-10 w-full items-center justify-start gap-2.5 rounded-[14px] px-3.5 text-sm font-bold text-[#A92B10] transition-colors hover:bg-[#FFE0CA]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33271E]"
              >
                <LogOut className="size-4 shrink-0 text-[#A92B10]" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
