/**
 * @file AppHeader.tsx
 * @description Header component containing the site logo, central navigation buttons, and user session menu.
 * @lastModified 2026-06-23
 */

import logoImage from '../../assets/lovv-logo.png'
import { useState, type MouseEvent } from 'react'
import type { LovvUser } from '../types/app'
import { useUiToggleStore } from '../store/uiToggleStore'
import { User, LogOut, Menu, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Session menu state from central store
  const isSessionMenuOpen = useUiToggleStore((state) => state.isSessionMenuOpen)
  const toggleSessionMenu = useUiToggleStore((state) => state.toggleSessionMenu)
  const headerFontClass =
    activeView === 'planner' || activeView === 'chat'
      ? 'lovv-font-suit'
      : activeView === 'map' || activeView === 'mypage'
        ? 'lovv-font-numeric'
        : 'lovv-font-pretendard'

  const handleMobileNavClick = (callback: () => void) => {
    setIsMobileMenuOpen(false)
    callback()
  }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/40 shadow-[0_8px_32px_-24px_rgba(51,39,30,0.25)] backdrop-blur-2xl ${headerFontClass}`}>
      <div className="relative mx-auto flex items-center min-h-[58px] max-w-[1440px] px-9 py-1 max-lg:px-8 max-sm:px-4">
        {/* Left: Logo */}
        <div className="flex justify-start">
          <a
            href="/home"
            aria-label="Lovv home"
            onClick={(e) => {
              setIsMobileMenuOpen(false)
              goHome(e)
            }}
            className="flex h-10 w-[74px] shrink-0 items-center overflow-hidden"
          >
            <img src={logoImage} alt="Lovv" className="h-full w-full object-contain" />
          </a>
        </div>

        {/* Left: Navigation (Desktop only) */}
        <nav className="ml-8 hidden md:flex items-center gap-7 max-lg:gap-5" role="navigation" aria-label="메인 메뉴">
          <button
            type="button"
            onClick={openMap}
            className={`min-h-10 text-sm font-bold transition-all relative py-1 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
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
            className={`min-h-10 text-sm font-bold transition-all relative py-1 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
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
            className={`min-h-10 text-sm font-bold transition-all relative py-1 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
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
          
          {/* Desktop User Avatar */}
          <div className="relative shrink-0 hidden md:block">
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

            {/* Session dropdown menu overlay */}
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

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label="모바일 내비게이션 토글"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/50 bg-[#fffffa]/60 text-[#33271E] shadow-sm transition hover:border-[#F3B489] hover:bg-[#FFF0E4]/40 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            {isMobileMenuOpen ? <X className="size-5 text-[#A92B10]" /> : <Menu className="size-5 text-[#A92B10]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="border-t border-white/30 bg-[#fffffa]/95 px-6 py-5 shadow-inner backdrop-blur-2xl md:hidden animate-[lovv-chip-in_0.2s_ease-out] flex flex-col gap-5">
          <nav className="flex flex-col gap-1.5" role="navigation" aria-label="모바일 메인 메뉴">
            <button
              type="button"
              onClick={() => handleMobileNavClick(openMap)}
              className={`flex min-h-12 w-full items-center rounded-[14px] px-4 text-base font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
                activeView === 'map'
                  ? 'bg-[#FFF0E4] text-[#F36B12] font-black'
                  : 'text-[#33271E] hover:bg-[#FFF0E4]/40'
              }`}
            >
              {t('common.search_cities')}
            </button>
            <button
              type="button"
              onClick={() => handleMobileNavClick(openPlanner)}
              className={`flex min-h-12 w-full items-center rounded-[14px] px-4 text-base font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
                activeView === 'planner' || activeView === 'chat'
                  ? 'bg-[#FFF0E4] text-[#F36B12] font-black'
                  : 'text-[#33271E] hover:bg-[#FFF0E4]/40'
              }`}
            >
              {t('common.plan_itinerary')}
            </button>
            <button
              type="button"
              onClick={() => handleMobileNavClick(openRecommendation)}
              className={`flex min-h-12 w-full items-center rounded-[14px] px-4 text-base font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
                activeView === 'recommendation'
                  ? 'bg-[#FFF0E4] text-[#F36B12] font-black'
                  : 'text-[#33271E] hover:bg-[#FFF0E4]/40'
              }`}
            >
              {t('common.recommendation')}
            </button>
          </nav>

          <hr className="border-t border-[#F3B489]/20" />

          {/* User Session Block on Mobile Drawer */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F36B12] text-sm font-black text-[#fffffa]">
                {currentUser?.avatarInitial ?? 'M'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#33271E]">
                  {currentUser?.name ?? 'Guest User'}
                </p>
                <p className="truncate text-[11px] font-semibold text-[#6E5A50]/70">
                  {currentProviderLabel} 계정
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => handleMobileNavClick(openMyPage)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-[#F3B489]/40 bg-[#fffffa] text-sm font-black text-[#33271E] transition hover:bg-[#FFF0E4]/40"
              >
                <User className="size-4 text-[#A92B10]" />
                {t('common.mypage')}
              </button>
              <button
                type="button"
                onClick={() => handleMobileNavClick(signOut)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-[#F3B489]/40 bg-[#fffffa] text-sm font-black text-[#A92B10] transition hover:bg-[#FFE0CA]/40"
              >
                <LogOut className="size-4 text-[#A92B10]" />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// EOF: AppHeader.tsx
