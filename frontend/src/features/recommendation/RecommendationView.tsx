/**
 * @file RecommendationView.tsx
 * @description Recommendation feed for public and personalized itinerary discovery.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { Compass, Heart, ImageIcon, Sparkles, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { requestListPublicItineraries } from '../../shared/api/savedPlansApi'
import { requestListPopularDestinations, type PopularDestinationApiItem } from '../../shared/api/recommendationsApi'
import { normalizeKoreanTopicParticle } from '../../shared/utils/koreanParticles'

const popularDestinationSlotCount = 6

type PopularDestination = {
  key: string
  cityId?: string
  name: string
  count: number
  reactionCount: number
  themeLabels: string[]
  region?: string
  country?: string
  countryLabel?: string
  imageUrl?: string | null
  summary?: string
}

export type RecommendationDestinationTarget = {
  cityId?: string
  name: string
  country?: string
}

type PopularAgeGroup = {
  ageGroup: string
  label: string
  items: PopularDestination[]
}

const popularThemeCopy: Record<string, string> = {
  art_sense: '예술·감성',
  food: '미식',
  healing_rest: '온천·휴양',
  history_tradition: '전통·역사',
  nature_trekking: '자연·트레킹',
  sea_coast: '바다·해안',
}

const toThemeCopy = (theme: string) => popularThemeCopy[theme] ?? theme

const buildPopularDestinationSummary = (
  item: PopularDestinationApiItem,
  name: string,
  themeLabels: string[],
) => {
  const summary = item.summary?.trim()

  if (summary) {
    return normalizeKoreanTopicParticle(summary, name)
  }

  const themeCopy = themeLabels.map(toThemeCopy).slice(0, 2).join('·')

  return themeCopy
    ? `${themeCopy} 여행 후보가 모여 있는 소도시입니다.`
    : '여행자 반응이 모이고 있는 소도시입니다.'
}

const normalizePopularDestination = (item: PopularDestinationApiItem): PopularDestination | null => {
  const key = item.cityId?.trim() || item.name?.trim()

  if (!key) {
    return null
  }

  const name = item.name?.trim() || item.cityId?.replace(/^(KR|JP)-/, '').replace(/-/g, ' ') || '이름 미정 지역'
  const themeLabels = Array.isArray(item.themes) ? item.themes.filter(Boolean).slice(0, 3) : []

  return {
    key,
    cityId: item.cityId,
    name,
    count: Math.max(0, item.savedPlanCount ?? item.saved_plan_count ?? 0),
    reactionCount: Math.max(0, item.reactionCount ?? item.reaction_count ?? 0),
    themeLabels,
    region: item.region,
    country: item.country,
    countryLabel: item.countryLabel,
    imageUrl: item.imageUrl ?? item.image_url ?? null,
    summary: buildPopularDestinationSummary(item, name, themeLabels),
  }
}

const normalizeAgeGroup = (group: NonNullable<Awaited<ReturnType<typeof requestListPopularDestinations>>['ageGroups']>[number]): PopularAgeGroup | null => {
  const ageGroup = group.ageGroup?.trim()
  const label = group.label?.trim()
  const items = Array.isArray(group.items)
    ? group.items.map(normalizePopularDestination).filter((item): item is PopularDestination => Boolean(item))
    : []

  if (!ageGroup || !label || items.length === 0) {
    return null
  }

  return { ageGroup, label, items }
}

type RecommendationViewProps = {
  onOpenDestinationOnMap?: (destination: RecommendationDestinationTarget) => void
}

export function RecommendationView({ onOpenDestinationOnMap }: RecommendationViewProps) {
  const navigate = useNavigate()
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null)
  const {
    data: popularDestinationsData,
    isLoading: isPopularDestinationsLoading,
    isError: isPopularDestinationsError,
  } = useQuery({
    queryKey: ['popularDestinations', popularDestinationSlotCount],
    queryFn: () => requestListPopularDestinations(popularDestinationSlotCount),
  })
  const { data: publicItinerariesData, isLoading: isPublicPlansLoading, isError: isPublicPlansError } = useQuery({
    queryKey: ['publicItineraries'],
    queryFn: () => requestListPublicItineraries(),
  })
  const publicPlans = useMemo(() => publicItinerariesData?.savedPlans ?? [], [publicItinerariesData?.savedPlans])
  const popularDestinations = useMemo(
    () => (popularDestinationsData?.items ?? [])
      .map(normalizePopularDestination)
      .filter((item): item is PopularDestination => Boolean(item)),
    [popularDestinationsData?.items],
  )
  const ageGroups = useMemo(
    () => (popularDestinationsData?.ageGroups ?? [])
      .map(normalizeAgeGroup)
      .filter((group): group is PopularAgeGroup => Boolean(group)),
    [popularDestinationsData?.ageGroups],
  )
  const activeAgeGroup = useMemo(() => {
    if (ageGroups.length === 0) {
      return null
    }
    return ageGroups.find((group) => group.ageGroup === selectedAgeGroup) ?? ageGroups[0]
  }, [ageGroups, selectedAgeGroup])
  const popularSlots = Array.from(
    { length: popularDestinationSlotCount },
    (_, index) => popularDestinations[index] ?? null,
  )
  const ageSlots = Array.from(
    { length: popularDestinationSlotCount },
    (_, index) => activeAgeGroup?.items[index] ?? null,
  )
  const totalReactionCount = popularDestinations.reduce((sum, destination) => sum + destination.reactionCount, 0)
  const totalReactedPlanCount = popularDestinations.reduce((sum, destination) => sum + destination.count, 0)

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] bg-gradient-to-b from-transparent to-[#FDFBF9] px-9 py-10 max-lg:px-8 max-sm:px-5">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF2EA] px-4 py-1.5 text-xs font-black text-[#F36B12] shadow-sm">
          <Sparkles className="size-3.5 fill-[#F36B12]" />
          <span>POPULAR AREAS</span>
        </div>
        <h1 className="break-keep text-4xl font-black tracking-tight text-[#33271E] max-sm:text-3xl">
           Lovv 인기 일정
        </h1>
        <p className="mx-auto mt-3 max-w-[680px] break-keep text-sm font-semibold leading-6 text-[#7A5A45] max-sm:text-xs">
          저장 일정에 남겨진 반응을 지역별로 합산한 인기 랭킹
         
        </p>
      </div>

      <section
        aria-labelledby="reaction-picks-title"
        className="rounded-[28px] border border-white/70 bg-white/35 p-6 shadow-[0_24px_70px_-52px_rgba(51,39,30,0.25)] backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-white">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h2 id="reaction-picks-title" className="text-xl font-black text-[#33271E]">
                실시간 인기 랭킹
              </h2>
              <p className="text-xs font-semibold text-[#7A5A45]">
                반응 남은 일정 {totalReactedPlanCount}개 · 총 반응 {totalReactionCount}개
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/70 bg-[#fffffa]/80 px-4 py-2 text-[12px] font-black text-[#A92B10] shadow-sm">
            전체 반응 집계 기준
          </span>
        </div>

        {isPopularDestinationsLoading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RankingListSkeleton title="인기 일정" />
            <RankingListSkeleton title="나이대별 인기" />
          </div>
        ) : isPopularDestinationsError ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#F3B489] bg-[#fffffa]/40 p-8 text-center">
            <p className="break-keep text-sm font-bold text-[#A92B10]">
              인기 지역 랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RankingListPanel
              title="인기 일정"
              description="전체 사용자의 반응을 지역별로 합산한 순위입니다."
              badge="전체"
              slots={popularSlots}
              onOpenDestinationOnMap={onOpenDestinationOnMap}
            />
            <RankingListPanel
              title="나이대별 인기"
              description={
                activeAgeGroup
                  ? `${activeAgeGroup.label} 반응 기준으로 많이 선택된 지역입니다.`
                  : '나이대별 반응 데이터가 쌓이면 순위가 표시됩니다.'
              }
              badge={activeAgeGroup?.label ?? '나이대'}
              slots={ageSlots}
              ageGroups={ageGroups}
              selectedAgeGroup={activeAgeGroup?.ageGroup ?? null}
              onSelectAgeGroup={setSelectedAgeGroup}
              onOpenDestinationOnMap={onOpenDestinationOnMap}
            />
          </div>
        )}
      </section>

      <section className="mt-16 mb-10 border-t border-[#F4EBE3] pt-12" aria-labelledby="public-plans-title">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#A92B10] to-[#F36B12] text-white">
            <Compass className="size-5" />
          </div>
          <div>
            <h2 id="public-plans-title" className="text-2xl font-black text-[#33271E]">
              다른 Lovver가 게시한 일정
            </h2>
            <p className="text-sm text-[#7A5A45]">인기 지역 랭킹의 기준이 되는 공개 일정입니다.</p>
          </div>
        </div>

        {isPublicPlansLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-[#F3B489] border-t-[#F36B12]" />
              <p className="text-sm font-semibold text-[#7A5A45]">공유된 일정을 불러오고 있어요...</p>
            </div>
          </div>
        ) : isPublicPlansError ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-[#F3B489] bg-[#fffffa]/40 p-8 text-center">
            <p className="text-sm font-bold text-[#A92B10]">공유 일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : publicPlans.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-[#F3B489] bg-[#fffffa]/40 p-8 text-center">
            <div className="max-w-md">
              <p className="mb-2 text-base font-black text-[#33271E]">아직 공개된 일정이 없어요</p>
              <p className="text-xs text-[#7A5A45]">내가 직접 짠 일정을 마이페이지에서 공개 처리하면 첫 주인공이 될 수 있습니다.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publicPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => navigate(`/plans/${encodeURIComponent(plan.id)}`)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/50 p-6 text-left shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#F36B12]/30 hover:bg-white/90 hover:shadow-[0_12px_40px_rgba(51,39,30,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12]"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-block rounded-md bg-[#FFF2EA] px-2.5 py-0.5 text-[10px] font-black text-[#F36B12]">
                      {plan.durationLabel}
                    </span>
                    <span className="text-[10px] font-bold text-[#7A5A45]">{plan.themeTag}</span>
                  </div>
                  <h3 className="truncate text-lg font-black text-[#33271E] transition-colors group-hover:text-[#F36B12]">
                    {plan.title}
                  </h3>
                  <p className="mt-1 truncate text-xs font-semibold text-[#7A5A45]">{plan.cityPair}</p>
                  <p className="mt-3 line-clamp-3 break-keep text-xs font-medium leading-relaxed text-[#6E5A50]">
                    {plan.summary}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#F4EBE3] pt-4">
                  <span className="text-[11px] font-bold text-[#7A5A45]/80">
                    작성자: {plan.ownerId ? `${plan.ownerId.slice(0, 4)}***` : '여행자'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#F36B12]">
                    <Heart className={`size-3.5 ${plan.isLiked ? 'fill-[#F36B12]' : ''}`} />
                    <span>반응 {plan.likeCount ?? 0}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function RankingListPanel({
  title,
  description,
  badge,
  slots,
  ageGroups,
  selectedAgeGroup,
  onSelectAgeGroup,
  onOpenDestinationOnMap,
}: {
  title: string
  description: string
  badge: string
  slots: Array<PopularDestination | null>
  ageGroups?: PopularAgeGroup[]
  selectedAgeGroup?: string | null
  onSelectAgeGroup?: (ageGroup: string) => void
  onOpenDestinationOnMap?: (destination: RecommendationDestinationTarget) => void
}) {
  return (
    <section className="rounded-[24px] border border-white/75 bg-[#fffffa]/62 p-4 shadow-[0_18px_44px_-38px_rgba(51,39,30,0.28)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-[#33271E]">{title}</h3>
            <span className="rounded-full bg-[#FFF2EA] px-2.5 py-1 text-[11px] font-black text-[#A92B10]">
              {badge}
            </span>
          </div>
          <p className="mt-1 break-keep text-xs font-semibold leading-5 text-[#7A5A45]">
            {description}
          </p>
        </div>
      </div>

      {ageGroups && ageGroups.length > 0 && onSelectAgeGroup ? (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="나이대별 인기 필터">
          {ageGroups.map((group) => {
            const isSelected = selectedAgeGroup === group.ageGroup
            return (
              <button
                key={group.ageGroup}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectAgeGroup(group.ageGroup)}
                className={`min-h-8 rounded-full px-3 text-[11px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12] ${
                  isSelected
                    ? 'bg-[#2F6F4E] text-white'
                    : 'border border-white/70 bg-white/78 text-[#6E5A50] hover:bg-[#EFF8F1]'
                }`}
              >
                {group.label}
              </button>
            )
          })}
        </div>
      ) : null}

      <ol className="grid gap-3" aria-label={`${title} 목록`}>
        {slots.map((destination, index) => (
          <li key={destination?.key ?? `${title}-empty-${index}`}>
            {destination ? (
              <RankingListItem
                destination={destination}
                rank={index + 1}
                onOpenDestinationOnMap={onOpenDestinationOnMap}
              />
            ) : (
              <RankingEmptyItem rank={index + 1} />
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

function RankingListItem({
  destination,
  rank,
  onOpenDestinationOnMap,
}: {
  destination: PopularDestination
  rank: number
  onOpenDestinationOnMap?: (destination: RecommendationDestinationTarget) => void
}) {
  const locationLabel = [destination.countryLabel, destination.region].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={() =>
        onOpenDestinationOnMap?.({
          cityId: destination.cityId,
          name: destination.name,
          country: destination.country,
        })
      }
      aria-label={`${destination.name} 여행지 찾아보기에서 보기`}
      className="group flex min-h-[116px] w-full gap-3 rounded-[20px] border border-white/80 bg-white/70 p-3 text-left shadow-[0_12px_28px_-24px_rgba(51,39,30,0.36)] transition hover:-translate-y-0.5 hover:border-[#F3B489] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F36B12] max-sm:min-h-0"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[16px] bg-[#FFF2EA] max-sm:h-20 max-sm:w-20">
        {destination.imageUrl ? (
          <img
            src={destination.imageUrl}
            alt={`${destination.name} 이미지`}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-[#A92B10]">
            <ImageIcon className="size-5" aria-hidden="true" />
            <span className="text-[10px] font-black">준비 중</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-[#F36B12] px-2 py-0.5 text-[10px] font-black text-[#33271E] shadow-sm">
          Rank {rank}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black text-[#A92B10]">
              {locationLabel || '지역 집계'}
            </p>
            <h4 className="mt-1 truncate text-base font-black text-[#33271E]">
              {destination.name}
            </h4>
          </div>
          <div className="shrink-0 text-right max-sm:hidden">
            <p className="text-sm font-black text-[#F36B12]">{destination.reactionCount}</p>
            <p className="text-[10px] font-black text-[#7A5A45]">반응</p>
          </div>
        </div>

        <p className="mt-2 line-clamp-1 break-keep text-xs font-semibold leading-5 text-[#6E5A50]">
          {destination.summary || '여행자들이 저장하고 반응을 남긴 소도시입니다.'}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {destination.themeLabels.slice(0, 2).map((theme) => (
            <span
              key={theme}
              className="rounded-full border border-[#F4EBE3] bg-[#fffffa] px-2.5 py-1 text-[10px] font-black text-[#6E5A50]"
            >
              {theme}
            </span>
          ))}
          <span className="rounded-full bg-[#EFF8F1] px-2.5 py-1 text-[10px] font-black text-[#2F6F4E]">
            일정 {destination.count}개
          </span>
          <span className="hidden rounded-full bg-[#FFF2EA] px-2.5 py-1 text-[10px] font-black text-[#A92B10] max-sm:inline-flex">
            반응 {destination.reactionCount}개
          </span>
        </div>
      </div>
    </button>
  )
}

function RankingEmptyItem({ rank }: { rank: number }) {
  return (
    <div className="flex min-h-[116px] items-center gap-3 rounded-[20px] border border-dashed border-[#F3B489]/70 bg-[#fffffa]/35 p-3">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF2EA]">
        <span className="text-[11px] font-black text-[#C07A50]">Rank {rank}</span>
      </div>
      <div>
        <p className="text-sm font-black text-[#33271E]">아직 비어 있어요</p>
        <p className="mt-1 break-keep text-xs font-semibold leading-5 text-[#7A5A45]">
          일정에 반응이 쌓이면 이 순위가 채워집니다.
        </p>
      </div>
    </div>
  )
}

function RankingListSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-[24px] border border-white/75 bg-[#fffffa]/62 p-4">
      <div className="mb-4">
        <div className="h-5 w-24 rounded-full bg-[#FFE0CA]" aria-hidden="true" />
        <p className="sr-only">{title} 불러오는 중</p>
      </div>
      <div className="grid gap-3">
        {Array.from({ length: popularDestinationSlotCount }, (_, index) => (
          <div
            key={`${title}-loading-${index}`}
            className="flex min-h-[116px] animate-pulse gap-3 rounded-[20px] border border-white/80 bg-white/55 p-3"
          >
            <div className="h-24 w-24 rounded-[16px] bg-[#FFE0CA]" />
            <div className="flex-1 py-2">
              <div className="h-3 w-20 rounded-full bg-[#F4EBE3]" />
              <div className="mt-3 h-5 w-2/5 rounded-full bg-[#F4EBE3]" />
              <div className="mt-3 h-3 w-3/4 rounded-full bg-[#F4EBE3]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// EOF: RecommendationView.tsx
