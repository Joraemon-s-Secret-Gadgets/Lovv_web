import fireworkImage from '../../assets/cities/hero-firework.jpg'
import seaHeroImage from '../../assets/cities/hero-sea.jpg'
import townHeroImage from '../../assets/cities/hero-town.jpg'
import gangneungImage from '../../assets/cities/gangneung.jpg'
import gyeongjuImage from '../../assets/cities/gyeongju.jpg'
import jeonjuImage from '../../assets/cities/jeonju.jpg'
import onyangImage from '../../assets/cities/onyang.jpg'
import busanImage from '../../assets/cities/busan.jpg'
import type { HeroTheme, MonthlyRecommendation } from '../../shared/types/app'
import { preferences } from '../onboarding/preferenceModel'

export const heroRotationIntervalMs = 10000

export const heroThemes: HeroTheme[] = [
  {
    id: 'mountain',
    label: 'Mountain',
    lead: '당신이 몰랐던',
    accent: '소도시의 숨은 매력',
    summary:
      '복잡한 도심을 벗어나 현지인의 숨결이 닿은 산과 오래된 마을로 초대합니다. Lovv가 제안하는 느린 여행을 시작해보세요.',
    backgroundImage: townHeroImage,
    accentClassName: 'lovv-text-mountain',
    glowClassName: 'lovv-hero-glow-mountain',
  },
  {
    id: 'sea',
    label: 'Sea',
    lead: '당신이 몰랐던',
    accent: '소도시의 푸른 바다',
    summary:
      '탁 트인 바다와 청량한 바람이 머무는 곳. Lovv와 함께 파도 소리에 맞춰 걷는 특별한 여정을 찾아보세요.',
    backgroundImage: seaHeroImage,
    accentClassName: 'lovv-text-sea',
    glowClassName: 'lovv-hero-glow-sea',
  },
  {
    id: 'festival',
    label: 'Festival',
    lead: '당신이 몰랐던',
    accent: '소도시의 화려한 축제',
    summary:
      '밤하늘의 빛, 골목의 음악, 지역의 계절감이 만나는 순간. 축제의 에너지를 담은 소도시 여정을 제안합니다.',
    backgroundImage: fireworkImage,
    accentClassName: 'lovv-text-festival-gradient',
    glowClassName: 'lovv-hero-glow-festival',
  },
]

export const monthlyRecommendations: MonthlyRecommendation[] = [
  {
    id: 'onyang-beppu-slow-onsen',
    preference: preferences[0],
    title: '온천으로 회복하는 느린 여행',
    summary: '숙소 체류와 스파 시간을 넉넉히 두는 회복형 소도시 루트입니다.',
    badge: '이달의 온천',
    image: onyangImage,
    themes: ['온천', '휴양'],
  },
  {
    id: 'busan-okinawa-blue-coast',
    preference: preferences[1],
    title: '바다색이 선명한 해안 휴식',
    summary: '해변 산책과 리조트 여백을 중심에 둔 바다 테마 추천입니다.',
    badge: '해안 휴식',
    image: busanImage,
    themes: ['바다', '해안'],
  },
  {
    id: 'gyeongju-kyoto-old-street',
    preference: preferences[2],
    title: '오래된 골목과 전통 산책',
    summary: '사찰, 전통 거리, 조용한 산책 리듬이 잘 맞는 코스입니다.',
    badge: '전통 산책',
    image: gyeongjuImage,
    themes: ['역사', '전통'],
  },
  {
    id: 'jeonju-osaka-local-table',
    preference: preferences[3],
    title: '노포와 시장을 따라가는 미식 산책',
    summary: '시장과 오래된 가게를 중심으로 로컬 식탁의 리듬을 따라갑니다.',
    badge: '미식 산책',
    image: jeonjuImage,
    themes: ['미식', '노포'],
  },
  {
    id: 'gangneung-kanazawa-craft-note',
    preference: preferences[5],
    title: '예술과 감성을 기록하는 하루',
    summary: '카페, 해변, 공예와 정원 장면을 천천히 따라갑니다.',
    badge: '감성 기록',
    image: gangneungImage,
    themes: ['예술', '감성'],
  },
]
