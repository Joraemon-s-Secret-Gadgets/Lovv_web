import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

const authStorageKey = 'lovv.auth.user'

const seedUser = () => {
  localStorage.setItem(
    authStorageKey,
    JSON.stringify({
      id: 'mock-google-user',
      name: 'Lovv Google User',
      email: 'google@lovv.local',
      avatarInitial: 'G',
      provider: 'google',
    }),
  )
}

const seedPreference = (cityPair = '아산/온양 · 벳푸') => {
  localStorage.setItem('lovv.preference', JSON.stringify({ cityPair }))
}

describe('MVP main entry screen', () => {
  it('shows social mock signup before onboarding on first entry', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '서울/오사카 말고, 지금은 이곳' })).toBeInTheDocument()
    expect(screen.getByText('회원가입하고 Lovv 시작하기')).toBeInTheDocument()
    expect(screen.queryByText(/저장한 취향과 여행 일정/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kakao 간편 로그인으로 시작하기' })).toBeInTheDocument()
    expect(screen.getByText(/OAuth API 없이 mock session만 저장합니다/)).toBeInTheDocument()
    expect(screen.queryByText('MVP mock session')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByText('Next step')).not.toBeInTheDocument()
    expect(screen.queryByText(/회원가입 후 여행의 분위기/)).not.toBeInTheDocument()
    expect(screen.getByTestId('auth-fixed-panel')).toHaveClass('border-r')
    expect(screen.getByTestId('auth-scroll-panel')).toHaveClass('overflow-y-auto')
    expect(screen.queryByRole('img', { name: '손을 흔드는 오렌지색 캐리어 캐릭터' })).not.toBeInTheDocument()
    expect(screen.getByText('지금은 이곳')).toHaveClass('text-[#F36B12]')
    expect(screen.getByRole('heading', { name: '소도시 여행의 새로운 기준, Lovv' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Lovv 서비스 설명' })).toHaveStyle({
      listStyleType: 'square',
    })
    expect(
      screen.getByText('Lovv는 소도시 여행 추천 큐레이션 서비스를 제공합니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('숨겨진 장소')).toBeInTheDocument()
    expect(screen.getByText('취향 큐레이션')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lovv의 여정' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Google User')
    expect(localStorage.getItem(authStorageKey)).toContain('google')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
  })

  it('starts onboarding through Kakao mock signup without an API call', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Kakao 간편 로그인으로 시작하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Kakao User')
    expect(localStorage.getItem(authStorageKey)).toContain('kakao')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
  })

  it('renders the Lovv landing content from the MVP Figma frame', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.queryByText('Lovv Google User')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '새 여정 만들기' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).toBeInTheDocument()
    expect(screen.getByTestId('main-entry')).toHaveClass('lovv-hero-radial')
    expect(screen.getByText('Lovv', { selector: 'span' })).toHaveClass(
      'lovv-headline-wordmark',
      'text-[#F36B12]',
      'drop-shadow-[0_3px_0_rgba(169,43,16,0.2)]',
    )
    ;['#부산', '#오키나와', '#바다'].forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
    expect(screen.queryByText('부산 · 오키나와 감성으로 시작합니다')).not.toBeInTheDocument()
    const proofHeading = screen.getByText('처음엔 작게, 추천은 정확하게')
    const mapHeading = screen.getByRole('heading', { name: '소도시 지도 프리뷰' })

    expect(mapHeading).toBeInTheDocument()
    expect(Boolean(proofHeading.compareDocumentPosition(mapHeading) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      true,
    )
    expect(screen.getByLabelText('부산 소도시 지도 마커')).toBeInTheDocument()
    expect(screen.getByLabelText('오키나와 소도시 지도 마커')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '빠른 이동 메뉴 열기' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveAttribute('href', '#chat')
    expect(screen.getByText('처음엔 작게, 추천은 정확하게')).toBeInTheDocument()
  })

  it('opens My Page from the header while keeping logout available', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    expect(screen.queryByRole('link', { name: '새 여정 만들기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '마이페이지' }))

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByText('Google mock')).toBeInTheDocument()
    expect(screen.getByText('경주 · 교토')).toBeInTheDocument()
    expect(screen.getByText(/API 호출 없이 더미 사용자만 저장 중입니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취향 다시 고르기' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: '메인으로 돌아가기' })).toBeInTheDocument()
  })

  it('opens preference edit from My Page and keeps the old preference when canceled', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '마이페이지' }))
    fireEvent.click(screen.getByRole('button', { name: '취향 다시 고르기' }))

    expect(screen.getByRole('heading', { name: '여행의 분위기를 다시 골라주세요' })).toBeInTheDocument()
    expect(screen.getByText('새 취향은 저장한 뒤 다음 AI 일정부터 반영됩니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /경주 · 교토/ })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('lovv.preference')).toContain('경주 · 교토')

    fireEvent.click(screen.getByRole('button', { name: /부산 · 오키나와/ }))

    expect(screen.getByRole('button', { name: /부산 · 오키나와/ })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('lovv.preference')).toContain('경주 · 교토')

    fireEvent.click(screen.getByRole('button', { name: '취소하고 마이페이지로 돌아가기' }))

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByText('경주 · 교토')).toBeInTheDocument()
    expect(localStorage.getItem('lovv.preference')).toContain('경주 · 교토')
  })

  it('saves a reselected preference and uses it for the next planner session', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '마이페이지' }))
    fireEvent.click(screen.getByRole('button', { name: '취향 다시 고르기' }))
    fireEvent.click(screen.getByRole('button', { name: /부산 · 오키나와/ }))
    fireEvent.click(screen.getByRole('button', { name: '이 취향으로 저장하기' }))

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('취향이 변경됐어요. 다음 AI 일정부터 반영됩니다.')
    expect(screen.getByText('부산 · 오키나와')).toBeInTheDocument()
    expect(localStorage.getItem('lovv.preference')).toContain('부산 · 오키나와')

    fireEvent.click(screen.getByRole('button', { name: '메인으로 돌아가기' }))
    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByText('부산 · 오키나와 감성으로 시작합니다.')).toBeInTheDocument()
    expect(screen.getByText('부산')).toBeInTheDocument()
    expect(screen.getByText('오키나와')).toBeInTheDocument()
  })

  it('shows compact planner summary cards and updates schedule status after choices', () => {
    seedUser()
    seedPreference('제주 · 닛코')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const summary = screen.getByTestId('chat-planner-summary')

    expect(within(summary).getByText('취향 반영 완료')).toBeInTheDocument()
    expect(within(summary).getByText('제주 · 닛코 감성으로 시작합니다.')).toBeInTheDocument()
    expect(within(summary).getByText('#자연')).toBeInTheDocument()
    expect(within(summary).getByText('소도시 후보 탐색')).toBeInTheDocument()
    expect(within(summary).getByText('제주')).toBeInTheDocument()
    expect(within(summary).getByText('닛코')).toBeInTheDocument()
    expect(within(summary).getByText('일정 초안 구성')).toBeInTheDocument()
    expect(within(summary).getByText('기간과 축제 여부를 고르면 초안이 완성됩니다.')).toBeInTheDocument()
    expect(within(summary).getByText('대기중')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(within(summary).getByText('1박 2일 · 축제 제외로 구성 중입니다.')).toBeInTheDocument()
    expect(within(summary).getByText('초안 준비')).toBeInTheDocument()
  })

  it('opens floating quick actions for chat and top navigation', () => {
    seedUser()
    seedPreference('부산 · 오키나와')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '빠른 이동 메뉴 열기' }))

    expect(screen.getByRole('button', { name: 'AI 일정 짜기 바로가기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '맨 위로 이동' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'AI 일정 짜기 바로가기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
  })

  it('uses the logo orange palette across primary controls', () => {
    seedUser()
    seedPreference()
    render(<App />)

    expect(screen.getByRole('button', { name: '마이페이지' })).toHaveClass('bg-[#F36B12]')

    const buttonLabels = ['AI 일정 짜기', 'AI 일정', '챗봇', '소도시 보기']

    buttonLabels.forEach((label) => {
      const button = screen.getByRole('link', { name: label })

      expect(button).toHaveClass('bg-[#F36B12]')
      expect(button).toHaveClass('border-[#A92B10]')
      expect(button).toHaveClass('text-[#33271E]')
      expect(button).toHaveClass('hover:bg-[#FF8A2A]')
    })
  })

  it('uses a warm patterned app background', () => {
    render(<App />)

    expect(screen.getByRole('main')).toHaveClass('lovv-warm-pattern')
    expect(screen.getByRole('main')).toHaveClass('lovv-ambient-background')
    expect(screen.getByRole('main')).toHaveClass('text-[#33271E]')
  })

  it('keeps dense text responsive on narrow screens', () => {
    seedUser()
    seedPreference('제주 · 닛코')
    render(<App />)

    expect(screen.getByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).toHaveClass(
      'break-keep',
      'max-sm:text-[36px]',
      'max-sm:leading-[44px]',
    )
    ;['#제주', '#닛코', '#자연'].forEach((tag) => {
      expect(screen.getByText(tag)).toHaveClass('max-sm:text-[13px]')
    })
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveClass(
      'max-sm:w-full',
      'max-sm:min-h-[48px]',
      'max-sm:whitespace-normal',
    )

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: '여행 조건을 대화로 정리하기' })).toHaveClass(
      'break-keep',
      'max-sm:text-xl',
      'max-sm:leading-7',
    )
    expect(screen.getByRole('heading', { name: '아직 일정이 생성되지 않았어요' })).toHaveClass(
      'break-keep',
      'max-sm:text-xl',
      'max-sm:leading-7',
    )
    expect(screen.getByText('축제 포함 여부와 여행 기간을 고르면 일정 초안이 여기에 표시됩니다.')).toHaveClass(
      'break-keep',
      'max-sm:text-[13px]',
    )

    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(screen.getByRole('heading', { name: '제주 · 닛코 감성 1박 2일 초안' })).toHaveClass(
      'break-keep',
      'max-sm:text-lg',
      'max-sm:leading-6',
    )
    expect(screen.getByText(/장소를 확정하기 전/)).toHaveClass('break-keep', 'max-sm:text-[13px]')
  })

  it('shows onboarding after signup before the main screen on first entry', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' }))

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).not.toBeInTheDocument()
    expect(screen.getByText('Lovv City Mood Journal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
    expect(screen.getByText(/익숙한 대도시 감각을 Lovv가 한국과 일본 소도시 후보로 바꿔둘게요/)).toBeInTheDocument()
    expect(screen.queryByText(/이번 선택으로 AI 일정의 말투와 지도 후보/)).not.toBeInTheDocument()
    expect(screen.queryByText(/도시 이름을 고르는 게 아니라/)).not.toBeInTheDocument()
    expect(screen.queryByText('First Issue')).not.toBeInTheDocument()
    expect(screen.queryByText('Before the map')).not.toBeInTheDocument()
    expect(screen.queryByText(/마음에 가까운 장면을 고르면/)).not.toBeInTheDocument()
    ;[
      '아산/온양 · 벳푸',
      '부산 · 오키나와',
      '경주 · 교토',
      '전주 · 오사카',
      '제주 · 닛코',
      '강릉 · 가나자와',
      '온천·휴양',
      '바다·해안',
      '역사·전통',
      '미식·노포',
      '자연·트레킹',
      '예술·감성',
      '온양온천, 스파 휴양',
      '에메랄드 바다, 리조트',
      '전주비빔밥, 시장',
      '히가시차야, 겐로쿠엔, 공예',
    ].forEach((copy) => {
      expect(screen.getByText(new RegExp(copy.replace('/', '\\/')))).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /부산 · 오키나와/ }))
    fireEvent.click(screen.getByRole('button', { name: '이 취향으로 Lovv 시작하기' }))

    expect(localStorage.getItem('lovv.preference')).toContain('부산 · 오키나와')
    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    ;['#부산', '#오키나와', '#바다'].forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('shows and cycles the selected cover only after a preference card is clicked', () => {
    seedUser()
    render(<App />)

    expect(screen.queryByText('Selected Cover')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '아산/온양 대표 이미지' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /아산\/온양 · 벳푸/ })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: /아산\/온양 · 벳푸/ }))

    expect(screen.getByRole('button', { name: /아산\/온양 · 벳푸/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: '아산/온양 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 아산/온양')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 도시 이미지 보기' }))

    expect(screen.getByRole('img', { name: '벳푸 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 벳푸')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /전주 · 오사카/ }))

    expect(screen.getByRole('img', { name: '전주 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 전주')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 도시 이미지 보기' }))

    expect(screen.getByRole('img', { name: '오사카 대표 이미지' })).toBeInTheDocument()
    expect(screen.getByText('현재 표시: 오사카')).toBeInTheDocument()
  })

  it('skips onboarding for returning users and opens the chat workspace without a map', () => {
    seedUser()
    seedPreference('제주 · 닛코')
    render(<App />)

    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    ;['#제주', '#닛코', '#자연'].forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← 이전으로 돌아가기' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-workspace')).toHaveClass('space-y-6')
    expect(screen.getByTestId('chat-planner-summary')).toHaveClass('grid')
    expect(screen.getByTestId('chat-top-grid')).toHaveClass('grid-cols-[minmax(0,0.92fr)_minmax(360px,0.82fr)]')
    expect(screen.getByRole('region', { name: 'AI 일정 챗봇 요약' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'AI 일정 결과' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '생성된 일정 상세' })).not.toBeInTheDocument()
    expect(screen.getByText('축제 포함 여부와 여행 기간을 고르면 일정 초안이 여기에 표시됩니다.')).toBeInTheDocument()
    expect(screen.queryByText('제주 · 닛코 감성 1일 초안')).not.toBeInTheDocument()
    expect(screen.queryByText('일정 다시짜기')).not.toBeInTheDocument()
    expect(screen.queryByText('일정 저장하기')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여행 지도' })).not.toBeInTheDocument()
    expect(screen.queryByText('제주 · 닛코 기반 지도')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '← 이전으로 돌아가기' }))

    expect(screen.getByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'AI 일정 챗봇' })).not.toBeInTheDocument()
  })

  it('maps legacy Japan-first stored preference to the Korea-first display order', () => {
    seedUser()
    seedPreference('오키나와 · 제주')
    render(<App />)

    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    ;['#부산', '#오키나와', '#바다'].forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('asks whether to include festivals when the chat starts', () => {
    seedUser()
    seedPreference('전주 · 오사카')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).getByText('축제 테마를 일정에 포함할까요?')).toBeInTheDocument()
    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '축제 포함' })).toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '축제 제외' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '축제 포함' }))

    expect(within(chatLog).getAllByText('축제 포함')[0]).toBeInTheDocument()
    expect(within(chatLog).queryByText('축제 테마를 일정에 포함할까요?')).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '축제 포함' })).not.toBeInTheDocument()
    expect(within(chatLog).getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
    expect(within(chatLog).getByRole('button', { name: '1박 2일' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(within(chatLog).queryByRole('button', { name: '1박 2일' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '전주 · 오사카 감성 1박 2일 초안' })).toBeInTheDocument()
    expect(screen.getByText('축제 포함 반영')).toBeInTheDocument()
    expect(screen.getByText(/지역 축제나 시즌 행사가 있으면 일정 후보에 함께 넣습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '일정 다시짜기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '일정 저장하기' })).toBeInTheDocument()
  })

  it('turns a chat message into an assistant response and updated itinerary detail', () => {
    seedUser()
    seedPreference('강릉 · 가나자와')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
    const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

    expect(sendButton).toBeDisabled()

    fireEvent.change(input, { target: { value: '2박 3일, 전시랑 편집숍 위주로 덜 걷고 싶어요' } })
    expect(sendButton).not.toBeDisabled()

    fireEvent.click(sendButton)

    expect(input).toHaveValue('')
    expect(screen.getByText('2박 3일, 전시랑 편집숍 위주로 덜 걷고 싶어요')).toBeInTheDocument()
    expect(screen.getByText(/2박 3일 흐름은 반영했어요/)).toBeInTheDocument()
    expect(screen.getByText('축제 테마를 일정에 포함할까요?')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '강릉 · 가나자와 감성 2박 3일 초안' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))

    expect(screen.getByRole('heading', { name: '강릉 · 가나자와 감성 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getAllByText('덜 걷는 일정').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/전시와 편집숍 사이 이동을 줄이는 쪽/)).toBeInTheDocument()
  })

  it('submits a duration guide chip without storing the full chat transcript', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).getAllByText('1박 2일')[0]).toBeInTheDocument()
    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '아산/온양 · 벳푸 감성 1박 2일 초안' })).toBeInTheDocument()
    expect(localStorage.getItem('lovv.chat')).toBeNull()
    expect(localStorage.getItem('lovv.messages')).toBeNull()
  })

  it('accepts free duration text from day trip through four nights five days', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))

    const input = screen.getByRole('textbox', { name: '여행 조건 입력' })
    const sendButton = screen.getByRole('button', { name: '메시지 보내기' })

    fireEvent.change(input, { target: { value: '당일치기로 역사 산책 위주' } })
    fireEvent.click(sendButton)
    expect(screen.getByRole('heading', { name: '경주 · 교토 감성 당일치기 초안' })).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '3박4일로 여유 있게 골목 산책하고 싶어요' } })
    fireEvent.click(sendButton)
    expect(screen.getByRole('heading', { name: '경주 · 교토 감성 3박 4일 초안' })).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '4박 5일까지 가능하고 카페도 넣어줘' } })
    fireEvent.click(sendButton)
    expect(screen.getByRole('heading', { name: '경주 · 교토 감성 4박 5일 초안' })).toBeInTheDocument()
    expect(screen.getByText('5일 구성')).toBeInTheDocument()
    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).queryByText('일정 기간을 먼저 골라주세요')).not.toBeInTheDocument()
    ;['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일'].forEach((duration) => {
      expect(within(chatLog).queryByRole('button', { name: duration })).not.toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('동행, 관심사, 걷는 정도를 추가로 입력해 주세요')).toBeInTheDocument()
  })

  it('resets or saves a generated itinerary from the itinerary panel actions', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    fireEvent.click(screen.getByRole('button', { name: '축제 포함' }))
    fireEvent.click(screen.getByRole('button', { name: '2박 3일' }))

    expect(screen.getByRole('heading', { name: '아산/온양 · 벳푸 감성 2박 3일 초안' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '일정 저장하기' }))

    expect(screen.getByText('마이페이지 저장 준비 완료')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '일정 다시짜기' }))

    expect(screen.queryByRole('heading', { name: '아산/온양 · 벳푸 감성 2박 3일 초안' })).not.toBeInTheDocument()
    expect(screen.getByText('축제 포함 여부와 여행 기간을 고르면 일정 초안이 여기에 표시됩니다.')).toBeInTheDocument()
    expect(screen.getByText('축제 테마를 일정에 포함할까요?')).toBeInTheDocument()
  })

  it('logs out to the signup gate without removing the selected preference', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(localStorage.getItem('lovv.preference')).toContain('경주 · 교토')
    expect(screen.getByRole('heading', { name: '서울/오사카 말고, 지금은 이곳' })).toBeInTheDocument()
    expect(screen.queryByText('경주 · 교토 감성으로 시작합니다')).not.toBeInTheDocument()
  })
})
