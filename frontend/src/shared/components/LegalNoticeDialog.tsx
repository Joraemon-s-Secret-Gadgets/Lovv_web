/**
 * @file LegalNoticeDialog.tsx
 * @description Shared modal dialog for Lovv legal and contact notices.
 * @lastModified 2026-06-14
 */

import { useEffect } from 'react'
import { legalNoticeContent } from './legalNoticeContent'
import { useUiToggleStore } from '../store/uiToggleStore'

export function LegalNoticeDialog() {
  const noticeType = useUiToggleStore((state) => state.activeLegalNoticeType)
  const onClose = useUiToggleStore((state) => state.closeLegalNotice)
  const notice = noticeType ? legalNoticeContent[noticeType] : null

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notice, onClose])

  if (!notice) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-[#33271E]/45 px-5 py-8 backdrop-blur-sm">
      <button
        type="button"
        data-testid="legal-notice-backdrop"
        aria-label="안내 닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-notice-title"
        aria-describedby="legal-notice-summary"
        className="relative z-10 max-h-[min(760px,calc(100dvh-4rem))] w-full max-w-[680px] overflow-hidden rounded-[24px] border border-[#F3B489]/65 bg-[#fffffa] shadow-[0_28px_80px_-42px_rgba(51,39,30,0.58)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#F3B489]/35 px-7 py-6 max-sm:px-5">
          <div className="min-w-0">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#F36B12]">
              {notice.eyebrow}
            </p>
            <h2
              id="legal-notice-title"
              className="mt-2 break-keep text-2xl font-black leading-8 text-[#33271E]"
            >
              {notice.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label={`${notice.title} 닫기`}
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#F3B489] bg-[#FFF8F6] text-lg font-black text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(min(760px,100dvh-4rem)-112px)] overflow-y-auto px-7 py-6 max-sm:px-5">
          <p
            id="legal-notice-summary"
            className="break-keep rounded-[18px] bg-[#FFF0E4] px-5 py-4 text-sm font-bold leading-6 text-[#33271E]"
          >
            {notice.summary}
          </p>

          <div className="mt-6 grid gap-5">
            {notice.sections.map((section) => (
              <section key={section.heading} className="rounded-[18px] border border-[#F3B489]/45 p-5">
                <h3 className="break-keep text-base font-black leading-6 text-[#33271E]">
                  {section.heading}
                </h3>
                <ul className="mt-3 grid gap-2">
                  {section.body.map((body) => (
                    <li
                      key={body}
                      className="break-keep text-sm font-semibold leading-6 text-[#6E5A50]"
                    >
                      {body}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
          >
            확인
          </button>
        </div>
      </section>
    </div>
  )
}

// EOF: LegalNoticeDialog.tsx
