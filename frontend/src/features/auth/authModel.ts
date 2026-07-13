import type { AuthProvider, LovvRole, LovvUser, SocialAuthProvider } from '../../shared/types/app'

export const authStorageKey = 'lovv.auth.user'
export const socialAuthProviderStorageKey = 'lovv.auth.socialProvider'

export const mockAuthUsers: Record<SocialAuthProvider, LovvUser> = {
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

export const readStoredSocialAuthProvider = (): SocialAuthProvider | null => {
  const provider = localStorage.getItem(socialAuthProviderStorageKey)

  return provider === 'google' || provider === 'kakao' ? provider : null
}

export const storeSocialAuthProvider = (provider: SocialAuthProvider) => {
  localStorage.setItem(socialAuthProviderStorageKey, provider)
}

export const clearStoredSocialAuthProvider = () => {
  localStorage.removeItem(socialAuthProviderStorageKey)
}

const validRoles = new Set<LovvRole>(['R-USER', 'R-ADMIN'])

export const readStoredRoles = (value: unknown): LovvRole[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined
  }

  const roles = value.filter((role): role is LovvRole => typeof role === 'string' && validRoles.has(role as LovvRole))

  return roles.length > 0 ? roles : undefined
}

export const authServiceBullets = [
  'Lovv는 도시 이름보다 여행 취향을 먼저 기준으로 삼습니다.',
  '바다 산책, 노포, 온천 같은 단서로 한국과 일본의 작은 도시 후보를 좁힙니다.',
  '여행 기간과 걷는 양을 대화로 맞춰 하루의 흐름을 잡습니다.',
  '마음에 든 일정은 세부 일정 확인, 좋아요, 마이페이지 저장으로 이어집니다.',
]

export const authServiceCards = [
  {
    title: '숨겨진 장소',
    body: '익숙한 관광지보다 분위기가 맞는 작은 도시부터 보여줍니다.',
  },
  {
    title: '취향별 후보',
    body: '고른 테마에 맞춰 도시와 일정 후보를 묶습니다.',
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

    const provider: AuthProvider =
      parsedUser.provider === 'cognito' ? 'cognito' : parsedUser.provider === 'kakao' ? 'kakao' : 'google'

    return {
      id: parsedUser.id,
      name: parsedUser.name,
      email: parsedUser.email,
      avatarInitial: parsedUser.avatarInitial,
      provider,
      roles: readStoredRoles(parsedUser.roles),
    }
  } catch {
    return null
  }
}
