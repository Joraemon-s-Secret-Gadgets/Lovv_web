import foxFaceImage from '../../assets/foxhead-smile.png'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import type { HeroTheme, MonthlyRecommendation, PreferenceProfile } from '../../shared/types/app'
import { heroThemes, monthlyRecommendations } from './homeContent'
import { useUiToggleStore } from '../../shared/store/uiToggleStore'
import { ArrowUp, Sparkles, Menu, X } from 'lucide-react'

export const monthlyRecommendationRotationIntervalMs = 7000
export const monthlyRecommendationTransitionDurationMs = 420

type MonthlyRecommendationMotion = 'idle' | 'next' | 'previous'

type HomeViewProps = {
  currentHeroTheme: HeroTheme
  selectedPreferenceProfile: PreferenceProfile
  selectedThemeHashtags: string[]
  recommendationBasisHashtags: string[]
  openChat: (event?: MouseEvent<HTMLElement>) => void
  openMap: (event?: MouseEvent<HTMLElement>) => void
  onOpenMonthlyRecommendationDetail: (recommendation: MonthlyRecommendation) => void
  onOpenChatFromQuickAction: () => void
  onScrollToTop: () => void
}

const getHeroSummaryLines = (summary: string) =>
  summary
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)

const getWrappedRecommendationIndex = (index: number) =>
  (index + monthlyRecommendations.length) % monthlyRecommendations.length

type MonthlyRecommendationMediaProps = {
  image?: string | null
  altText: string
}

export function MonthlyRecommendationMedia({ image, altText }: MonthlyRecommendationMediaProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const imageSource = image?.trim()

  if (!imageSource || hasImageError) {
    return (
      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-[#FFF0E4] px-6 text-center text-sm font-black text-[#7A5A45]">
        이미지 준비 중입니다.
      </div>
    )
  }

  return (
    <img
      src={imageSource}
      alt={altText}
      onError={() => setHasImageError(true)}
      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.04]"
    />
  )
}

export function HomeView({
  currentHeroTheme,
  selectedPreferenceProfile,
  selectedThemeHashtags,
  recommendationBasisHashtags,
  openChat,
  openMap,
  onOpenMonthlyRecommendationDetail,
  onOpenChatFromQuickAction,
  onScrollToTop,
}: HomeViewProps) {
  const isQuickActionsOpen = useUiToggleStore((state) => state.isQuickActionsOpen)
  const toggleQuickActions = useUiToggleStore((state) => state.toggleQuickActions)
  const heroSummaryLines = getHeroSummaryLines(currentHeroTheme.summary)
  const [featuredRecommendationIndex, setFeaturedRecommendationIndex] = useState(0)
  const [monthlyRecommendationMotion, setMonthlyRecommendationMotion] =
    useState<MonthlyRecommendationMotion>('idle')
  const monthlyRecommendationMotionRef = useRef<MonthlyRecommendationMotion>('idle')
  const monthlyRecommendationMotionTimerRef = useRef<number | null>(null)
  const featuredRecommendation = monthlyRecommendations[featuredRecommendationIndex]
  const previousRecommendation =
    monthlyRecommendations[getWrappedRecommendationIndex(featuredRecommendationIndex - 1)]
  const nextRecommendation =
    monthlyRecommendations[getWrappedRecommendationIndex(featuredRecommendationIndex + 1)]
  const visibleMonthlyRecommendations = [
    { placement: 'previous', recommendation: previousRecommendation },
    { placement: 'featured', recommendation: featuredRecommendation },
    { placement: 'next', recommendation: nextRecommendation },
  ] as const
  const moveMonthlyRecommendation = useCallback((direction: -1 | 1) => {
    if (monthlyRecommendations.length <= 1 || monthlyRecommendationMotionRef.current !== 'idle') {
      return
    }

    const nextMotion = direction === 1 ? 'next' : 'previous'
    if (monthlyRecommendationMotionTimerRef.current !== null) {
      window.clearTimeout(monthlyRecommendationMotionTimerRef.current)
    }

    monthlyRecommendationMotionRef.current = nextMotion
    setFeaturedRecommendationIndex((currentIndex) =>
      getWrappedRecommendationIndex(currentIndex + direction),
    )
    setMonthlyRecommendationMotion(nextMotion)

    monthlyRecommendationMotionTimerRef.current = window.setTimeout(() => {
      monthlyRecommendationMotionRef.current = 'idle'
      monthlyRecommendationMotionTimerRef.current = null
      setMonthlyRecommendationMotion('idle')
    }, monthlyRecommendationTransitionDurationMs)
  }, [])

  useEffect(() => {
    if (monthlyRecommendations.length <= 1) {
      return undefined
    }

    const rotationTimer = window.setInterval(() => {
      moveMonthlyRecommendation(1)
    }, monthlyRecommendationRotationIntervalMs)

    return () => {
      window.clearInterval(rotationTimer)
    }
  }, [moveMonthlyRecommendation])

  useEffect(
    () => () => {
      if (monthlyRecommendationMotionTimerRef.current !== null) {
        window.clearTimeout(monthlyRecommendationMotionTimerRef.current)
      }
    },
    [],
  )

  return (
    <>
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
                            className={`lovv-hero-background-layer absolute inset-0 ${
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

                  <section className="mx-auto max-w-[1440px] px-[55px] pb-8 max-sm:px-5">
                    <div
                      data-testid="proof-summary-panel"
                      className="grid min-h-[126px] grid-cols-[1fr_auto] items-center gap-8 rounded-3xl border border-white/60 bg-white/45 px-[31px] py-7 shadow-[0_12px_28px_-14px_rgba(51,39,30,0.1)] backdrop-blur-2xl max-lg:grid-cols-1"
                    >
                      <div>
                        <h2 className="break-keep text-[22px] font-bold leading-7 text-[#33271E] max-sm:text-xl">
                          붐비는 유명지 대신, 취향에 맞는 소도시
                        </h2>
                        <p className="mt-2 break-keep text-sm leading-5 text-[#33271E]">
                          어디로 갈지 못정했어도 괜찮아요 - 시기만 정하면 조건에 맞는 소도시를 골라드려요.
                        </p>
                      </div>
                      <ul
                        aria-label="추천 근거 해시태그"
                        className="flex max-w-[560px] flex-wrap justify-end gap-2 max-lg:justify-start"
                      >
                        {recommendationBasisHashtags.map((tag, index) => (
                          <li key={tag}>
                            <span
                              className={`inline-flex min-h-[34px] items-center rounded-[5px] border px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E] shadow-sm transition hover:scale-[1.01] ${
                                index === 0
                                  ? 'border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A]'
                                  : 'border-white/60 bg-[#fffffa]/60 hover:bg-[#FFE0CA]'
                              }`}
                            >
                              {tag}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section
                    id="monthly-recommendations"
                    aria-labelledby="monthly-recommendations-title"
                    className="mx-auto max-w-[1440px] px-[55px] pb-12 max-sm:px-5"
                  >
                    <div className="mb-6 flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F36B12]">
                          Monthly picks
                        </p>
                        <h2
                          id="monthly-recommendations-title"
                          className="mt-3 break-keep text-[34px] font-black leading-10 text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                        >
                          이번 달 추천 소도시
                        </h2>
                        <p className="mt-3 max-w-[660px] break-keep text-sm font-semibold leading-6 text-[#33271E]">
                          계절감과 선택 테마가 잘 맞는 한국과 일본의 소도시 후보를 먼저 골랐습니다.
                        </p>
                      </div>
                      <p className="rounded-[5px] border border-white/60 bg-[#fffffa]/80 px-4 py-2 text-[12px] font-bold leading-5 text-[#33271E] shadow-sm backdrop-blur-sm">
                        카드를 선택하면 테마 상세 정보를 먼저 확인할 수 있습니다.
                      </p>
                    </div>

                    <div
                      data-testid="monthly-recommendation-grid"
                      data-featured-index={featuredRecommendationIndex}
                      data-motion={monthlyRecommendationMotion}
                      className="group/carousel relative grid min-h-[520px] grid-cols-[minmax(160px,0.58fr)_minmax(0,1.45fr)_minmax(160px,0.58fr)] items-center gap-5 overflow-hidden rounded-[26px] border border-white/60 bg-white/40 p-5 shadow-[0_18px_54px_-44px_rgba(51,39,30,0.25)] backdrop-blur-2xl max-lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.18fr)_minmax(0,0.62fr)] max-md:min-h-0 max-md:grid-cols-1 max-md:p-4"
                    >
                      <button
                        type="button"
                        aria-label="이전 추천 보기"
                        disabled={monthlyRecommendationMotion !== 'idle'}
                        onClick={() => moveMonthlyRecommendation(-1)}
                        className="absolute left-7 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-2xl font-black text-[#33271E] opacity-0 shadow-[0_16px_34px_-22px_rgba(51,39,30,0.48)] transition hover:bg-[#FFF0E4] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed disabled:opacity-40 group-hover/carousel:opacity-100 max-md:left-6 max-md:top-[45%]"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label="다음 추천 보기"
                        disabled={monthlyRecommendationMotion !== 'idle'}
                        onClick={() => moveMonthlyRecommendation(1)}
                        className="absolute right-7 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-2xl font-black text-[#33271E] opacity-0 shadow-[0_16px_34px_-22px_rgba(51,39,30,0.48)] transition hover:bg-[#FFF0E4] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed disabled:opacity-40 group-hover/carousel:opacity-100 max-md:right-6 max-md:top-[45%]"
                      >
                        ›
                      </button>

                      {visibleMonthlyRecommendations.map(({ placement, recommendation }) => {
                        const isFeatured = placement === 'featured'
                        const isCurrentRecommendation =
                          selectedPreferenceProfile.selectedThemeIds.includes(recommendation.preference.themeId)

                        return (
                          <button
                            key={`${placement}-${recommendation.id}`}
                            type="button"
                            aria-current={isCurrentRecommendation ? 'true' : undefined}
                            aria-label={`${recommendation.preference.cityPair} 이달 추천 상세 보기`}
                            data-testid={`monthly-recommendation-${placement}`}
                            data-placement={placement}
                            data-motion={monthlyRecommendationMotion}
                            onClick={() =>
                              monthlyRecommendationMotion !== 'idle'
                                ? undefined
                                : isFeatured
                                ? onOpenMonthlyRecommendationDetail(recommendation)
                                : moveMonthlyRecommendation(placement === 'previous' ? -1 : 1)
                            }
                            className={`lovv-monthly-card group/card relative min-w-0 overflow-hidden rounded-[18px] border border-transparent bg-[#33271E] text-left shadow-[0_18px_50px_-34px_rgba(51,39,30,0.45)] transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#A92B10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E] motion-reduce:transform-none motion-reduce:transition-none ${
                              isFeatured
                                ? 'min-h-[500px] max-md:min-h-[430px]'
                                : 'min-h-[330px] opacity-[0.78] max-md:min-h-[230px]'
                            } ${
                              monthlyRecommendationMotion !== 'idle' ? 'pointer-events-none' : ''
                            }`}
                          >
                            <MonthlyRecommendationMedia
                              image={recommendation.image}
                              altText={`${recommendation.preference.cityPair} 추천 소도시 이미지`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A17]/88 via-[#1F1A17]/28 to-transparent" />
                            <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between gap-5 p-7 text-white max-sm:p-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-[5px] border border-white/60 bg-white/80 px-3 py-1 text-[12px] font-black text-[#33271E] shadow-sm">
                                  {recommendation.badge}
                                </span>
                                {isCurrentRecommendation ? (
                                  <span className="rounded-[5px] border border-white/40 bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-3 py-1 text-[12px] font-black text-[#33271E] shadow-sm">
                                    현재 기준
                                  </span>
                                ) : null}
                              </div>

                              <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/80">
                                  {recommendation.preference.cityPair}
                                </p>
                                <h3
                                  className={`mt-2 break-keep font-black tracking-normal ${
                                    isFeatured
                                      ? 'text-[38px] leading-[46px] max-sm:text-[28px] max-sm:leading-9'
                                      : 'line-clamp-2 text-[20px] leading-7'
                                  }`}
                                >
                                  {recommendation.title}
                                </h3>
                                <p
                                  className={`mt-3 break-keep text-sm font-semibold leading-6 text-white/90 ${
                                    isFeatured ? 'line-clamp-3' : 'line-clamp-2'
                                  }`}
                                >
                                  {recommendation.summary}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-[5px] border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
                                    {recommendation.themes.join('·')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>

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
                </>
  )
}
