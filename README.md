# Lovv Web (Frontend Workspace)

`Lovv`는 한국과 일본의 매력적인 소도시 여행을 사용자 맞춤형으로 큐레이션하고, 대화형 AI를 통해 동적이고 최적화된 상세 일정을 설계해 주는 웹 애플리케이션 서비스입니다. 

본 저장소는 `Lovv` 서비스의 프론트엔드 프로토타입 및 팀 개발 규정(Wiki)을 포함하는 워크스페이스입니다.

---

## 🛠 Tech Stack (기술 스택)

프론트엔드 모듈은 최신 모던 웹 스택을 기반으로 강력하고 안전하게 설계되었습니다.

- **Core**: [React 19](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L17) (TypeScript)
- **Build Tool**: [Vite 8](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L39)
- **Styling**: [Tailwind CSS v4](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L36) (Vite 통합 플러그인 적용)
- **State Management**:
  - **Server State**: [TanStack Query v5](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L15) (비동기 데이터 캐싱 및 동기화)
  - **Client UI State**: [Zustand v5](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L20) (전역 상태 및 모달/사이드바 등 UI 제어)
- **Routing**: [React Router DOM v7](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L19)
- **Test Framework**: [Vitest](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L40), [React Testing Library](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L26)
- **Icons**: [Lucide React](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/package.json#L16)

---

## 🌟 Key Features (주요 기능)

### 1. 사용자 인증 및 Cognito 연동 (Auth)
- **소셜 로그인**: 구글 및 카카오 OAuth 연동 지원.
- **Cognito Bridge**: AWS Cognito Hosted UI 검증 후, 백엔드 세션(`HttpOnly` Secure 쿠키 기반)과 연결하는 고보안 브릿지 인증 패턴 탑재.
- **이중 마운트 콜백 방지**: React 19의 개발 환경 StrictMode 하에서 발생할 수 있는 일회성 인가 코드(Authorization Code)의 중복 검증 오류를 `sessionStorage` 기반의 세션 가드로 원천 차단.
- **Mock 모드 지원**: 인프라 없이도 개발 및 UI 검증이 가능하도록 로컬 개발용 가상 로그인 시뮬레이터 제공.

### 2. 여행 취향 온보딩 (Onboarding)
- 첫 진입 사용자를 위해 여행 성향 및 동선 페이스, 관심 키워드 등을 파악하는 단계형 취향 조사 UI.
- 국가 선호도(한국/일본 소도시) 설정에 따른 맞춤형 추천 풀 바인딩.

### 3. 메인 대시보드 (Home)
- **리퀴드 글래스모피즘(Liquid Glassmorphism)** 테마를 전면 적용한 고급스러운 디자인 레이아웃.
- 계절성, 유저 취향 선호도 뱃지를 매핑한 이달의 추천 소도시 슬라이딩 캐러셀 카드.
- 하위 섹션 탐색을 돕는 플로팅 퀵 액션 버블 메뉴 탑재.

### 4. 소도시 지도 탐색 (Map Discovery)
- Google Maps API를 연동한 지도 위 소도시 마커 렌더링 및 클러스터링 시각화.
- 국가별, 테마 필터링(자연, 온천, 축제 등)에 따른 동적 소도시 리스트 갱신 및 사이드 패널 정보 표출.

### 5. AI 일정 플래너 챗봇 워크스페이스 (Planner Workspace)
- 소도시 전용 1:1 대화형 AI 플래너 레이아웃.
- 당일치기, 1박 2일, 2박 3일 등 기간을 직관적으로 조절할 수 있는 가이드 칩 제공.
- 실시간 축제 정보 포함 여부, 피드백에 맞춰 동적으로 변하는 최적 동선 타임라인 컴포넌트 렌더링.
- 최종 확정 일정 저장 및 보관함 이동 딥링크 생성.

### 6. 마이페이지 (My Page)
- 저장된 일정 아코디언 상세 조회 및 보관 취소(삭제) 관리.
- 좋아요 버튼으로 북마크한 일정 카드 아카이브 기능.
- 소셜 계정 연동 현황 확인 및 회원 정보 관리.

---

## 📂 Repository Directory Structure (디렉터리 구조)

이 저장소는 다중 모듈 개발 및 개발 규정을 체계적으로 분할 관리할 수 있는 모노레포 구조로 되어 있습니다.

```text
Lovv-pg/
├── docs/                 # 프로젝트 분석 산출물, 외부 공유 문서 및 스펙 아카이브
├── frontend/             # React 프론트엔드 애플리케이션 프로젝트 소스
│   ├── public/           # 정적 에셋 폴더
│   ├── src/              # 프론트엔드 메인 소스코드
│   │   ├── assets/       # 로컬 이미지 및 로고 에셋
│   │   ├── components/   # 전역 컴포넌트 (예: Google Map 래퍼)
│   │   ├── data/         # 소도시 관련 정적 데이터 및 API 모듈
│   │   ├── features/     # Feature 중심 슬라이스 폴더 구조
│   │   │   ├── auth/          # 회원가입, 로그인, Cognito 연동
│   │   │   ├── home/          # 메인 대시보드 및 캐러셀
│   │   │   ├── map-city/      # 구글 지도 탐색 및 소도시 정보
│   │   │   ├── my-page/       # 마이페이지 일정 관리 및 프로필
│   │   │   ├── onboarding/    # 사용자 취향 조사 단계별 플로우
│   │   │   ├── planner/       # AI 플래너 챗봇 인터페이스
│   │   │   ├── recommendation/# 추천 카드 및 리스트 UI
│   │   │   └── saved-plans/   # 일정 저장/반응 관리
│   │   ├── shared/       # 공통 유틸리티, 스토어, 전역 타입
│   │   │   ├── api/           # Axios/Fetch 기본 설정 및 클라이언트
│   │   │   ├── components/    # 버튼, 입력 폼 등 공유 공통 UI 컴포넌트
│   │   │   ├── store/         # Zustand 전역 스토어
│   │   │   ├── types/         # TypeScript 공통 인터페이스 및 타입 정의
│   │   │   └── logger.ts      # 디버깅 및 에러 로깅 모듈
│   │   ├── App.tsx       # 라우터 및 메인 렌더러 정의
│   │   ├── index.css     # Tailwind CSS 진입점 파일
│   │   └── main.tsx      # Entry Point
│   └── tests/            # 단위 및 통합 테스트 케이스 폴더
├── backend/              # [확장 대기] 백엔드 모듈 공간 (현재 SAM 프로젝트는 Lovv_BE에서 개발)
├── database/             # [확장 대기] 데이터베이스 스키마 및 마이그레이션 스크립트 보관
├── models/               # [확장 대기] RAG/임베딩 등 AI 모델 관련 추론 파일 보관
├── wiki/                 # mdBook 기반의 팀 내부 기술 컨벤션 문서
└── vercel.json           # Vercel 클라우드 프론트엔드 배포 설정 파일
```

---

## 🚀 Getting Started (시작 가이드)

### 1. 환경 변수 설정
`frontend` 폴더 내에 `.env.local` 파일을 생성하여 다음과 같이 백엔드 주소 및 Google Maps 키를 매핑합니다. (자세한 설정은 [.env.example](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend/.env.example) 파일 참고)

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Auth Mode 선택 (mock | cognito)
VITE_LOVV_AUTH_MODE=mock

# 백엔드 API URL
VITE_LOVV_API_BASE_URL=https://api.yourdomain.com
VITE_LOVV_AGENT_API_URL=https://lambda-url.yourdomain.aws

# AWS Cognito (Cognito 모드 동작 시)
VITE_COGNITO_DOMAIN=https://your-cognito.auth.ap-northeast-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your_cognito_client_id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback/cognito
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/
```

### 2. 패키지 설치
[frontend/](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/frontend) 디렉터리로 이동하여 의존성 패키지를 설치합니다.
```bash
cd frontend
npm install
```

### 3. 로컬 개발 서버 구동
Vite 개발용 로컬 서버를 기동합니다. (기본 포트: `5173`)
```bash
npm run dev
```

---

## 🧪 Verification & Testing (검증 및 테스트)

배포 또는 코드를 푸시하기 전, 빌드 안정성과 기능 신뢰성을 확보하기 위해 다음 명령들을 실행합니다.

```bash
# 1. TypeScript 컴파일 검증 및 프로젝트 프로덕션 빌드
npm run build

# 2. Vitest를 통한 전체 단위 테스트 런타임 실행 (227개 이상의 테스트 케이스 제공)
npm run test

# 3. ESLint를 통한 코드 린팅 및 품질 검증
npm run lint
```

---

## 📝 Team Wiki & Conventions (팀 위키 및 개발 컨벤션)

본 저장소의 [wiki/](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/wiki) 폴더에는 프로젝트 진행 시 필요한 모든 개발 규정들이 작성되어 있습니다. `mdbook` 도구를 활용하여 로컬 브라우저에서 편리하게 문서들을 조회할 수 있습니다.

### 위키 실행법
```bash
# mdBook이 설치되어 있는 경우
cd wiki
mdbook serve
```
웹 브라우저에서 `http://localhost:3000`으로 접속하여 다음 내용들을 확인할 수 있습니다:
- **Git Flow**: 브랜치 전략 및 Pull Request 작성 절차
- **Commit**: 커밋 메시지 템플릿 및 접두사(Conventional Commits) 규칙
- **Naming**: 컴포넌트, 변수명, 파일 구조 네이밍 규칙
- **Code Style**: ESLint, Prettier 설정 및 React/TypeScript 최적 작성 문법

---

## 🔒 License
이 프로젝트의 라이선스는 [LICENSE](file:///Users/jeonjonghyeok/Documents/Final/Lovv-pg/LICENSE) 파일에서 확인하실 수 있습니다.
