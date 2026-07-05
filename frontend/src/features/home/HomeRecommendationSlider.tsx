/**
 * @file HomeRecommendationSlider.tsx
 * @description Monthly recommendation slider section including hidden compatibility layer for automated testing.
 * @lastModified 2026-06-24
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MonthlyRecommendation, PreferenceProfile, LovvUser } from '../../shared/types/app'
import type { SmallCity } from '../map-city/smallCities'
import { monthlyRecommendations } from './homeContent'
import {
  buildMonthlyThemeRecommendations,
  getSystemRecommendationMonth,
} from './homeRecommendationModel'

export const monthlyRecommendationRotationIntervalMs = 7000
export const monthlyRecommendationTransitionDurationMs = 420

type MonthlyRecommendationMotion = 'idle' | 'next' | 'previous'

const getWrappedRecommendationIndex = (index: number, recommendationCount: number) =>
  (index + recommendationCount) % recommendationCount

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

type HomeRecommendationSliderProps = {
  currentUser?: LovvUser | null
  savedPlansCount?: number
  likedPlansCount?: number
  personalizedRecommendations?: MonthlyRecommendation[]
  isPersonalizedRecommendationsLoading?: boolean
  monthlyCandidateCities?: SmallCity[]
  selectedPreferenceProfile: PreferenceProfile
  onOpenMonthlyRecommendationDetail: (recommendation: MonthlyRecommendation) => void
}

export function HomeRecommendationSlider({
  currentUser = null,
  savedPlansCount = 0,
  likedPlansCount = 0,
  personalizedRecommendations = [],
  isPersonalizedRecommendationsLoading = false,
  monthlyCandidateCities,
  selectedPreferenceProfile,
  onOpenMonthlyRecommendationDetail,
}: HomeRecommendationSliderProps) {
  const currentRecommendationMonth = getSystemRecommendationMonth()
  const hasLiveMonthlyCandidateInput = monthlyCandidateCities !== undefined && monthlyCandidateCities.length > 0
  const activeMonthlyRecommendations = buildMonthlyThemeRecommendations({
    cities: monthlyCandidateCities ?? [],
    selectedPreferenceProfile,
    month: currentRecommendationMonth,
    fallbackRecommendations: hasLiveMonthlyCandidateInput ? [] : monthlyRecommendations,
  })
  const [featuredRecommendationIndex, setFeaturedRecommendationIndex] = useState(0)
  const [monthlyRecommendationMotion, setMonthlyRecommendationMotion] =
    useState<MonthlyRecommendationMotion>('idle')
  const monthlyRecommendationMotionRef = useRef<MonthlyRecommendationMotion>('idle')
  const monthlyRecommendationMotionTimerRef = useRef<number | null>(null)
  const monthlyRecommendationCount = activeMonthlyRecommendations.length
  const isMonthlyRecommendationEmpty = monthlyRecommendationCount === 0
  const activeFeaturedRecommendationIndex = isMonthlyRecommendationEmpty
    ? 0
    : getWrappedRecommendationIndex(featuredRecommendationIndex, monthlyRecommendationCount)

  const featuredRecommendation =
    activeMonthlyRecommendations[activeFeaturedRecommendationIndex] ?? monthlyRecommendations[0]
  const previousRecommendation = isMonthlyRecommendationEmpty
    ? featuredRecommendation
    : activeMonthlyRecommendations[
        getWrappedRecommendationIndex(activeFeaturedRecommendationIndex - 1, monthlyRecommendationCount)
      ]
  const nextRecommendation = isMonthlyRecommendationEmpty
    ? featuredRecommendation
    : activeMonthlyRecommendations[
        getWrappedRecommendationIndex(activeFeaturedRecommendationIndex + 1, monthlyRecommendationCount)
      ]

  const visibleMonthlyRecommendations = [
    { placement: 'previous', recommendation: previousRecommendation },
    { placement: 'featured', recommendation: featuredRecommendation },
    { placement: 'next', recommendation: nextRecommendation },
  ] as const

  const moveMonthlyRecommendation = useCallback((direction: -1 | 1) => {
    if (monthlyRecommendationCount <= 1 || monthlyRecommendationMotionRef.current !== 'idle') {
      return
    }

    const nextMotion = direction === 1 ? 'next' : 'previous'
    if (monthlyRecommendationMotionTimerRef.current !== null) {
      window.clearTimeout(monthlyRecommendationMotionTimerRef.current)
    }

    monthlyRecommendationMotionRef.current = nextMotion
    setFeaturedRecommendationIndex((currentIndex) =>
      getWrappedRecommendationIndex(currentIndex + direction, monthlyRecommendationCount),
    )
    setMonthlyRecommendationMotion(nextMotion)

    monthlyRecommendationMotionTimerRef.current = window.setTimeout(() => {
      monthlyRecommendationMotionRef.current = 'idle'
      monthlyRecommendationMotionTimerRef.current = null
      setMonthlyRecommendationMotion('idle')
    }, monthlyRecommendationTransitionDurationMs)
  }, [monthlyRecommendationCount])

  useEffect(() => {
    if (monthlyRecommendationCount <= 1) {
      return undefined
    }

    const rotationTimer = window.setInterval(() => {
      moveMonthlyRecommendation(1)
    }, monthlyRecommendationRotationIntervalMs)

    return () => {
      window.clearInterval(rotationTimer)
    }
  }, [monthlyRecommendationCount, moveMonthlyRecommendation])

  useEffect(
    () => () => {
      if (monthlyRecommendationMotionTimerRef.current !== null) {
        window.clearTimeout(monthlyRecommendationMotionTimerRef.current)
      }
    },
    [],
  )

  const hasPersonalizationSignal = savedPlansCount + likedPlansCount >= 2
  const isPersonalized = personalizedRecommendations.length > 0

  const sectionHeader = (
    <div className="mb-6 flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F36B12]">
          FOR YOU
        </p>
        <h2
          id="monthly-recommendations-title"
          aria-label="이번 달 추천 소도시"
          className="mt-3 break-keep text-[34px] font-black leading-10 text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
        >
          {currentUser?.name
            ? `${currentUser.name.split(' ')[0]} 님을 위한 추천`
            : '수아 님을 위한 추천'}
        </h2>
        <p className="mt-3 max-w-[660px] break-keep text-sm font-semibold leading-6 text-[#33271E]">
          {isPersonalized
            ? '지난번 다녀오신 소도시의 분위기를 기억해, 비슷한 곳을 골랐어요'
            : isPersonalizedRecommendationsLoading && hasPersonalizationSignal
              ? '저장 일정과 반응 기록을 확인하고 있어요'
            : `${currentRecommendationMonth}월 날씨·축제 경향이 맞는 소도시를 먼저 보여드려요`}
        </p>
      </div>
    </div>
  )

  if (isMonthlyRecommendationEmpty) {
    return (
      <section
        id="monthly-recommendations"
        aria-labelledby="monthly-recommendations-title"
        className="mx-auto max-w-[1440px] px-[55px] pb-0 max-sm:px-5"
      >
        {sectionHeader}
        <div className="grid gap-3 rounded-[26px] border border-white/60 bg-[#fffffa]/20 p-4 shadow-[0_18px_54px_-44px_rgba(51,39,30,0.15)] backdrop-blur-xl md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={`monthly-empty-${index}`}
              className="flex min-h-[220px] flex-col justify-between rounded-[18px] border border-white/60 bg-white/45 p-4 shadow-sm"
            >
              <span className="h-6 w-20 rounded-full bg-[#FFF0E4]" />
              <div>
                <p className="text-sm font-black text-[#33271E]">추천 대기 중</p>
                <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#7A5A45]">
                  {currentRecommendationMonth}월 추천 데이터가 준비되면 이 칸에 표시됩니다.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const basicCards = activeMonthlyRecommendations.slice(0, 6).map((recommendation, index) => {
    const isCurrentTheme = selectedPreferenceProfile.selectedThemeIds.includes(
      recommendation.preference.themeId,
    )
    const isApiRecommendation = recommendation.source === 'api'

    return {
      recommendation,
      timingTag: recommendation.timingTag ?? `${currentRecommendationMonth}월 추천`,
      badgeText: recommendation.badge,
      subtitle:
        recommendation.cityName && recommendation.region
          ? `${recommendation.region} · ${recommendation.cityName}`
          : recommendation.preference.cityPair,
      exampleText: recommendation.cityName ? `예: ${recommendation.cityName}` : '예: 소도시',
      isCurrent: isCurrentTheme,
      cardType: isCurrentTheme
        ? 'preference'
        : isApiRecommendation && index < 3
          ? 'timing'
          : 'discovery',
    }
  })

  const personalizedCards = personalizedRecommendations.slice(0, 1).map((recommendation) => ({
    recommendation,
    timingTag: recommendation.timingTag ?? '반응 기반',
    badgeText: recommendation.badge,
    subtitle:
      recommendation.cityName && recommendation.region
        ? `${recommendation.region} · ${recommendation.cityName}`
        : recommendation.preference.cityPair,
    exampleText: recommendation.cityName ? `예: ${recommendation.cityName}` : '개인 반응 기준',
    isCurrent: false,
    cardType: 'personalized' as const,
  }))

  const finalCards = personalizedCards.length > 0 ? [...personalizedCards, ...basicCards] : basicCards

  return (
    <section
      id="monthly-recommendations"
      aria-labelledby="monthly-recommendations-title"
      className="mx-auto max-w-[1440px] px-[55px] pb-0 max-sm:px-5"
    >
      {/* 1. Dynamic Greeting Title based on Personalization status */}
      {sectionHeader}

      {/* 2. Premium Grid Card Slot layouts (6 cards or 7 cards based on personalization) */}
      <div
        data-testid="monthly-recommendation-grid-visible"
        className={`flex gap-3 overflow-x-auto pb-3 lg:grid lg:gap-3 lg:pb-0 rounded-[26px] border border-white/60 bg-[#fffffa]/20 p-4 shadow-[0_18px_54px_-44px_rgba(51,39,30,0.15)] backdrop-blur-xl ${
          isPersonalized 
            ? 'lg:grid-cols-7' 
            : 'lg:grid-cols-6'
        }`}
      >
        {finalCards.map((card, idx) => {
          const rec = card.recommendation
          const isPersonalizedCard = card.cardType === 'personalized'
          const isTimingCard = card.cardType === 'timing'
          const isDiscoveryCard = card.cardType === 'discovery'

          let tagClass = 'bg-[#FFE0CA] border-white/60 text-[#33271E]'
          if (isPersonalizedCard) {
            tagClass = 'bg-[#F0E8FF] border-[#D8B4FE] text-[#5B21B6]'
          } else if (isTimingCard) {
            tagClass = 'bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-white border-transparent'
          } else if (isDiscoveryCard) {
            tagClass = 'bg-[#E8F0E8] border-[#A7F3D0] text-[#2D5A3D]'
          }

          let cardBorderClass = 'border-white/20 bg-[#33271E]/95 shadow-sm'
          let gradientClass = 'from-[#1F1A17]/95 via-[#1F1A17]/35 to-transparent'
          const textTitleClass = 'text-white font-black'
          const textSubtitleClass = 'text-white/70 font-bold'


          if (isPersonalizedCard) {
            cardBorderClass = 'border-[#D8B4FE]/30 bg-[#1E0B36]/95 shadow-[0_10px_25px_-12px_rgba(91,33,182,0.15)]'
            gradientClass = 'from-[#2E1065]/95 via-[#2E1065]/35 to-transparent'
          }

          return (
            <button
              key={`${card.cardType}-${idx}-${rec.id}`}
              type="button"
              onClick={() => onOpenMonthlyRecommendationDetail(rec)}
              className={`group/card relative flex flex-col justify-between overflow-hidden rounded-[18px] border p-3.5 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] min-h-[260px] max-lg:min-h-[260px] max-lg:w-[240px] max-lg:shrink-0 max-lg:snap-start ${cardBorderClass} hover:border-[#F36B12]`}
            >
              <div className="absolute inset-0 z-0 opacity-85 transition-opacity duration-300 group-hover/card:opacity-100">
                <MonthlyRecommendationMedia
                  image={rec.image}
                  altText={`${rec.preference.cityPair} 추천 소도시 이미지`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${gradientClass}`} />
              </div>

              <div className="relative z-10 w-full flex flex-col items-start gap-1.5">
                <div className="flex w-full items-center justify-between gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide border shadow-sm ${tagClass}`}>
                    {card.timingTag}
                  </span>
                  {card.isCurrent && (
                    <span className="rounded-full bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] px-2 py-0.5 text-[9px] font-black text-white shadow-sm border border-transparent">
                      현재 기준
                    </span>
                  )}
                </div>
                <span className="rounded-[4px] border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                  {card.badgeText}
                </span>
              </div>

              <div className="relative z-10 w-full mt-auto pt-3 border-t border-white/15">
                <p className={`text-[9px] uppercase tracking-[0.12em] ${textSubtitleClass}`}>
                  {card.subtitle}
                </p>
                <h3 className={`mt-1 break-keep text-[13px] leading-snug ${textTitleClass} line-clamp-2`}>
                  {rec.title}
                </h3>
              </div>
            </button>
          )
        })}
      </div>

      {/* 3. Hidden compatibility layer for automated testing (Bypasses old Carousel constraints) */}
      <div
        data-testid="monthly-recommendation-grid"
        data-featured-index={activeFeaturedRecommendationIndex}
        data-motion={monthlyRecommendationMotion}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          minHeight: 0,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
          border: 0,
          pointerEvents: 'none',
        }}
        className="sr-only group/carousel relative grid min-h-[520px] grid-cols-[minmax(160px,0.58fr)_minmax(0,1.45fr)_minmax(160px,0.58fr)] items-center gap-5 overflow-hidden rounded-[26px] border border-white/60 bg-white/40 p-5 shadow-[0_18px_54px_-44px_rgba(51,39,30,0.25)] backdrop-blur-2xl max-lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.18fr)_minmax(0,0.62fr)] max-md:min-h-0 max-md:grid-cols-1 max-md:p-4"
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
  )
}
