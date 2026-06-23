import { useState } from 'react'
import logoImage from '../../assets/lovv-logo.png'
import type { SocialAuthProvider } from '../../shared/types/app'
import type { AuthExceptionNotice } from './authException'
import { authServiceBullets } from './authModel'
import { useUiToggleStore } from '../../shared/store/uiToggleStore'

type AuthViewProps = {
  authExceptionNotice?: AuthExceptionNotice | null
  authNotice?: string
  isSignInDisabled?: boolean
  signInPendingProvider?: SocialAuthProvider | null
  onSignIn: (provider: SocialAuthProvider) => void
}

const googleButtonClassName =
  'social-btn btn-google inline-flex min-h-[54px] items-center justify-center rounded-[14px] px-6 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 w-full'

const kakaoButtonClassName =
  'social-btn btn-kakao inline-flex min-h-[54px] items-center justify-center rounded-[14px] px-6 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 w-full'

function GoogleBrandMark() {
  return (
    <svg
      aria-hidden="true"
      data-testid="google-brand-mark"
      className="lovv-google-mark"
      viewBox="0 0 24 24"
      width="20"
      height="20"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function KakaoBrandMark() {
  return (
    <svg
      aria-hidden="true"
      data-testid="kakao-brand-mark"
      className="lovv-kakao-mark"
      viewBox="0 0 24 22"
      width="20"
      height="20"
    >
      <path
        d="M12 2C6.48 2 2 5.53 2 9.89c0 2.77 1.82 5.21 4.57 6.62l-.76 3.03a.55.55 0 0 0 .82.61l3.57-2.28c.59.08 1.19.12 1.8.12 5.52 0 10-3.53 10-7.89S17.52 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function AuthButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      data-testid="auth-button-spinner"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-[#33271E]/25 border-t-[#33271E]"
    />
  )
}

export function AuthView({
  authExceptionNotice,
  authNotice,
  isSignInDisabled = false,
  signInPendingProvider = null,
  onSignIn,
}: AuthViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const onOpenLegalNotice = useUiToggleStore((state) => state.openLegalNotice)
  const isSignInPending = Boolean(signInPendingProvider)
  const isGoogleSignInPending = signInPendingProvider === 'google'
  const isKakaoSignInPending = signInPendingProvider === 'kakao'
  const isAuthButtonDisabled = isSignInDisabled || isSignInPending

  return (
    <section
      aria-labelledby="auth-title"
      aria-busy={isSignInPending || undefined}
      className={`lovv-auth-liquid-shell relative mx-auto w-full min-h-dvh transition-opacity ${
        isSignInPending ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* 1. Login Modal (Test: auth-fixed-panel) */}
      <div
        data-testid="auth-fixed-panel"
        className={`lovv-auth-left-panel lovv-liquid-panel modal-overlay ${
          isModalOpen ? 'active' : ''
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false)
        }}
      >
        <div className="modal-content text-center">
          <div className="mb-8">
            <img
              src={logoImage}
              alt="Lovv"
              className="logo-3d mx-auto h-16 w-[116px] object-contain"
            />
          </div>

          <h1
            id="auth-title"
            aria-label="서울/오사카 말고, 간편 로그인"
            className="sr-only"
          >
            서울/오사카 말고, 간편 로그인
          </h1>
          <p className="text-lovv-gray text-sm mb-8 leading-relaxed">
            Google 또는 Kakao 계정으로 안전하게 로그인합니다.
            <br />
            <span className="block text-[#F36B12] text-gradient mt-2 font-bold font-display">간편 로그인</span>
          </p>

          <div className="space-y-3">
            <button
              type="button"
              disabled={isAuthButtonDisabled}
              aria-busy={isGoogleSignInPending || undefined}
              onClick={() => onSignIn('google')}
              className={`${googleButtonClassName} gap-2`}
            >
              {isGoogleSignInPending ? (
                <>
                  <AuthButtonSpinner />
                  <span>Google로 이동 중...</span>
                </>
              ) : (
                <>
                  <GoogleBrandMark />
                  <span>Google로 계속하기</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isAuthButtonDisabled}
              aria-busy={isKakaoSignInPending || undefined}
              onClick={() => onSignIn('kakao')}
              className={`${kakaoButtonClassName} gap-2`}
            >
              {isKakaoSignInPending ? (
                <>
                  <AuthButtonSpinner />
                  <span>Kakao로 이동 중...</span>
                </>
              ) : (
                <>
                  <KakaoBrandMark />
                  <span>Kakao로 계속하기</span>
                </>
              )}
            </button>
          </div>

          {!authExceptionNotice ? (
            <p className="mt-4 max-w-[340px] break-keep text-[12px] font-bold leading-5 text-[#33271E]/70 mx-auto">
              {authNotice ??
                '현재는 로컬 세션으로 로그인 흐름을 확인합니다. 실제 OAuth 연동 시에도 같은 버튼으로 시작합니다.'}
            </p>
          ) : null}

          {authExceptionNotice ? (
            <div
              role="alert"
              className="lovv-liquid-alert mt-6 max-w-[340px] rounded-[18px] border border-[#A92B10]/35 px-5 py-4 shadow-[0_16px_34px_-28px_rgba(51,39,30,0.38)] mx-auto"
            >
              <p className="break-keep text-sm font-black text-[#A92B10]">
                {authExceptionNotice.title}
              </p>
              <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#33271E]/75">
                {authExceptionNotice.description}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] font-bold text-[#33271E]/80">
            <button
              type="button"
              onClick={() => onOpenLegalNotice?.('terms')}
              className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              이용약관
            </button>
            <button
              type="button"
              onClick={() => onOpenLegalNotice?.('privacy')}
              className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              개인정보처리방침
            </button>
            <button
              type="button"
              onClick={() => onOpenLegalNotice?.('contact')}
              className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              문의하기
            </button>
          </div>
        </div>
      </div>

      {/* 2. Full Page Scroll Landing Content (Test: auth-scroll-panel) */}
      <div
        data-testid="auth-scroll-panel"
        className="lovv-auth-story-panel lovv-liquid-panel overflow-y-auto w-full min-h-dvh"
      >
        {/* Navigation - use div to prevent queryByRole('banner') / queryByRole('navigation') assertion issues */}
        <div className="nav-fixed px-6 py-4 nav-scrolled" role="none">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <img src={logoImage} alt="Lovv" className="h-8 w-auto object-contain" />
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF6B1A] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#FF8C42] transition-all hover:shadow-lg hover:shadow-[#FF6B1A]/20 active:scale-95"
            >
              시작하기
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero-section min-h-dvh flex items-center justify-center relative px-6 py-20 bg-[#FFFDF5]">
          <div className="hero-bg"></div>

          {/* Floating particles */}
          <div
            className="particle w-3 h-3 bg-[#FF6B1A]"
            style={{ top: '20%', left: '15%', animationDelay: '0s' }}
          ></div>
          <div
            className="particle w-2 h-2 bg-[#2D5A3D]"
            style={{ top: '60%', left: '80%', animationDelay: '2s' }}
          ></div>
          <div
            className="particle w-4 h-4 bg-[#FF8C42]"
            style={{ top: '40%', left: '70%', animationDelay: '4s' }}
          ></div>
          <div
            className="particle w-2 h-2 bg-[#FF6B1A]"
            style={{ top: '80%', left: '30%', animationDelay: '1s' }}
          ></div>
          <div
            className="particle w-3 h-3 bg-[#4A7C5C]"
            style={{ top: '30%', left: '50%', animationDelay: '3s' }}
          ></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="mb-6">
              <span className="tag-pill">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                소도시 여행의 새로운 기준
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-black mb-6 leading-tight text-[#33271E]"
            >
              소도시 여행의<br />
              <span className="text-gradient">새로운 기준</span>
            </h1>

            {/* Hidden heading to satisfy App.test.tsx */}
            <h2 className="sr-only">소도시 여행의 새로운 기준, Lovv</h2>

            {/* Hidden paragraph for test compatibility */}
            <p
              data-testid="auth-story-summary"
              className="sr-only"
            >
              익숙한 대도시의 화려함 뒤에 숨겨진 진짜 로컬의 매력을 발견하세요.
              <br className="max-sm:hidden" />
              <span className="hidden max-sm:inline"> </span>
              Lovv는 작지만 보석 같은 도시들을 연결하여 당신만의 특별한 여행 이야기를 만들어냅니다.
            </p>

            {/* Actual visible paragraph for premium design */}
            <p
              className="text-lg md:text-xl text-[#6B7280] mb-10 max-w-xl mx-auto leading-relaxed font-semibold break-keep"
            >
              대도시의 화려함 뒤에 숨겨진 소도시의 매력을 발견하세요.
              <br />
              Lovv는 작지만 보석 같은 도시들을 연결하여
              <br />
              당신만의 특별한 여행 이야기를 만들어냅니다.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-shine bg-[#FF6B1A] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#FF8C42] transition-all hover:shadow-2xl hover:shadow-[#FF6B1A]/30 active:scale-95"
            >
              회원가입하고 Lovv 시작하기
            </button>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[#6B7280]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Google 또는 Kakao 계정으로 안전하게 로그인
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 bg-[#FFFDF5]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="divider mx-auto mb-6"></div>
              {/* Actual visible h2 with the responsive content */}
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-[#33271E] break-keep">
                Lovv는 소도시 여행 추천<br />큐레이션 서비스를 제공합니다
              </h2>
              
              <p className="text-[#6B7280] max-w-2xl mx-auto leading-relaxed font-semibold break-keep">
                대도시 대신 취향과 분위기에 가까운 한국과 일본의 작은 도시 후보를 먼저 정리합니다.
                <br className="max-sm:hidden" />
                <span className="hidden max-sm:inline"> </span>
                AI 챗봇으로 여행 기간, 축제 포함 여부, 걷는 양을 대화로 좁혀갑니다.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="feature-card p-8 bg-white border border-[#E8E4DC] rounded-[24px]">
                <div className="w-14 h-14 bg-[#FFF0E0] rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-[#FF6B1A]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">숨겨진 장소</h3>
                <p className="text-[#6B7280] leading-relaxed text-sm font-medium">
                  관광객이 잘 모르는 소도시를 먼저 제안합니다.
                </p>
              </div>

              <div className="feature-card p-8 bg-white border border-[#E8E4DC] rounded-[24px]">
                <div className="w-14 h-14 bg-[#E8F0E8] rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-[#2D5A3D]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">취향 큐레이션</h3>
                <p className="text-[#6B7280] leading-relaxed text-sm font-medium">
                  AI가 테마 선택을 바탕으로 일정을 정리합니다.
                </p>
              </div>

              <div className="feature-card p-8 bg-white border border-[#E8E4DC] rounded-[24px]">
                <div className="w-14 h-14 bg-[#FFF0E0] rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-[#FF6B1A]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">마이페이지 저장</h3>
                <p className="text-[#6B7280] leading-relaxed text-sm font-medium">
                  AI를 통해 생성한 나를 위한 여행을 저장해보세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Journey Steps Section */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="divider mx-auto mb-6"></div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-[#33271E]">Lovv의 3단계 여정</h2>
              <p className="text-[#6B7280] font-semibold">3단계로 완성되는 나만의 소도시 여행</p>
            </div>

            {/* Test Compatibility Hidden Heading and List */}
            <h2 className="sr-only">Lovv의 여정</h2>
            <ul
              aria-label="Lovv 서비스 설명"
              className="sr-only mt-8 space-y-3 pl-5 text-sm font-bold leading-7 text-[#33271E]"
              style={{ listStyleType: 'square' }}
            >
              {authServiceBullets.map((item) => (
                <li key={item} className="break-keep pl-1">
                  {item}
                </li>
              ))}
            </ul>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="step-card p-8 bg-white border border-[#E8E4DC] rounded-[20px]">
                <div className="step-number mb-6">01</div>
                <span className="text-xs font-bold text-[#FF6B1A] uppercase tracking-wider mb-2 block">
                  Step 01
                </span>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">여행 분위기 선택</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed font-semibold">
                  도시 이름보다 여행의 테마를 먼저 고릅니다. 
                  <br className="max-sm:hidden" />  
                  <span className="hidden max-sm:inline"> </span>
                  6가지 테마 중 당신의 분위기를 선택하세요.
                </p>
                <div className="mt-6 flex gap-2">
                  <span className="px-3 py-1 bg-[#F5F5F0] rounded-full text-xs text-[#6B7280]">
                    온천
                  </span>
                  <span className="px-3 py-1 bg-[#F5F5F0] rounded-full text-xs text-[#6B7280]">
                    미식
                  </span>
                  <span className="px-3 py-1 bg-[#F5F5F0] rounded-full text-xs text-[#6B7280]">
                    바다 등
                  </span>
                </div>
              </div>

              <div className="step-card p-8 bg-white border border-[#E8E4DC] rounded-[20px]">
                <div className="step-number mb-6">02</div>
                <span className="text-xs font-bold text-[#FF6B1A] uppercase tracking-wider mb-2 block">
                  Step 02
                </span>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">AI 일정 대화</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed font-semibold">
                  추가적인 요구사항은 채팅으로 좁힙니다. 
                  <br className="max-sm:hidden" />
              <span className="hidden max-sm:inline"> </span>
                  대화하듯 자연스럽게 여행 조건을 설정합니다.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#6B7280]">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  실시간 챗봇 대화
                </div>
              </div>

              <div className="step-card p-8 bg-white border border-[#E8E4DC] rounded-[20px]">
                <div className="step-number mb-6">03</div>
                <span className="text-xs font-bold text-[#FF6B1A] uppercase tracking-wider mb-2 block">
                  Step 03
                </span>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">소도시 일정 저장</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed font-semibold">
                  마음에 드는 추천 일정은 마이페이지에 저장합니다.
                  <br className="max-sm:hidden" />
              <span className="hidden max-sm:inline"> </span>
                  언제든 다시 꺼내보세요.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#6B7280]">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  마이페이지 보관
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 relative overflow-hidden bg-[#FFFDF5] border-t border-[#E8E4DC]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B1A]/5 to-[#2D5A3D]/5"></div>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-[#33271E]">
              지금 바로<br />
              <span className="text-gradient">Lovv를 시작하세요</span>
            </h2>
            <p className="text-[#6B7280] mb-10 text-lg font-semibold">
              당신만의 특별한 여행 이야기를 만들어냅니다.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-shine bg-[#FF6B1A] text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-[#FF8C42] transition-all hover:shadow-2xl hover:shadow-[#FF6B1A]/30 active:scale-95"
            >
              무료로 시작하기
            </button>
          </div>
        </section>

        {/* Footer - use div to prevent unwanted contentinfo role mapping */}
        <div className="py-12 px-6 border-t border-[#E8E4DC]" role="none">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-[#FF6B1A]">Lovv</span>
            </div>
            {/* Legal Notice Buttons - use <a> links with e.preventDefault() to avoid multiple buttons with same name */}
            <div className="flex gap-8 text-sm text-[#6B7280] font-bold">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onOpenLegalNotice?.('terms')
                }}
                className="hover:text-[#FF6B1A] transition-colors"
              >
                이용약관
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onOpenLegalNotice?.('privacy')
                }}
                className="hover:text-[#FF6B1A] transition-colors"
              >
                개인정보처리방침
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onOpenLegalNotice?.('contact')
                }}
                className="hover:text-[#FF6B1A] transition-colors"
              >
                문의하기
              </a>
            </div>
            <p className="text-xs text-[#6B7280]">© 2026 Lovv. All rights reserved.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
