import type { AuthProvider, LovvUser } from '../../shared/types/app'

export const authStorageKey = 'lovv.auth.user'

export const mockAuthUsers: Record<AuthProvider, LovvUser> = {
  google: {
    id: 'mock-google-user',
    name: 'Lovv Google User',
    email: 'google@lovv.local',
    avatarInitial: 'G',
    provider: 'google',
  },
  kakao: {
    id: 'mock-kakao-user',
    name: 'Lovv Kakao User',
    email: 'kakao@lovv.local',
    avatarInitial: 'K',
    provider: 'kakao',
  },
}

export const authServiceBullets = [
  'Lovv는 소도시 여행 추천 큐레이션 서비스를 제공합니다.',
  '대도시 대신 취향과 분위기에 가까운 한국과 일본의 작은 도시 후보를 먼저 정리합니다.',
  'AI 챗봇으로 여행 기간, 축제 포함 여부, 걷는 양을 대화로 좁혀갑니다.',
  '추천 일정은 세부 일정 확인, 좋아요, 마이페이지 저장 흐름으로 확장됩니다.',
]

export const authServiceCards = [
  {
    title: '숨겨진 장소',
    body: '관광객은 모르는 현지 감각의 작은 도시와 동네를 먼저 제안합니다.',
  },
  {
    title: '취향 큐레이션',
    body: 'AI가 사용자의 속도와 장면 선택을 바탕으로 일정 후보를 정리합니다.',
  },
]

export const authJourneyItems = [
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

export const readStoredUser = (): LovvUser | null => {
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
      provider: parsedUser.provider === 'kakao' ? 'kakao' : 'google',
    }
  } catch {
    return null
  }
}
