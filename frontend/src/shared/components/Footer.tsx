/**
 * @file Footer.tsx
 * @description Footer component containing copyright information and links to legal notice dialogs (Terms, Privacy, Contact).
 * @lastModified 2026-06-25
 */

import { useUiToggleStore } from '../store/uiToggleStore'
import { FileText, ShieldCheck, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Shared Footer navigation component.
 */
export function Footer() {
  const { t } = useTranslation()
  const onOpenLegalNotice = useUiToggleStore((state) => state.openLegalNotice)

  return (
    <footer className="mx-auto max-w-[1440px] px-16 pb-12 pt-4 max-lg:px-8 max-sm:px-5" role="contentinfo">
      {/* Liquid Glassmorphism container border styling */}
      <div className="grid gap-6 rounded-[24px] border border-white/70 bg-white/20 px-8 py-6 shadow-[0_22px_56px_-32px_rgba(51,39,30,0.15)] backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-[#33271E]">Lovv</span>
          </div>
          <p className="mt-2.5 break-keep text-[11px] font-semibold leading-5 text-[#33271E]/60">
            {t('common.copyright')} {t('common.tagline')}
          </p>
        </div>

        <nav aria-label="Lovv footer links" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-[#33271E]/90">
          <button
            type="button"
            onClick={() => onOpenLegalNotice('terms')}
            className="inline-flex items-center gap-1.5 rounded-full transition-colors hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            <FileText className="size-3.5 text-[#33271E]/50" />
            {t('common.terms')}
          </button>
          <button
            type="button"
            onClick={() => onOpenLegalNotice('privacy')}
            className="inline-flex items-center gap-1.5 rounded-full transition-colors hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            <ShieldCheck className="size-3.5 text-[#33271E]/50" />
            {t('common.privacy')}
          </button>
          <button
            type="button"
            onClick={() => onOpenLegalNotice('contact')}
            className="inline-flex items-center gap-1.5 rounded-full transition-colors hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            <Mail className="size-3.5 text-[#33271E]/50" />
            {t('common.contact')}
          </button>
        </nav>
      </div>
    </footer>
  )
}

// EOF: Footer.tsx
