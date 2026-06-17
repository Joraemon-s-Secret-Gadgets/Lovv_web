# Lovv Frontend (FE)

Lovv는 한국과 일본의 매력적인 소도시 여행을 추천하고 개인 맞춤형 일정을 생성해 주는 웹 애플리케이션 서비스입니다. 본 폴더는 Lovv 서비스의 프론트엔드 코드를 담고 있습니다.

## 🛠 Tech Stack

- **Core**: React 18 (TypeScript)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **State Management**: 
  - TanStack Query v5 (서버 상태 관리 및 캐싱)
  - Zustand (클라이언트 UI 상태 관리)
- **Routing**: React Router DOM v6
- **Test**: Vitest, React Testing Library
- **Icons**: Lucide React

---

## 🌟 Key Features

### 1. 사용자 인증 및 세션 연동 (Auth)
- **소셜 로그인**: Google 및 Kakao OAuth 로그인 지원.
- **Cognito 연동**: AWS Cognito Hosted UI 및 백엔드 Bridge Session 연동을 통한 보안성 높은 사용자 세션 관리.
- **개발용 가상 로그인(Mock)**: `.env.local` 설정을 통해 백엔드 인프라 없이 독립적으로 프론트엔드 개발 및 UI 검증이 가능한 Mock 모드 지원.
- **StrictMode 중복 방지**: React 18 개발 환경의 더블 마운트 시 발생할 수 있는 일회성 Authorization Code 중복 요청 이슈를 `sessionStorage` 기반 콜백 가드로 완벽 방지.

### 2. 여행 취향 온보딩 (Onboarding)
- 첫 진입 사용자를 위한 직관적인 소도시 여행 테마 취향 조사.
- 한국/일본 선호도 설정 및 선택된 취향에 따른 동적 맞춤 테마 뱃지 관리.

### 3. 메인 홈 (Home)
- **디자인 테마**: 고급스러운 느낌을 주는 **리퀴드 글래스모피즘(Liquid Glassmorphism)** 테마 적용.
- **이달의 추천 소도시**: 이번 달 날씨와 사용자 취향에 가장 알맞은 소도시들을 슬라이딩 캐러셀 카드 형태로 추천.
- **빠른 메뉴**: 페이지 스크롤 및 AI 일정 짜기로 바로 가기 편의를 돕는 플로팅 퀵 액션 버블 제공.

### 4. 소도시 지도 탐색 (Map Discovery)
- Google Maps API 기반의 마커 시각화 및 클러스터링.
- 국가별(한국/일본), 테마별 소도시 필터링 기능 및 상세 정보 사이드 패널 연동.

### 5. AI 일정 플래너 챗봇 (Planner Workspace)
- AI 여행 플래너와의 1:1 채팅 인터페이스.
- 기간 선택 칩(당일치기 ~ 2박 3일 등), 축제 포함 여부 등 대화형 시나리오 조건 추출.
- 생성된 추천 일정의 아코디언 기반 일차별 상세 뷰어 및 저장/좋아요 연동.

### 6. 마이페이지 (My Page)
- 사용자가 저장한 일정 리스트 조회 및 삭제 관리.
- 좋아요를 표시한 일정 모아보기.
- 프로필 정보 수정 및 소셜 로그인 계정 연동/해제 기능.

---

## 🚀 Getting Started

### 1. 환경 변수 설정
`frontend` 폴더 아래에 `.env.local` 파일을 생성하여 다음과 같이 환경 변수를 입력합니다. (상세 구조는 `.env.example` 파일 참고)

```env
# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Auth Mode (cognito | mock)
VITE_LOVV_AUTH_MODE=mock

# Backend API URLs
VITE_LOVV_API_BASE_URL=https://api.yourdomain.com
VITE_LOVV_AGENT_API_URL=https://lambda-url.yourdomain.aws

# AWS Cognito Configuration (Cognito 모드 활성화 시 필요)
VITE_COGNITO_DOMAIN=https://your-cognito-domain.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your_cognito_client_id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback/cognito
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

### 2. 패키지 설치
의존성 패키지를 설치합니다.
```bash
npm install
```

### 3. 로컬 개발 서버 실행
로컬 개발 서버를 구동합니다. (기본 포트: `5173`)
```bash
npm run dev
```

### 4. 빌드 및 테스트
배포용 프로덕션 파일 빌드 및 단위 테스트를 수행합니다.

```bash
# TypeScript 컴파일 및 Vite 빌드
npm run build

# Vitest 전체 단위 테스트 실행 (227+ test cases)
npm run test -- --run

# ESLint 코드 정적 분석 및 포맷 확인
npm run lint
```

---

## 📂 Project Structure

```text
frontend/
├── dist/                 # 빌드 결과물 경로
├── public/               # 정적 자산 (파비콘 등)
├── src/
│   ├── assets/           # 이미지, 로고 등 미디어 리소스
│   ├── features/         # 기능 단위의 도메인 모듈
│   │   ├── auth/         # 소셜 로그인 및 세션 관리 (Cognito)
│   │   ├── home/         # 메인 페이지 및 추천 소도시 캐러셀
│   │   ├── map-city/     # 소도시 지도 탐색 및 상세 정보
│   │   ├── my-page/      # 저장한 일정 리스트 및 프로필 정보
│   │   ├── onboarding/   # 취향 조사 페이지
│   │   ├── planner/      # AI 챗봇 워크스페이스 및 일정 생성
│   │   └── saved-plans/  # 저장 및 좋아요 기능 처리
│   ├── shared/           # 전역 공유 코드
│   │   ├── api/          # 백엔드 API 클라이언트 연동 (Fetch 기반)
│   │   ├── components/   # 헤더, 푸터, 에러 바운더리 등 공통 컴포넌트
│   │   ├── store/        # Zustand 글로벌 UI 상태 관리
│   │   └── types/        # 전역 TypeScript 공통 인터페이스
│   ├── App.tsx           # 상태 및 내비게이션 허브
│   ├── main.tsx          # 애플리케이션 엔트리 포인트
│   └── setupTests.ts     # Vitest 테스트 공통 모크 및 글로벌 설정
└── tests/                # 테스트 유틸리티 및 셋업
```
