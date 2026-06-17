/**
 * @file uiToggleStore.ts
 * @description Zustand store for pure UI on/off toggle state that has no business-flow
 * logic attached to it. Deliberately scoped narrow: only state where the value itself is a
 * simple open/close flag flipped by a simple setter qualifies. Business-flow callbacks
 * (submitChatMessage, openPlanDetailView, saveGeneratedPlan, etc.) and business-derived
 * notice strings (savedPlanNotice, preferenceNotice) stay as plain useState/props in App.tsx
 * by design, since moving them here would make store-action mocking in tests harder and
 * increase coupling between components.
 * @lastModified 2026-06-16
 */

import { create } from 'zustand'
import type { LegalNoticeType } from '../components/legalNoticeContent'

type UiToggleState = {
  isQuickActionsOpen: boolean
  isSessionMenuOpen: boolean
  activeLegalNoticeType: LegalNoticeType | null
}

type UiToggleActions = {
  toggleQuickActions: () => void
  closeQuickActions: () => void
  toggleSessionMenu: () => void
  closeSessionMenu: () => void
  openLegalNotice: (noticeType: LegalNoticeType) => void
  closeLegalNotice: () => void
  reset: () => void
}

const initialState: UiToggleState = {
  isQuickActionsOpen: false,
  isSessionMenuOpen: false,
  activeLegalNoticeType: null,
}

export const useUiToggleStore = create<UiToggleState & UiToggleActions>((set) => ({
  ...initialState,
  toggleQuickActions: () => set((state) => ({ isQuickActionsOpen: !state.isQuickActionsOpen })),
  closeQuickActions: () => set({ isQuickActionsOpen: false }),
  toggleSessionMenu: () => set((state) => ({ isSessionMenuOpen: !state.isSessionMenuOpen })),
  closeSessionMenu: () => set({ isSessionMenuOpen: false }),
  openLegalNotice: (noticeType) => set({ activeLegalNoticeType: noticeType }),
  closeLegalNotice: () => set({ activeLegalNoticeType: null }),
  reset: () => set(initialState),
}))

// EOF: uiToggleStore.ts
