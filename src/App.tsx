import { useEffect, useRef, useState } from 'react'
import logoImage from './assets/lovv-logo.png'
import suitcaseImage from './assets/lovv-suitcase-hi.png'

type Preference = {
  cityPair: string
  description: string
  tag: string
  signals: string[]
  weakSignal: string
}

const preferences: Preference[] = [
  {
    cityPair: '교토 · 경주',
    description: '역사, 전통문화, 산책',
    tag: '역사',
    signals: ['역사 +2', '산책 +1', '혼잡 회피 +1', '로컬 미식 +1'],
    weakSignal: '사진 명소 - 약함',
  },
  {
    cityPair: '후쿠오카 · 부산',
    description: '미식, 로컬 시장, 축제',
    tag: '미식',
    signals: ['미식 +2', '시장 +1', '축제 +1', '로컬 미식 +1'],
    weakSignal: '조용한 산책 - 약함',
  },
  {
    cityPair: '오키나와 · 제주',
    description: '바다, 자연, 휴식',
    tag: '바다',
    signals: ['바다 +2', '휴식 +1', '자연 +1', '카페 산책 +1'],
    weakSignal: '도심 쇼핑 - 약함',
  },
  {
    cityPair: '벳푸 · 온양',
    description: '온천, 힐링, 여유',
    tag: '온천',
    signals: ['온천 +2', '힐링 +1', '느린 일정 +1', '숙소 체류 +1'],
    weakSignal: '야간 축제 - 약함',
  },
  {
    cityPair: '삿포로 · 강원',
    description: '자연, 계절감, 겨울',
    tag: '자연',
    signals: ['자연 +2', '계절감 +1', '전망 +1', '로컬 음식 +1'],
    weakSignal: '혼잡 도심 - 약함',
  },
  {
    cityPair: '도쿄 · 서울',
    description: '전시, 쇼핑, 예술, 트렌드',
    tag: '예술',
    signals: ['예술 +2', '전시 +1', '쇼핑 +1', '트렌드 +1'],
    weakSignal: '한적한 자연 - 약함',
  },
]

type View = 'home' | 'chat'

function App() {
  const proofItems = ['AI 일정', '챗봇', '소도시 보기']
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [activeView, setActiveView] = useState<View>('home')
  const [selectedPreference, setSelectedPreference] = useState(preferences[0])
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false)

  const showOnboarding = () => {
    setActiveView('chat')
    setIsOnboardingVisible(true)
  }

  const closeOnboarding = () => {
    setIsOnboardingVisible(false)
  }

  const storeSelectedPreference = () => {
    localStorage.setItem('lovv.preference', JSON.stringify(selectedPreference))
  }

  const startChatWithPreference = () => {
    storeSelectedPreference()
    setActiveView('chat')
    closeOnboarding()
  }

  useEffect(() => {
    if (!isOnboardingVisible) {
      return
    }

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOnboarding()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOnboardingVisible])

  return (
    <main className="min-h-dvh bg-[#fffcd9] text-[#10392d]">
      <header className="fixed inset-x-0 top-0 z-20 h-14 border-b border-[#d9e1c7] bg-white/95 shadow-[0_3px_10.5px_rgba(16,37,31,0.05)] backdrop-blur">
        <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-9">
          <a
            href="#home"
            aria-label="Lovv home"
            onClick={() => {
              setActiveView('home')
              closeOnboarding()
            }}
            className="block h-14 w-[102px] overflow-hidden"
          >
            <img src={logoImage} alt="Lovv" className="h-full w-full object-cover" />
          </a>
          <a
            href="#home"
            onClick={() => {
              setActiveView('home')
              closeOnboarding()
            }}
            className="inline-flex h-8 w-[132px] items-center justify-center rounded-[10.5px] border border-[#b8c9aa] bg-[#dbe8d3] text-[10.5px] font-bold text-[#10251f] shadow-[0_3px_10.5px_rgba(16,37,31,0.05)] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10392d]"
          >
            새 여정 만들기
          </a>
        </nav>
      </header>

      {activeView === 'home' ? (
        <>
          <section
            id="home"
            aria-labelledby="main-entry-title"
            className="mx-auto grid min-h-[732px] max-w-[1440px] grid-cols-[minmax(0,1fr)_430px] items-start gap-20 px-[77px] pt-[145px] max-lg:grid-cols-1 max-lg:px-8 max-lg:pt-28 max-sm:px-5"
          >
            <div className="max-w-[620px]">
              <p className="text-base font-semibold leading-[22px] text-[#577861]">
                한국과 일본 소도시 여행을 가장 쉽게 시작하는 방법
              </p>
              <h1
                id="main-entry-title"
                aria-label="나만 아는 여행 앱, Lovv"
                className="mt-3 text-[58px] font-bold leading-[68px] tracking-normal text-[#10392d] max-sm:text-[42px] max-sm:leading-[50px]"
              >
                <span className="block">나만 아는</span>
                <span className="block">여행 앱, Lovv</span>
              </h1>
              <p className="mt-12 max-w-[600px] text-lg leading-[31px] text-[#10392d] max-sm:mt-7 max-sm:text-base max-sm:leading-7">
                여행 조건을 길게 입력하지 않아도 괜찮아요. <br />
                한국과 일본의 작은 도시를 기준으로 취향에 맞는 여행 흐름을 먼저 제안합니다.
              </p>
              <a
                href="#onboarding"
                aria-controls="onboarding"
                aria-expanded={isOnboardingVisible}
                onClick={(event) => {
                  event.preventDefault()
                  showOnboarding()
                }}
                className="mt-7 inline-flex h-[52px] w-[178px] items-center justify-center rounded-[18px] border border-[#b8c9aa] bg-[#dbe8d3] text-sm font-semibold text-[#10392d] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] transition hover:-translate-y-0.5 hover:border-[#ccb23d] hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10392d]"
              >
                AI 일정 짜기
              </a>
            </div>

            <div className="-mt-2.5 justify-self-end max-lg:mt-0 max-lg:justify-self-start">
              <img
                src={suitcaseImage}
                alt="손을 흔드는 초록색 캐리어 캐릭터"
                className="h-[531px] w-[375px] rounded-[17px] object-cover max-sm:h-auto max-sm:w-full"
              />
            </div>
          </section>

          <section className="mx-auto max-w-[1440px] px-[55px] pb-10 max-sm:px-5">
            <div className="grid min-h-[126px] grid-cols-[1fr_auto] items-center gap-8 rounded-3xl border border-[#e0d6a8] bg-white/80 px-[31px] py-7 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] max-lg:grid-cols-1">
              <div>
                <h2 className="text-[22px] font-semibold leading-7 text-[#10392d]">
                  처음엔 작게, 추천은 정확하게
                </h2>
                <p className="mt-2 text-sm leading-5 text-[#577861]">
                  한국과 일본 소도시부터 검증하고, 사용자의 테마 선택으로 일정 추천 품질을 높입니다.
                </p>
              </div>
              <ul className="flex flex-wrap gap-3">
                {proofItems.map((item, index) => (
                  <li key={item}>
                    <a
                      href={item === '챗봇' ? '#chat' : '#home'}
                      className={`inline-flex h-[34px] items-center justify-center rounded-full border border-[#b8c9aa] bg-[#dbe8d3] px-8 text-xs text-[#10392d] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] ${
                        index === 0 ? 'font-semibold' : 'font-medium'
                      }`}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : (
        <section
          id="chat"
          aria-labelledby="chat-title"
          className="mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
        >
          <div className="grid min-h-[620px] grid-cols-[320px_minmax(0,1fr)] gap-6 max-lg:grid-cols-1">
            <aside className="rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] p-6 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]">
              <p className="text-sm font-semibold text-[#617566]">Lovv AI Planner</p>
              <h2 id="chat-title" className="mt-3 text-[30px] font-bold leading-9 text-[#10392d]">
                AI 일정 챗봇
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#577861]">
                온보딩에서 고른 취향을 바탕으로 한국과 일본 소도시 일정을 대화로 만들어갑니다.
              </p>
              <div className="mt-8 space-y-3">
                {['취향 설문 대기', '소도시 추천', '일정 초안'].map((item) => (
                  <div
                    key={item}
                    className="rounded-[14px] border border-[#bed0b1] bg-[#f0f6e9] px-4 py-3 text-sm font-semibold text-[#10392d]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex min-h-[620px] flex-col rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]">
              <div className="border-b border-[#e0d6a8] px-6 py-5">
                <p className="text-sm font-semibold text-[#617566]">AI 일정 짜기</p>
                <h3 className="mt-2 text-2xl font-bold text-[#10392d]">여행 조건을 대화로 정리하기</h3>
              </div>
              <div className="flex-1 space-y-4 px-6 py-6">
                <div className="max-w-[560px] rounded-[18px] border border-[#bed0b1] bg-[#f0f6e9] px-5 py-4 text-sm leading-6 text-[#10392d]">
                  먼저 여행 감각을 고르면, 어울리는 소도시와 일정 흐름을 이어서 제안할게요.
                </div>
                <div className="ml-auto max-w-[520px] rounded-[18px] border border-[#d7d3a2] bg-[#ffe25a] px-5 py-4 text-sm font-semibold leading-6 text-[#10392d]">
                  취향 선택 후 일정 대화를 시작할게요.
                </div>
              </div>
              <div className="border-t border-[#e0d6a8] p-5">
                <div className="flex min-h-12 items-center rounded-full border border-[#bed0b1] bg-[#f7f5df] px-5 text-sm text-[#617566]">
                  여행 기간, 동행, 관심사를 입력해 주세요
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isOnboardingVisible && (
        <div
          data-testid="onboarding-overlay"
          className="fixed inset-0 z-40 overflow-y-auto bg-[#10392d]/30 px-8 py-5 backdrop-blur-[6px] max-sm:px-4 max-sm:py-6"
        >
          <section
            id="onboarding"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            className="relative mx-auto w-full max-w-[1280px] rounded-[26px] border border-[#d7d3a2] bg-[#fffcd9] px-10 pb-7 pt-7 shadow-[0_24px_80px_rgba(16,37,31,0.24)] max-lg:px-8 max-sm:px-5"
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="온보딩 닫기"
              onClick={closeOnboarding}
              className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border border-[#bed0b1] bg-[#f0f6e9] text-lg font-bold text-[#10392d] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b2e]"
            >
              ×
            </button>
            <p className="text-lg font-semibold text-[#617566]">접속 시 최초 온보딩 설문</p>
            <h2
              id="onboarding-title"
              className="mt-3 text-[34px] font-bold leading-10 text-[#0b3b2e] max-sm:text-[30px] max-sm:leading-10"
            >
              대도시 예시로 여행 취향을 가볍게 고르기
            </h2>
            <p className="mt-3 max-w-[860px] text-base leading-6 text-[#0b3b2e]">
              처음부터 테마를 확정하지 않고, 익숙한 도시의 느낌을 선택하면 Lovv가 소도시 추천 태그로
              변환합니다.
            </p>

            <div className="mt-4 grid grid-cols-[minmax(0,842px)_360px] gap-8 max-xl:grid-cols-1">
              <section className="rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] p-6 shadow-[0_8px_9px_rgba(0,0,0,0.08)] max-sm:p-5">
                <h3 className="text-[28px] font-bold leading-9 text-[#0b3b2e] max-sm:text-2xl">
                  어떤 여행 감각에 더 가까우세요?
                </h3>

                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 max-md:grid-cols-1">
                  {preferences.map((preference) => {
                    const isSelected = selectedPreference.cityPair === preference.cityPair

                    return (
                      <button
                        key={preference.cityPair}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPreference(preference)}
                        className={`grid min-h-[84px] grid-cols-[1fr_auto] items-center gap-4 rounded-[14px] border border-[#bed0b1] px-5 text-left transition hover:border-[#b8c9aa] hover:bg-[#e7f0df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b2e] ${
                          isSelected ? 'bg-[#e7f0df]' : 'bg-[#fffced]'
                        }`}
                      >
                        <span>
                          <span className="block text-xl font-bold leading-7 text-[#0b3b2e]">
                            {preference.cityPair}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-[#617566]">
                            {preference.description}
                          </span>
                        </span>
                        <span
                          className={`inline-flex h-[34px] min-w-[74px] items-center justify-center rounded-full border px-4 text-[13px] font-semibold text-[#0b3b2e] ${
                            isSelected
                              ? 'border-[#d7d3a2] bg-[#ffe25a]'
                              : 'border-[#bed0b1] bg-[#f0f6e9]'
                          }`}
                        >
                          {preference.tag}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 flex justify-end">
                  <a
                    href="#chat"
                    onClick={startChatWithPreference}
                    className="inline-flex h-[46px] w-[230px] items-center justify-center rounded-full border border-[#d7d3a2] bg-[#ffe25a] text-sm font-semibold text-[#0b3b2e] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b2e]"
                  >
                    이 느낌으로 대화 시작
                  </a>
                </div>
              </section>

              <aside className="rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] p-6 shadow-[0_8px_9px_rgba(0,0,0,0.08)] max-sm:p-5">
                <p className="text-lg font-semibold text-[#617566]">Lovv가 저장하는 개인화 단서</p>
                <h3 className="mt-4 text-[28px] font-bold leading-9 text-[#0b3b2e]">
                  <span className="block">대화 전에는</span>
                  <span className="block">취향 힌트만 저장합니다</span>
                </h3>
                <p className="mt-5 text-sm leading-[22px] text-[#0b3b2e]">
                  로그인 없이 MVP를 운영하므로 전체 대화 기록은 저장하지 않고, 선택한 감각과 생성된
                  계획만 localStorage에 남깁니다.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[...selectedPreference.signals, selectedPreference.weakSignal].map((signal, index) => (
                    <span
                      key={signal}
                      className={`inline-flex h-[34px] items-center justify-center rounded-full border px-4 text-[13px] font-semibold text-[#0b3b2e] ${
                        index < 2 ? 'border-[#d7d3a2] bg-[#ffe25a]' : 'border-[#bed0b1] bg-[#f0f6e9]'
                      }`}
                    >
                      {signal}
                    </span>
                  ))}
                </div>

                <div className="mt-6 rounded-[14px] border border-[#bed0b1] bg-[#f0f6e9] px-5 py-4 text-sm font-semibold leading-[22px] text-[#0b3b2e]">
                  <p>저장 대상: 생성된 여행 계획, 관심 지역, 비교/저장 액션</p>
                  <p>저장 제외: 전체 채팅 로그</p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
