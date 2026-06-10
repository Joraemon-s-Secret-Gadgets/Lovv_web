import { useState, type ReactNode } from 'react'

const heroBackground =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663562330405/WazP5rTdYzLQcRwdu79Yt7/lovv-hero-background-fcXoxsmGszszA8R9qoYaip.webp'
const characterImage =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663562330405/WazP5rTdYzLQcRwdu79Yt7/lovv-character-suitcase-KxkM4ovEqn9qxjra8ev3pE.webp'

const travelPreferences = [
  { id: 'golf', icon: '⛳', label: '골프·휴양', description: '골프장과 리조트' },
  { id: 'beach', icon: '🏖️', label: '해변·휴양', description: '해변과 수상 활동' },
  { id: 'culture', icon: '🏛️', label: '역사·문화', description: '박물관과 유산지' },
  { id: 'shopping', icon: '🛍️', label: '쇼핑·미식', description: '쇼핑과 음식' },
  { id: 'nature', icon: '🏔️', label: '자연·등산', description: '산과 자연 경관' },
  { id: 'city', icon: '🌆', label: '도시·야경', description: '도시 탐방' },
]

const features = [
  { icon: '◎', title: '당신의 취향 분석', description: 'AI가 당신의 여행 스타일을 정확히 파악합니다' },
  { icon: '↗', title: '맞춤형 추천', description: '당신만을 위한 특별한 여행지를 추천합니다' },
  { icon: '✓', title: '완벽한 계획', description: '상세한 일정과 팁으로 완벽한 여행을 준비합니다' },
]

const destinations = [
  {
    id: 1,
    name: '현대적 도시 경험',
    image:
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663562330405/WazP5rTdYzLQcRwdu79Yt7/lovv-travel-destination-1-iwPAp5y2C5wDJnH36CBfjd.webp',
    description: '황금 시간의 도시 풍경과 현대 건축',
  },
  {
    id: 2,
    name: '산악 자연 경험',
    image:
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663562330405/WazP5rTdYzLQcRwdu79Yt7/lovv-travel-destination-2-KpF6JTSVCsRkUfZvWu5c38.webp',
    description: '고산 지대의 평온한 자연 경관',
  },
  {
    id: 3,
    name: '해안 마을 경험',
    image:
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663562330405/WazP5rTdYzLQcRwdu79Yt7/lovv-travel-destination-3-db9fpyr3UmQfdtUPBeD3gV.webp',
    description: '지중해 해안 마을의 따뜻한 분위기',
  },
]

const mvpFlow = [
  { number: '01', title: 'Main', description: '여행 취향 선택' },
  { number: '02', title: 'Onboarding', description: '기본 정보 입력' },
  { number: '03', title: 'Chat Planning', description: 'AI와 대화' },
  { number: '04', title: 'AI Ranking', description: '추천 순위 결정' },
  { number: '05', title: 'Result', description: '결과 제시' },
  { number: '06', title: 'Save/Compare', description: '저장 및 비교' },
  { number: '07', title: 'Gap Planning', description: '세부 계획' },
  { number: '08', title: 'Next', description: '다음 추천' },
]

function ManusButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <button className={className}>{children}</button>
}

function ManusCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={className}>{children}</article>
}

export default function ManusLovvHomeReference() {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])

  const togglePreference = (id: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(id) ? prev.filter((preferenceId) => preferenceId !== id) : [...prev, id],
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="text-lg font-bold text-white">L</span>
            </div>
            <span className="text-xl font-bold text-foreground">Lovv</span>
          </div>
          <ManusButton className="btn-primary">시작하기</ManusButton>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={heroBackground} alt="Hero Background" className="h-full w-full object-cover" />
        </div>
        <div className="container relative py-20 md:py-32">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                ✨ 나란 아는 여행 앱
              </div>
              <h1 className="text-5xl font-bold leading-tight text-foreground md:text-6xl">
                Lovv로 시작하는 맞춤형 여행
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                당신의 취향을 분석하고 AI가 추천하는 최고의 여행 경험. 나란 아는 여행, Lovv와 함께
                시작하세요.
              </p>
              <div className="flex gap-4 pt-4">
                <ManusButton className="btn-primary">여행 시작하기 →</ManusButton>
                <ManusButton className="btn-secondary">자세히 보기</ManusButton>
              </div>
            </div>

            <div className="flex justify-center animate-fade-in-up md:justify-end">
              <img src={characterImage} alt="Lovv Character" className="h-64 w-64 object-contain drop-shadow-lg md:h-80 md:w-80" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-warm py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-3xl">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              당신의 여행 취향을 알려주세요
            </h2>
            <p className="text-lg text-muted-foreground">
              어떤 종류의 여행을 좋아하시나요? 여러 개를 선택할 수 있습니다.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {travelPreferences.map((preference) => {
              const isSelected = selectedPreferences.includes(preference.id)

              return (
                <button
                  key={preference.id}
                  onClick={() => togglePreference(preference.id)}
                  className={`rounded-lg p-6 text-left transition-all duration-200 ${
                    isSelected
                      ? 'scale-105 bg-primary text-primary-foreground shadow-lg'
                      : 'border border-border bg-white text-foreground hover:border-primary hover:shadow-md'
                  }`}
                >
                  <div className="mb-2 text-2xl">{preference.icon}</div>
                  <div className="font-semibold">{preference.label}</div>
                  <div className="mt-1 text-sm opacity-75">{preference.description}</div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-center">
            <ManusButton className="btn-primary">다음 단계로 이동 →</ManusButton>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <ManusCard key={feature.title} className="card-elevated p-8 text-center transition-all duration-200">
                <div className="mb-4 flex justify-center text-3xl text-primary">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </ManusCard>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/10 py-16 md:py-24">
        <div className="container">
          <div className="mb-12">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">추천 여행지</h2>
            <p className="text-lg text-muted-foreground">다양한 여행 경험을 제공합니다</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {destinations.map((destination) => (
              <ManusCard key={destination.id} className="group card-elevated cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden">
                  <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-xl font-bold">{destination.name}</h3>
                  <p className="mb-4 text-muted-foreground">{destination.description}</p>
                  <ManusButton className="btn-primary w-full text-sm">자세히 보기</ManusButton>
                </div>
              </ManusCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-12">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Lovv 여행 계획 프로세스</h2>
            <p className="text-lg text-muted-foreground">8단계의 체계적인 여행 계획 과정</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {mvpFlow.map((step) => (
              <ManusCard key={step.number} className="card-elevated flex h-full flex-col justify-center p-6 text-center">
                <div className="mb-2 text-3xl font-bold text-primary">{step.number}</div>
                <h3 className="mb-1 font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </ManusCard>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-accent py-16 md:py-24">
        <div className="container text-center">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">당신의 완벽한 여행을 시작하세요</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
            Lovv와 함께 당신의 취향에 맞는 최고의 여행 경험을 만들어보세요.
          </p>
          <ManusButton className="rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-all duration-200 hover:bg-white/90 hover:shadow-lg">
            지금 시작하기
          </ManusButton>
        </div>
      </section>

      <footer className="border-t border-border bg-foreground/5 py-12">
        <div className="container">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <span className="font-bold text-white">L</span>
                </div>
                <span className="font-bold">Lovv</span>
              </div>
              <p className="text-sm text-muted-foreground">나란 아는 여행 앱, Lovv</p>
            </div>

            {[
              { title: '서비스', links: ['여행 계획', '추천 여행지', '커뮤니티'] },
              { title: '회사', links: ['소개', '블로그', '채용'] },
              { title: '법률', links: ['이용약관', '개인정보', '문의'] },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="mb-3 font-semibold">{group.title}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="transition hover:text-foreground">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Lovv. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
