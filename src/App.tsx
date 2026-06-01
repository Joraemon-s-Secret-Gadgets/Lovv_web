import { useState } from 'react'
import logoImage from './assets/lovv-logo.png'
import suitcaseImage from './assets/lovv-suitcase-hi.png'

type Preference = {
  cityPair: string
  description: string
  tag: string
  signals: string[]
  weakSignal: string
  issue: string
  editorialNote: string
  routeHint: string
}

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

type PlanStop = {
  time: '오전' | '오후' | '저녁'
  move: string
  title: string
  body: string
  reason: string
}

type PlanDraft = {
  durationLabel: string
  intensityLabel: string
  summary: string
  stops: PlanStop[]
}

const preferenceStorageKey = 'lovv.preference'

const preferences: Preference[] = [
  {
    cityPair: '교토 · 경주',
    description: '역사, 전통문화, 산책',
    tag: '역사',
    signals: ['역사 +2', '산책 +1', '혼잡 회피 +1', '로컬 미식 +1'],
    weakSignal: '사진 명소 - 약함',
    issue: 'No. 01',
    editorialNote: '오래된 골목, 낮은 담장, 천천히 머무는 하루에 가까워요.',
    routeHint: '전통 거리 · 찻집 · 야경 산책',
  },
  {
    cityPair: '후쿠오카 · 부산',
    description: '미식, 로컬 시장, 축제',
    tag: '미식',
    signals: ['미식 +2', '시장 +1', '축제 +1', '로컬 미식 +1'],
    weakSignal: '조용한 산책 - 약함',
    issue: 'No. 02',
    editorialNote: '시장과 포장마차, 바다 가까운 식탁을 따라 움직이는 여행이에요.',
    routeHint: '시장 탐방 · 로컬 식당 · 항구 산책',
  },
  {
    cityPair: '오키나와 · 제주',
    description: '바다, 자연, 휴식',
    tag: '바다',
    signals: ['바다 +2', '휴식 +1', '자연 +1', '카페 산책 +1'],
    weakSignal: '도심 쇼핑 - 약함',
    issue: 'No. 03',
    editorialNote: '바다와 바람을 오래 바라보고, 일정 사이에 여백을 두는 쪽이에요.',
    routeHint: '해변 드라이브 · 자연 전망 · 느린 카페',
  },
  {
    cityPair: '벳푸 · 온양',
    description: '온천, 힐링, 여유',
    tag: '온천',
    signals: ['온천 +2', '힐링 +1', '느린 일정 +1', '숙소 체류 +1'],
    weakSignal: '야간 축제 - 약함',
    issue: 'No. 04',
    editorialNote: '많이 보기보다 잘 쉬는 여행, 숙소와 동네의 리듬을 중시해요.',
    routeHint: '온천 거리 · 로컬 식사 · 숙소 휴식',
  },
  {
    cityPair: '삿포로 · 강원',
    description: '자연, 계절감, 겨울',
    tag: '자연',
    signals: ['자연 +2', '계절감 +1', '전망 +1', '로컬 음식 +1'],
    weakSignal: '혼잡 도심 - 약함',
    issue: 'No. 05',
    editorialNote: '계절의 색이 선명한 풍경과 전망 좋은 동선을 먼저 떠올려요.',
    routeHint: '전망 포인트 · 계절 식당 · 숲길',
  },
  {
    cityPair: '도쿄 · 서울',
    description: '전시, 쇼핑, 예술, 트렌드',
    tag: '예술',
    signals: ['예술 +2', '전시 +1', '쇼핑 +1', '트렌드 +1'],
    weakSignal: '한적한 자연 - 약함',
    issue: 'No. 06',
    editorialNote: '전시와 편집숍, 새로운 동네의 감각을 촘촘히 따라가요.',
    routeHint: '전시 공간 · 편집숍 · 밤 산책',
  },
]

type View = 'onboarding' | 'home' | 'chat'

const suggestionPrompts = ['혼자 1박 2일', '친구랑 2박 3일', '걷기 적은 일정', '카페와 전시 추가']

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

const createMessageId = (role: ChatMessage['role'], index: number) => `${role}-${index}`

const getDurationLabel = (message: string) => {
  if (/2\s*박\s*3\s*일/.test(message)) {
    return '2박 3일'
  }

  if (/1\s*박\s*2\s*일/.test(message)) {
    return '1박 2일'
  }

  if (/당일|하루|1\s*일/.test(message)) {
    return '1일'
  }

  return '1일'
}

const wantsLessWalking = (message: string) => /덜\s*걷|적게\s*걷|동선|천천|여유|혼자/.test(message)

const createPlanDraft = (preference: Preference, message = ''): PlanDraft => {
  const durationLabel = getDurationLabel(message)
  const isLessWalking = wantsLessWalking(message)
  const isArtFocused = preference.tag === '예술' || /전시|편집숍|쇼핑|예술/.test(message)
  const intensityLabel = isLessWalking ? '덜 걷는 일정' : '동선이 느슨한 일정'
  const summary = isArtFocused
    ? '전시와 편집숍 사이 이동을 줄이는 쪽으로, 저녁에는 동네 산책보다 휴식 여백을 먼저 둡니다.'
    : `${preference.routeHint} 흐름을 기준으로 이동 부담을 낮추고, ${preference.tag} 취향이 잘 보이는 장면을 앞에 둡니다.`

  return {
    durationLabel,
    intensityLabel,
    summary,
    stops: [
      {
        time: '오전',
        move: isLessWalking ? '12분' : '18분',
        title: isLessWalking ? '가볍게 도착하고 가까운 동네부터 보기' : '가볍게 도착하고 동네 감 잡기',
        body: preference.routeHint,
        reason: '첫 장소는 걷는 부담보다 여행 분위기를 잡는 데 집중합니다.',
      },
      {
        time: '오후',
        move: isLessWalking ? '16분' : '24분',
        title: isArtFocused ? '전시와 편집숍을 한 동선 안에 묶기' : '취향에 맞는 핵심 장소 둘러보기',
        body: isArtFocused ? '전시 공간 · 편집숍 · 쉬어가는 카페를 한 구역에 묶어 봅니다.' : preference.description,
        reason: isArtFocused
          ? '선택한 예술 취향이 가장 잘 드러나는 장소를 이동이 짧은 순서로 배치합니다.'
          : '선택한 취향이 가장 잘 드러나는 장소를 중간에 배치합니다.',
      },
      {
        time: '저녁',
        move: isLessWalking ? '10분' : '15분',
        title: '무리하지 않는 마무리 동선',
        body: preference.editorialNote,
        reason: '마지막에는 이동을 줄이고 쉬어갈 수 있는 여백을 둡니다.',
      },
    ],
  }
}

const createInitialChatMessages = (preference: Preference): ChatMessage[] => [
  {
    id: createMessageId('assistant', 0),
    role: 'assistant',
    content: `${preference.cityPair} 감성에 맞춰 시작할게요. 여행 기간, 동행, 걷는 양을 알려주면 어울리는 소도시와 일정 흐름을 먼저 정리할게요.`,
  },
  {
    id: createMessageId('user', 1),
    role: 'user',
    content: '대화로 먼저 여행 조건을 좁혀보고 싶어요.',
  },
]

const createAssistantReply = (preference: Preference, draft: PlanDraft) =>
  `${preference.cityPair} 감성으로 ${draft.durationLabel} 흐름을 잡아볼게요. ${draft.intensityLabel}으로 ${preference.tag} 취향이 가장 잘 보이는 시간대를 먼저 배치했습니다.`

function App() {
  const proofItems = ['AI 일정', '챗봇', '소도시 보기']
  const [selectedPreference, setSelectedPreference] = useState(() => readStoredPreference() ?? preferences[0])
  const [activeView, setActiveView] = useState<View>(() => (readStoredPreference() ? 'home' : 'onboarding'))
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    createInitialChatMessages(selectedPreference),
  )
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => createPlanDraft(selectedPreference))

  const goHome = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault()
    setActiveView('home')
  }

  const openChat = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault()
    setChatInput('')
    setChatMessages(createInitialChatMessages(selectedPreference))
    setPlanDraft(createPlanDraft(selectedPreference))
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

  const submitChatMessage = (message: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return
    }

    const nextDraft = createPlanDraft(selectedPreference, trimmedMessage)

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId('user', currentMessages.length),
        role: 'user',
        content: trimmedMessage,
      },
      {
        id: createMessageId('assistant', currentMessages.length + 1),
        role: 'assistant',
        content: createAssistantReply(selectedPreference, nextDraft),
      },
    ])
    setPlanDraft(nextDraft)
    setChatInput('')
  }

  const submitChatForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitChatMessage(chatInput)
  }

  return (
    <main className="min-h-dvh bg-[#fffcd9] text-[#10392d]">
      {activeView === 'onboarding' ? (
        <section
          id="onboarding"
          aria-labelledby="onboarding-title"
          className="mx-auto min-h-dvh max-w-[1440px] px-12 py-9 max-lg:px-8 max-sm:px-5"
        >
          <div className="grid min-h-[calc(100dvh-72px)] grid-cols-[minmax(0,1fr)_420px] gap-10 max-xl:grid-cols-1">
            <div>
              <div className="flex items-center justify-between gap-4">
                <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-cover" />
                <span className="inline-flex h-9 items-center rounded-full border border-[#d7d3a2] bg-[#fffffa] px-4 text-[12px] font-bold text-[#617566]">
                  First Issue
                </span>
              </div>

              <div className="mt-10 grid grid-cols-[minmax(0,1fr)_260px] items-end gap-8 max-lg:grid-cols-1">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#617566]">
                    Lovv City Mood Journal
                  </p>
                  <h1
                    id="onboarding-title"
                    className="mt-4 max-w-[820px] break-keep text-[56px] font-bold leading-[64px] text-[#0b3b2e] max-sm:text-[34px] max-sm:leading-[42px]"
                  >
                    이번 여행의 첫 분위기를 골라주세요
                  </h1>
                  <p className="mt-5 max-w-[680px] break-keep text-base leading-7 text-[#0b3b2e] max-sm:text-[15px] max-sm:leading-6">
                    도시 이름을 고르는 게 아니라, 여행의 속도와 장면을 먼저 고르는 단계예요. 익숙한
                    대도시 감각을 Lovv가 한국과 일본 소도시 후보로 바꿔둘게요.
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#d7d3a2] bg-[#fffffa] p-5 shadow-[0_18px_50px_-32px_rgba(16,57,45,0.28)]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#617566]">
                    Before the map
                  </p>
                  <p className="mt-3 break-keep text-[15px] font-bold leading-6 text-[#0b3b2e] max-sm:text-sm">
                    이번 선택으로 AI 일정의 말투와 지도 후보가 먼저 정리됩니다
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-[#0b3b2e]">
                    {['취향', '도시', '동선'].map((step) => (
                      <span key={step} className="rounded-full border border-[#bed0b1] bg-[#f0f6e9] px-3 py-2">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <section className="mt-9">
                <div className="flex items-end justify-between gap-5 max-md:block">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#617566]">Choose your cover story</p>
                    <h2 className="mt-2 break-keep text-[28px] font-bold leading-9 text-[#0b3b2e] max-sm:text-2xl max-sm:leading-8">
                      도시의 분위기로 고르는 여행 취향
                    </h2>
                  </div>
                  <p className="max-w-[320px] break-keep text-sm leading-6 text-[#617566] max-md:mt-3">
                    마음에 가까운 장면을 고르면, 다음 화면의 챗봇과 지도 추천이 이 톤에서 시작됩니다.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                  {preferences.map((preference) => {
                    const isSelected = selectedPreference.cityPair === preference.cityPair

                    return (
                      <button
                        key={preference.cityPair}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPreference(preference)}
                        className={`flex min-h-[176px] min-w-0 flex-col justify-between rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-[#10392d] hover:bg-[#f0f6e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b2e] ${
                          isSelected
                            ? 'border-[#10392d] bg-[#e7f0df] shadow-[0_18px_40px_-28px_rgba(16,57,45,0.55)]'
                            : 'border-[#d7d3a2] bg-[#fffffa]'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#617566]">
                            {preference.issue}
                          </span>
                          <span
                            className={`inline-flex h-[30px] shrink-0 items-center rounded-full border px-3 text-[12px] font-bold text-[#0b3b2e] ${
                              isSelected ? 'border-[#d7d3a2] bg-[#ffe25a]' : 'border-[#bed0b1] bg-[#f0f6e9]'
                            }`}
                          >
                            {preference.tag}
                          </span>
                        </span>
                        <span className="mt-5">
                          <span className="block break-keep text-[23px] font-bold leading-8 text-[#0b3b2e] max-sm:text-xl max-sm:leading-7">
                            {preference.cityPair}
                          </span>
                          <span className="mt-2 block line-clamp-2 break-keep text-sm leading-6 text-[#617566]">
                            {preference.description}
                          </span>
                        </span>
                        <span className="mt-5 block line-clamp-2 break-keep border-t border-[#d7d3a2] pt-3 text-[12px] font-semibold leading-5 text-[#0b3b2e]">
                          {preference.routeHint}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-5 rounded-[22px] border border-[#d7d3a2] bg-[#fffffa] px-5 py-4 shadow-[0_18px_50px_-34px_rgba(16,57,45,0.24)] max-md:grid-cols-1">
                  <div className="flex flex-wrap gap-2">
                    {[...selectedPreference.signals.slice(0, 3), selectedPreference.weakSignal].map(
                      (signal, index) => (
                        <span
                          key={signal}
                          className={`inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full border px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#0b3b2e] ${
                            index < 2 ? 'border-[#d7d3a2] bg-[#ffe25a]' : 'border-[#bed0b1] bg-[#f0f6e9]'
                          }`}
                        >
                          {signal}
                        </span>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={enterMainWithPreference}
                    className="inline-flex h-auto min-h-[48px] w-[220px] items-center justify-center rounded-full border border-[#d7d3a2] bg-[#ffe25a] px-5 text-center text-sm font-semibold leading-5 text-[#0b3b2e] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b2e] max-md:w-full"
                  >
                    이 취향으로 Lovv 시작하기
                  </button>
                </div>
              </section>
            </div>

            <aside className="sticky top-9 h-fit rounded-[28px] border border-[#d7d3a2] bg-[#fffffa] p-5 shadow-[0_24px_70px_-42px_rgba(16,57,45,0.45)] max-xl:static">
              <div className="relative overflow-hidden rounded-[24px] border border-[#e0d6a8] bg-[#f0f6e9] px-6 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#617566]">
                    Selected Cover
                  </span>
                  <span className="rounded-full border border-[#d7d3a2] bg-[#ffe25a] px-3 py-1 text-[12px] font-bold text-[#0b3b2e]">
                    {selectedPreference.tag}
                  </span>
                </div>
                <img
                  src={suitcaseImage}
                  alt="손을 흔드는 초록색 캐리어 캐릭터"
                  className="mx-auto mt-4 h-[310px] w-[230px] rounded-t-[24px] object-cover"
                />
              </div>

              <div className="px-2 pb-2 pt-5">
                <p className="text-sm font-semibold text-[#617566]">오늘의 취향 여정</p>
                <h2 className="mt-2 break-keep text-[34px] font-bold leading-10 text-[#0b3b2e] max-sm:text-3xl max-sm:leading-9">
                  {selectedPreference.cityPair}
                </h2>
                <p className="mt-4 line-clamp-3 break-keep text-sm leading-6 text-[#0b3b2e]">
                  {selectedPreference.editorialNote}
                </p>

                <div className="mt-5 rounded-[18px] border border-[#bed0b1] bg-[#fffced] p-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#617566]">
                    First route note
                  </p>
                  <p className="mt-2 line-clamp-2 break-keep text-sm font-bold leading-6 text-[#0b3b2e]">
                    {selectedPreference.routeHint}
                  </p>
                </div>

                <p className="mt-5 line-clamp-3 break-keep text-[13px] leading-6 text-[#617566]">
                  로그인 없이 MVP를 운영하므로 전체 채팅 로그가 아니라 여행 취향 힌트만 먼저 저장합니다.
                </p>
              </div>
            </aside>
          </div>
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
                className="inline-flex h-auto min-h-8 w-[132px] items-center justify-center rounded-[10.5px] border border-[#b8c9aa] bg-[#dbe8d3] px-3 text-center text-[10.5px] font-bold leading-4 text-[#10251f] shadow-[0_3px_10.5px_rgba(16,37,31,0.05)] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10392d]"
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
                  <p className="break-keep text-base font-semibold leading-[22px] text-[#577861] max-sm:text-sm max-sm:leading-5">
                    한국과 일본 소도시 여행을 가장 쉽게 시작하는 방법
                  </p>
                  <h1
                    id="main-entry-title"
                    aria-label="나만 아는 여행 앱, Lovv"
                    className="mt-3 break-keep text-[58px] font-bold leading-[68px] tracking-normal text-[#10392d] max-sm:text-[36px] max-sm:leading-[44px]"
                  >
                    <span className="block">나만 아는</span>
                    <span className="block">여행 앱, Lovv</span>
                  </h1>
                  <p className="mt-7 inline-flex max-w-full min-h-[36px] items-center rounded-full border border-[#d7d3a2] bg-[#fffced] px-5 py-2 break-keep text-center text-sm font-semibold leading-5 text-[#10392d] max-sm:text-[13px]">
                    {selectedPreference.cityPair} 감성으로 시작합니다
                  </p>
                  <p className="mt-8 max-w-[600px] break-keep text-lg leading-[31px] text-[#10392d] max-sm:mt-7 max-sm:text-base max-sm:leading-7">
                    여행 조건을 길게 입력하지 않아도 괜찮아요. <br />
                    한국과 일본의 작은 도시를 기준으로 취향에 맞는 여행 흐름을 먼저 제안합니다.
                  </p>
                  <a
                    href="#chat"
                    onClick={openChat}
                    className="mt-7 inline-flex h-[52px] w-[178px] items-center justify-center rounded-[18px] border border-[#b8c9aa] bg-[#dbe8d3] px-5 text-center text-sm font-semibold leading-5 text-[#10392d] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] transition hover:-translate-y-0.5 hover:border-[#ccb23d] hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10392d] max-sm:h-auto max-sm:min-h-[48px] max-sm:w-full max-sm:whitespace-normal"
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
                    <h2 className="break-keep text-[22px] font-semibold leading-7 text-[#10392d] max-sm:text-xl">
                      처음엔 작게, 추천은 정확하게
                    </h2>
                    <p className="mt-2 break-keep text-sm leading-5 text-[#577861]">
                      한국과 일본 소도시부터 검증하고, 사용자의 테마 선택으로 일정 추천 품질을 높입니다.
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-3">
                    {proofItems.map((item, index) => (
                      <li key={item}>
                        <a
                          href={item === '소도시 보기' ? '#home' : '#chat'}
                          onClick={item === '소도시 보기' ? goHome : openChat}
                          className={`inline-flex h-[34px] items-center justify-center rounded-full border border-[#b8c9aa] bg-[#dbe8d3] px-8 text-center text-xs leading-4 text-[#10392d] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] max-sm:h-auto max-sm:min-h-[34px] max-sm:px-4 max-sm:whitespace-normal ${
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
                  <h2
                    id="chat-title"
                    className="mt-3 break-keep text-[30px] font-bold leading-9 text-[#10392d] max-sm:text-2xl max-sm:leading-8"
                  >
                    AI 일정 챗봇
                  </h2>
                  <p className="mt-4 break-keep text-sm leading-6 text-[#577861]">
                    {selectedPreference.cityPair} 감성을 기준으로 여행 조건을 대화로 정리합니다.
                  </p>
                  <div className="mt-8 space-y-3">
                    {['취향 반영 완료', '소도시 후보 탐색', '일정 초안 구성'].map((item) => (
                      <div
                        key={item}
                        className="rounded-[14px] border border-[#bed0b1] bg-[#f0f6e9] px-4 py-3 text-sm font-semibold leading-5 text-[#10392d]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="flex min-h-[660px] flex-col gap-5">
                  <div className="flex min-h-[660px] flex-1 flex-col rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]">
                    <div className="border-b border-[#e0d6a8] px-6 py-5">
                      <p className="text-sm font-semibold text-[#617566]">AI 일정 짜기</p>
                      <h3 className="mt-2 break-keep text-2xl font-bold leading-8 text-[#10392d] max-sm:text-xl max-sm:leading-7">
                        여행 조건을 대화로 정리하기
                      </h3>
                    </div>
                    <div
                      role="log"
                      aria-label="AI 일정 대화"
                      className="flex-1 space-y-4 px-6 py-6"
                    >
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-[560px] break-keep rounded-[18px] border px-5 py-4 text-sm leading-6 text-[#10392d] max-sm:text-[13px] max-sm:leading-6 ${
                            message.role === 'assistant'
                              ? 'border-[#bed0b1] bg-[#f0f6e9]'
                              : 'ml-auto border-[#d7d3a2] bg-[#ffe25a] font-semibold'
                          }`}
                        >
                          {message.content}
                        </div>
                      ))}

                      {chatMessages.length > 2 ? (
                        <div className="rounded-[18px] border border-[#d7d3a2] bg-[#fffced] p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#bed0b1] bg-[#fffffa] px-3 py-1 text-[12px] font-bold text-[#10392d]">
                              일정 초안
                            </span>
                            <span className="rounded-full border border-[#d7d3a2] bg-[#ffe25a] px-3 py-1 text-[12px] font-bold text-[#10392d]">
                              {planDraft.durationLabel}
                            </span>
                            <span className="rounded-full border border-[#bed0b1] bg-[#f0f6e9] px-3 py-1 text-[12px] font-bold text-[#10392d]">
                              {planDraft.intensityLabel} 반영
                            </span>
                          </div>
                          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#10392d] max-sm:text-[13px]">
                            하단 일정 상세에 반영했어요. 시간대별 동선과 추천 이유를 이어서 확인해 주세요.
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="border-t border-[#e0d6a8] p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {suggestionPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => submitChatMessage(prompt)}
                            className="inline-flex min-h-[34px] items-center rounded-full border border-[#bed0b1] bg-[#f0f6e9] px-4 py-1 text-[12px] font-bold leading-4 text-[#10392d] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10392d]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      <form onSubmit={submitChatForm} className="grid grid-cols-[1fr_auto] gap-3 max-sm:grid-cols-1">
                        <input
                          aria-label="여행 조건 입력"
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          placeholder="여행 기간, 동행, 관심사를 입력해 주세요"
                          className="min-h-12 min-w-0 rounded-full border border-[#bed0b1] bg-[#f7f5df] px-5 py-2 break-keep text-sm leading-5 text-[#10392d] outline-none transition placeholder:text-[#617566] focus:border-[#10392d] focus:bg-[#fffffa] max-sm:text-[13px]"
                        />
                        <button
                          type="submit"
                          aria-label="메시지 보내기"
                          disabled={!chatInput.trim()}
                          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#b8c9aa] bg-[#dbe8d3] px-6 text-sm font-bold text-[#10392d] transition hover:border-[#ccb23d] hover:bg-[#ffe55f] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#b8c9aa] disabled:hover:bg-[#dbe8d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10392d]"
                        >
                          보내기
                        </button>
                      </form>
                    </div>
                  </div>

                  <section
                    aria-labelledby="generated-plan-title"
                    className="overflow-hidden rounded-[18px] border border-[#d7d3a2] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
                  >
                    <div className="border-b border-[#e0d6a8] bg-[#f7f5df] px-6 py-6">
                      <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
                        <div>
                          <p className="text-sm font-semibold text-[#617566]">맞춤 일정 결과</p>
                          <h3
                            id="generated-plan-title"
                            className="mt-2 break-keep text-2xl font-bold leading-8 text-[#10392d] max-sm:text-xl max-sm:leading-7"
                          >
                            생성된 일정 상세
                          </h3>
                          <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-[#577861] max-sm:text-[13px]">
                            챗봇에서 정리된 조건을 바탕으로, 바로 아래에 일정 결과를 이어서 보여줍니다.
                          </p>
                        </div>
                        <span className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7d3a2] bg-[#ffe25a] px-5 text-[12px] font-bold text-[#10392d]">
                          1일차
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3 max-md:grid-cols-1">
                        {[
                          planDraft.intensityLabel,
                          `${selectedPreference.tag} 중심`,
                          selectedPreference.weakSignal,
                        ].map((item) => (
                          <span
                            key={item}
                            className="inline-flex min-h-11 min-w-0 items-center rounded-[14px] border border-[#bed0b1] bg-[#fffffa] px-4 py-2 break-keep text-sm font-bold leading-5 text-[#10392d] max-sm:text-[13px]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="px-6 py-6">
                      <div className="grid grid-cols-[1fr_auto] items-start gap-4 max-md:grid-cols-1">
                        <div>
                          <p className="text-sm font-bold text-[#617566]">1일차 추천 일정</p>
                          <h4 className="mt-2 break-keep text-xl font-bold leading-7 text-[#10392d] max-sm:text-lg max-sm:leading-6">
                            {selectedPreference.cityPair} 감성 {planDraft.durationLabel} 초안
                          </h4>
                          <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-[#577861] max-sm:text-[13px]">
                            장소를 확정하기 전, 취향에 맞는 하루 흐름과 이동 강도를 먼저 확인합니다.{' '}
                            {planDraft.summary}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#bed0b1] bg-[#f0f6e9] px-4 py-2 text-[12px] font-bold text-[#10392d]">
                          코스 3개
                        </span>
                      </div>

                      <div className="mt-6 space-y-4">
                        {planDraft.stops.map((item, index) => (
                          <article key={item.time} className="grid grid-cols-[38px_minmax(0,1fr)] gap-4">
                            <div className="flex flex-col items-center">
                              <span className="flex size-9 items-center justify-center rounded-full border border-[#10392d] bg-[#ffe25a] text-sm font-black text-[#10392d]">
                                {index + 1}
                              </span>
                              {index < 2 ? <span className="mt-2 h-full w-px bg-[#d7d3a2]" /> : null}
                            </div>
                            <div className="min-w-0 rounded-[18px] border border-[#bed0b1] bg-[#f0f6e9] p-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#10392d]">
                                  {item.time}
                                </span>
                                <span className="rounded-full border border-[#d7d3a2] bg-[#fffffa] px-3 py-1 text-[12px] font-semibold leading-4 text-[#617566]">
                                  다음 장소까지 {item.move}
                                </span>
                              </div>
                              <h5 className="mt-4 break-keep text-lg font-bold leading-7 text-[#10392d] max-sm:text-base max-sm:leading-6">
                                {item.title}
                              </h5>
                              <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-[#577861] max-sm:text-[13px]">
                                {item.body}
                              </p>
                              <div className="mt-4 rounded-[14px] border border-[#d7d3a2] bg-[#fffffa] px-4 py-3">
                                <p className="text-[12px] font-bold text-[#617566]">추천 이유</p>
                                <p className="mt-1 line-clamp-2 break-keep text-sm leading-6 text-[#10392d] max-sm:text-[13px]">
                                  {item.reason}
                                </p>
                              </div>
                            </div>
                          </article>
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
