/**
 * @file AppHeader.tsx
 * @description Header component containing the site logo, central navigation buttons, and user session menu.
 * @lastModified 2026-06-23
 */

import logoImage from '../../assets/lovv-logo.png'
import type { MouseEvent } from 'react'
import type { LovvUser } from '../types/app'
import { useUiToggleStore } from '../store/uiToggleStore'
import { User, LogOut } from 'lucide-react'
import type { View } from '../types/app'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'

type AppHeaderProps = {
  goHome: (event?: MouseEvent<HTMLElement>) => void
  currentProviderLabel: string
  currentUser: LovvUser | null
  openMyPage: () => void
  signOut: () => void
  activeView: View
  openMap: () => void
  openPlanner: () => void
  openRecommendation: () => void
}

/**
 * Shared AppHeader navigation component.
 */
export function AppHeader({
  goHome,
  currentProviderLabel,
  currentUser,
  openMyPage,
  signOut,
  activeView,
  openMap,
  openPlanner,
  openRecommendation,
}: AppHeaderProps) {
  const { t } = useTranslation()
  // Session menu state from central store
  const isSessionMenuOpen = useUiToggleStore((state) => state.isSessionMenuOpen)
  const toggleSessionMenu = useUiToggleStore((state) => state.toggleSessionMenu)
  const headerFontClass =
    activeView === 'planner' || activeView === 'chat'
      ? 'lovv-font-suit'
      : activeView === 'map' || activeView === 'mypage'
        ? 'lovv-font-numeric'
        : 'lovv-font-pretendard'

  return (
    <header className={`fixed inset-x-0 top-0 z-20 border-b border-white/60 bg-white/40 shadow-[0_8px_32px_-24px_rgba(51,39,30,0.25)] backdrop-blur-2xl ${headerFontClass}`}>
      <div className="relative mx-auto flex items-center min-h-[58px] max-w-[1440px] px-9 py-1 max-lg:px-8 max-sm:px-4">
        {/* Left: Logo */}
        <div className="flex justify-start">
          <a
            href="/home"
            aria-label="Lovv home"
            onClick={goHome}
            className="flex h-10 w-[74px] shrink-0 items-center overflow-hidden"
          >
            <img src={logoImage} alt="Lovv" className="h-full w-full object-contain" />
          </a>
        </div>

        {/* Left: Navigation */}
        <nav className="ml-8 flex items-center gap-7 max-lg:gap-5 max-sm:ml-4 max-sm:gap-3" role="navigation" aria-label="메인 메뉴">
          <button
            type="button"
            onClick={openMap}
            className={`min-h-10 text-sm font-bold transition-all relative py-1 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] max-sm:text-[12px] ${
              activeView === 'map'
                ? 'text-[#F36B12] font-black'
                : 'text-[#33271E] hover:text-[#F36B12]'
            }`}
          >
            {t('common.search_cities')}
            {activeView === 'map' && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#F36B12]" />
            )}
          </button>
          <button
            type="button"
            onClick={openPlanner}
            className={`min-h-10 text-sm font-bold transition-all relative py-1 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] max-sm:text-[12px] ${
              activeView === 'planner' || activeView === 'chat'
                ? 'text-[#F36B12] font-black'
                : 'text-[#33271E] hover:text-[#F36B12]'
            }`}
          >
            {t('common.plan_itinerary')}
            {(activeView === 'planner' || activeView === 'chat') && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#F36B12]" />
            )}
          </button>
          <button
            type="button"
            onClick={openRecommendation}
            className={`min-h-10 text-sm font-bold transition-all relative py-1 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] max-sm:text-[12px] ${
              activeView === 'recommendation'
                ? 'text-[#F36B12] font-black'
                : 'text-[#33271E] hover:text-[#F36B12]'
            }`}
          >
            {t('common.recommendation')}
            {activeView === 'recommendation' && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#F36B12]" />
            )}
          </button>
        </nav>

        {/* Right: Session Menu & Language Selector */}
        <div className="ml-auto flex items-center justify-end gap-3.5">
          <LanguageSelector />
          <div className="relative shrink-0">
            {/* Avatar single button representation for accessibility and consistency */}
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

            {/* Session dropdown menu overlay (Liquid glass style) */}
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
                {t('common.mypage')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="inline-flex min-h-10 w-full items-center justify-start gap-2.5 rounded-[14px] px-3.5 text-sm font-bold text-[#A92B10] transition-colors hover:bg-[#FFE0CA]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33271E]"
              >
                <LogOut className="size-4 shrink-0 text-[#A92B10]" />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// EOF: AppHeader.tsx
