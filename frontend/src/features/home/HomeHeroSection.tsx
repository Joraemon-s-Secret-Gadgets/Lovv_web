/**
 * @file HomeHeroSection.tsx
 * @description Rotating hero banner section for the landing page.
 * @lastModified 2026-06-24
 */

import type { MouseEvent } from 'react'
import foxFaceImage from '../../assets/foxhead-smile.png'
import type { HeroTheme } from '../../shared/types/app'
import { heroThemes } from './homeContent'

type HomeHeroSectionProps = {
  currentHeroTheme: HeroTheme
  selectedThemeHashtags: string[]
  openChat: (event?: MouseEvent<HTMLElement>) => void
  openMap: (event?: MouseEvent<HTMLElement>) => void
}

const getHeroSummaryLines = (summary: string) =>
  summary
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)

export function HomeHeroSection({
  currentHeroTheme,
  selectedThemeHashtags,
  openChat,
  openMap,
}: HomeHeroSectionProps) {
  const heroSummaryLines = getHeroSummaryLines(currentHeroTheme.summary)

  return (
    <section
      id="home"
      data-testid="main-entry"
      aria-labelledby="main-entry-title"
      data-theme={currentHeroTheme.id}
      className="lovv-rotating-hero relative mx-auto min-h-[820px] max-w-[1440px] overflow-hidden px-[55px] pb-24 pt-[96px] max-lg:min-h-[780px] max-lg:px-8 max-sm:min-h-[740px] max-sm:px-5 max-sm:pb-20 max-sm:pt-24"
    >
      <div className="absolute inset-0">
        {heroThemes.map((theme) => {
          const isActiveTheme = theme.id === currentHeroTheme.id

          return (
            <div
              key={theme.id}
              data-testid={`hero-theme-${theme.id}`}
              aria-hidden={!isActiveTheme}
              className={`lovv-hero-background-layer absolute inset-0 transition-all ${
                isActiveTheme ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={theme.backgroundImage}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )
        })}
        <div className="lovv-hero-tone-veil absolute inset-0" />
        <div className="lovv-hero-focus-wash absolute inset-0" />
        <div className="lovv-hero-tone-bridge absolute inset-x-0 bottom-0" />
      </div>

      <div className={`lovv-hero-theme-glow ${currentHeroTheme.glowClassName}`} aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[600px] max-w-[880px] flex-col items-center justify-center text-center max-lg:min-h-[560px] max-sm:min-h-[510px]">
        <div className="inline-flex min-h-[58px] items-center gap-3 rounded-full border border-white/60 bg-white/80 px-5 py-2 text-sm font-bold text-[#A92B10] shadow-[0_20px_46px_-30px_rgba(51,39,30,0.25)] backdrop-blur-md max-sm:min-h-[52px] max-sm:text-[12px]">
          <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-[#FFF0E4]">
            <img
              src={foxFaceImage}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          안녕! 나랑 같이 떠날래?
        </div>

        <h1
          id="main-entry-title"
          aria-label={`${currentHeroTheme.lead} ${currentHeroTheme.accent}`}
          className="mt-8 break-keep text-[56px] font-black leading-[1.08] tracking-normal text-[#1F1A17] drop-shadow-[0_2px_20px_rgba(255,255,255,0.75)] max-sm:mt-6 max-sm:text-[36px]"
        >
          <span className="block">{currentHeroTheme.lead}</span>
          <span
            data-testid="hero-slogan-accent"
            className={`block ${currentHeroTheme.accentClassName}`}
          >
            {currentHeroTheme.accent}
          </span>
        </h1>

        <p
          data-testid="hero-summary"
          className="mt-7 max-w-[680px] break-keep text-base font-semibold leading-8 text-[#4A3A31] max-sm:text-sm max-sm:leading-7"
        >
          {heroSummaryLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < heroSummaryLines.length - 1 ? (
                <>
                  <br className="max-sm:hidden" />
                  <span className="hidden max-sm:inline"> </span>
                </>
              ) : null}
            </span>
          ))}
        </p>

        <div aria-label="선택한 여행 테마" className="mt-6 flex max-w-full flex-wrap justify-center gap-2">
          {selectedThemeHashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex min-h-[34px] items-center rounded-full border border-white/60 bg-[#fffffa]/80 px-4 py-1 break-keep text-sm font-bold leading-5 text-[#33271E] shadow-sm backdrop-blur-sm max-sm:text-[13px] hover:scale-[1.01] transition-transform duration-200"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-4 max-sm:w-full max-sm:flex-col">
          <a
            href="/map"
            onClick={openMap}
            className="inline-flex min-h-[58px] min-w-[210px] items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-tr from-[#B64A00] to-[#F36B12] px-8 text-center text-base font-black text-white shadow-md transition hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
          >
            여행지 찾아보기
          </a>
          <a
            href="/planner"
            onClick={openChat}
            className="inline-flex min-h-[58px] min-w-[190px] items-center justify-center rounded-[20px] border border-white/70 bg-white/80 px-8 text-center text-base font-black text-[#B64A00] shadow-sm transition hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[#F3B489]/50 hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
          >
            AI 일정 짜기
          </a>
        </div>

        <div
          aria-label="현재 히어로 테마"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {heroThemes.map((theme) => (
            <span
              key={theme.id}
              aria-current={theme.id === currentHeroTheme.id ? 'true' : undefined}
              className={`inline-flex h-2.5 w-8 rounded-full transition ${
                theme.id === currentHeroTheme.id ? 'bg-[#F36B12]' : 'bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
