import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

const authStorageKey = 'lovv.auth.user'

const seedUser = () => {
  localStorage.setItem(
    authStorageKey,
    JSON.stringify({
      id: 'mock-google-user',
      name: 'Lovv Tester',
      email: 'tester@lovv.local',
      avatarInitial: 'L',
    }),
  )
}

const seedPreference = (cityPair = '아산/온양 · 벳푸') => {
  localStorage.setItem('lovv.preference', JSON.stringify({ cityPair }))
}

describe('MVP main entry screen', () => {
  it('shows Google signup before onboarding on first entry', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '회원가입하고 Lovv 시작하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' })).toBeInTheDocument()
    expect(screen.queryByText('MVP mock session')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Google 간편 로그인으로 시작하기' }))

    expect(localStorage.getItem(authStorageKey)).toContain('Lovv Tester')
    expect(screen.getByRole('heading', { name: '여행의 분위기를 골라주세요' })).toBeInTheDocument()
  })

  it('renders the Lovv landing content from the MVP Figma frame', () => {
    seedUser()
    seedPreference()
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /나만 아는 여행 앱, Lovv/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI 일정 짜기' })).toHaveAttribute('href', '#chat')
    expect(screen.getByText('처음엔 작게, 추천은 정확하게')).toBeInTheDocument()
  })

  it('uses a grounded pale green button color that turns yellow on hover', () => {
    seedUser()
    seedPreference()
    render(<App />)

    const buttonLabels = ['새 여정 만들기', 'AI 일정 짜기', 'AI 일정', '챗봇', '소도시 보기']

    buttonLabels.forEach((label) => {
      const button = screen.getByRole('link', { name: label })

      expect(button).toHaveClass('bg-[#dbe8d3]')
      expect(button).toHaveClass('border-[#b8c9aa]')
      expect(button).toHaveClass('hover:bg-[#ffe55f]')
    })
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
    expect(screen.getByText('제주 · 닛코 감성으로 시작합니다')).toHaveClass(
      'max-w-full',
      'break-keep',
      'max-sm:text-[13px]',
    )
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
    expect(screen.getByRole('heading', { name: '제주 · 닛코 감성 1일 초안' })).toHaveClass(
      'break-keep',
      'max-sm:text-lg',
      'max-sm:leading-6',
    )
    expect(screen.getByText(/장소를 확정하기 전/)).toHaveClass('line-clamp-2', 'max-sm:text-[13px]')
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
    expect(screen.getByText('부산 · 오키나와 감성으로 시작합니다')).toBeInTheDocument()
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
    expect(screen.getByText('제주 · 닛코 감성으로 시작합니다')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByRole('heading', { name: 'AI 일정 챗봇' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '생성된 일정 상세' })).toBeInTheDocument()
    expect(screen.getByText('1일차 추천 일정')).toBeInTheDocument()
    expect(screen.getByText('제주 · 닛코 감성 1일 초안')).toBeInTheDocument()
    expect(screen.getByText('동선이 느슨한 일정')).toBeInTheDocument()
    expect(screen.getAllByText('추천 이유')).toHaveLength(3)
    expect(screen.getAllByText(/다음 장소까지/)).toHaveLength(3)
    expect(screen.getByText('오전')).toBeInTheDocument()
    expect(screen.getByText('오후')).toBeInTheDocument()
    expect(screen.getByText('저녁')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여행 지도' })).not.toBeInTheDocument()
    expect(screen.queryByText('제주 · 닛코 기반 지도')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
  })

  it('maps legacy Japan-first stored preference to the Korea-first display order', () => {
    seedUser()
    seedPreference('오키나와 · 제주')
    render(<App />)

    expect(
      screen.queryByRole('heading', { name: '여행의 분위기를 골라주세요' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('부산 · 오키나와 감성으로 시작합니다')).toBeInTheDocument()
  })

  it('asks whether to include festivals when the chat starts', () => {
    seedUser()
    seedPreference('전주 · 오사카')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

    expect(screen.getByText(/축제를 일정 테마에 포함할까요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '축제 포함' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '축제 제외' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '축제 포함' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).getAllByText('축제 포함')[0]).toBeInTheDocument()
    expect(screen.getByText('축제 포함 반영')).toBeInTheDocument()
    expect(screen.getByText(/지역 축제나 시즌 행사가 있으면 일정 후보에 함께 넣습니다/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '축제 제외' }))

    expect(within(chatLog).getAllByText('축제 제외')[0]).toBeInTheDocument()
    expect(screen.getByText('축제 제외 반영')).toBeInTheDocument()
    expect(screen.getByText(/축제보다 식당과 동네 산책을 우선합니다/)).toBeInTheDocument()
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
    expect(screen.getByText(/강릉 · 가나자와 감성으로 2박 3일 흐름을 잡아볼게요/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '강릉 · 가나자와 감성 2박 3일 초안' })).toBeInTheDocument()
    expect(screen.getByText('덜 걷는 일정')).toBeInTheDocument()
    expect(screen.getByText(/전시와 편집숍 사이 이동을 줄이는 쪽/)).toBeInTheDocument()
  })

  it('submits a duration guide chip without storing the full chat transcript', () => {
    seedUser()
    seedPreference('아산/온양 · 벳푸')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))
    fireEvent.click(screen.getByRole('button', { name: '1박 2일' }))

    const chatLog = screen.getByRole('log', { name: 'AI 일정 대화' })

    expect(within(chatLog).getAllByText('1박 2일')[0]).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '아산/온양 · 벳푸 감성 1박 2일 초안' })).toBeInTheDocument()
    expect(localStorage.getItem('lovv.chat')).toBeNull()
    expect(localStorage.getItem('lovv.messages')).toBeNull()
  })

  it('accepts free duration text from day trip through four nights five days', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'AI 일정 짜기' }))

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
    expect(screen.getByText('일정 기간을 먼저 골라주세요')).toBeInTheDocument()
    ;['당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일'].forEach((duration) => {
      expect(screen.getByRole('button', { name: duration })).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('동행, 관심사, 걷는 정도를 추가로 입력해 주세요')).toBeInTheDocument()
  })

  it('logs out to the signup gate without removing the selected preference', () => {
    seedUser()
    seedPreference('경주 · 교토')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(localStorage.getItem(authStorageKey)).toBeNull()
    expect(localStorage.getItem('lovv.preference')).toContain('경주 · 교토')
    expect(screen.getByRole('heading', { name: '회원가입하고 Lovv 시작하기' })).toBeInTheDocument()
    expect(screen.queryByText('경주 · 교토 감성으로 시작합니다')).not.toBeInTheDocument()
  })
})
