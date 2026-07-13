/* eslint-disable react-refresh/only-export-components */
/**
 * @file HomeView.tsx
 * @description Layout coordinator for the landing page.
 * @lastModified 2026-06-24
 */

import type { MouseEvent } from 'react'
import type { HeroTheme, MonthlyRecommendation, PreferenceProfile, LovvUser } from '../../shared/types/app'
import type { SmallCity } from '../map-city/smallCities'
import { HomeHeroSection } from './HomeHeroSection'
import {
  HomeRecommendationSlider,
  MonthlyRecommendationMedia,
  monthlyRecommendationRotationIntervalMs,
  monthlyRecommendationTransitionDurationMs,
} from './HomeRecommendationSlider'
import { HomeQuickActions } from './HomeQuickActions'

// Re-export constants and helper components so that the vitest test suite continues to work without modifications.
export {
  MonthlyRecommendationMedia,
  monthlyRecommendationRotationIntervalMs,
  monthlyRecommendationTransitionDurationMs,
}

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
  savedPlansCount?: number
  likedPlansCount?: number
  personalizedRecommendations?: MonthlyRecommendation[]
  isPersonalizedRecommendationsLoading?: boolean
  currentUser?: LovvUser | null
  monthlyCandidateCities?: SmallCity[]
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
  savedPlansCount = 0,
  likedPlansCount = 0,
  personalizedRecommendations = [],
  isPersonalizedRecommendationsLoading = false,
  currentUser = null,
  monthlyCandidateCities,
}: HomeViewProps) {
  return (
    <div className="lovv-page-home">
      <HomeHeroSection
        currentHeroTheme={currentHeroTheme}
        selectedThemeHashtags={selectedThemeHashtags}
        openChat={openChat}
        openMap={openMap}
      />

      <section className="mx-auto max-w-[1440px] px-[55px] pb-8 max-sm:px-5">
        <div
          data-testid="proof-summary-panel"
          className="grid min-h-[126px] grid-cols-[1fr_auto] items-center gap-8 rounded-3xl border border-white/60 bg-white/18 px-[31px] py-7 shadow-[0_12px_28px_-14px_rgba(51,39,30,0.06)] backdrop-blur-2xl max-lg:grid-cols-1"
        >
          <div>
            <h2 className="break-keep text-[22px] font-bold leading-7 text-[#33271E] max-sm:text-xl">
              선택한 취향에 맞는 소도시
            </h2>
            <p className="mt-2 break-keep text-sm leading-5 text-[#33271E]">
              여행 기간을 정하면 조건에 맞는 후보를 먼저 보여드려요.
            </p>
          </div>
          <ul
            aria-label="추천 근거 해시태그"
            className="flex max-w-[560px] flex-wrap justify-end gap-2 max-lg:justify-start"
          >
            {recommendationBasisHashtags.map((tag) => (
              <li key={tag}>
                <span
                  className="inline-flex min-h-[30px] items-center rounded-[999px] border border-[#E8DED4]/80 bg-transparent px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#6E5A50]"
                >
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HomeRecommendationSlider
        currentUser={currentUser}
        savedPlansCount={savedPlansCount}
        likedPlansCount={likedPlansCount}
        personalizedRecommendations={personalizedRecommendations}
        isPersonalizedRecommendationsLoading={isPersonalizedRecommendationsLoading}
        monthlyCandidateCities={monthlyCandidateCities}
        selectedPreferenceProfile={selectedPreferenceProfile}
        onOpenMonthlyRecommendationDetail={onOpenMonthlyRecommendationDetail}
      />

      <HomeQuickActions
        onOpenChatFromQuickAction={onOpenChatFromQuickAction}
        onScrollToTop={onScrollToTop}
      />
    </div>
  )
}
