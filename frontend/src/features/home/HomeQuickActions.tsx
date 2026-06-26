/**
 * @file HomeQuickActions.tsx
 * @description Floating quick actions component.
 * @lastModified 2026-06-24
 */

import { ArrowUp, Sparkles, Menu, X } from 'lucide-react'
import { useUiToggleStore } from '../../shared/store/uiToggleStore'

type HomeQuickActionsProps = {
  onOpenChatFromQuickAction: () => void
  onScrollToTop: () => void
}

export function HomeQuickActions({
  onOpenChatFromQuickAction,
  onScrollToTop,
}: HomeQuickActionsProps) {
  const isQuickActionsOpen = useUiToggleStore((state) => state.isQuickActionsOpen)
  const toggleQuickActions = useUiToggleStore((state) => state.toggleQuickActions)

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3.5 max-sm:bottom-4 max-sm:right-4">
      {isQuickActionsOpen ? (
        <div className="flex flex-col items-end gap-2.5">
          <button
            type="button"
            aria-label="AI 일정 짜기 바로가기"
            onClick={onOpenChatFromQuickAction}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-20px_rgba(51,39,30,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            <Sparkles className="size-4 fill-[#33271E]/20 text-[#33271E]" />
            AI 일정 짜기
          </button>
          <button
            type="button"
            aria-label="맨 위로 이동"
            onClick={onScrollToTop}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/60 bg-white/70 px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-22px_rgba(51,39,30,0.22)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            <ArrowUp className="size-4 text-[#A92B10]" />
            맨 위로
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-label={isQuickActionsOpen ? '빠른 이동 메뉴 닫기' : '빠른 이동 메뉴 열기'}
        aria-expanded={isQuickActionsOpen}
        onClick={toggleQuickActions}
        className="flex size-14 items-center justify-center rounded-full border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-xl font-black text-[#33271E] shadow-[0_18px_42px_-20px_rgba(243,107,18,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-16px_rgba(243,107,18,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
      >
        {isQuickActionsOpen ? (
          <X className="size-6 text-[#33271E]" />
        ) : (
          <Menu className="size-6 text-[#33271E]" />
        )}
      </button>
    </div>
  )
}
