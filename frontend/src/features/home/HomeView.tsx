import foxFaceImage from '../../assets/foxhead-smile.png'
import type { MouseEvent } from 'react'
import type { HeroTheme, MonthlyRecommendation, PreferenceProfile } from '../../shared/types/app'
import { heroThemes, monthlyRecommendations } from './homeContent'

type HomeViewProps = {
  currentHeroTheme: HeroTheme
  selectedPreferenceProfile: PreferenceProfile
  selectedThemeHashtags: string[]
  recommendationBasisHashtags: string[]
  openChat: (event?: MouseEvent<HTMLElement>) => void
  openMap: (event?: MouseEvent<HTMLElement>) => void
  onOpenMonthlyRecommendationDetail: (recommendation: MonthlyRecommendation) => void
  isQuickActionsOpen: boolean
  onOpenChatFromQuickAction: () => void
  onScrollToTop: () => void
  onToggleQuickActions: () => void
}

export function HomeView({
  currentHeroTheme,
  selectedPreferenceProfile,
  selectedThemeHashtags,
  recommendationBasisHashtags,
  openChat,
  openMap,
  onOpenMonthlyRecommendationDetail,
  isQuickActionsOpen,
  onOpenChatFromQuickAction,
  onScrollToTop,
  onToggleQuickActions,
}: HomeViewProps) {
  return (
    <>
                  <section
                    id="home"
                    data-testid="main-entry"
                    aria-labelledby="main-entry-title"
                    data-theme={currentHeroTheme.id}
                    className="lovv-rotating-hero relative mx-auto min-h-[820px] max-w-[1440px] overflow-hidden px-[55px] pb-24 pt-[132px] max-lg:min-h-[780px] max-lg:px-8 max-sm:min-h-[740px] max-sm:px-5 max-sm:pb-20 max-sm:pt-36"
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
                      <div className="inline-flex min-h-[58px] items-center gap-3 rounded-full border border-transparent bg-white/90 px-5 py-2 text-sm font-bold text-[#A92B10] shadow-[0_20px_46px_-30px_rgba(51,39,30,0.55)] backdrop-blur max-sm:min-h-[52px] max-sm:text-[12px]">
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

                      <p className="mt-7 max-w-[680px] break-keep text-base font-semibold leading-8 text-[#4A3A31] max-sm:text-sm max-sm:leading-7">
                        {currentHeroTheme.summary}
                      </p>

                      <div aria-label="선택한 여행 테마" className="mt-6 flex max-w-full flex-wrap justify-center gap-2">
                        {selectedThemeHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex min-h-[34px] items-center rounded-full border border-transparent bg-white/80 px-4 py-1 break-keep text-sm font-bold leading-5 text-[#33271E] shadow-[0_10px_24px_-18px_rgba(51,39,30,0.28)] backdrop-blur max-sm:text-[13px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-9 flex flex-wrap justify-center gap-4 max-sm:w-full max-sm:flex-col">
                        <a
                          href="/map"
                          onClick={openMap}
                          className="inline-flex min-h-[58px] min-w-[210px] items-center justify-center rounded-[20px] border border-[#A92B10] bg-[#B64A00] px-8 text-center text-base font-black text-white shadow-[0_18px_42px_-20px_rgba(51,39,30,0.55)] transition hover:-translate-y-0.5 hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
                        >
                          여행지 찾아보기
                        </a>
                        <a
                          href="/planner"
                          onClick={openChat}
                          className="inline-flex min-h-[58px] min-w-[190px] items-center justify-center rounded-[20px] border border-white/85 bg-white/90 px-8 text-center text-base font-black text-[#B64A00] shadow-[0_18px_42px_-24px_rgba(51,39,30,0.42)] transition hover:-translate-y-0.5 hover:border-[#F3B489] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-full"
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
                      className="grid min-h-[126px] grid-cols-[1fr_auto] items-center gap-8 rounded-3xl border border-transparent bg-white/82 px-[31px] py-7 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] max-lg:grid-cols-1"
                    >
                      <div>
                        <h2 className="break-keep text-[22px] font-semibold leading-7 text-[#33271E] max-sm:text-xl">
                          처음엔 작게, 추천은 명확하게
                        </h2>
                        <p className="mt-2 break-keep text-sm leading-5 text-[#33271E]">
                          Lovv는 선택한 기준 테마를 먼저 보고, 같은 분위기의 소도시 후보를 좁힙니다.
                        </p>
                      </div>
                      <ul
                        aria-label="추천 근거 해시태그"
                        className="flex max-w-[560px] flex-wrap justify-end gap-2 max-lg:justify-start"
                      >
                        {recommendationBasisHashtags.map((tag, index) => (
                          <li key={tag}>
                            <span
                              className={`inline-flex min-h-[34px] items-center rounded-[5px] border px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E] ${
                                index === 0
                                  ? 'border-[#A92B10] bg-[#F36B12]'
                                  : 'border-transparent bg-[#FFF0E4]'
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
                      <p className="rounded-[5px] bg-white/80 px-4 py-2 text-[12px] font-bold leading-5 text-[#33271E] shadow-[0_10px_24px_-22px_rgba(51,39,30,0.24)]">
                        카드를 선택하면 테마 상세 정보를 먼저 확인할 수 있습니다.
                      </p>
                    </div>

                    <div
                      data-testid="monthly-recommendation-grid"
                      className="grid auto-rows-[296px] grid-cols-4 gap-5 max-lg:grid-cols-2 max-md:auto-rows-[306px] max-sm:grid-cols-1 max-sm:auto-rows-auto"
                    >
                      {monthlyRecommendations.map((recommendation, index) => {
                        const isFeatured = index === 0
                        const isCurrentRecommendation =
                          selectedPreferenceProfile.selectedThemeIds.includes(recommendation.preference.themeId)

                        return (
                          <button
                            key={recommendation.id}
                            type="button"
                            aria-current={isCurrentRecommendation ? 'true' : undefined}
                            aria-label={`${recommendation.preference.cityPair} 이달 추천 상세 보기`}
                            onClick={() => onOpenMonthlyRecommendationDetail(recommendation)}
                            className={`group relative min-w-0 overflow-hidden rounded-[8px] border border-transparent bg-[#33271E] text-left shadow-[0_18px_50px_-34px_rgba(51,39,30,0.45)] transition hover:-translate-y-1 hover:border-[#A92B10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E] ${
                              isFeatured
                                ? 'col-span-2 row-span-2 min-h-[612px] max-lg:col-span-2 max-sm:col-span-1 max-sm:row-span-1 max-sm:min-h-[410px]'
                                : 'min-h-[296px] max-sm:min-h-[350px]'
                            }`}
                          >
                            <img
                              src={recommendation.image}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.hidden = true
                              }}
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A17]/88 via-[#1F1A17]/28 to-transparent" />
                            <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between gap-5 p-7 text-white max-sm:p-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-[5px] bg-white/90 px-3 py-1 text-[12px] font-black text-[#33271E]">
                                  {recommendation.badge}
                                </span>
                                {isCurrentRecommendation ? (
                                  <span className="rounded-[5px] bg-[#F36B12] px-3 py-1 text-[12px] font-black text-[#33271E]">
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
                                      ? 'text-[34px] leading-10 max-sm:text-[28px] max-sm:leading-9'
                                      : 'text-[21px] leading-7'
                                  }`}
                                >
                                  {recommendation.title}
                                </h3>
                                <p className="mt-3 line-clamp-2 break-keep text-sm font-semibold leading-6 text-white/90">
                                  {recommendation.summary}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {recommendation.themes.map((theme) => (
                                    <span
                                      key={`${recommendation.id}-${theme}`}
                                      className="rounded-[5px] bg-white/18 px-3 py-1 text-[12px] font-bold text-white backdrop-blur"
                                    >
                                      #{theme}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 max-sm:bottom-4 max-sm:right-4">
                    {isQuickActionsOpen ? (
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          aria-label="AI 일정 짜기 바로가기"
                          onClick={onOpenChatFromQuickAction}
                          className="inline-flex min-h-11 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-20px_rgba(51,39,30,0.55)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          AI 일정 짜기
                        </button>
                        <button
                          type="button"
                          aria-label="맨 위로 이동"
                          onClick={onScrollToTop}
                          className="inline-flex min-h-11 items-center rounded-full border border-[#F3B489] bg-white px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-22px_rgba(51,39,30,0.45)] transition hover:-translate-y-0.5 hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          맨 위로
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      aria-label={isQuickActionsOpen ? '빠른 이동 메뉴 닫기' : '빠른 이동 메뉴 열기'}
                      aria-expanded={isQuickActionsOpen}
                      onClick={onToggleQuickActions}
                      className="flex size-14 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-xl font-black text-[#33271E] shadow-[0_18px_42px_-20px_rgba(51,39,30,0.65)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      {isQuickActionsOpen ? '×' : '↥'}
                    </button>
                  </div>
                </>
  )
}
