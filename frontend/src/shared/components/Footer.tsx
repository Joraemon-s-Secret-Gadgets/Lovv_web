import type { MouseEvent } from 'react'

type FooterProps = {
  onGoHome: (event?: MouseEvent<HTMLElement>) => void
}

export function Footer({ onGoHome }: FooterProps) {
  return (
    <footer className="mx-auto max-w-[1440px] px-16 pb-10 pt-4 max-lg:px-8 max-sm:px-5" role="contentinfo">
      <div className="grid gap-6 rounded-[24px] border border-transparent bg-[#fffffa]/90 px-7 py-6 shadow-[0_16px_42px_-30px_rgba(51,39,30,0.32)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-xl font-black leading-6 text-[#33271E]">Lovv</p>
          </div>
          <p className="mt-3 break-keep text-[12px] font-semibold leading-5 text-[#33271E]/70">
            © 2026 Lovv. All rights reserved.
          </p>
        </div>

        <nav aria-label="Lovv footer links" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#33271E]">
          <a
            href="#home"
            onClick={onGoHome}
            className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            이용약관
          </a>
          <a
            href="#home"
            onClick={onGoHome}
            className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            개인정보처리방침
          </a>
          <a
            href="#home"
            onClick={onGoHome}
            className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
          >
            문의하기
          </a>
        </nav>
      </div>
    </footer>
  )
}
