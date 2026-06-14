/**
 * @file AuthView.tsx
 * @description Lovv social login entry view.
 * @lastModified 2026-06-13
 */

import logoImage from '../../assets/lovv-logo.png'
import type { LegalNoticeType } from '../../shared/components/legalNoticeContent'
import type { SocialAuthProvider } from '../../shared/types/app'
import type { AuthExceptionNotice } from './authException'
import { authJourneyItems, authServiceBullets, authServiceCards } from './authModel'

type AuthViewProps = {
  authExceptionNotice?: AuthExceptionNotice | null
  authNotice?: string
  isSignInDisabled?: boolean
  signInPendingProvider?: SocialAuthProvider | null
  onOpenLegalNotice?: (noticeType: LegalNoticeType) => void
  onSignIn: (provider: SocialAuthProvider) => void
}

const googleButtonClassName =
  'lovv-social-button lovv-social-button-google inline-flex min-h-[54px] items-center justify-center rounded-[14px] border px-6 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0'

const kakaoButtonClassName =
  'lovv-social-button lovv-social-button-kakao inline-flex min-h-[54px] items-center justify-center rounded-[14px] border px-6 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0'

function GoogleBrandMark() {
  return (
    <svg
      aria-hidden="true"
      data-testid="google-brand-mark"
      className="lovv-google-mark"
      viewBox="0 0 24 24"
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
  onOpenLegalNotice,
  onSignIn,
}: AuthViewProps) {
  const isSignInPending = Boolean(signInPendingProvider)
  const isGoogleSignInPending = signInPendingProvider === 'google'
  const isKakaoSignInPending = signInPendingProvider === 'kakao'
  const isAuthButtonDisabled = isSignInDisabled || isSignInPending

  return (
    <section
              aria-labelledby="auth-title"
              aria-busy={isSignInPending || undefined}
              className={`lovv-auth-liquid-shell mx-auto grid min-h-dvh max-w-[1440px] grid-cols-[minmax(360px,440px)_minmax(0,1fr)] p-5 transition-opacity lg:h-dvh lg:overflow-hidden max-lg:grid-cols-1 max-lg:p-4 max-sm:p-0 ${
                isSignInPending ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <div
                data-testid="auth-fixed-panel"
                className="lovv-auth-left-panel lovv-liquid-panel flex min-h-[calc(100dvh-2.5rem)] min-w-0 flex-col justify-between rounded-l-[32px] border border-white/55 px-16 py-16 shadow-[0_26px_80px_-54px_rgba(51,39,30,0.52)] max-lg:min-h-0 max-lg:rounded-b-none max-lg:rounded-t-[28px] max-lg:px-8 max-lg:py-10 max-sm:rounded-none max-sm:px-5"
              >
                <div>
                  <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
                </div>

                <div className="my-16 min-w-0 max-lg:my-10">
                  <p className="text-sm font-black uppercase tracking-[0.26em] text-[#33271E] max-sm:text-[12px]">
                    Social login
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
                  {authExceptionNotice ? (
                    <div
                      role="alert"
                      className="lovv-liquid-alert mt-6 max-w-[340px] rounded-[18px] border border-[#A92B10]/35 px-5 py-4 shadow-[0_16px_34px_-28px_rgba(51,39,30,0.38)]"
                    >
                      <p className="break-keep text-sm font-black text-[#A92B10]">
                        {authExceptionNotice.title}
                      </p>
                      <p className="mt-2 break-keep text-[12px] font-bold leading-5 text-[#33271E]/75">
                        {authExceptionNotice.description}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-8 flex w-full max-w-[340px] flex-col gap-3">
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
                    <p className="mt-4 max-w-[340px] break-keep text-[12px] font-bold leading-5 text-[#33271E]/70">
                      {authNotice ??
                        '현재는 로컬 세션으로 로그인 흐름을 확인합니다. 실제 OAuth 연동 시에도 같은 버튼으로 시작합니다.'}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold text-[#33271E]/80">
                  <button
                    type="button"
                    onClick={() => onOpenLegalNotice?.('terms')}
                    className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
                  >
                    이용약관
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalNotice?.('privacy')}
                    className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
                  >
                    개인정보처리방침
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalNotice?.('contact')}
                    className="rounded-full transition hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
                  >
                    문의하기
                  </button>
                </div>
              </div>

              <div
                data-testid="auth-scroll-panel"
                className="lovv-auth-story-panel lovv-liquid-panel min-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-r-[32px] border border-l-0 border-white/55 px-20 py-20 shadow-[0_26px_80px_-54px_rgba(51,39,30,0.42)] max-lg:min-h-0 max-lg:overflow-visible max-lg:rounded-b-[28px] max-lg:rounded-r-none max-lg:border-l max-lg:border-t-0 max-lg:px-8 max-lg:py-12 max-sm:rounded-none max-sm:px-5"
              >
                <div className="mx-auto max-w-[720px] pb-16">
                  <div className="lovv-liquid-pill inline-flex min-h-[32px] items-center rounded-full px-4 text-[12px] font-black text-[#A92B10]">
                    소도시 여행의 새로운 기준
                  </div>
                  <h2 className="mt-8 max-w-[560px] break-keep text-[44px] font-black leading-[54px] text-[#33271E] max-sm:text-[32px] max-sm:leading-10">
                    소도시 여행의 새로운 기준, Lovv
                  </h2>
                  <p
                    data-testid="auth-story-summary"
                    className="mt-7 max-w-[610px] break-keep text-base font-semibold leading-8 text-[#33271E] max-sm:text-sm max-sm:leading-7"
                  >
                    <span>익숙한 대도시의 화려함 뒤에 숨겨진 진짜 로컬의 매력을 발견하세요.</span>
                    <br className="max-sm:hidden" />
                    <span className="hidden max-sm:inline"> </span>
                    <span>
                      Lovv는 작지만 보석 같은 도시들을 연결하여 당신만의 특별한 여행
                      이야기를 만들어냅니다.
                    </span>
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
                        className="lovv-liquid-card min-h-[150px] rounded-[20px] border border-white/55 p-6 shadow-[0_18px_40px_-32px_rgba(51,39,30,0.32)]"
                      >
                        <div className="lovv-liquid-card-mark size-8 rounded-full shadow-[0_8px_18px_-14px_rgba(51,39,30,0.45)]" />
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
  )
}

// EOF: AuthView.tsx
