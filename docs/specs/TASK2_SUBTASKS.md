# TASK2 Subtasks: 개인 main 게시 및 Organization PR

## Context and Dependencies

- Previous Task report: `docs/reports/TASK1_COMPLETION.md`
- Verified implementation commit: `ea29538`
- Base branch: personal fork `main` at `36d976b`
- Source repository: `JJonyeok2/Lovv_web`
- Intended Organization repository: remote URL을 게시 전에 확인한다.
- Intended Organization target branch: repository 규약에 따라 `dev`를 우선 확인한다.
- Deployment is out of scope.

## Subtask 2.1: 검증된 커밋을 개인 fork main에 통합

### Purpose

검증된 Task 1 커밋만 개인 fork의 `main`에 반영하고 원격 상태와 충돌 여부를 확인한다.

### Target Files

- 새 코드 변경 없음.
- Git refs and remote configuration only.

### Local Rules

- 사용자 확인을 받은 뒤 시작한다.
- 게시 직전에 origin/main을 fetch하고 선행 변경을 확인한다.
- force push를 사용하지 않는다.
- 검증된 Task 1 커밋과 문서 커밋 외의 변경을 포함하지 않는다.
- `.env` 및 실제 자격 증명을 스테이징하거나 출력하지 않는다.

### Acceptance Criteria

- 개인 fork `main`이 최신 원격 기준으로 검증된 커밋을 포함한다.
- 작업 트리가 깨끗하다.
- 개인 fork `main` 푸시가 성공한다.

### Verification Commands

```powershell
git fetch origin
git log --oneline --decorate --graph -10
git status --short
git push origin main
git ls-remote --heads origin main
```

## Subtask 2.2: Organization 대상 PR 생성

### Purpose

개인 fork `main`을 Organization의 배포 전 통합 브랜치로 보내는 ready PR을 생성한다.

### Target Files

- 새 코드 변경 없음.
- GitHub pull request metadata only.

### Local Rules

- Organization repository URL과 대상 브랜치를 원격 및 workflow 규약으로 재확인한다.
- 기본 대상은 Organization `dev`이며 실제 원격에 없거나 규약이 다르면 중단하고 사용자에게 보고한다.
- PR 본문에 변경 요약, 테스트 결과, 배포 제외 사실을 기록한다.
- AWS S3 배포나 Organization `main` 병합은 수행하지 않는다.

### Acceptance Criteria

- source는 `JJonyeok2:main`, target은 확인된 Organization 통합 브랜치다.
- ready PR URL을 사용자에게 제공한다.
- PR 생성 후 상태와 diff 범위를 확인한다.

### Verification Commands

```powershell
git remote -v
gh pr view --json url,state,isDraft,headRefName,baseRefName
git status --short
```

## Deadlock Escape Conditions

- fetch/push/PR 작업이 동일 원인으로 세 번 실패하면 중단하고 사용자에게 보고한다.
- 원격 `main`에 예상하지 못한 커밋이 있거나 Organization 대상 저장소/브랜치가 불명확하면 자동 병합하지 않는다.
- force push, Organization 브랜치 직접 push, 배포가 필요해지면 별도 사용자 승인을 받는다.
