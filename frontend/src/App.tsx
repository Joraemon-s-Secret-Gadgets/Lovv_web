import { useState } from 'react'
import logoImage from './assets/lovv-logo.png'
import suitcaseImage from './assets/lovv-suitcase-hi.png'
import beppuImage from './assets/cities/beppu.jpg'
import busanImage from './assets/cities/busan.jpg'
import gangneungImage from './assets/cities/gangneung.jpg'
import gyeongjuImage from './assets/cities/gyeongju.jpg'
import jejuImage from './assets/cities/jeju.jpg'
import jeonjuImage from './assets/cities/jeonju.jpg'
import kanazawaImage from './assets/cities/kanazawa.jpg'
import kyotoImage from './assets/cities/kyoto.jpg'
import nikkoImage from './assets/cities/nikko.jpg'
import okinawaImage from './assets/cities/okinawa.jpg'
import onyangImage from './assets/cities/onyang.jpg'
import osakaImage from './assets/cities/osaka.jpg'

type CityCoverImage = {
  city: string
  image: string
}

type FestivalThemeChoice = 'undecided' | 'include' | 'exclude'

type Preference = {
  cityPair: string
  legacyCityPairs?: string[]
  description: string
  tag: string
  signals: string[]
  weakSignal: string
  issue: string
  editorialNote: string
  routeHint: string
  coverImages: CityCoverImage[]
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
  festivalThemeLabel: string
  summary: string
  stops: PlanStop[]
}

type LovvUser = {
  id: string
  name: string
  email: string
  avatarInitial: string
}

const preferenceStorageKey = 'lovv.preference'
const authStorageKey = 'lovv.auth.user'

const mockGoogleUser: LovvUser = {
  id: 'mock-google-user',
  name: 'Lovv Tester',
  email: 'tester@lovv.local',
  avatarInitial: 'L',
}

const authServiceBullets = [
  'Lovv는 소도시 여행 추천 큐레이션 서비스를 제공합니다.',
  '대도시 대신 취향과 분위기에 가까운 한국과 일본의 작은 도시 후보를 먼저 정리합니다.',
  'AI 챗봇으로 여행 기간, 축제 포함 여부, 걷는 양을 대화로 좁혀갑니다.',
  '추천 일정은 세부 일정 확인, 좋아요, 마이페이지 저장 흐름으로 확장됩니다.',
]

const authServiceCards = [
  {
    title: '숨겨진 장소',
    body: '관광객은 모르는 현지 감각의 작은 도시와 동네를 먼저 제안합니다.',
  },
  {
    title: '취향 큐레이션',
    body: 'AI가 사용자의 속도와 장면 선택을 바탕으로 일정 후보를 정리합니다.',
  },
]

const authJourneyItems = [
  {
    date: 'Step 01',
    title: '여행 분위기 선택',
    body: '도시 이름보다 여행의 속도와 장면을 먼저 고릅니다.',
  },
  {
    date: 'Step 02',
    title: 'AI 일정 대화',
    body: '기간, 축제 포함 여부, 걷는 양을 채팅으로 좁힙니다.',
  },
  {
    date: 'Step 03',
    title: '소도시 일정 저장',
    body: '마음에 드는 추천 일정은 나중에 마이페이지에 담을 수 있게 확장합니다.',
  },
]

const preferences: Preference[] = [
  {
    cityPair: '아산/온양 · 벳푸',
    legacyCityPairs: ['온양 · 벳푸', '벳푸 · 온양'],
    description: '온양온천, 스파 휴양 · 온천 수도, 지옥 순례',
    tag: '온천·휴양',
    signals: ['온천 +2', '휴양 +1', '스파 +1', '숙소 체류 +1'],
    weakSignal: '혼잡 도심 - 약함',
    issue: 'No. 01',
    editorialNote: '온양온천과 벳푸처럼 뜨거운 물, 숙소 체류, 느린 회복감을 중심에 둬요.',
    routeHint: '온양온천 · 스파 휴양 · 지옥 순례',
    coverImages: [
      { city: '아산/온양', image: onyangImage },
      { city: '벳푸', image: beppuImage },
    ],
  },
  {
    cityPair: '부산 · 오키나와',
    legacyCityPairs: ['제주 · 오키나와', '오키나와 · 제주'],
    description: '해운대, 광안리 · 에메랄드 바다, 리조트',
    tag: '바다·해안',
    signals: ['바다 +2', '해안 +1', '리조트 +1', '휴식 +1'],
    weakSignal: '산악 트레킹 - 약함',
    issue: 'No. 02',
    editorialNote: '해변과 바다색이 먼저 떠오르는 여행, 리조트와 해안 산책의 여백을 중시해요.',
    routeHint: '해운대 · 광안리 · 에메랄드 바다',
    coverImages: [
      { city: '부산', image: busanImage },
      { city: '오키나와', image: okinawaImage },
    ],
  },
  {
    cityPair: '경주 · 교토',
    legacyCityPairs: ['교토 · 경주'],
    description: '불국사, 첨성대, 황리단길 · 사찰, 기온, 전통 거리',
    tag: '역사·전통',
    signals: ['역사 +2', '전통 +1', '산책 +1', '골목 +1'],
    weakSignal: '리조트 휴양 - 약함',
    issue: 'No. 03',
    editorialNote: '경주와 교토처럼 오래된 장소, 골목, 전통의 결을 천천히 따라가요.',
    routeHint: '불국사 · 첨성대 · 기온 거리',
    coverImages: [
      { city: '경주', image: gyeongjuImage },
      { city: '교토', image: kyotoImage },
    ],
  },
  {
    cityPair: '전주 · 오사카',
    legacyCityPairs: ['부산 · 후쿠오카', '후쿠오카 · 부산'],
    description: '한옥마을, 전주비빔밥, 시장 · 도톤보리, 타코야키, 노포',
    tag: '미식·노포',
    signals: ['미식 +2', '노포 +1', '시장 +1', '로컬 음식 +1'],
    weakSignal: '한적한 자연 - 약함',
    issue: 'No. 04',
    editorialNote: '대표 음식과 오래된 가게를 중심으로, 시장과 골목의 식탁을 따라 움직여요.',
    routeHint: '한옥마을 · 전주비빔밥 · 도톤보리 노포',
    coverImages: [
      { city: '전주', image: jeonjuImage },
      { city: '오사카', image: osakaImage },
    ],
  },
  {
    cityPair: '제주 · 닛코',
    legacyCityPairs: ['강원 · 삿포로', '삿포로 · 강원'],
    description: '한라산, 올레길 · 도쇼구, 게곤폭포, 산악',
    tag: '자연·트레킹',
    signals: ['자연 +2', '트레킹 +1', '전망 +1', '계절감 +1'],
    weakSignal: '도심 쇼핑 - 약함',
    issue: 'No. 05',
    editorialNote: '한라산과 닛코처럼 걷는 리듬, 산악 풍경, 폭포와 숲의 장면을 먼저 봅니다.',
    routeHint: '한라산 · 올레길 · 게곤폭포',
    coverImages: [
      { city: '제주', image: jejuImage },
      { city: '닛코', image: nikkoImage },
    ],
  },
  {
    cityPair: '강릉 · 가나자와',
    legacyCityPairs: ['서울 · 도쿄', '도쿄 · 서울'],
    description: '감성 카페, 안목해변, 정동진 · 히가시차야, 겐로쿠엔, 공예',
    tag: '예술·감성',
    signals: ['감성 +2', '예술 +1', '카페 +1', '공예 +1'],
    weakSignal: '빠른 도심 쇼핑 - 약함',
    issue: 'No. 06',
    editorialNote: '카페와 해변, 공예와 정원의 분위기를 천천히 보고 기록하는 여행이에요.',
    routeHint: '안목해변 · 정동진 · 히가시차야',
    coverImages: [
      { city: '강릉', image: gangneungImage },
      { city: '가나자와', image: kanazawaImage },
    ],
  },
]

type View = 'auth' | 'onboarding' | 'home' | 'chat'

const durationGuidePrompts = ['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일']
const festivalThemePrompts: { label: string; choice: FestivalThemeChoice }[] = [
  { label: '축제 포함', choice: 'include' },
  { label: '축제 제외', choice: 'exclude' },
]

const readStoredPreference = () => {
  try {
    const rawPreference = localStorage.getItem(preferenceStorageKey)

    if (!rawPreference) {
      return null
    }

    const parsedPreference = JSON.parse(rawPreference) as Partial<Preference>

    return (
      preferences.find(
        (preference) =>
          preference.cityPair === parsedPreference.cityPair ||
          preference.legacyCityPairs?.includes(parsedPreference.cityPair ?? ''),
      ) ?? null
    )
  } catch {
    return null
  }
}

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(authStorageKey)

    if (!rawUser) {
      return null
    }

    const parsedUser = JSON.parse(rawUser) as Partial<LovvUser>

    if (!parsedUser.id || !parsedUser.name || !parsedUser.email || !parsedUser.avatarInitial) {
      return null
    }

    return {
      id: parsedUser.id,
      name: parsedUser.name,
      email: parsedUser.email,
      avatarInitial: parsedUser.avatarInitial,
    }
  } catch {
    return null
  }
}

const createMessageId = (role: ChatMessage['role'], index: number) => `${role}-${index}`

const getExplicitDurationLabel = (message: string) => {
  const normalizedMessage = message.replace(/\s+/g, '')

  if (!normalizedMessage) {
    return null
  }

  const nightsMatch = normalizedMessage.match(/([1-4])박([2-5])일/)

  if (nightsMatch) {
    const nights = Number(nightsMatch[1])
    const days = nights + 1

    return `${nights}박 ${days}일`
  }

  if (/당일치기|당일|하루/.test(message)) {
    return '당일치기'
  }

  const daysOnlyMatch = normalizedMessage.match(/([1-5])일/)

  if (daysOnlyMatch) {
    const days = Number(daysOnlyMatch[1])

    if (days <= 1) {
      return '당일치기'
    }

    return `${days - 1}박 ${days}일`
  }

  return null
}

const getDurationLabel = (message: string) => {
  return getExplicitDurationLabel(message) ?? '1일'
}

const wantsLessWalking = (message: string) => /덜\s*걷|적게\s*걷|동선|천천|여유|혼자/.test(message)

const resolveFestivalThemeChoice = (
  message: string,
  currentChoice: FestivalThemeChoice,
): FestivalThemeChoice => {
  if (/축제\s*포함|축제.*넣|축제.*같이|행사.*포함/.test(message)) {
    return 'include'
  }

  if (/축제\s*제외|축제.*빼|축제.*없이|행사.*제외/.test(message)) {
    return 'exclude'
  }

  return currentChoice
}

const getFestivalThemeSummary = (choice: FestivalThemeChoice) => {
  if (choice === 'include') {
    return '지역 축제나 시즌 행사가 있으면 일정 후보에 함께 넣습니다.'
  }

  if (choice === 'exclude') {
    return '축제보다 식당과 동네 산책을 우선합니다.'
  }

  return '축제 포함 여부는 대화 초반에 먼저 확인합니다.'
}

const getFestivalThemeLabel = (choice: FestivalThemeChoice) => {
  if (choice === 'include') {
    return '축제 포함'
  }

  if (choice === 'exclude') {
    return '축제 제외'
  }

  return '축제 미정'
}

const createPlanDraft = (
  preference: Preference,
  message = '',
  festivalThemeChoice: FestivalThemeChoice = 'undecided',
): PlanDraft => {
  const durationLabel = getDurationLabel(message)
  const isLessWalking = wantsLessWalking(message)
  const isArtFocused = preference.tag === '예술' || /전시|편집숍|쇼핑|예술/.test(message)
  const intensityLabel = isLessWalking ? '덜 걷는 일정' : '동선이 느슨한 일정'
  const baseSummary = isArtFocused
    ? '전시와 편집숍 사이 이동을 줄이는 쪽으로, 저녁에는 동네 산책보다 휴식 여백을 먼저 둡니다.'
    : `${preference.routeHint} 흐름을 기준으로 이동 부담을 낮추고, ${preference.tag} 취향이 잘 보이는 장면을 앞에 둡니다.`
  const festivalThemeSummary = getFestivalThemeSummary(festivalThemeChoice)

  return {
    durationLabel,
    intensityLabel,
    festivalThemeLabel: getFestivalThemeLabel(festivalThemeChoice),
    summary: `${baseSummary} ${festivalThemeSummary}`,
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
    content: `${preference.cityPair} 감성에 맞춰 시작할게요. 먼저 축제를 일정 테마에 포함할까요?`,
  },
  {
    id: createMessageId('user', 1),
    role: 'user',
    content: '대화로 먼저 여행 조건을 좁혀보고 싶어요.',
  },
]

const createAssistantReply = (preference: Preference, draft: PlanDraft) =>
  `${preference.cityPair} 감성으로 ${draft.durationLabel} 흐름을 잡아볼게요. ${draft.intensityLabel}으로 ${preference.tag} 취향이 가장 잘 보이는 시간대를 먼저 배치했습니다.`

const mapMarkerPositions = [
  { left: '32%', top: '58%' },
  { left: '67%', top: '38%' },
]

const getThemeHashtags = (preference: Preference) => [
  ...preference.coverImages.map((coverImage) => `#${coverImage.city.replace('/', '')}`),
  `#${preference.tag.split('·')[0]}`,
]

function App() {
  const proofItems = ['AI 일정', '챗봇', '소도시 보기']
  const [, setCurrentUser] = useState<LovvUser | null>(() => readStoredUser())
  const [selectedPreference, setSelectedPreference] = useState(() => readStoredPreference() ?? preferences[0])
  const [activeView, setActiveView] = useState<View>(() => {
    if (!readStoredUser()) {
      return 'auth'
    }

    return readStoredPreference() ? 'home' : 'onboarding'
  })
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [hasSelectedCover, setHasSelectedCover] = useState(false)
  const [festivalThemeChoice, setFestivalThemeChoice] = useState<FestivalThemeChoice>('undecided')
  const [selectedDurationLabel, setSelectedDurationLabel] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    createInitialChatMessages(selectedPreference),
  )
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => createPlanDraft(selectedPreference))
  const selectedCoverImage =
    selectedPreference.coverImages[coverImageIndex] ?? selectedPreference.coverImages[0]
  const selectedThemeHashtags = getThemeHashtags(selectedPreference)
  const shouldShowFestivalPrompt = festivalThemeChoice === 'undecided'
  const shouldShowDurationPrompt = !shouldShowFestivalPrompt && selectedDurationLabel === null
  const isPlannerReady = festivalThemeChoice !== 'undecided' && selectedDurationLabel !== null

  const signInWithGoogle = () => {
    localStorage.setItem(authStorageKey, JSON.stringify(mockGoogleUser))
    setCurrentUser(mockGoogleUser)
    setActiveView(readStoredPreference() ? 'home' : 'onboarding')
  }

  const signOut = () => {
    localStorage.removeItem(authStorageKey)
    setCurrentUser(null)
    setActiveView('auth')
  }

  const goHome = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault()
    setActiveView('home')
  }

  const openChat = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault()
    setChatInput('')
    setFestivalThemeChoice('undecided')
    setSelectedDurationLabel(null)
    setChatMessages(createInitialChatMessages(selectedPreference))
    setPlanDraft(createPlanDraft(selectedPreference))
    setActiveView('chat')
  }

  const openChatFromQuickAction = () => {
    setIsQuickActionsOpen(false)
    openChat()
  }

  const scrollToTop = () => {
    setIsQuickActionsOpen(false)
    setActiveView('home')
    window.scrollTo?.({ behavior: 'smooth', top: 0 })
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

  const selectPreference = (preference: Preference) => {
    setSelectedPreference(preference)
    setCoverImageIndex(0)
    setHasSelectedCover(true)
  }

  const showNextCoverImage = () => {
    setCoverImageIndex((currentIndex) => (currentIndex + 1) % selectedPreference.coverImages.length)
  }

  const submitChatMessage = (message: string) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return
    }

    const nextFestivalThemeChoice = resolveFestivalThemeChoice(trimmedMessage, festivalThemeChoice)
    const explicitDurationLabel = getExplicitDurationLabel(trimmedMessage)
    const nextSelectedDurationLabel = explicitDurationLabel ?? selectedDurationLabel
    const draftMessage = explicitDurationLabel
      ? trimmedMessage
      : nextSelectedDurationLabel
        ? `${nextSelectedDurationLabel} ${trimmedMessage}`
        : trimmedMessage
    const nextDraft = createPlanDraft(selectedPreference, draftMessage, nextFestivalThemeChoice)
    const didChooseFestivalTheme = nextFestivalThemeChoice !== festivalThemeChoice
    const assistantContent =
      didChooseFestivalTheme && nextSelectedDurationLabel === null
        ? `${getFestivalThemeLabel(nextFestivalThemeChoice)} 기준으로 볼게요. 이제 여행 기간을 먼저 골라주세요.`
        : festivalThemeChoice === 'undecided' && nextFestivalThemeChoice === 'undecided'
          ? nextSelectedDurationLabel
            ? `${nextSelectedDurationLabel} 흐름은 반영했어요. 축제 테마를 일정에 포함할지도 알려주세요.`
            : '좋아요. 먼저 축제 테마 포함 여부와 여행 기간을 차례로 좁혀볼게요.'
          : createAssistantReply(selectedPreference, nextDraft)

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
        content: assistantContent,
      },
    ])
    setFestivalThemeChoice(nextFestivalThemeChoice)
    setSelectedDurationLabel(nextSelectedDurationLabel)
    setPlanDraft(nextDraft)
    setChatInput('')
  }

  const submitChatForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitChatMessage(chatInput)
  }

  return (
    <main className="lovv-warm-pattern lovv-ambient-background min-h-dvh bg-[#fff8ee] text-[#33271E]">
      {activeView === 'auth' ? (
        <section
          aria-labelledby="auth-title"
          className="mx-auto grid min-h-dvh max-w-[1440px] grid-cols-[minmax(360px,440px)_minmax(0,1fr)] lg:h-dvh lg:overflow-hidden max-lg:grid-cols-1"
        >
          <div
            data-testid="auth-fixed-panel"
            className="flex min-h-dvh min-w-0 flex-col justify-between border-r border-[#A92B10]/70 px-16 py-16 max-lg:min-h-0 max-lg:border-b max-lg:border-r-0 max-lg:px-8 max-lg:py-10 max-sm:px-5"
          >
            <div>
              <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
            </div>

            <div className="my-16 min-w-0 max-lg:my-10">
              <p className="text-sm font-black uppercase tracking-[0.26em] text-[#33271E] max-sm:text-[12px]">
                Google simple signup
              </p>
              <h1
                id="auth-title"
                aria-label="서울/오사카 말고, 지금은 이곳"
                className="mt-7 max-w-[360px] break-keep text-[48px] font-black leading-[58px] text-[#33271E] max-sm:text-[36px] max-sm:leading-[44px]"
              >
                <span className="block">서울/오사카 말고,</span>
                <span className="block text-[#F36B12]">지금은 이곳</span>
              </h1>
              <p className="mt-6 break-keep text-sm font-bold text-[#33271E]">
                회원가입하고 Lovv 시작하기
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="mt-8 inline-flex min-h-[54px] w-full max-w-[340px] items-center justify-center rounded-[14px] border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-black text-[#33271E] shadow-[0_14px_32px_-18px_rgba(51,39,30,0.45)] transition hover:-translate-y-0.5 hover:border-[#A92B10] hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                Google 간편 로그인으로 시작하기
              </button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold text-[#33271E]/80">
              <a href="#auth-title" className="hover:text-[#F36B12]">
                이용약관
              </a>
              <a href="#auth-title" className="hover:text-[#F36B12]">
                개인정보처리방침
              </a>
            </div>
          </div>

          <div
            data-testid="auth-scroll-panel"
            className="min-h-dvh overflow-y-auto px-20 py-20 max-lg:min-h-0 max-lg:overflow-visible max-lg:px-8 max-lg:py-12 max-sm:px-5"
          >
            <div className="mx-auto max-w-[720px] pb-16">
              <div className="inline-flex min-h-[32px] items-center rounded-full bg-[#FFF0E4] px-4 text-[12px] font-black text-[#A92B10]">
                소도시 여행의 새로운 기준
              </div>
              <h2 className="mt-8 max-w-[560px] break-keep text-[44px] font-black leading-[54px] text-[#33271E] max-sm:text-[32px] max-sm:leading-10">
                소도시 여행의 새로운 기준, Lovv
              </h2>
              <p className="mt-7 max-w-[610px] break-keep text-base font-semibold leading-8 text-[#33271E] max-sm:text-sm max-sm:leading-7">
                익숙한 대도시의 화려함 뒤에 숨겨진 진짜 로컬의 매력을 발견하세요.
                Lovv는 한국과 일본의 작지만 보석 같은 도시들을 연결하여 당신만의 특별한 여행
                이야기를 만들어냅니다.
              </p>

              <ul
                aria-label="Lovv 서비스 설명"
                className="mt-8 space-y-3 pl-5 text-sm font-bold leading-7 text-[#33271E]"
                style={{ listStyleType: 'square' }}
              >
                {authServiceBullets.map((item) => (
                  <li key={item} className="break-keep pl-1">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-12 grid grid-cols-2 gap-5 max-md:grid-cols-1">
                {authServiceCards.map((card) => (
                  <article
                    key={card.title}
                    className="min-h-[150px] rounded-[20px] border border-[#F3B489] bg-[#FFE4D4] p-6 shadow-[0_18px_40px_-32px_rgba(51,39,30,0.32)]"
                  >
                    <div className="size-8 rounded-full border border-[#A92B10] bg-[#FFF8EE]" />
                    <h3 className="mt-4 text-base font-black text-[#33271E]">{card.title}</h3>
                    <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                      {card.body}
                    </p>
                  </article>
                ))}
              </div>

              <section aria-labelledby="auth-journey-title" className="mt-20">
                <h3 id="auth-journey-title" className="text-2xl font-black text-[#33271E]">
                  Lovv의 여정
                </h3>
                <ol className="mt-8 space-y-8 border-l-2 border-[#F36B12] pl-7">
                  {authJourneyItems.map((item) => (
                    <li key={item.date} className="relative">
                      <span className="absolute -left-[37px] top-1 size-4 rounded-full border-2 border-[#FFF8EE] bg-[#A92B10]" />
                      <p className="text-sm font-black text-[#F36B12]">{item.date}</p>
                      <h4 className="mt-1 break-keep text-lg font-black text-[#33271E]">
                        {item.title}
                      </h4>
                      <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </section>
      ) : activeView === 'onboarding' ? (
        <section
          id="onboarding"
          aria-labelledby="onboarding-title"
          className="mx-auto min-h-dvh max-w-[1440px] px-12 py-9 max-lg:px-8 max-sm:px-5"
        >
          <div
            className={`grid min-h-[calc(100dvh-72px)] gap-10 max-xl:grid-cols-1 ${
              hasSelectedCover ? 'grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
              </div>

              <div className="mt-10">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#33271E]">
                    Lovv City Mood Journal
                  </p>
                  <h1
                    id="onboarding-title"
                    className="mt-4 max-w-[820px] break-keep text-[56px] font-bold leading-[64px] text-[#33271E] max-sm:text-[34px] max-sm:leading-[42px]"
                  >
                    여행의 분위기를 골라주세요
                  </h1>
                  <p className="mt-5 max-w-[680px] break-keep text-base leading-7 text-[#33271E] max-sm:text-[15px] max-sm:leading-6">
                    익숙한 대도시 감각을 Lovv가 한국과 일본 소도시 후보로 바꿔둘게요.
                  </p>
                </div>
              </div>

              <section className="mt-9">
                <div className="flex items-end justify-between gap-5 max-md:block">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#33271E]">Choose your cover story</p>
                    <h2 className="mt-2 break-keep text-[28px] font-bold leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                      도시의 분위기로 고르는 여행 취향
                    </h2>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                  {preferences.map((preference) => {
                    const isSelected = hasSelectedCover && selectedPreference.cityPair === preference.cityPair

                    return (
                      <button
                        key={preference.cityPair}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectPreference(preference)}
                        className={`flex min-h-[176px] min-w-0 flex-col justify-between rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-[#A92B10] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                          isSelected
                            ? 'border-[#A92B10] bg-[#FFF0E4] shadow-[0_18px_40px_-28px_rgba(51,39,30,0.55)]'
                            : 'border-[#F3B489] bg-[#fffffa]'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                            {preference.issue}
                          </span>
                          <span
                            className="inline-flex h-[30px] shrink-0 items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-3 text-[12px] font-bold text-[#33271E]"
                          >
                            {preference.tag}
                          </span>
                        </span>
                        <span className="mt-5">
                          <span className="block break-keep text-[23px] font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
                            {preference.cityPair}
                          </span>
                          <span className="mt-2 block line-clamp-2 break-keep text-sm leading-6 text-[#33271E]">
                            {preference.description}
                          </span>
                        </span>
                        <span className="mt-5 block line-clamp-2 break-keep border-t border-[#F3B489] pt-3 text-[12px] font-semibold leading-5 text-[#33271E]">
                          {preference.routeHint}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-5 rounded-[22px] border border-[#F3B489] bg-[#fffffa] px-5 py-4 shadow-[0_18px_50px_-34px_rgba(51,39,30,0.24)] max-md:grid-cols-1">
                  <div className="flex flex-wrap gap-2">
                    {[...selectedPreference.signals.slice(0, 3), selectedPreference.weakSignal].map(
                      (signal) => (
                        <span
                          key={signal}
                          className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]"
                        >
                          {signal}
                        </span>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={enterMainWithPreference}
                    className="inline-flex h-auto min-h-[48px] w-[220px] items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:w-full"
                  >
                    이 취향으로 Lovv 시작하기
                  </button>
                </div>
              </section>
            </div>

            {hasSelectedCover ? (
              <aside className="sticky top-9 h-fit rounded-[28px] border border-[#F3B489] bg-[#fffffa] p-5 shadow-[0_24px_70px_-42px_rgba(51,39,30,0.45)] max-xl:static">
                <div className="group relative overflow-hidden rounded-[24px] border border-[#F3B489] bg-[#FFF0E4]">
                  <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                      Selected Cover
                    </span>
                    <span className="rounded-full border border-[#F3B489] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                      {selectedPreference.tag}
                    </span>
                  </div>
                  <img
                    src={selectedCoverImage.image}
                    alt={`${selectedCoverImage.city} 대표 이미지`}
                    className="h-[360px] w-full object-cover max-sm:h-[260px]"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#33271E]/75 via-[#33271E]/20 to-transparent p-5 max-sm:flex-col max-sm:items-start">
                    <span className="rounded-full bg-[#fffffa]/95 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-[0_10px_30px_-22px_rgba(0,0,0,0.5)]">
                      현재 표시: {selectedCoverImage.city}
                    </span>
                    <button
                      type="button"
                      aria-label="다음 도시 이미지 보기"
                      onClick={showNextCoverImage}
                      className="inline-flex min-h-9 items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 text-[12px] font-bold text-[#33271E] opacity-0 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.5)] transition hover:bg-[#FFE0CA] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffffa] group-hover:opacity-100 max-sm:opacity-100"
                    >
                      다음
                    </button>
                  </div>
                </div>

                <div className="px-2 pb-2 pt-5">
                  <p className="text-sm font-semibold text-[#33271E]">오늘의 취향 여정</p>
                  <h2 className="mt-2 break-keep text-[34px] font-bold leading-10 text-[#33271E] max-sm:text-3xl max-sm:leading-9">
                    {selectedPreference.cityPair}
                  </h2>
                  <p className="mt-4 line-clamp-3 break-keep text-sm leading-6 text-[#33271E]">
                    {selectedPreference.editorialNote}
                  </p>

                  <div className="mt-5 rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-4">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#33271E]">
                      First route note
                    </p>
                    <p className="mt-2 line-clamp-2 break-keep text-sm font-bold leading-6 text-[#33271E]">
                      {selectedPreference.routeHint}
                    </p>
                  </div>

                  <p className="mt-5 line-clamp-3 break-keep text-[13px] leading-6 text-[#33271E]">
                    현재 MVP는 Google mock 세션과 여행 취향 힌트만 저장하고, 전체 채팅 로그는 저장하지 않습니다.
                  </p>
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          <header className="fixed inset-x-0 top-0 z-20 h-14 border-b border-[#F3B489] bg-white/95 shadow-[0_3px_10.5px_rgba(51,39,30,0.05)] backdrop-blur">
            <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-9 max-sm:px-5">
              <a
                href="#home"
                aria-label="Lovv home"
                onClick={goHome}
                className="block h-14 w-[102px] overflow-hidden"
              >
                <img src={logoImage} alt="Lovv" className="h-full w-full object-contain" />
              </a>
              <div className="flex min-w-0 items-center justify-end gap-2">
                <a
                  href="#home"
                  onClick={goHome}
                  className="inline-flex h-auto min-h-8 w-[132px] items-center justify-center rounded-[10.5px] border border-[#A92B10] bg-[#F36B12] px-3 text-center text-[10.5px] font-bold leading-4 text-[#33271E] shadow-[0_3px_10.5px_rgba(51,39,30,0.05)] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:w-auto max-sm:px-2"
                >
                  새 여정 만들기
                </a>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex h-auto min-h-8 items-center justify-center rounded-[10.5px] border border-[#F3B489] bg-[#fffffa] px-3 text-center text-[10.5px] font-bold leading-4 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  로그아웃
                </button>
              </div>
            </nav>
          </header>

          {activeView === 'home' ? (
            <>
              <section
                id="home"
                data-testid="main-entry"
                aria-labelledby="main-entry-title"
                className="lovv-hero-radial mx-auto grid min-h-[732px] max-w-[1440px] grid-cols-[minmax(0,1fr)_430px] items-start gap-20 px-[77px] pt-[145px] max-lg:grid-cols-1 max-lg:px-8 max-lg:pt-28 max-sm:px-5"
              >
                <div className="max-w-[620px]">
                  <p className="break-keep text-base font-semibold leading-[22px] text-[#33271E] max-sm:text-sm max-sm:leading-5">
                    한국과 일본 소도시 여행을 가장 쉽게 시작하는 방법
                  </p>
                  <h1
                    id="main-entry-title"
                    aria-label="나만 아는 여행 앱, Lovv"
                    className="mt-3 break-keep text-[58px] font-bold leading-[68px] tracking-normal text-[#33271E] max-sm:text-[36px] max-sm:leading-[44px]"
                  >
                    <span className="block">나만 아는</span>
                    <span className="block">
                      여행 앱,{' '}
                      <span className="lovv-headline-wordmark text-[#F36B12] drop-shadow-[0_3px_0_rgba(169,43,16,0.2)]">
                        Lovv
                      </span>
                    </span>
                  </h1>
                  <div aria-label="선택한 여행 테마" className="mt-7 flex max-w-full flex-wrap gap-2">
                    {selectedThemeHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex min-h-[34px] items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 break-keep text-sm font-bold leading-5 text-[#33271E] shadow-[0_10px_24px_-18px_rgba(51,39,30,0.28)] max-sm:text-[13px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-8 max-w-[600px] break-keep text-lg leading-[31px] text-[#33271E] max-sm:mt-7 max-sm:text-base max-sm:leading-7">
                    여행 조건을 길게 입력하지 않아도 괜찮아요. <br />
                    한국과 일본의 작은 도시를 기준으로 취향에 맞는 여행 흐름을 먼저 제안합니다.
                  </p>
                  <a
                    href="#chat"
                    onClick={openChat}
                    className="mt-7 inline-flex h-[52px] w-[178px] items-center justify-center rounded-[18px] border border-[#A92B10] bg-[#F36B12] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] transition hover:-translate-y-0.5 hover:border-[#A92B10] hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-sm:h-auto max-sm:min-h-[48px] max-sm:w-full max-sm:whitespace-normal"
                  >
                    AI 일정 짜기
                  </a>
                </div>

                <div className="lovv-float-soft -mt-2.5 justify-self-end max-lg:mt-0 max-lg:justify-self-start">
                  <img
                    src={suitcaseImage}
                    alt="손을 흔드는 오렌지색 캐리어 캐릭터"
                    className="h-[531px] w-[430px] object-contain max-sm:h-auto max-sm:w-full"
                  />
                </div>
              </section>

              <section className="mx-auto max-w-[1440px] px-[55px] pb-8 max-sm:px-5">
                <div className="grid min-h-[126px] grid-cols-[1fr_auto] items-center gap-8 rounded-3xl border border-[#F3B489] bg-white/80 px-[31px] py-7 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.1)] max-lg:grid-cols-1">
                  <div>
                    <h2 className="break-keep text-[22px] font-semibold leading-7 text-[#33271E] max-sm:text-xl">
                      처음엔 작게, 추천은 정확하게
                    </h2>
                    <p className="mt-2 break-keep text-sm leading-5 text-[#33271E]">
                      한국과 일본 소도시부터 검증하고, 사용자의 테마 선택으로 일정 추천 품질을 높입니다.
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-3">
                    {proofItems.map((item, index) => (
                      <li key={item}>
                        <a
                          href={item === '소도시 보기' ? '#home' : '#chat'}
                          onClick={item === '소도시 보기' ? goHome : openChat}
                          className={`inline-flex h-[34px] items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-8 text-center text-xs leading-4 text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] max-sm:h-auto max-sm:min-h-[34px] max-sm:px-4 max-sm:whitespace-normal ${
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

              <section
                aria-labelledby="small-city-map-title"
                className="mx-auto max-w-[1440px] px-[55px] pb-10 max-sm:px-5"
              >
                <div className="grid min-h-[320px] grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6 rounded-3xl border border-[#F3B489] bg-white/80 p-6 shadow-[0_18px_50px_-34px_rgba(51,39,30,0.24)] max-lg:grid-cols-1">
                  <div className="flex min-w-0 flex-col justify-between gap-6">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F36B12]">
                        Small city route
                      </p>
                      <h2
                        id="small-city-map-title"
                        className="mt-3 break-keep text-[28px] font-bold leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
                      >
                        소도시 지도 프리뷰
                      </h2>
                      <p className="mt-3 break-keep text-sm leading-6 text-[#33271E]">
                        선택한 테마와 가까운 도시를 먼저 지도 위에 표시하고, AI 일정은 이 후보를 기준으로 대화를 시작합니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreference.coverImages.map((coverImage) => (
                        <span
                          key={coverImage.city}
                          className="inline-flex min-h-[34px] items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 text-[12px] font-bold text-[#33271E]"
                        >
                          {coverImage.city}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    aria-label="선택한 소도시 지도"
                    className="lovv-mini-map relative min-h-[280px] overflow-hidden rounded-[26px] border border-[#F3B489] bg-[#FFF0E4]"
                  >
                    <div className="absolute inset-0 opacity-70">
                      <div className="absolute left-[10%] top-[18%] h-[64%] w-[32%] rounded-[55%] border border-[#F3B489]" />
                      <div className="absolute right-[8%] top-[14%] h-[70%] w-[38%] rounded-[55%] border border-[#F3B489]" />
                      <div className="absolute left-[42%] top-[24%] h-[58%] w-[20%] rotate-12 rounded-[50%] border border-[#F3B489]" />
                    </div>
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M32 58 C45 40, 52 52, 67 38"
                        fill="none"
                        stroke="#F36B12"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                    {selectedPreference.coverImages.map((coverImage, index) => (
                      <button
                        key={coverImage.city}
                        type="button"
                        aria-label={`${coverImage.city} 소도시 지도 마커`}
                        style={mapMarkerPositions[index]}
                        className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-[#A92B10] bg-white px-3 py-2 text-[12px] font-black text-[#33271E] shadow-[0_12px_30px_-18px_rgba(51,39,30,0.5)] transition hover:scale-[1.03] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        <span className="size-2 rounded-full bg-[#F36B12]" />
                        {coverImage.city}
                      </button>
                    ))}
                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-[#F3B489] bg-white/90 px-4 py-3 text-[12px] font-bold leading-5 text-[#33271E] shadow-[0_12px_30px_-24px_rgba(51,39,30,0.45)]">
                      {selectedPreference.tag} 테마 후보를 먼저 띄워두고, 일정 대화에서 기간과 축제 포함 여부를 좁혀갑니다.
                    </div>
                  </div>
                </div>
              </section>

              <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 max-sm:bottom-4 max-sm:right-4">
                {isQuickActionsOpen ? (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      aria-label="AI 일정 짜기 바로가기"
                      onClick={openChatFromQuickAction}
                      className="inline-flex min-h-11 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] shadow-[0_16px_36px_-20px_rgba(51,39,30,0.55)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      AI 일정 짜기
                    </button>
                    <button
                      type="button"
                      aria-label="맨 위로 이동"
                      onClick={scrollToTop}
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
                  onClick={() => setIsQuickActionsOpen((isOpen) => !isOpen)}
                  className="flex size-14 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-xl font-black text-[#33271E] shadow-[0_18px_42px_-20px_rgba(51,39,30,0.65)] transition hover:-translate-y-0.5 hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {isQuickActionsOpen ? '×' : '↥'}
                </button>
              </div>
            </>
          ) : (
            <section
              id="chat"
              aria-labelledby="chat-title"
              className="mx-auto min-h-dvh max-w-[1440px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
            >
              <div data-testid="chat-workspace" className="space-y-5">
                <div
                  data-testid="chat-top-grid"
                  className="grid min-h-[660px] grid-cols-[300px_minmax(0,1fr)] items-stretch gap-6 max-lg:grid-cols-1"
                >
                  <aside
                    aria-label="AI 일정 챗봇 요약"
                    className="h-full rounded-[18px] border border-[#F3B489] bg-[#fffffa] p-6 shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
                  >
                    <p className="text-sm font-semibold text-[#33271E]">Lovv AI Planner</p>
                    <h2
                      id="chat-title"
                      className="mt-3 break-keep text-[30px] font-bold leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8"
                    >
                      AI 일정 챗봇
                    </h2>
                    <p className="mt-4 break-keep text-sm leading-6 text-[#33271E]">
                      {selectedPreference.cityPair} 감성을 기준으로 여행 조건을 대화로 정리합니다.
                    </p>
                    <div className="mt-8 space-y-3">
                      {['취향 반영 완료', '소도시 후보 탐색', '일정 초안 구성'].map((item) => (
                        <div
                          key={item}
                          className="rounded-[14px] border border-[#F3B489] bg-[#FFF0E4] px-4 py-3 text-sm font-semibold leading-5 text-[#33271E]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="flex min-h-[660px] flex-col rounded-[18px] border border-[#F3B489] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]">
                    <div className="border-b border-[#F3B489] px-6 py-5">
                      <p className="text-sm font-semibold text-[#33271E]">AI 일정 짜기</p>
                      <h3 className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
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
                          className={`max-w-[560px] break-keep rounded-[18px] border px-5 py-4 text-sm leading-6 text-[#33271E] max-sm:text-[13px] max-sm:leading-6 ${
                            message.role === 'assistant'
                              ? 'border-[#F3B489] bg-[#FFF0E4]'
                              : 'ml-auto border-[#A92B10] bg-[#F36B12] font-semibold'
                          }`}
                        >
                          {message.content}
                        </div>
                      ))}

                      {shouldShowFestivalPrompt ? (
                        <div className="max-w-[560px] space-y-3">
                          <div className="inline-flex max-w-full rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] px-5 py-4 text-sm font-bold leading-6 text-[#33271E] max-sm:text-[13px] max-sm:leading-6">
                            축제 테마를 일정에 포함할까요?
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {festivalThemePrompts.map((prompt) => {
                              const isSelected = festivalThemeChoice === prompt.choice

                              return (
                                <button
                                  key={prompt.choice}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => submitChatMessage(prompt.label)}
                                  className={`inline-flex min-h-[36px] items-center rounded-full border px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                                    isSelected
                                      ? 'border-[#A92B10] bg-[#F36B12]'
                                      : 'border-[#F3B489] bg-[#FFF0E4]'
                                  }`}
                                >
                                  {prompt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}

                      {shouldShowDurationPrompt ? (
                        <div className="max-w-[680px] space-y-3">
                          <div className="inline-flex max-w-full rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] px-5 py-4 text-sm font-bold leading-6 text-[#33271E] max-sm:text-[13px] max-sm:leading-6">
                            일정 기간을 먼저 골라주세요
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {durationGuidePrompts.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => submitChatMessage(prompt)}
                                className="inline-flex min-h-[36px] items-center rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-1 text-[12px] font-bold leading-4 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {isPlannerReady ? (
                        <div className="rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                              일정 초안
                            </span>
                            <span className="rounded-full border border-[#F3B489] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                              {planDraft.durationLabel}
                            </span>
                            <span className="rounded-full border border-[#F3B489] bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E]">
                              {planDraft.intensityLabel} 반영
                            </span>
                          </div>
                          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#33271E] max-sm:text-[13px]">
                            하단 일정 상세에 반영했어요. 시간대별 동선과 추천 이유를 이어서 확인해 주세요.
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="border-t border-[#F3B489] p-5">
                      <form onSubmit={submitChatForm} className="grid grid-cols-[1fr_auto] gap-3 max-sm:grid-cols-1">
                        <input
                          aria-label="여행 조건 입력"
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          placeholder="동행, 관심사, 걷는 정도를 추가로 입력해 주세요"
                          className="min-h-12 min-w-0 rounded-full border border-[#F3B489] bg-[#FFF0E4] px-5 py-2 break-keep text-sm leading-5 text-[#33271E] outline-none transition placeholder:text-[#33271E] focus:border-[#33271E] focus:bg-[#fffffa] max-sm:text-[13px]"
                        />
                        <button
                          type="submit"
                          aria-label="메시지 보내기"
                          disabled={!chatInput.trim()}
                          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-bold text-[#33271E] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#A92B10] disabled:hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          보내기
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <section
                  aria-labelledby="generated-plan-title"
                  className="overflow-hidden rounded-[18px] border border-[#F3B489] bg-[#fffffa] shadow-[0_12px_28px_-14px_rgba(33,46,33,0.14)]"
                >
                  <div className="border-b border-[#F3B489] bg-[#FFF0E4] px-6 py-6">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
                      <div>
                        <p className="text-sm font-semibold text-[#33271E]">맞춤 일정 결과</p>
                        <h3
                          id="generated-plan-title"
                          className="mt-2 break-keep text-2xl font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7"
                        >
                          생성된 일정 상세
                        </h3>
                        <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                          챗봇에서 정리된 조건을 바탕으로, 바로 아래에 일정 결과를 이어서 보여줍니다.
                        </p>
                      </div>
                      <span className="inline-flex h-10 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-[12px] font-bold text-[#33271E]">
                        1일차
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 max-md:grid-cols-1">
                      {[
                        planDraft.intensityLabel,
                        `${selectedPreference.tag} 중심`,
                        planDraft.festivalThemeLabel !== '축제 미정'
                          ? `${planDraft.festivalThemeLabel} 반영`
                          : null,
                        selectedPreference.weakSignal,
                      ].filter(Boolean).map((item) => (
                        <span
                          key={item}
                          className="inline-flex min-h-11 min-w-0 items-center rounded-[14px] border border-[#F3B489] bg-[#fffffa] px-4 py-2 break-keep text-sm font-bold leading-5 text-[#33271E] max-sm:text-[13px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-6">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-4 max-md:grid-cols-1">
                      <div>
                        <p className="text-sm font-bold text-[#33271E]">1일차 추천 일정</p>
                        <h4 className="mt-2 break-keep text-xl font-bold leading-7 text-[#33271E] max-sm:text-lg max-sm:leading-6">
                          {selectedPreference.cityPair} 감성 {planDraft.durationLabel} 초안
                        </h4>
                        <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                          장소를 확정하기 전, 취향에 맞는 하루 흐름과 이동 강도를 먼저 확인합니다.{' '}
                          {planDraft.summary}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#F3B489] bg-[#FFF0E4] px-4 py-2 text-[12px] font-bold text-[#33271E]">
                        코스 3개
                      </span>
                    </div>

                    <div className="mt-6 space-y-4">
                      {planDraft.stops.map((item, index) => (
                        <article key={item.time} className="grid grid-cols-[38px_minmax(0,1fr)] gap-4">
                          <div className="flex flex-col items-center">
                            <span className="flex size-9 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] text-sm font-black text-[#33271E]">
                              {index + 1}
                            </span>
                            {index < 2 ? <span className="mt-2 h-full w-px bg-[#F3B489]" /> : null}
                          </div>
                          <div className="min-w-0 rounded-[18px] border border-[#F3B489] bg-[#FFF0E4] p-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                                {item.time}
                              </span>
                              <span className="rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-semibold leading-4 text-[#33271E]">
                                다음 장소까지 {item.move}
                              </span>
                            </div>
                            <h5 className="mt-4 break-keep text-lg font-bold leading-7 text-[#33271E] max-sm:text-base max-sm:leading-6">
                              {item.title}
                            </h5>
                            <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
                              {item.body}
                            </p>
                            <div className="mt-4 rounded-[14px] border border-[#F3B489] bg-[#fffffa] px-4 py-3">
                              <p className="text-[12px] font-bold text-[#33271E]">추천 이유</p>
                              <p className="mt-1 line-clamp-2 break-keep text-sm leading-6 text-[#33271E] max-sm:text-[13px]">
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
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App
