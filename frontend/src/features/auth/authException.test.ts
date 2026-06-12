import { describe, expect, it } from 'vitest'
import { getAuthExceptionNotice } from './authException'

describe('Auth exception notices', () => {
  it.each([
    ['OAUTH_STATE_INVALID', '로그인 요청이 만료되었습니다.', '이전 로그인 요청을 더 이상 사용할 수 없습니다. 다시 시도해 주세요.'],
    ['OAUTH_CALLBACK_INVALID', '로그인 응답을 확인할 수 없습니다.', '로그인 과정에서 필요한 정보가 누락되었습니다. 다시 시도해 주세요.'],
    ['COGNITO_PKCE_MISSING', '로그인 세션 정보가 없습니다.', '브라우저의 로그인 세션 정보를 확인할 수 없습니다. 다시 시도해 주세요.'],
    ['COGNITO_HOSTED_UI_BASE_URL_MISSING', '로그인 설정이 필요합니다.', '현재 환경에서 소셜 로그인을 시작할 수 없습니다.'],
    ['COGNITO_CLIENT_ID_MISSING', '로그인 설정이 필요합니다.', '현재 환경에서 소셜 로그인을 시작할 수 없습니다.'],
    ['PROVIDER_UNAVAILABLE', '외부 로그인 서버 응답이 지연되고 있습니다.', '잠시 후 다시 시도해 주세요.'],
    ['UNAUTHORIZED', '세션이 만료되었습니다.', '다시 로그인해 주세요.'],
    ['HTTP_401', '세션이 만료되었습니다.', '다시 로그인해 주세요.'],
  ])('maps %s to a user-facing Korean notice', (code, title, description) => {
    expect(getAuthExceptionNotice(code)).toEqual({ title, description })
  })

  it('reads error codes without exposing internal token details in the notice text', () => {
    const notice = getAuthExceptionNotice({
      code: 'PROVIDER_TOKEN_INVALID_AUDIENCE',
      message: 'id_token audience mismatch: secret-token-value',
    })

    expect(notice).toEqual({
      title: '로그인 정보를 확인할 수 없습니다.',
      description: '외부 로그인 응답이 현재 서비스 설정과 맞지 않습니다.',
    })
    expect(`${notice.title} ${notice.description}`).not.toContain('secret-token-value')
    expect(`${notice.title} ${notice.description}`).not.toContain('PROVIDER_TOKEN_INVALID_AUDIENCE')
  })

  it('falls back to a retry message for unknown auth failures', () => {
    expect(getAuthExceptionNotice({ code: 'UNKNOWN_AUTH_ERROR' })).toEqual({
      title: '로그인을 완료하지 못했습니다.',
      description: '아래 버튼으로 다시 시도해 주세요.',
    })
  })
})
