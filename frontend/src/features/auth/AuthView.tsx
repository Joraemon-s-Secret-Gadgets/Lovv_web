/**
 * @file AuthView.tsx
 * @description Lovv social login entry view.
 * @lastModified 2026-06-12
 */

import logoImage from '../../assets/lovv-logo.png'
import type { SocialAuthProvider } from '../../shared/types/app'
import type { AuthExceptionNotice } from './authException'
import { authJourneyItems, authServiceBullets, authServiceCards } from './authModel'

type AuthViewProps = {
  authExceptionNotice?: AuthExceptionNotice | null
  authNotice?: string
  isSignInDisabled?: boolean
  onSignIn: (provider: SocialAuthProvider) => void
}

const googleButtonClassName =
  'inline-flex min-h-[54px] items-center justify-center rounded-[14px] border border-[#EAE3E1] bg-[#fffffa] px-6 text-sm font-black text-[#33271E] shadow-[0_14px_32px_-18px_rgba(51,39,30,0.22)] transition hover:-translate-y-0.5 hover:border-[#F36B12] hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-[#EAE3E1] disabled:hover:bg-[#fffffa]'

const kakaoButtonClassName =
  'inline-flex min-h-[54px] items-center justify-center rounded-[14px] border border-[#A92B10] bg-[#F36B12] px-6 text-sm font-black text-[#33271E] shadow-[0_14px_32px_-18px_rgba(51,39,30,0.45)] transition hover:-translate-y-0.5 hover:border-[#A92B10] hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-[#A92B10] disabled:hover:bg-[#F36B12]'

export function AuthView({ authExceptionNotice, authNotice, isSignInDisabled = false, onSignIn }: AuthViewProps) {
  return (
    <section
              aria-labelledby="auth-title"
              className="mx-auto grid min-h-dvh max-w-[1440px] grid-cols-[minmax(360px,440px)_minmax(0,1fr)] lg:h-dvh lg:overflow-hidden max-lg:grid-cols-1"
            >
              <div
                data-testid="auth-fixed-panel"
                className="lovv-auth-left-panel flex min-h-dvh min-w-0 flex-col justify-between border-r border-[#A92B10]/25 px-16 py-16 max-lg:min-h-0 max-lg:border-b max-lg:border-r-0 max-lg:px-8 max-lg:py-10 max-sm:px-5"
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
                      className="mt-6 max-w-[340px] rounded-[18px] border border-[#A92B10]/35 bg-[#FFF0E4] px-5 py-4 shadow-[0_16px_34px_-28px_rgba(51,39,30,0.38)]"
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
                      disabled={isSignInDisabled}
                      onClick={() => onSignIn('google')}
                      className={googleButtonClassName}
                    >
                      Google 간편 로그인으로 시작하기
                    </button>
                    <button
                      type="button"
                      disabled={isSignInDisabled}
                      onClick={() => onSignIn('kakao')}
                      className={kakaoButtonClassName}
                    >
                      Kakao 간편 로그인으로 시작하기
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
                  <a
                    href="#auth-title"
                    className="rounded-full hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
                  >
                    이용약관
                  </a>
                  <a
                    href="#auth-title"
                    className="rounded-full hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
                  >
                    개인정보처리방침
                  </a>
                  <a
                    href="#auth-title"
                    className="rounded-full hover:text-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33271E]"
                  >
                    문의하기
                  </a>
                </div>
              </div>

              <div
                data-testid="auth-scroll-panel"
                className="lovv-auth-story-panel min-h-dvh overflow-y-auto px-20 py-20 max-lg:min-h-0 max-lg:overflow-visible max-lg:px-8 max-lg:py-12 max-sm:px-5"
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
                        className="min-h-[150px] rounded-[20px] border border-transparent bg-[#FFE4D4] p-6 shadow-[0_18px_40px_-32px_rgba(51,39,30,0.32)]"
                      >
                        <div className="size-8 rounded-full bg-[#FFF8EE] shadow-[0_8px_18px_-14px_rgba(51,39,30,0.45)]" />
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
