# TASK1 Subtasks: 세부 일정 수정 채팅 기록 누적

## Context and Dependencies

- Authoritative design: `docs/superpowers/specs/2026-07-15-modification-chat-history-design.md`
- Detailed implementation plan: `docs/superpowers/plans/2026-07-15-modification-chat-history.md`
- Base branch: `main` at `36d976b`
- Working branch: `codex/fix-modification-chat-history`
- Backend and recommendation API contracts are out of scope.

## Subtask 1.1: 수정 요청과 처리 결과 누적

### Purpose

`PlanDetailView`의 세부 일정 수정 챗봇에서 연속된 user 요청과 assistant 처리 결과를 컴포넌트 세션 동안 보존한다.

### Target Files

- `frontend/src/features/planner/PlanDetailView.tsx`
- `frontend/src/features/planner/PlanDetailView.test.tsx`

### Local Rules

- 테스트를 먼저 작성하고 의도한 이유로 실패하는지 확인한다.
- `localChatMessages`를 상태 소유자로 유지한다.
- API 계약과 백엔드는 변경하지 않는다.
- 로딩 문구를 대화 결과로 중복 저장하지 않는다.
- 요청과 최종 결과는 각각 한 번만 저장한다.

### Acceptance Criteria

- 연속된 두 수정 요청과 두 assistant 결과가 모두 `최근 대화`에 남는다.
- 챗봇을 닫았다 다시 열어도 같은 화면 세션에서는 기록이 유지된다.
- 입력 거절과 API 실패도 user/assistant 턴으로 기록된다.
- 기존 후보 확인과 일정 반영 흐름이 유지된다.
- 관련 단위 테스트, 전체 테스트, 린트, 빌드가 통과한다.

### Verification Commands

```powershell
cd frontend
npm test -- src/features/planner/PlanDetailView.test.tsx
npm test
npm run lint
npm run build
```

## Deadlock Escape Conditions

- 동일 테스트 또는 수정 시도가 세 번 연속 실패하면 즉시 중단하고 사용자에게 원인과 대안을 보고한다.
- 구현·리뷰가 세 번 반복되거나 범위가 API·백엔드 변경으로 확대되면 사용자 승인을 다시 받는다.
- Subtask 1.1 완료와 검증 후 다음 top-level Task인 게시·PR 작업을 자동 시작하지 않는다. `docs/reports/TASK1_COMPLETION.md`와 `docs/specs/TASK2_SUBTASKS.md`를 작성하고 사용자 확인을 기다린다.
