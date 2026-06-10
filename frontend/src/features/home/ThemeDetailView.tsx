import type { MouseEvent } from 'react'
import type { MonthlyRecommendation, Preference } from '../../shared/types/app'

type ThemeDetailViewProps = {
  recommendation: MonthlyRecommendation
  goHome: (event?: MouseEvent<HTMLElement>) => void
  openMonthlyRecommendationPlan: (preference: Preference) => void
}

export function ThemeDetailView({
  recommendation,
  goHome,
  openMonthlyRecommendationPlan,
}: ThemeDetailViewProps) {
    const preference = recommendation.preference
    const recommendationHasFestivalTheme = recommendation.themes.includes('축제')
    const detailFacts = [
      {
        label: '기준 테마',
        value: preference.tag,
        body: recommendation.themes.map((theme) => `#${theme}`).join(' '),
      },
      {
        label: '추천 이유',
        value: recommendation.badge,
        body: preference.editorialNote,
      },
      {
        label: '첫 동선 단서',
        value: preference.routeHint,
        body: recommendationHasFestivalTheme
          ? 'AI 일정은 이 동선 단서를 기준으로 기간과 축제 포함 여부를 좁힙니다.'
          : 'AI 일정은 이 동선 단서를 기준으로 여행 기간과 세부 취향을 좁힙니다.',
      },
    ]

    return (
      <section
        aria-labelledby="theme-detail-title"
        className="mx-auto min-h-dvh max-w-[1440px] px-[55px] pb-16 pt-28 max-lg:px-8 max-sm:px-5"
      >
        <button
          type="button"
          onClick={goHome}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-bold text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
        >
          ← 추천 카드로 돌아가기
        </button>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-transparent bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]">
          <div className="grid min-h-[460px] grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] max-lg:grid-cols-1">
            <div className="relative min-h-[460px] overflow-hidden bg-[#33271E] max-sm:min-h-[320px]">
              <img
                src={recommendation.image}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A17]/86 via-[#1F1A17]/18 to-transparent" />
              <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-8 text-white max-sm:p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-[5px] bg-white/90 px-3 py-1 text-[12px] font-black text-[#33271E]">
                    {recommendation.badge}
                  </span>
                  <span className="rounded-[5px] bg-white/18 px-3 py-1 text-[12px] font-bold text-white backdrop-blur">
                    {preference.cityPair}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/80">
                    Theme detail
                  </p>
                  <h1
                    id="theme-detail-title"
                    className="mt-3 break-keep text-[42px] font-black leading-[50px] tracking-normal max-sm:text-[30px] max-sm:leading-10"
                  >
                    {recommendation.title}
                  </h1>
                  <p className="mt-4 max-w-[620px] break-keep text-base font-semibold leading-7 text-white/90 max-sm:text-sm max-sm:leading-6">
                    {recommendation.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-between gap-8 p-8 max-sm:p-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F36B12]">
                  Recommendation basis
                </p>
                <h2 className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                  이 테마를 추천하는 기준
                </h2>
                <p className="mt-4 break-keep text-sm font-semibold leading-7 text-[#33271E]">
                  Lovv는 도시 이름보다 먼저 여행 분위기를 정리하고, 해당 테마와 가까운 소도시 후보를 일정 대화로 연결합니다.
                </p>
              </div>

              <div className="grid gap-3">
                {detailFacts.map((fact) => (
                  <article
                    key={fact.label}
                    className="rounded-[8px] border border-transparent bg-[#FFF0E4] p-5"
                  >
                    <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#A92B10]">
                      {fact.label}
                    </p>
                    <h3 className="mt-2 break-keep text-lg font-black leading-7 text-[#33271E]">
                      {fact.value}
                    </h3>
                    <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {fact.body}
                    </p>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openMonthlyRecommendationPlan(preference)}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                >
                  이 테마로 일정 계획하기
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[#F3B489] bg-[#fffffa] px-6 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                >
                  다른 추천 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
}
