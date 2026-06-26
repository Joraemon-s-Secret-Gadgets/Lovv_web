/**
 * @file legalNoticeContent.ts
 * @description Static Lovv legal and contact notice copy for in-app disclosure dialogs.
 * @lastModified 2026-06-14
 */

export type LegalNoticeType = 'terms' | 'privacy' | 'contact'

export type LegalNoticeSection = {
  heading: string
  body: string[]
}

export type LegalNoticeContent = {
  eyebrow: string
  title: string
  summary: string
  sections: LegalNoticeSection[]
}

export const legalNoticeContent: Record<LegalNoticeType, LegalNoticeContent> = {
  terms: {
    eyebrow: 'Terms',
    title: '이용약관',
    summary:
      'Lovv는 소도시 여행지를 탐색하고 취향 기반 일정 후보를 확인할 수 있도록 돕는 여행 큐레이션 서비스입니다.',
    sections: [
      {
        heading: '서비스 이용',
        body: [
          '사용자는 Google 또는 Kakao 계정 등 제공되는 로그인 수단으로 Lovv를 이용할 수 있습니다.',
          'Lovv가 제공하는 도시 정보, 추천 일정, 이동 동선은 여행 계획을 돕기 위한 참고 정보이며 실제 운영 시간, 교통, 현장 상황은 방문 전 다시 확인해야 합니다.',
        ],
      },
      {
        heading: '계정과 저장 정보',
        body: [
          '로그인한 사용자는 선택한 취향, 저장한 일정, 좋아요와 같은 개인화 정보를 확인하고 관리할 수 있습니다.',
          '타인의 계정 사용, 서비스 방해 행위, 허위 정보 입력 등 정상적인 서비스 운영을 방해하는 행위는 제한될 수 있습니다.',
        ],
      },
      {
        heading: '변경 및 책임',
        body: [
          '서비스 화면, 추천 기준, 제공 데이터는 품질 개선과 운영 상황에 따라 변경될 수 있습니다.',
          'Lovv는 안정적인 서비스를 제공하기 위해 노력하지만, 외부 지도, 인증, 관광 데이터 제공자의 장애나 변경으로 일부 기능이 제한될 수 있습니다.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: '개인정보 처리방침',
    summary:
      'Lovv는 로그인, 취향 기반 추천, 저장 일정 확인에 필요한 최소한의 정보를 사용하며, 민감한 인증 비밀값을 저장하거나 노출하지 않습니다.',
    sections: [
      {
        heading: '수집 및 이용 항목',
        body: [
          '소셜 로그인 과정에서 제공되는 식별자, 이름 또는 닉네임, 이메일, 프로필 기본 정보가 계정 식별과 로그인 상태 유지에 사용될 수 있습니다.',
          '사용자가 선택한 여행 테마, 기본 국가 선호값, 저장한 일정, 일정 좋아요 상태는 개인화된 화면과 추천 흐름을 제공하기 위해 사용됩니다.',
        ],
      },
      {
        heading: '보관과 보호',
        body: [
          '인증 세션은 서버와 브라우저의 보안 정책에 맞춰 관리됩니다.',
          '운영 환경에서는 HTTPS, HttpOnly cookie, 권한 검증, 접근 제한 등 보안 설정을 기준으로 사용자 정보를 보호합니다.',
        ],
      },
      {
        heading: '사용자 권리',
        body: [
          '사용자는 로그아웃을 통해 현재 브라우저의 인증 상태를 종료할 수 있으며, 저장 일정 삭제와 취향 수정 기능을 통해 서비스 내 개인화 정보를 관리할 수 있습니다.',
          '개인정보 관련 요청 채널은 정식 운영 전 확정되며, 문의하기 안내를 통해 최신 접수 방법을 확인할 수 있습니다.',
        ],
      },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: '문의하기',
    summary:
      '서비스 이용 중 로그인, 지도, 일정 저장, 추천 결과와 관련된 문제가 있다면 아래 항목을 함께 정리해 전달해 주세요.',
    sections: [
      {
        heading: '문의 전 확인',
        body: [
          '오류가 발생한 화면, 선택한 로그인 방식, 재현한 순서, 브라우저 종류를 함께 알려주면 원인 확인에 도움이 됩니다.',
          '지도나 추천 도시 정보가 다르게 보이는 경우 도시명, 선택한 국가, 적용한 테마 필터를 함께 남겨 주세요.',
        ],
      },
      {
        heading: '문의 유형',
        body: [
          '계정 및 로그인: Google/Kakao 로그인, 세션 만료, 로그아웃 문제',
          '여행 기능: 소도시 탐색, 추천 일정 생성, 저장 일정, 좋아요와 삭제 동작',
          '데이터 제보: 잘못된 도시 정보, 이미지 누락, 축제 또는 관광지 정보 보완 요청',
        ],
      },
      {
        heading: '접수 채널',
        body: [
          '문의가 필요한 경우 joramong711@gmail.com 으로 연락해 주세요.',
        ],
      },
    ],
  },
}

// EOF: legalNoticeContent.ts
