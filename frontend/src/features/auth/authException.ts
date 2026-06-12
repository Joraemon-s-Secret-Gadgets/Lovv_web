/**
 * @file authException.ts
 * @description User-facing Auth exception notices for OAuth, Cognito, and backend Auth errors.
 * @lastModified 2026-06-12
 */

export type AuthExceptionNotice = {
  title: string
  description: string
}

const fallbackAuthExceptionNotice: AuthExceptionNotice = {
  title: '로그인을 완료하지 못했습니다.',
  description: '아래 버튼으로 다시 시도해 주세요.',
}

const authExceptionNotices: Record<string, AuthExceptionNotice> = {
  OAUTH_CALLBACK_INVALID: {
    title: '로그인 응답을 확인할 수 없습니다.',
    description: '로그인 과정에서 필요한 정보가 누락되었습니다. 다시 시도해 주세요.',
  },
  OAUTH_STATE_INVALID: {
    title: '로그인 요청이 만료되었습니다.',
    description: '이전 로그인 요청을 더 이상 사용할 수 없습니다. 다시 시도해 주세요.',
  },
  COGNITO_PKCE_MISSING: {
    title: '로그인 세션 정보가 없습니다.',
    description: '브라우저의 로그인 세션 정보를 확인할 수 없습니다. 다시 시도해 주세요.',
  },
  COGNITO_HOSTED_UI_BASE_URL_MISSING: {
    title: '로그인 설정이 필요합니다.',
    description: '현재 환경에서 소셜 로그인을 시작할 수 없습니다.',
  },
  COGNITO_CLIENT_ID_MISSING: {
    title: '로그인 설정이 필요합니다.',
    description: '현재 환경에서 소셜 로그인을 시작할 수 없습니다.',
  },
  COGNITO_TOKEN_CONFIG_MISSING: {
    title: '로그인 설정이 필요합니다.',
    description: '현재 환경에서 소셜 로그인을 완료할 수 없습니다.',
  },
  OAUTH_CLIENT_ID_MISSING: {
    title: '로그인 설정이 필요합니다.',
    description: '현재 환경에서 소셜 로그인을 시작할 수 없습니다.',
  },
  PROVIDER_UNAVAILABLE: {
    title: '외부 로그인 서버 응답이 지연되고 있습니다.',
    description: '잠시 후 다시 시도해 주세요.',
  },
  INVALID_REQUEST: {
    title: '로그인 요청을 처리할 수 없습니다.',
    description: '요청 정보를 다시 확인해야 합니다. 아래 버튼으로 다시 시도해 주세요.',
  },
  PROVIDER_TOKEN_INVALID: {
    title: '로그인 정보를 확인할 수 없습니다.',
    description: '외부 로그인 응답이 유효하지 않습니다. 다시 시도해 주세요.',
  },
  PROVIDER_TOKEN_INVALID_AUDIENCE: {
    title: '로그인 정보를 확인할 수 없습니다.',
    description: '외부 로그인 응답이 현재 서비스 설정과 맞지 않습니다.',
  },
  PROVIDER_TOKEN_INVALID_ISSUER: {
    title: '로그인 정보를 확인할 수 없습니다.',
    description: '외부 로그인 응답의 발급자를 확인할 수 없습니다.',
  },
  PROVIDER_TOKEN_INVALID_NONCE: {
    title: '로그인 정보를 확인할 수 없습니다.',
    description: '로그인 요청 검증에 실패했습니다. 다시 시도해 주세요.',
  },
  UNAUTHORIZED: {
    title: '세션이 만료되었습니다.',
    description: '다시 로그인해 주세요.',
  },
  USER_NOT_FOUND: {
    title: '세션이 만료되었습니다.',
    description: '다시 로그인해 주세요.',
  },
  INTERNAL_ERROR: {
    title: '로그인 처리 중 문제가 발생했습니다.',
    description: '잠시 후 다시 시도해 주세요.',
  },
  access_denied: {
    title: '로그인 요청이 취소되었습니다.',
    description: '계속하려면 다시 로그인해 주세요.',
  },
  invalid_grant: {
    title: '로그인 요청이 만료되었습니다.',
    description: '이전 로그인 요청을 더 이상 사용할 수 없습니다. 다시 시도해 주세요.',
  },
  HTTP_401: {
    title: '세션이 만료되었습니다.',
    description: '다시 로그인해 주세요.',
  },
  HTTP_500: {
    title: '로그인 처리 중 문제가 발생했습니다.',
    description: '잠시 후 다시 시도해 주세요.',
  },
}

const readErrorCode = (errorOrCode: unknown) => {
  if (typeof errorOrCode === 'string') {
    return errorOrCode
  }

  if (typeof errorOrCode !== 'object' || errorOrCode === null) {
    return ''
  }

  const maybeError = errorOrCode as { code?: unknown; statusCode?: unknown }

  if (typeof maybeError.code === 'string' && maybeError.code.trim()) {
    return maybeError.code.trim()
  }

  if (typeof maybeError.statusCode === 'number' && Number.isFinite(maybeError.statusCode)) {
    return `HTTP_${maybeError.statusCode}`
  }

  return ''
}

export const getAuthExceptionNotice = (errorOrCode: unknown): AuthExceptionNotice => {
  const code = readErrorCode(errorOrCode)

  return authExceptionNotices[code] ?? fallbackAuthExceptionNotice
}

// EOF: authException.ts
