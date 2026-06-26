import { Heart, Sparkles, TrendingUp, Users, Compass } from 'lucide-react'
import type { MonthlyRecommendation } from '../../shared/types/app'
import { monthlyRecommendations } from '../home/homeContent'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { requestListPublicItineraries } from '../../shared/api/savedPlansApi'

type RecommendationViewProps = {
  onOpenMonthlyRecommendationDetail: (recommendation: MonthlyRecommendation) => void
}

// NOTE: Demo/sample data only — these likes counts, rankings and age-group
// groupings are hardcoded mocks, not real aggregated statistics. The UI labels
// them as "데모 데이터" so users are not misled. Replace with a real aggregation
// API before presenting these as live numbers.
const rankingData = [
  { rank: 1, recommendation: monthlyRecommendations[2], likes: 1240, region: '경상북도 경주' }, // 경주
  { rank: 2, recommendation: monthlyRecommendations[4], likes: 980, region: '제주특별자치도' },   // 제주
  { rank: 3, recommendation: monthlyRecommendations[1], likes: 850, region: '부산광역시' },      // 부산
  { rank: 4, recommendation: monthlyRecommendations[3], likes: 720, region: '전라북도 전주' },    // 전주
  { rank: 5, recommendation: monthlyRecommendations[0], likes: 540, region: '충청남도 아산(온양)' }, // 온양
  { rank: 6, recommendation: monthlyRecommendations[5], likes: 410, region: '강원도 강릉' },      // 강릉
]

const ageGroups = [
  {
    id: '20s',
    label: '20대 인기',
    tagline: '감성 충전! 인생샷과 트렌디한 미식 로드',
    recommendations: [monthlyRecommendations[3], monthlyRecommendations[5]], // 전주, 강릉
  },
  {
    id: '30s',
    label: '30대 인기',
    tagline: '바쁜 일상 탈출, 나를 위한 온전한 충전과 스파',
    recommendations: [monthlyRecommendations[0], monthlyRecommendations[1]], // 온양, 부산
  },
  {
    id: '40sPlus',
    label: '40대 이상 인기',
    tagline: '깊이 있는 전통 산책과 고요한 자연 속 힐링',
    recommendations: [monthlyRecommendations[2], monthlyRecommendations[4]], // 경주, 제주
  },
]

export function RecommendationView({ onOpenMonthlyRecommendationDetail }: RecommendationViewProps) {
  const [activeAgeTab, setActiveAgeTab] = useState<'20s' | '30s' | '40sPlus'>('20s')
  const currentAgeGroup = ageGroups.find((g) => g.id === activeAgeTab) || ageGroups[0]
  const navigate = useNavigate()

  const { data: publicItinerariesData, isLoading, isError } = useQuery({
    queryKey: ['publicItineraries'],
    queryFn: () => requestListPublicItineraries(),
  })
  const publicPlans = publicItinerariesData?.savedPlans ?? []

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-9 py-10 max-lg:px-8 max-sm:px-5 bg-gradient-to-b from-transparent to-[#FDFBF9]">
      {/* Hero Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD9C0] bg-[#FFF2EA] px-4 py-1.5 text-xs font-black text-[#F36B12] shadow-sm mb-4">
          <Sparkles className="size-3.5 fill-[#F36B12]" />
          <span>TRAVEL PICKS · 데모 데이터</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-[#33271E] max-sm:text-3xl">
          지금 주목받는 인기 소도시
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#7A5A45] max-sm:text-xs">
          큐레이션 미리보기예요. 표시된 좋아요·순위·나이대 수치는 <strong className="font-black text-[#A92B10]">샘플(데모) 데이터</strong>로,
          실제 집계 연동 전입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Side: Real-time Popular Ranking */}
        <section className="lg:col-span-7 flex flex-col gap-6" aria-labelledby="realtime-rank-title">
          <div className="flex items-center gap-3 border-b border-[#F4EBE3] pb-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#F36B12] to-[#FF8A2A] text-white">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h2 id="realtime-rank-title" className="text-xl font-black text-[#33271E]">
                실시간 인기 여행지 TOP 6
              </h2>
              <p className="text-xs text-[#7A5A45]">최근 일주일 좋아요 순위 (샘플 데이터)</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {rankingData.map((item) => {
              const { rank, recommendation, likes, region } = item
              return (
                <button
                  key={recommendation.id}
                  type="button"
                  onClick={() => onOpenMonthlyRecommendationDetail(recommendation)}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/40 p-4 text-left shadow-[0_4px_20px_-10px_rgba(51,39,30,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F36B12]/30 hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F36B12]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Rank Badge */}
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                        rank === 1
                          ? 'bg-[#A92B10] text-white'
                          : rank === 2
                          ? 'bg-[#F36B12] text-white'
                          : rank === 3
                          ? 'bg-[#E39D68] text-white'
                          : 'bg-[#F4EBE3] text-[#7A5A45]'
                      }`}
                    >
                      {rank}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-[#FFF0E4]">
                      {recommendation.image ? (
                        <img
                          src={recommendation.image}
                          alt={recommendation.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#7A5A45] font-black">
                          IMAGE
                        </div>
                      )}
                    </div>

                    {/* Title and Info */}
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-[#A92B10] uppercase tracking-wider">
                        {recommendation.badge}
                      </span>
                      <h3 className="text-base font-black text-[#33271E] truncate group-hover:text-[#F36B12] transition-colors">
                        {recommendation.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#7A5A45] truncate mt-0.5">
                        {region} · {recommendation.summary}
                      </p>
                    </div>
                  </div>

                  {/* Likes badge */}
                  <div className="flex items-center gap-1.5 shrink-0 rounded-lg bg-[#FFF2EA] px-2.5 py-1 text-xs font-bold text-[#F36B12]">
                    <Heart className="size-3.5 fill-[#F36B12]" />
                    <span>{likes.toLocaleString()}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Right Side: Age Group Social Proof */}
        <section className="lg:col-span-5 flex flex-col gap-6" aria-labelledby="age-recommend-title">
          <div className="flex items-center gap-3 border-b border-[#F4EBE3] pb-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#9B51E0] to-[#BC78EC] text-white">
              <Users className="size-5" />
            </div>
            <div>
              <h2 id="age-recommend-title" className="text-xl font-black text-[#33271E]">
                나이대별 맞춤 추천
              </h2>
              <p className="text-xs text-[#7A5A45]">비슷한 연령대 선호 코스 (샘플 데이터)</p>
            </div>
          </div>

          {/* Age Tabs */}
          <div className="flex gap-2 rounded-xl bg-[#F4EBE3]/50 p-1.5 border border-[#F4EBE3]/80">
            {ageGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveAgeTab(g.id as '20s' | '30s' | '40sPlus')}
                className={`flex-1 rounded-lg py-2 text-sm font-black transition-all ${
                  activeAgeTab === g.id
                    ? 'bg-[#33271E] text-white shadow-sm'
                    : 'text-[#7A5A45] hover:text-[#33271E]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Age Content Card */}
          <div className="flex flex-col gap-5 rounded-2xl border border-white/80 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-lg">
            <div className="mb-2">
              <span className="inline-block rounded-md bg-[#F3E8FF] px-2.5 py-0.5 text-xs font-black text-[#9B51E0]">
                {currentAgeGroup.label} Pick
              </span>
              <p className="mt-2 text-base font-black text-[#33271E]">
                {currentAgeGroup.tagline}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {currentAgeGroup.recommendations.map((recommendation) => (
                <button
                  key={recommendation.id}
                  type="button"
                  onClick={() => onOpenMonthlyRecommendationDetail(recommendation)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-[#F4EBE3] bg-white text-left transition-all duration-300 hover:border-[#9B51E0]/30 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9B51E0]"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-[#FFF0E4]">
                    {recommendation.image ? (
                      <img
                        src={recommendation.image}
                        alt={recommendation.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-103"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#7A5A45] font-black">
                        IMAGE
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-3 left-4 rounded bg-white/90 px-2 py-0.5 text-[10px] font-black text-[#33271E]">
                      {recommendation.badge}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-base font-black text-[#33271E] group-hover:text-[#9B51E0] transition-colors">
                      {recommendation.title}
                    </h4>
                    <p className="mt-1 text-xs font-semibold text-[#7A5A45] line-clamp-2 leading-relaxed">
                      {recommendation.summary}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Public Share Itineraries Section */}
      <section className="mt-16 border-t border-[#F4EBE3] pt-12 mb-10" aria-labelledby="public-plans-title">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#A92B10] to-[#F36B12] text-white">
            <Compass className="size-5" />
          </div>
          <div>
            <h2 id="public-plans-title" className="text-2xl font-black text-[#33271E]">
              유저들이 공유한 인기 일정
            </h2>
            <p className="text-sm text-[#7A5A45]">다른 여행자들이 작성하고 공개한 실시간 알짜 여행 루트를 구경해 보세요!</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-[#F3B489] border-t-[#F36B12]" />
              <p className="text-sm font-semibold text-[#7A5A45]">공유된 일정을 불러오고 있어요...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-[#F3B489] bg-[#fffffa]/40 p-8 text-center">
            <p className="text-sm font-bold text-[#A92B10]">공유 일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : publicPlans.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-[#F3B489] bg-[#fffffa]/40 p-8 text-center">
            <div className="max-w-md">
              <p className="text-base font-black text-[#33271E] mb-2">아직 공개된 일정이 없어요</p>
              <p className="text-xs text-[#7A5A45]">내가 직접 짠 일정을 마이페이지에서 공개 처리하면 첫 주인공이 될 수 있습니다!</p>
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
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="inline-block rounded-md bg-[#FFF2EA] px-2.5 py-0.5 text-[10px] font-black text-[#F36B12]">
                      {plan.durationLabel}
                    </span>
                    <span className="text-[10px] font-bold text-[#7A5A45]">
                      {plan.themeTag}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#33271E] group-hover:text-[#F36B12] transition-colors truncate">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#7A5A45] truncate">
                    {plan.cityPair}
                  </p>
                  <p className="mt-3 text-xs font-medium leading-relaxed text-[#6E5A50] line-clamp-3 break-keep">
                    {plan.summary}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#F4EBE3] pt-4">
                  <span className="text-[11px] font-bold text-[#7A5A45]/80">
                    작성자: {plan.ownerId ? `${plan.ownerId.slice(0, 4)}***` : '여행자'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#F36B12]">
                    <Heart className={`size-3.5 ${plan.isLiked ? 'fill-[#F36B12]' : ''}`} />
                    <span>좋아요</span>
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
