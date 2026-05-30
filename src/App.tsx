import { useState } from 'react'
import logoImage from './assets/lovv-logo.png'
import suitcaseImage from './assets/lovv-suitcase-hi.png'

type Preference = {
  cityPair: string
  description: string
  tag: string
  signals: string[]
  weakSignal: string
}

const preferenceStorageKey = 'lovv.preference'

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

type View = 'onboarding' | 'home' | 'chat'

const readStoredPreference = () => {
  try {
    const rawPreference = localStorage.getItem(preferenceStorageKey)

    if (!rawPreference) {
      return null
    }

    const parsedPreference = JSON.parse(rawPreference) as Partial<Preference>

    return preferences.find((preference) => preference.cityPair === parsedPreference.cityPair) ?? null
  } catch {
    return null
  }
}

function App() {
  const proofItems = ['AI 일정', '챗봇', '소도시 보기']
  const [selectedPreference, setSelectedPreference] = useState(() => readStoredPreference() ?? preferences[0])
  const [activeView, setActiveView] = useState<View>(() => (readStoredPreference() ? 'home' : 'onboarding'))

  const goHome = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault()
    setActiveView('home')
  }

  const openChat = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault()
    setActiveView('chat')
  }

  const storeSelectedPreference = () => {
    localStorage.setItem(
      preferenceStorageKey,
      JSON.stringify({
        cityPair: selectedPreference.cityPair,
      }),
    )
  }

  const enterMainWithPreference = () => {
    storeSelectedPreference()
    setActiveView('home')
  }

  return (
    <main className="min-h-dvh bg-[#fffcd9] text-[#10392d]">
      {activeView === 'onboarding' ? (
        <section
          id="onboarding"
          aria-labelledby="onboarding-title"
          className="mx-auto grid min-h-dvh max-w-[1440px] grid-cols-[minmax(0,1fr)_360px] items-start gap-14 px-14 py-10 max-lg:grid-cols-1 max-lg:px-8 max-sm:px-5"
        >
          <div className="max-w-[860px]">
            <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-cover" />
            <p className="mt-10 text-lg font-semibold text-[#617566]">처음 진입 전 온보딩</p>
            <h1
              id="onboarding-title"
              className="mt-3 text-[48px] font-bold leading-[58px] text-[#0b3b2e] max-sm:text-[36px] max-sm:leading-[44px]"
            >
              대도시 예시로 여행 취향을 가볍게 고르기
            </h1>
            <p className="mt-4 max-w-[720px] text-base leading-7 text-[#0b3b2e]">
              메인 화면에 들어가기 전에 익숙한 도시 감각을 하나만 선택해 주세요. Lovv는 이 선택을
              소도시 추천과 AI 일정 대화의 첫 기준으로 사용합니다.
            </p>

            <section className="mt-8 rounded-[22px] border border-[#d7d3a2] bg-[#fffffa] p-6 shadow-[0_18px_50px_-28px_rgba(16,57,45,0.35)] max-sm:p-5">
              <h2 className="text-[26px] font-bold leading-8 text-[#0b3b2e] max-sm:text-2xl">
                어떤 여행 감각에 더 가까우세요?
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 max-md:grid-cols-1">
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
                        <span className="block text-lg font-bold leading-7 text-[#0b3b2e]">
                          {preference.cityPair}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-[#617566]">
                          {preference.description}
                        </span>
                      </span>
                      <span
                        className={`inline-flex h-[34px] min-w-[74px] items-center justify-center rounded-full border px-4 text-[13px] font-semibold text-[#0b3b2e] ${
                          isSelected ? 'border-[#d7d3a2] bg-[#ffe25a]' : 'border-[#bed0b1] bg-[#f0f6e9]'
                        }`}
                      >
                        {preference.tag}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-5 max-md:grid-cols-1">
                <div className="flex flex-wrap gap-2">
                  {[...selectedPreference.signals.slice(0, 3), selectedPreference.weakSignal].map((signal, index) => (
                    <span
                      key={signal}
                      className={`inline-flex h-[32px] items-center justify-center rounded-full border px-4 text-[12px] font-semibold text-[#0b3b2e] ${
                        index < 2 ? 'border-[#d7d3a2] bg-[#ffe25a]' : 'border-[#bed0b1] bg-[#f0f6e9]'
                      }`}
                    >
                      {signal}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={enterMainWithPreference}
                  className="inline-flex h-[48px] w-[220px] items-center justify-center rounded-full border border-[#d7d3a2] bg-[#ffe25a] text-sm font-semibold text-[#0b3b2e] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b2e] max-md:w-full"
                >
                  이 취향으로 Lovv 시작하기
                </button>
              </div>
            </section>
          </div>

          <aside className="mt-[364px] justify-self-end rounded-[24px] border border-[#d7d3a2] bg-[#fffffa] p-6 shadow-[0_18px_50px_-28px_rgba(16,57,45,0.35)] max-lg:mt-0 max-lg:justify-self-start max-sm:w-full">
            <img
              src={suitcaseImage}
              alt="손을 흔드는 초록색 캐리어 캐릭터"
              className="mx-auto h-[340px] w-[240px] rounded-[18px] object-cover"
            />
            <p className="mt-5 text-sm font-semibold text-[#617566]">선택한 감각</p>
            <h2 className="mt-2 text-[28px] font-bold leading-8 text-[#0b3b2e]">
              {selectedPreference.cityPair}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#0b3b2e]">
              로그인 없이 MVP를 운영하므로 전체 채팅 로그가 아니라 여행 취향 힌트만 먼저 저장합니다.
            </p>
          </aside>
        </section>
      ) : (
        <>
          <header className="fixed inset-x-0 top-0 z-20 h-14 border-b border-[#d9e1c7] bg-white/95 shadow-[0_3px_10.5px_rgba(16,37,31,0.05)] backdrop-blur">
            <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-9 max-sm:px-5">
              <a
                href="#home"
                aria-label="Lovv home"
                onClick={goHome}
                className="block h-14 w-[102px] overflow-hidden"
              >
                <img src={logoImage} alt="Lovv" className="h-full w-full object-cover" />
              </a>
              <a
                href="#home"
                onClick={goHome}
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
                  <p className="mt-7 inline-flex min-h-[36px] items-center rounded-full border border-[#d7d3a2] bg-[#fffced] px-5 text-sm font-semibold text-[#10392d]">
                    {selectedPreference.cityPair} 감성으로 시작합니다
                  </p>
                  <p className="mt-8 max-w-[600px] text-lg leading-[31px] text-[#10392d] max-sm:mt-7 max-sm:text-base max-sm:leading-7">
                    여행 조건을 길게 입력하지 않아도 괜찮아요. <br />
                    한국과 일본의 작은 도시를 기준으로 취향에 맞는 여행 흐름을 먼저 제안합니다.
                  </p>
                  <a
                    href="#chat"
                    onClick={openChat}
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
                          href={item === '소도시 보기' ? '#home' : '#chat'}
                          onClick={item === '소도시 보기' ? goHome : openChat}
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
              <div className="grid min-h-[660px] grid-cols-[300px_minmax(0,1fr)] gap-6 max-lg:grid-cols-1">
                <aside className="rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] p-6 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]">
                  <p className="text-sm font-semibold text-[#617566]">Lovv AI Planner</p>
                  <h2 id="chat-title" className="mt-3 text-[30px] font-bold leading-9 text-[#10392d]">
                    AI 일정 챗봇
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-[#577861]">
                    {selectedPreference.cityPair} 감성을 기준으로 대화와 지도를 함께 보며 여행 흐름을
                    만듭니다.
                  </p>
                  <div className="mt-8 space-y-3">
                    {['취향 반영 완료', '소도시 후보 탐색', '지도 동선 구성'].map((item) => (
                      <div
                        key={item}
                        className="rounded-[14px] border border-[#bed0b1] bg-[#f0f6e9] px-4 py-3 text-sm font-semibold text-[#10392d]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="flex min-h-[660px] flex-col gap-5">
                  <div className="flex min-h-[410px] flex-1 flex-col rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]">
                    <div className="border-b border-[#e0d6a8] px-6 py-5">
                      <p className="text-sm font-semibold text-[#617566]">AI 일정 짜기</p>
                      <h3 className="mt-2 text-2xl font-bold text-[#10392d]">여행 조건을 대화로 정리하기</h3>
                    </div>
                    <div className="flex-1 space-y-4 px-6 py-6">
                      <div className="max-w-[560px] rounded-[18px] border border-[#bed0b1] bg-[#f0f6e9] px-5 py-4 text-sm leading-6 text-[#10392d]">
                        {selectedPreference.cityPair} 감성에 맞춰 시작할게요. 여행 기간, 동행, 걷는 양을
                        알려주면 지도에 후보 동선을 바로 붙여볼게요.
                      </div>
                      <div className="ml-auto max-w-[520px] rounded-[18px] border border-[#d7d3a2] bg-[#ffe25a] px-5 py-4 text-sm font-semibold leading-6 text-[#10392d]">
                        하단 지도에서 후보 지역을 확인하면서 일정을 만들고 싶어요.
                      </div>
                    </div>
                    <div className="border-t border-[#e0d6a8] p-5">
                      <div className="flex min-h-12 items-center rounded-full border border-[#bed0b1] bg-[#f7f5df] px-5 text-sm text-[#617566]">
                        여행 기간, 동행, 관심사를 입력해 주세요
                      </div>
                    </div>
                  </div>

                  <section
                    aria-label="여행 지도"
                    className="rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] p-5 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
                  >
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4 max-sm:grid-cols-1">
                      <div>
                        <p className="text-sm font-semibold text-[#617566]">Map Preview</p>
                        <h3 className="mt-1 text-xl font-bold text-[#10392d]">
                          {selectedPreference.cityPair} 기반 지도
                        </h3>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 max-sm:justify-start">
                        {selectedPreference.signals.slice(0, 3).map((signal) => (
                          <span
                            key={signal}
                            className="inline-flex h-[30px] items-center rounded-full border border-[#bed0b1] bg-[#f0f6e9] px-3 text-[12px] font-semibold text-[#10392d]"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 h-[210px] overflow-hidden rounded-[16px] border border-[#bed0b1] bg-[#edf4e8] p-4">
                      <div className="relative h-full rounded-[12px] bg-[#f9f6df]">
                        <div className="absolute left-[8%] top-[52%] h-10 w-[70%] rounded-full border-2 border-dashed border-[#d7d3a2]" />
                        <div className="absolute left-[20%] top-[30%] h-20 w-28 rounded-full bg-[#dbe8d3]" />
                        <div className="absolute right-[18%] top-[38%] h-24 w-32 rounded-full bg-[#dbe8d3]" />
                        {['출발', '점심', '산책', '숙소'].map((label, index) => (
                          <span
                            key={label}
                            className={`absolute flex h-9 min-w-12 items-center justify-center rounded-full border border-[#ccb23d] bg-[#ffe25a] px-3 text-[12px] font-bold text-[#10392d] shadow-[0_6px_18px_-12px_rgba(16,57,45,0.55)] ${
                              index === 0
                                ? 'left-[12%] top-[54%]'
                                : index === 1
                                  ? 'left-[36%] top-[38%]'
                                  : index === 2
                                    ? 'right-[28%] top-[54%]'
                                    : 'right-[10%] top-[32%]'
                            }`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App
