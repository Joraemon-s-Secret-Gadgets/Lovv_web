# TASK3 Subtasks: 서울 S3 배포 및 CloudFront 반영

## Context and Dependencies

- 이전 완료 보고서: `docs/reports/TASK2_COMPLETION.md`
- 배포 소스 기준: 개인 `main` 및 PR #21 head
- 프론트 리전: `ap-northeast-2`
- 배포 스크립트: `deploy/release-seoul.sh`
- 사용자 도메인: `lovv.site`, `www.lovv.site`
- 배포 범위: 프론트 정적 빌드, S3 업로드, CloudFront invalidation, 공개 URL smoke test
- 제외 범위: Organization PR 병합, 백엔드 SAM 재배포, DNS·인증서 재구성

## Subtask 3.1: AWS 및 배포 대상 사전 점검

### Purpose

실제 변경 전에 AWS 계정·리전·S3 bucket·CloudFront distribution·도메인 매핑과 로컬 배포 환경을 읽기 전용으로 확인한다.

### Checks

- `aws --version`, `aws sts get-caller-identity`, `aws configure get region`
- `deploy/.seoul-cdn.env` 존재 여부와 필요한 변수 이름 확인. 값은 로그나 보고서에 노출하지 않는다.
- 대상 bucket 리전이 `ap-northeast-2`인지 확인한다.
- CloudFront distribution의 origin, aliases, status가 현재 `lovv.site`/`www.lovv.site` 구성과 일치하는지 확인한다.
- `frontend/.env.production.local` 존재 여부와 필요한 키 이름만 확인하고 값은 출력하지 않는다.
- `deploy/release-seoul.sh`가 Cognito redirect/logout을 CloudFront 기본 도메인으로 임시 변경하므로, 사용자 도메인을 보존할 배포 방식 또는 안전한 override를 확정한다.
- 작업 트리가 깨끗하고 배포 대상 commit이 개인 `main`과 일치하는지 확인한다.

### Acceptance Criteria

- AWS 계정과 대상 리소스가 명확하다.
- 실제 사용자 도메인과 Cognito redirect/logout 값이 배포 후 유지되는 방법이 확정된다.
- 비밀정보가 터미널 출력, 문서, Git에 포함되지 않는다.
- 사전 점검 결과를 사용자에게 보고하고 업로드 승인 후 다음 Subtask로 이동한다.

## Subtask 3.2: 프로덕션 빌드 및 서울 S3 업로드

### Purpose

검증된 프론트 소스를 프로덕션 설정으로 빌드하고 대상 S3 bucket에 게시한다.

### Steps

- 배포 직전 `npm test`, `npm run lint`, `npm run build` 또는 승인된 동등 검증을 실행한다.
- production env 파일을 수정해야 한다면 백업·복구 trap이 정상 동작하는지 확인한다.
- hashed asset은 `public,max-age=31536000,immutable`로 sync한다.
- `index.html`은 `no-cache,no-store,must-revalidate`와 `text/html`로 업로드한다.
- `--delete` 대상 bucket이 사전 점검에서 확인한 프론트 전용 bucket과 정확히 일치할 때만 실행한다.

### Acceptance Criteria

- 빌드가 성공하고 `dist/index.html`이 존재한다.
- 대상 bucket에 최신 hashed asset과 index가 업로드된다.
- production env 원본이 복구된다.
- 다른 bucket이나 백엔드 리소스는 변경되지 않는다.

## Subtask 3.3: CloudFront invalidation 및 공개 도메인 검증

### Purpose

CloudFront `/*` invalidation을 생성하고 완료 후 `lovv.site`와 `www.lovv.site`에서 최신 빌드를 확인한다.

### Steps

- 확인된 distribution ID에 `/*` invalidation을 생성한다.
- invalidation 완료를 기다리고 상태를 기록한다.
- `https://lovv.site`, `https://www.lovv.site`, SPA 직접 경로의 HTTP 상태와 캐시 헤더를 확인한다.
- HTML이 참조하는 `index-*.js`가 최신 빌드 asset인지 확인한다.
- 로그인 화면, 일정 상세 진입, 위시리스트 UI를 읽기 중심 smoke test한다.

### Acceptance Criteria

- invalidation 상태가 `Completed`다.
- 루트 및 SPA 경로가 정상 응답한다.
- `www.lovv.site`에서 최신 JS/CSS asset이 제공된다.
- Cognito callback/logout과 API CORS 도메인이 기존 사용자 도메인 기준으로 유지된다.
- 배포 결과와 rollback 방법을 사용자에게 보고한다.

## Deadlock Escape Conditions

- AWS 인증, bucket/distribution 식별, 도메인 alias가 불명확하면 실제 업로드 전에 중단한다.
- 같은 배포 또는 invalidation 실패가 세 번 반복되면 중단하고 사용자에게 보고한다.
- 확인되지 않은 bucket에 `--delete`를 실행하지 않는다.
- DNS, ACM, Cognito, SAM 변경이 필요해지면 현재 범위를 확장하지 말고 별도 승인을 요청한다.
