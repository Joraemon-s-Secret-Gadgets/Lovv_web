# TASK3 Chat Planner Detail Spec

## Summary

메인 화면에서 `AI 일정 짜기`를 누른 뒤 진입하는 여행 생성 화면을 MVP 수준의 실제 작업 공간으로 만든다. 최신 방향은 지도 없이 챗봇을 중심에 두고, 생성된 일정의 세부 내용은 Triple의 맞춤 일정 결과처럼 챗봇 창 아래에 이어서 붙는 구조다. 사용자는 온보딩에서 고른 여행 취향을 기반으로 대화 입력을 시작하고, Lovv는 대화 내용에 맞는 소도시 후보와 일정 초안을 같은 화면에서 정리한다.

이 Spec은 README의 다음 MVP 프레임인 `MVP Refined 03 / Lovv Chat Planning`, `MVP Refined 04 / Style Input + Result`를 우선 범위로 묶는다. `MVP Refined 05 / Lovv Geo Planning`은 지도 방향이 다시 확정될 때 별도 Task로 다룬다.

## Goals

- 챗봇과 챗봇 아래 일정 상세 영역으로 여행 생성 작업을 진행하는 웹앱 화면을 구현한다.
- 온보딩에서 저장한 `lovv.preference`를 챗봇 시작 메시지, 추천 톤, 일정 상세 초안에 반영한다.
- 사용자가 여행 조건을 입력하면 대화 메시지와 일정 초안 UI가 화면 안에서 이어진다.
- 생성된 일정 상세는 챗봇 창 아래에서 결과 페이지처럼 시간대별 세부 내용으로 보인다.
- 현재 Lovv 컬러, 캐릭터, 부드러운 초록/노랑 버튼 톤을 유지하되, 단순한 placeholder 느낌을 줄인다.
- MVP에서는 백엔드 없이 프론트엔드 상태와 `localStorage`만 사용한다.

## Non-Goals

- 실제 AI API 연동은 포함하지 않는다.
- 실제 지도 API, 지오코딩, 경로 계산, 실시간 장소 검색은 포함하지 않는다.
- 지도 UI는 이번 Task에 포함하지 않는다.
- 로그인, 계정 저장, 서버 동기화, 전체 채팅 로그 저장은 포함하지 않는다.
- 추천 알고리즘의 정확도 개선이나 실제 여행 데이터 수집은 포함하지 않는다.
- Figma의 모든 픽셀 값을 1:1로 복제하지 않는다. React/Tailwind 구현에 맞게 적응한다.

## Users

- 한국과 일본 소도시 여행을 빠르게 시작하고 싶은 일반 사용자.
- 여행 조건을 길게 정리하기보다 대화로 일정 초안을 만들고 싶은 사용자.
- 추천 결과를 말로만 받기보다 시간대별 세부 일정으로 바로 확인하고 싶은 사용자.

## User Flow

1. 사용자는 첫 진입 온보딩에서 여행 취향을 선택한다.
2. 사용자는 메인 화면에서 `AI 일정 짜기`를 클릭한다.
3. 시스템은 온보딩을 다시 띄우지 않고 챗봇 워크스페이스로 이동한다.
4. 챗봇 첫 메시지는 저장된 취향을 반영해 여행 조건 입력을 요청한다.
5. 사용자는 여행 기간, 동행, 걷는 정도, 관심사를 입력하거나 추천 칩을 선택한다.
6. 시스템은 사용자 메시지를 대화 목록에 추가하고, MVP용 deterministic 응답으로 일정 초안을 보여준다.
7. 챗봇 창 아래의 일정 상세 영역은 선택 취향과 일정 초안에 맞는 시간대별 세부 내용을 보여준다.
8. 사용자는 같은 화면에서 대화와 일정 상세를 비교하며 다음 입력을 이어갈 수 있다.

## Requirements

### R1. Chat workspace entry

- WHEN a returning or newly onboarded user clicks `AI 일정 짜기`, THE system SHALL show the chat workspace directly.
- WHEN the chat workspace is shown, THE system SHALL NOT show the onboarding gate or onboarding modal.
- WHEN no stored preference exists because storage was cleared or invalid, THE system SHALL fall back to the onboarding gate before the main or chat screen.

### R2. Preference-aware chat start

- WHEN the chat workspace loads, THE system SHALL read the selected preference from the existing app state.
- THE system SHALL show an assistant opening message that includes the selected city pair or its theme signals.
- THE system SHALL show progress/status items that indicate preference reflection, candidate exploration, and route planning.

### R3. Message input behavior

- WHEN the message input is empty, THE send action SHALL be disabled or visually unavailable.
- WHEN the user enters a message and submits it, THE system SHALL append the user message to the conversation.
- WHEN the user submits a message, THE system SHALL append a deterministic MVP assistant response with a visible schedule draft.
- WHEN the message is submitted, THE input SHALL clear and keep focus available for continued typing.
- IF the user presses Enter while the input has text, THE system SHALL submit the message.

### R4. Schedule draft result

- WHEN at least one user message has been submitted, THE system SHALL show a schedule draft section in the chat area.
- THE schedule draft SHALL include at least three visible itinerary blocks such as morning, afternoon, and evening.
- THE schedule draft SHALL include a compact summary of recommended city direction, travel mood, and next question.
- THE schedule draft SHALL remain readable on desktop and mobile.

### R5. Generated schedule detail behavior

- WHEN the chat workspace loads, THE generated schedule detail section SHALL appear below the unchanged chat panel.
- THE schedule detail section SHALL expose an accessible region label such as `생성된 일정 상세`.
- THE schedule detail section SHALL include a preference-aware one-day draft title.
- THE schedule detail section SHALL show at least three time blocks: morning, afternoon, and evening.
- THE schedule detail section SHALL present a result-page style timeline with movement hints and recommendation reasons.
- THE chat workspace SHALL NOT render the `여행 지도` region in this Task.

### R6. Persistence and privacy

- THE system SHALL continue storing only the selected preference in `lovv.preference`.
- THE system MAY store a lightweight generated plan draft such as `lovv.planDraft`.
- THE system SHALL NOT store the full chat transcript.
- IF stored preference JSON is invalid or unknown, THE system SHALL safely ignore it and return to onboarding.

### R7. Responsiveness and accessibility

- THE layout SHALL be desktop-first webapp UI with a useful mobile fallback.
- ON desktop, THE layout SHALL keep the left planner rail, chat area, and generated schedule detail area visually organized.
- ON mobile, THE layout SHALL stack sections without text overlap or horizontal scrolling.
- Interactive controls SHALL have accessible labels or visible text.
- Text inside buttons, cards, status chips, and schedule detail blocks SHALL not overflow its container.

## Acceptance Criteria

- First-time users still start at the pre-main onboarding gate.
- Returning users can enter the main screen and open the chat workspace without seeing onboarding again.
- Chat workspace contains:
  - `AI 일정 챗봇` heading.
  - Preference-aware assistant opening message.
  - Message input.
  - Send action.
  - `생성된 일정 상세` region below the chat panel.
  - Morning, afternoon, and evening detail blocks.
  - Result-style timeline items with movement hints and recommendation reasons.
- Submitting a non-empty message adds the user message and a deterministic assistant response.
- After first submit, a schedule draft with at least three itinerary blocks is visible.
- The chat workspace does not render a `여행 지도` region.
- No full chat transcript is written to `localStorage`.
- `npm test`, `npm run lint`, and `npm run build` pass.
- Browser verification confirms desktop and mobile layouts do not show incoherent overlap.

## Constraints

- Tech stack remains React, TypeScript, Tailwind CSS, Vite, Vitest.
- Keep implementation inside `/Users/jeonjonghyeok/Lovv-pg`.
- Keep changes scoped to frontend UI and local state.
- Do not add external UI libraries, map providers, AI SDKs, backend calls, or global dependencies for this task.
- Use the existing Lovv logo and suitcase character assets.
- Preserve the existing color system unless a specific UI readability issue requires a small adjustment.
- Use TDD for behavior changes: write failing tests before production code.

## Design

### Existing System Context

The current app keeps all UI in `src/App.tsx` with three views:

- `onboarding`: first-entry preference gate.
- `home`: personalized main screen.
- `chat`: current placeholder chat screen with generated schedule detail below the chat panel.

Preferences are held in a local `preferences` array and persisted as `lovv.preference` with only `cityPair`. Tests live in `src/App.test.tsx` and already cover onboarding, returning-user behavior, chat entry, map absence, and generated schedule detail presence.

### Chosen Approach

Implement the next MVP as a richer local-state chat and itinerary-detail workspace. The chat flow will remain deterministic and front-end only. This keeps the MVP credible visually while avoiding backend/API complexity before product flow is stable.

The preferred implementation direction is to split `src/App.tsx` only where it reduces real complexity:

- Move preference data and helper lookup into a small data/helper module.
- Extract `ChatPlannerView` when adding message state and draft state.
- Keep `HomeView` and `OnboardingGate` extraction optional unless `App.tsx` becomes difficult to review.

### UI Structure

Desktop layout:

- Fixed top header retained from current app.
- Left rail: Lovv AI Planner, selected preference, progress states, current trip assumptions.
- Main chat panel: message list, assistant/user bubbles, input row. The chat panel's existing visual height and structure should remain stable.
- Generated detail panel below chat: one-day draft summary, result-style timeline, time blocks, movement hints, recommendation reasons, selected preference signals.

Mobile layout:

- Header.
- Chat panel first.
- Planner status and generated detail stacked below or above depending on readability.
- Input remains full-width and does not overlap content.

### State Model

Suggested local state:

```ts
type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

type PlanStop = {
  id: string
  label: string
  time: string
  description: string
}

type PlanDraft = {
  cityPair: string
  mood: string
  summary: string
  stops: PlanStop[]
}
```

Initial state derives from `selectedPreference`. The first generated draft can be deterministic based on preference and user text length or keyword categories. The implementation does not need AI-quality parsing.

### Error Handling

- Invalid stored preference remains handled by the existing fallback logic.
- Empty input does not submit.
- Whitespace-only input is treated as empty.
- If `lovv.planDraft` parsing fails, ignore it and create a fresh draft.

### Privacy

Only the selected preference and optional final lightweight plan draft may be stored. The full message list stays in React state only.

## Risks And Assumptions

- Figma metadata inspection timed out during Spec drafting, so exact node names and pixel-level dimensions are not confirmed in this document.
- The Spec assumes the next useful product step is the chat + generated itinerary detail workspace, based on the latest user direction.
- Map UI is intentionally deferred. If map returns later, it should be treated as a separate Task rather than mixed into the chat-detail task.
- `src/App.tsx` is already large. Adding chat behavior without extraction will increase review risk.

## Task Breakdown

### Task 3.1: Prepare chat workspace data model

- Purpose: 챗봇 메시지와 일정 상세 초안을 표현할 최소 타입과 deterministic 데이터를 준비한다.
- Scope: preference helper, chat message model, plan draft model, static detail generator.
- Dependencies: Current onboarding and main flow.
- Context Budget:
  - Must read: `src/App.tsx`, `src/App.test.tsx`, this Spec.
  - Do not read: `.superpowers/`, `dist/`, `node_modules/`.
  - Optional read: README.
- Acceptance Criteria: preference별 초기 메시지와 draft 생성에 필요한 데이터가 코드에서 명확히 분리된다.
- Verification: `npm test`.

### Task 3.2: Implement message input and deterministic response

- Purpose: 사용자가 실제로 여행 조건을 입력하고 챗봇 응답을 받는 흐름을 만든다.
- Scope: chat input, submit behavior, message append, empty input guard, Enter submit.
- Dependencies: Task 3.1.
- Context Budget:
  - Must read: current Subtask, Spec `#requirements`, `#state-model`, `#acceptance-criteria`.
  - Do not read: unrelated docs and generated files.
  - Optional read: Tailwind class usage in existing chat placeholder.
- Acceptance Criteria: user message and assistant response are visible after submit; empty input does not submit.
- Verification: `npm test`, browser manual submit check.

### Task 3.3: Render schedule draft result

- Purpose: 챗봇 응답을 단순 문장으로 끝내지 않고 일정 초안 UI로 보여준다.
- Scope: itinerary blocks, summary, next question, selected preference signals.
- Dependencies: Task 3.2.
- Context Budget:
  - Must read: Spec `#schedule-draft-result`, `#ui-structure`.
  - Do not read: Figma metadata unless the user asks for pixel matching.
  - Optional read: current App chat section.
- Acceptance Criteria: first submit 후 최소 3개 itinerary block이 보이고 모바일에서도 텍스트가 겹치지 않는다.
- Verification: `npm test`, `npm run lint`, browser desktop/mobile check.

### Task 3.4: Render generated schedule detail below chat

- Purpose: 챗봇에서 나온 일정 초안이 대화 아래에서 결과 페이지형 세부 내용으로 이어지게 한다.
- Scope: generated schedule detail region, one-day draft title, result timeline, morning/afternoon/evening detail blocks, movement hints, recommendation reasons.
- Dependencies: Task 3.3.
- Context Budget:
  - Must read: Spec `#generated-schedule-detail-behavior`, `#ui-structure`.
  - Do not read: external map API docs.
  - Optional read: current chat detail section in `src/App.tsx`.
- Acceptance Criteria: 챗봇 아래에 `생성된 일정 상세` region이 있고 오전/오후/저녁 세부 블록, 이동 힌트, 추천 이유가 보인다.
- Verification: `npm test`, browser position/overlap check.

### Task 3.5: Privacy and persistence guard

- Purpose: MVP 저장 정책을 명확히 지키고 회귀를 막는다.
- Scope: `lovv.preference` 유지, optional `lovv.planDraft`, full transcript non-persistence test.
- Dependencies: Task 3.2 or later.
- Context Budget:
  - Must read: Spec `#persistence-and-privacy`, `#privacy`.
  - Do not read: environment files.
  - Optional read: `src/setupTests.ts`.
- Acceptance Criteria: full chat transcript is not stored in `localStorage`; invalid stored data fails safely.
- Verification: `npm test`.

## Verification Plan

- Unit/interaction tests:
  - First-entry onboarding remains unchanged.
  - Returning user opens main directly.
  - `AI 일정짜기` opens chat workspace.
  - Empty input does not create a message.
  - Non-empty input creates user message, assistant response, and schedule draft details.
  - Full chat transcript is not persisted to `localStorage`.
- Static checks:
  - `npm run lint`.
  - `npm run build`.
- Browser checks:
  - Desktop viewport: no overlapping text, chat and generated detail both visible as a coherent webapp workspace.
  - Mobile viewport: sections stack without horizontal overflow.
  - Preference-specific text appears in chat and generated detail.

## Approval Needed

사용자 승인이 필요한 결정:

- 다음 구현 범위를 Task 3 전체로 볼지, 아니면 Task 3.1-3.2까지만 먼저 구현할지.
- 챗봇 응답을 완전히 deterministic mock으로 둘지, API 연결 전 임시 “AI처럼 보이는” 로딩 상태까지 포함할지.
- `lovv.planDraft` 저장을 이번에 포함할지, 아니면 화면 상태만 만들고 저장은 다음 Task로 미룰지.
