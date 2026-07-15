# Modification Chat History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세부 일정 수정 챗봇에서 사용자 수정 요청과 각 처리 결과를 화면 세션 동안 순서대로 누적한다.

**Architecture:** `PlanDetailView`가 이미 소유한 `localChatMessages`를 수정 대화의 단일 로컬 기록으로 유지한다. 메시지 추가와 최종 결과 보고를 작은 helper로 통일하고 기존 수정 API, 후보 확인 UI, 일정 교체 콜백은 변경하지 않는다.

**Tech Stack:** React 19, TypeScript 6, Vitest 4, Testing Library, Vite

## Global Constraints

- 진행 중인 수정 대화를 백엔드, `localStorage`, `sessionStorage`에 저장하지 않는다.
- 추천 API 요청·응답 계약과 백엔드 구현을 변경하지 않는다.
- 유효한 요청 하나당 user 메시지를 한 번만 추가한다.
- 최종 후보·성공·확인·입력 거절·API 실패 결과를 assistant 메시지로 한 번만 추가한다.
- 기존 후보 확인과 일정 적용 동작을 유지한다.
- 실제 환경 변수나 토큰을 소스·테스트·커밋에 포함하지 않는다.

---

### Task 1: Accumulate modification requests and results

**Files:**
- Modify: `frontend/src/features/planner/PlanDetailView.tsx:579`
- Modify: `frontend/src/features/planner/PlanDetailView.tsx:863-1023`
- Modify: `frontend/src/features/planner/PlanDetailView.tsx:1301-1349`
- Test: `frontend/src/features/planner/PlanDetailView.test.tsx`

**Interfaces:**
- Consumes: `ChatMessage`, `createLocalChatMessageId(prefix: string): string`, `onRequestPlanModification(request): Promise<PlanDraft | PlanDay | PlanStop | null>`
- Produces: component-local `appendLocalChatMessage(role, content)` and `reportFloatingChatResult(content)` helpers; no exported API changes

- [ ] **Step 1: Add a failing regression test for two consecutive modification turns**

Add `within` to the Testing Library import and add an editable render helper:

```tsx
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const renderEditablePlanDetail = (
  planDraft: PlanDraft,
  onRequestPlanModification: ReturnType<typeof vi.fn>,
) => render(
  <MemoryRouter>
    <PlanDetailView
      isPlannerReady
      shouldAskFestivalTheme={false}
      returnToChatWorkspace={vi.fn()}
      currentPlanTitle="수정 대화 테스트"
      planDraft={planDraft}
      plannerBasisLabel="강릉"
      planId="modification-chat-history-plan"
      saveGeneratedPlan={vi.fn()}
      isCurrentPlanSaved={false}
      onDeleteSavedPlan={vi.fn()}
      openMyPage={vi.fn()}
      savedPlanNotice={null}
      authAccessToken="access-token"
      onReplacePlanStop={vi.fn()}
      onReplacePlanDay={vi.fn()}
      onReplacePlanDraft={vi.fn()}
      onRequestPlanModification={onRequestPlanModification}
    />
  </MemoryRouter>,
)
```

Add one test with two distinct stop requests and candidates:

```tsx
it('keeps consecutive modification requests and assistant results in the chat history', async () => {
  const planDraft = createPlanDraft([
    createDay(1, [[128.91, 37.75], [128.93, 37.77]], [[128.91, 37.75], [128.93, 37.77]]),
  ])
  const onRequestPlanModification = vi.fn()
    .mockResolvedValueOnce({
      ...planDraft.days[0].stops[0],
      title: '첫 번째 대체 장소',
    })
    .mockResolvedValueOnce({
      ...planDraft.days[0].stops[1],
      title: '두 번째 대체 장소',
    })

  renderEditablePlanDetail(planDraft, onRequestPlanModification)
  fireEvent.click(screen.getByRole('button', { name: 'Lovv 챗봇' }))

  const input = screen.getByRole('textbox', { name: '세부 일정 수정 요청' })
  fireEvent.change(input, { target: { value: '1일차 첫 장소 바꿔줘' } })
  fireEvent.click(screen.getByRole('button', { name: '확인', exact: true }))
  await screen.findByRole('group', { name: /첫 번째 대체 장소 장소 변경 확인/ })

  fireEvent.change(input, { target: { value: '1일차 두 번째 장소 바꿔줘' } })
  fireEvent.click(screen.getByRole('button', { name: '확인', exact: true }))
  await screen.findByRole('group', { name: /두 번째 대체 장소 장소 변경 확인/ })

  const history = screen.getByRole('group', { name: '최근 대화' })
  expect(within(history).getByText('1일차 첫 장소 바꿔줘')).toBeVisible()
  expect(within(history).getByText('1일차 두 번째 장소 바꿔줘')).toBeVisible()
  expect(within(history).getAllByText('에이전트가 제안한 후보를 확인해 주세요.')).toHaveLength(2)
})
```

If the rendered history currently uses `aria-label` without `role="group"`, add `role="group"` to that existing history container as the minimal accessibility-compatible production change covered by this test.

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```powershell
npm test -- src/features/planner/PlanDetailView.test.tsx
```

Expected: the new test fails because directly submitted commands and assistant results are absent from `localChatMessages`. Existing route tests must remain green.

- [ ] **Step 3: Add local message helpers**

Immediately after the `localChatMessages` state in `PlanDetailView`, add:

```tsx
const appendLocalChatMessage = (role: ChatMessage['role'], content: string) => {
  setLocalChatMessages((current) => [
    ...current,
    {
      id: createLocalChatMessageId(`plan-detail-${role}`),
      role,
      content,
    },
  ])
}

const reportFloatingChatResult = (content: string) => {
  setFloatingChatNotice(content)
  appendLocalChatMessage('assistant', content)
}
```

Replace the existing inline `setLocalChatMessages` in `openStopModificationChat` with:

```tsx
appendLocalChatMessage('user', requestMessage)
```

- [ ] **Step 4: Record final outcomes from modification request functions**

Keep loading-only `setFloatingChatNotice(...)` calls unchanged. Replace each final result update in `requestStopReplacement`, `requestDayReplacementCandidate`, and `requestPlanReplacement` with `reportFloatingChatResult(...)`:

```tsx
reportFloatingChatResult('일정 수정 에이전트 연결이 아직 준비되지 않았어요.')
reportFloatingChatResult('수정 후보를 받지 못했어요. 조건을 조금 더 구체적으로 다시 요청해 주세요.')
reportFloatingChatResult('에이전트가 제안한 후보를 확인해 주세요.')
reportFloatingChatResult(getPlanModificationFailureMessage(error))
reportFloatingChatResult('기존 방문지와 겹치지 않는 새 일차를 받지 못했어요. 잠시 후 다시 시도해 주세요.')
reportFloatingChatResult('전체 일정 수정안을 받지 못했어요. 조건을 조금 더 구체적으로 다시 요청해 주세요.')
reportFloatingChatResult(options.successNotice ?? '에이전트가 제안한 전체 일정 수정안을 반영했어요.')
```

When a pending stop or day edit is applied, preserve the replacement callback and add one final assistant result:

```tsx
if (pendingEdit.kind === 'stop' && onReplacePlanStop) {
  onReplacePlanStop(pendingEdit.dayNumber, pendingEdit.stopIndex, pendingEdit.candidate)
  reportFloatingChatResult('선택한 장소 변경을 일정에 반영했어요.')
}

if (pendingEdit.kind === 'day' && onReplacePlanDay) {
  onReplacePlanDay(pendingEdit.dayNumber, pendingEdit.candidate)
  reportFloatingChatResult(`${pendingEdit.dayNumber}일차 변경을 일정에 반영했어요.`)
}
```

- [ ] **Step 5: Record submitted commands and local validation results**

In `handleFloatingChatSubmit`, keep the empty-input early return, then append the user command exactly once:

```tsx
appendLocalChatMessage('user', command)
```

Use `reportFloatingChatResult` for terminal local outcomes:

```tsx
reportFloatingChatResult('특정 장소 지정은 지원하지 않아요. 바꿀 시간대와 실내 여부, 분위기, 이동 부담을 알려주세요.')
reportFloatingChatResult('“도시 바꿔줘”, “1일차 2번째 장소 바꿔줘”, “1일차 점심을 OO로 바꿔줘”처럼 요청해 주세요.')
reportFloatingChatResult('요청을 확인했어요. 일정 화면에서 변경 범위를 확정해 주세요.')
```

Do not append another assistant message in `handleFloatingChatSubmit` for stop, plan, or weather requests because their request functions now own the final assistant outcome.

- [ ] **Step 6: Run the targeted test and verify GREEN**

Run:

```powershell
npm test -- src/features/planner/PlanDetailView.test.tsx
```

Expected: all `PlanDetailView.test.tsx` tests pass, including the consecutive-history regression.

- [ ] **Step 7: Add failure-path coverage if not already exercised by the regression fixture**

Add a focused test that submits an unsupported command twice and verifies both user requests and both assistant explanations remain in the `최근 대화` group. Use the exact unsupported-command copy from `handleFloatingChatSubmit`; do not mock the API because the validation path must not call it.

- [ ] **Step 8: Run full frontend verification**

Run in `frontend`:

```powershell
npm test
npm run lint
npm run build
```

Expected: every command exits with code 0 and reports no test, lint, TypeScript, or Vite build failures.

- [ ] **Step 9: Review scope and create the implementation commit**

Run:

```powershell
git diff --check
git status --short
git diff -- frontend/src/features/planner/PlanDetailView.tsx frontend/src/features/planner/PlanDetailView.test.tsx
```

Confirm only the approved planner chat history behavior and its tests changed, then commit:

```powershell
git add -- frontend/src/features/planner/PlanDetailView.tsx frontend/src/features/planner/PlanDetailView.test.tsx
git commit -m "fix(planner): preserve modification chat history"
```

### Task 2: Prepare handoff for main publication and Organization PR

**Files:**
- Create: `docs/reports/TASK1_COMPLETION.md`
- Create: `docs/specs/TASK2_SUBTASKS.md`

**Interfaces:**
- Consumes: verified Task 1 commit and `origin/main`
- Produces: user-reviewable completion evidence and publication instructions

- [ ] **Step 1: Write the Task 1 completion report**

Record completion timestamp, responsible role, spec checklist, changed files, exact test outputs, remaining risks, and the required user confirmation before publication.

- [ ] **Step 2: Write Task 2 publication instructions**

Define the ordered operations: update local `main`, integrate the verified commits, push `JJonyeok2/Lovv_web` `main`, confirm the Organization repository and base branch, create a PR from `JJonyeok2:main`, and verify the resulting URL.

- [ ] **Step 3: Commit the handoff documents**

```powershell
git add -- docs/reports/TASK1_COMPLETION.md docs/specs/TASK2_SUBTASKS.md
git commit -m "docs(planner): record chat history task handoff"
```

- [ ] **Step 4: Stop for the project-required Task gate**

Report Task 1 verification evidence and request approval before performing the external `main` push and Organization PR creation.
