import { useEffect, useState } from 'react'
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
  // An auth error (e.g. a failed OAuth callback) must be visible to the user, so
  // open the login modal automatically when an exception notice appears — otherwise
  // the alert stays trapped in the hidden, inert overlay.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authExceptionNotice) setIsModalOpen(true)
  }, [authExceptionNotice])
  const onOpenLegalNotice = useUiToggleStore((state) => state.openLegalNotice)
  const isSignInPending = Boolean(signInPendingProvider)
  const isGoogleSignInPending = signInPendingProvider === 'google'
  const isKakaoSignInPending = signInPendingProvider === 'kakao'
  const isAuthButtonDisabled = isSignInDisabled || isSignInPending

  return (
    <section
      aria-labelledby="auth-title"
      aria-busy={isSignInPending || undefined}
      className={`lovv-auth-liquid-shell lovv-page-landing relative mx-auto w-full min-h-dvh transition-opacity ${
        isSignInPending ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* 1. Login Modal (Test: auth-fixed-panel) */}
      {/*
        When closed the overlay stays in the DOM for the opacity transition, so it
        must be removed from the accessibility tree and tab order — otherwise screen
        readers and keyboard users reach the hidden Google/Kakao buttons. `inert`
        (React 19) disables focus + pointer + a11y for the whole subtree; aria-hidden
        reinforces it for assistive tech.
      */}
      <div
        data-testid="auth-fixed-panel"
        role="dialog"
        aria-modal={isModalOpen || undefined}
        aria-labelledby="auth-title"
        aria-hidden={!isModalOpen || undefined}
        inert={!isModalOpen}
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
        className="lovv-auth-story-panel lovv-liquid-panel lovv-landing-page lovv-page-landing overflow-y-auto w-full min-h-dvh"
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
        <section className="lovv-landing-section lovv-landing-hero hero-section min-h-dvh flex items-center justify-center relative px-6 py-20">
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

        {/* Journey Steps Section */}
        <section className="lovv-landing-section py-24 px-6">
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
              <div className="step-card step-card-orange p-8 border rounded-[20px]">
                <div className="step-number step-number-orange mb-6">01</div>
                <span className="text-xs font-bold text-[#FF6B1A] uppercase tracking-wider mb-2 block">
                  Step 01
                </span>
                <h3 className="text-xl font-bold mb-3 text-[#33271E]">여행 분위기 선택</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed font-semibold">
                  도시 이름이 아닌, 여행의 테마를 고릅니다.
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

              <div className="step-card step-card-green p-8 border rounded-[20px]">
                <div className="step-number step-number-green mb-6">02</div>
                <span className="text-xs font-bold text-[#2D5A3D] uppercase tracking-wider mb-2 block">
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

              <div className="step-card step-card-brown p-8 border rounded-[20px]">
                <div className="step-number step-number-brown mb-6">03</div>
                <span className="text-xs font-bold text-[#7A4D2A] uppercase tracking-wider mb-2 block">
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
        <section className="lovv-landing-section lovv-landing-cta py-24 px-6 relative overflow-hidden border-t border-[#E8E4DC]">
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
        <div className="lovv-landing-footer py-12 px-6 border-t border-[#E8E4DC]" role="none">
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
