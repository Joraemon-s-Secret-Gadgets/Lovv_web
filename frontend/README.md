# Lovv Frontend

Lovv는 한국 소도시를 탐색하고, 사용자의 여행 취향과 조건을 반영한 AI 일정을 생성하고 수정할 수 있는 웹 서비스입니다. 이 디렉터리는 Lovv 사용자 웹의 React 애플리케이션을 포함합니다.

- 서비스: [https://www.lovv.site](https://www.lovv.site)
- 관리자 웹: [https://admin.lovv.site](https://admin.lovv.site)
- 렌더링 방식: Vite 기반 CSR(Client-Side Rendering)
- 백엔드 통신: AWS API Gateway를 통한 REST API

## 주요 기능

- Google, Kakao, Cognito 기반 로그인과 세션 복구
- 최초 사용자의 여행 취향 온보딩과 취향 수정
- 월별 및 개인화 소도시 추천
- 지도, 검색, 해시태그, 페이지네이션 기반 소도시 탐색
- 여행 기간, 희망 월, 축제 포함 여부를 반영하는 AI 일정 생성
- AgentCore V2 기반 일정 수정, 일차 및 장소 교체, clarification 처리
- 일정 상세 지도, 도로 동선 계산, 맛집 위시리스트 추가와 제거
- 일정 저장, 좋아요, 공개 상태 변경, 공유 및 복제
- 마이페이지 프로필과 소셜 계정 관리
- 관리자 권한 사용자의 관리자 웹 진입

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| UI | React 19, TypeScript 6 |
| 빌드 | Vite 8 |
| 스타일 | Tailwind CSS 4 |
| 라우팅 | React Router DOM 7 |
| 서버 상태 | TanStack Query 5 |
| UI 상태 | Zustand 5, React local state |
| 다국어 | i18next, react-i18next |
| 테스트 | Vitest, React Testing Library, Playwright |
| 지도 | Google Maps, Kakao Maps JavaScript SDK |

## 애플리케이션 구조

Lovv Frontend는 서버에서 HTML을 렌더링하지 않는 CSR 애플리케이션입니다. `main.tsx`에서 React Query와 BrowserRouter를 구성하고, `App.tsx`가 인증 상태와 URL을 기준으로 각 기능 화면을 연결합니다.

```text
Browser
  -> CloudFront
  -> S3 static assets
  -> React Router
  -> TanStack Query / feature hooks
  -> API Gateway
  -> Lovv Backend / AgentCore
```

### 상태 관리

- TanStack Query: 인증 세션, 사용자 정보, 저장 일정, 추천 및 API mutation
- Zustand: 퀵 액션, 세션 메뉴, 약관 모달과 같은 단순 전역 UI 토글
- React state와 feature hooks: 플래너 대화, 일정 초안, 지도 선택, 폼 상태
- `sessionStorage`: OAuth 처리 가드와 현재 플래너 취향 프로필
- `localStorage`: mock 인증 사용자와 언어 설정

진행 중인 AI 대화와 미완성 일정은 서버에 영구 저장하지 않습니다. 사용자가 저장한 확정 일정만 백엔드 저장 API를 사용합니다.

## 주요 라우트

| 경로 | 화면 | 접근 조건 |
| --- | --- | --- |
| `/auth` | 로그인 | 비로그인 |
| `/onboarding` | 취향 온보딩 | 로그인, 온보딩 미완료 |
| `/home` | 홈과 개인화 추천 | 로그인 |
| `/map` | 소도시 탐색 | 로그인 |
| `/planner` | AI 일정 플래너 | 로그인 |
| `/plans/:planId` | 일정 상세 | 로그인, 접근 가능한 일정 |
| `/recommendation` | 추천 피드 | 로그인 |
| `/mypage` | 저장 일정과 계정 관리 | 로그인 |
| `/preferences` | 취향 수정 | 로그인 |

`/saved-plans`와 과거 `?view=` 주소는 현재 canonical route로 변환됩니다. CloudFront와 S3는 직접 진입한 SPA 경로가 `index.html`로 돌아오도록 설정되어야 합니다.

## 프로젝트 구조

```text
frontend/
├── e2e/                         # Playwright E2E 시나리오
├── public/                      # favicon 등 정적 파일
├── src/
│   ├── assets/                  # 로고와 화면 이미지
│   ├── data/                    # 프론트 정적 데이터
│   ├── features/
│   │   ├── auth/                # 인증, OAuth, 세션 복구
│   │   ├── home/                # 홈 추천 화면
│   │   ├── map-city/            # 소도시 검색, 목록, 지도
│   │   ├── my-page/             # 프로필과 저장 일정 관리
│   │   ├── onboarding/          # 취향 온보딩
│   │   ├── planner/             # AI 일정 생성과 상세 수정
│   │   ├── recommendation/      # 추천 피드
│   │   └── saved-plans/         # 저장 일정 모델과 화면
│   ├── locales/                 # 번역 리소스
│   ├── shared/
│   │   ├── api/                 # REST API 어댑터
│   │   ├── components/          # 공통 레이아웃과 UI
│   │   ├── store/               # Zustand UI store
│   │   ├── types/               # 공통 타입
│   │   └── utils/               # 공통 유틸리티
│   ├── App.tsx                  # 화면 흐름과 기능 통합
│   ├── main.tsx                 # React 진입점과 Provider
│   └── setupTests.ts            # Vitest 공통 설정
├── .env.example                 # 환경변수 예시
├── playwright.config.ts
├── vite.config.ts
└── package.json
```

## API 모듈

`src/shared/api`에서 브라우저와 백엔드 사이의 계약을 관리합니다.

| 모듈 | 역할 |
| --- | --- |
| `authApi.ts` | 로그인, 세션 복구, 로그아웃, 프로필과 소셜 계정 |
| `preferencesApi.ts` | 온보딩 취향 조회 및 저장 |
| `recommendationsApi.ts` | AgentCore V2 일정 생성, 수정, clarification, 경로 계산 |
| `savedPlansApi.ts` | 일정 저장, 조회, 삭제, 공유, 좋아요 |
| `smallCityApi.ts` | 소도시 목록, 상세, 장소와 추천 데이터 |
| `kakaoPlaceImageApi.ts` | Kakao 장소 대표 이미지 조회 |

API 응답 타입을 변경할 때는 어댑터 테스트와 실제 소비 컴포넌트를 함께 확인해야 합니다. AgentCore V2 필드를 우선 사용하고 호환이 필요한 legacy 필드는 어댑터 경계에서만 처리합니다.

## 로컬 실행

### 요구 사항

- Node.js 20 이상 권장
- npm 10 이상 권장

### 설치

```bash
cd frontend
npm ci
```

### 환경변수

```bash
cp .env.example .env.local
```

`.env.local`에는 개발 환경에서 필요한 값만 입력합니다.

| 변수 | 설명 | 필수 조건 |
| --- | --- | --- |
| `VITE_LOVV_AUTH_MODE` | `mock`, `api`, `cognito` 중 하나 | 필수 |
| `VITE_LOVV_API_BASE_URL` | Lovv API Gateway base URL | API 연동 시 필수 |
| `VITE_COGNITO_DOMAIN` | Cognito Hosted UI 도메인 | Cognito 모드 |
| `VITE_COGNITO_CLIENT_ID` | Cognito public app client ID | Cognito 모드 |
| `VITE_COGNITO_REDIRECT_URI` | 로그인 callback URL | Cognito 모드 |
| `VITE_COGNITO_LOGOUT_URI` | 로그아웃 후 이동 URL | Cognito 모드 |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | Google OAuth public client ID | 직접 OAuth 사용 시 |
| `VITE_KAKAO_OAUTH_CLIENT_ID` | Kakao OAuth public client ID | 직접 OAuth 사용 시 |
| `VITE_GOOGLE_MAPS_API_KEY` | 도메인 제한된 Google Maps browser key | Google 지도 사용 시 |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps map ID | 선택 |
| `VITE_KAKAO_MAP_JAVASCRIPT_KEY` | 도메인 제한된 Kakao JavaScript key | Kakao 장소 검색 시 |
| `VITE_IMAGE_CDN_BASE_URL` | 장소 이미지 CDN base URL | 선택 |

`VITE_*` 값은 빌드 결과에 포함되어 브라우저에서 볼 수 있습니다. 서버 비밀키, REST API secret, private key, AWS credential은 절대 넣지 않습니다. 브라우저용 지도 키는 제공자 콘솔에서 localhost와 Lovv 배포 도메인만 허용해야 합니다.

### 개발 서버

```bash
npm run dev
```

기본 주소는 `http://localhost:5173`입니다. OAuth callback 설정과 로컬 접속 주소의 `localhost` 또는 `127.0.0.1`을 일치시켜야 합니다.

## 검증

```bash
# ESLint
npm run lint

# Vitest 전체 테스트
npm test -- --run

# 특정 테스트
npm test -- --run src/shared/api/recommendationsApi.test.ts

# Playwright E2E
npm run test:e2e

# TypeScript 검사와 production build
npm run build

# production build 로컬 확인
npm run preview
```

PR을 올리기 전 최소 기준은 `lint`, 전체 Vitest, production build 통과입니다. 사용자 흐름이나 라우팅을 변경했다면 관련 Playwright E2E도 실행합니다.

## 인증 모드

- `mock`: 백엔드 없이 UI와 온보딩 흐름을 확인하는 로컬 전용 모드
- `api`: Lovv API가 제공하는 인증 endpoint를 직접 사용하는 모드
- `cognito`: Cognito Hosted UI 로그인 후 Lovv 백엔드 세션으로 교환하는 배포 기본 모드

운영 권한은 프론트의 role 표시만으로 판단하지 않습니다. 관리자 API와 사용자 데이터 API는 백엔드에서 JWT와 role을 다시 검증해야 합니다.

## 배포

Production build는 정적 파일이므로 S3에 업로드한 뒤 CloudFront 캐시를 무효화합니다. 실제 리소스 이름은 배포 환경 변수나 팀의 AWS 설정을 사용합니다.

```bash
npm ci
npm run lint
npm test -- --run
npm run build

aws s3 sync dist/ "s3://${FRONTEND_BUCKET}" --delete
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*"
```

배포 후 다음을 확인합니다.

1. `/auth`, `/home`, `/planner`, `/plans/:planId` 직접 접근
2. OAuth callback과 logout redirect 도메인
3. API Gateway CORS 허용 origin과 credential cookie
4. 새 `index-*.js` 번들이 제공되는지 확인
5. 로그인, 일정 생성, 저장, 상세 조회 smoke test

## 보안 주의사항

- `.env.local`과 실제 credential 파일은 커밋하지 않습니다.
- access token이나 OAuth code를 console, URL history, localStorage에 기록하지 않습니다.
- 인증 cookie와 CORS 정책은 백엔드 설정을 source of truth로 둡니다.
- 외부 링크에는 필요한 경우 `noopener,noreferrer`를 적용합니다.
- 사용자 입력을 HTML로 직접 삽입하지 않습니다.
- 지도와 OAuth browser key는 반드시 허용 도메인을 제한합니다.

## 문제 해결

### 새 배포가 보이지 않는 경우

- CloudFront invalidation 완료 여부를 확인합니다.
- HTML이 참조하는 `assets/index-*.js` 해시가 최신 빌드인지 확인합니다.
- 브라우저 캐시를 비우고 다시 로드합니다.

### 로그인 후 다른 도메인으로 이동하는 경우

- `VITE_COGNITO_REDIRECT_URI`와 `VITE_COGNITO_LOGOUT_URI`를 확인합니다.
- Cognito app client callback/logout URL과 현재 배포 도메인이 일치하는지 확인합니다.

### 지도 또는 장소 검색이 동작하지 않는 경우

- Google 또는 Kakao browser key의 허용 도메인을 확인합니다.
- `localhost`와 `127.0.0.1` 등록 여부를 각각 확인합니다.
- API base URL과 백엔드 CORS 설정을 확인합니다.

### 일정 생성이 실패하는 경우

- 브라우저 Network 탭에서 `/api/v1/recommendations` 응답을 확인합니다.
- 로그인 세션이 만료되지 않았는지 확인합니다.
- 요청의 `entryType`, `sessionId`, `threadId`, `recommendationId`가 현재 AgentCore V2 흐름과 맞는지 확인합니다.
