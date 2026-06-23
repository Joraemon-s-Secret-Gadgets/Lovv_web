# TASK5 MVP User Flow, Preference Edit, Planner Summary Spec

## User Request Original

> 사용자 흐름대로 구현은 되어야 하고, 저 카드와 위에 취향 다시 선택하기(고르기)기능 Spec 작성하고 작업 다 하고 이 플로우 대로 빠진거 보충하는게 나을까 아니면 Spec을 전체 작성하는게 좋을까?
>
> 그래그래 근데 Backend와 연결되어야하는 점들은 더미로 처리해서 구현하자. 이건 꼭 지켜야할 거로.

## Structured Agent Contract

- Write a full MVP user-flow baseline spec before implementing more UI.
- Mark which parts of the uploaded A-X flow are already implemented, partially implemented, in the next implementation slice, later, or out of scope.
- Implement the next slice only after the spec is reviewed: My Page preference re-selection and AI Planner summary-card content.
- Any behavior that would normally require backend, database, external OAuth, map, weather, AI agent, or storage API integration must be represented with mock adapters, deterministic dummy data, and/or localStorage during this MVP phase.
- Do not wire real backend calls, real credentials, real external API calls, or real AI-agent calls in this task.

## Summary

Lovv's 1차 MVP should follow a clear user flow from service entry through mock login, onboarding, main map/chat entry, AI itinerary generation, result review, save, feedback, and My Page actions.

This spec establishes the full user-flow baseline and isolates the next implementable slice:

1. My Page preference re-selection: users can reopen the travel-mood selection UI from My Page and save a new preference without immediately deleting the current one.
2. AI Planner summary cards: the three summary cards above the chat should no longer look empty. They should show concise state summaries with at most one short line and up to two chips per card.

The current MVP remains frontend-only. Backend-connected features must be mocked so the UI and state contracts are ready for later integration.

## Goals

- Define the full A-X Lovv MVP user flow as the product baseline.
- Keep implementation aligned with the user's actual flow, not only isolated screens.
- Add a My Page flow for reselecting travel preference.
- Keep the existing preference until a new one is explicitly saved.
- Improve the AI Planner summary cards without overloading them with detailed content.
- Clearly separate frontend mock behavior from future backend/API/AI responsibilities.
- Keep header behavior unchanged: authenticated header shows `마이페이지` and `로그아웃` only.
- Preserve current orange Lovv visual direction, character/brand tone, and web-app layout.

## Non-Goals

- No real Google/Kakao OAuth integration.
- No real backend, SAM, Django, DynamoDB, S3, CloudFront, map API, weather API, or AI agent call.
- No real account synchronization across devices.
- No real recommendation algorithm.
- No permanent full chat transcript storage.
- No implementation of the entire A-X flow in one task.
- No major redesign of the landing, onboarding cards, or chat workspace.

## Must-Follow Dummy Backend Rule

Backend-connected work must be implemented as a swappable mock layer first.

| Future backend/API concern | MVP implementation rule |
| --- | --- |
| Google/Kakao auth | Use mock provider users in localStorage. No OAuth redirect, token, or SDK. |
| User profile | Use `lovv.auth.user` dummy user data. |
| Preference storage | Use `lovv.preference` with `{ cityPair: string }`. |
| Saved preferences/history | Use localStorage or in-memory dummy records only. |
| AI itinerary generation | Use deterministic frontend helper functions based on selected preference and chat inputs. |
| City candidate search | Use existing static preference/city data. |
| Map markers | Use static dummy marker positions/data. |
| Festival/event inclusion | Use selected chip state and dummy labels. |
| Weather or bad-weather alternatives | Use placeholder dummy copy only when that slice is implemented later. |
| Save/like/review | Use localStorage-backed mock collections until backend contracts exist. |

Implementation should name helper boundaries so they can later become API adapters. Example: `mockAuthUsers`, `readStoredPreference`, `createPlanDraft`, future `mockRecommendationService`, future `mockSavedPlanStore`.

## Current System Context

The current frontend is a React, TypeScript, Vite, and Tailwind CSS app under `frontend/`.

Current view orchestration is handled with `activeView` in `frontend/src/App.tsx`:

```ts
type View = 'auth' | 'onboarding' | 'home' | 'chat' | 'mypage'
```

Current persisted MVP keys:

| Key | Purpose | Status |
| --- | --- | --- |
| `lovv.auth.user` | Mock Google/Kakao login user | Implemented |
| `lovv.preference` | Selected travel-mood city pair | Implemented |
| Saved plan state | Save confirmation notice only | Partial |
| Liked plan state | Not implemented | Later |
| Review state | Not implemented | Later |

## Full MVP User Flow Baseline

| Node | Flow step | User-facing behavior | MVP implementation status |
| --- | --- | --- | --- |
| A | 서비스 진입 | User enters Lovv web app. | Implemented |
| B | 로그인 상태 확인 | App checks mock auth session. | Implemented |
| C | Google/Kakao 로그인 | User can start through mock Google/Kakao buttons. | Implemented with dummy users |
| D | 기존 선호/저장/피드백 로드 | Existing preference and later saved feedback are loaded. | Preference implemented, saved/feedback later |
| E | 온보딩 완료 여부 | App routes users without preference to onboarding. | Implemented |
| F | 대도시 스타일 선택 | User selects the mood/city-pair style. | Implemented |
| G | 기본 6개 테마로 선호 매핑 | App maps the selected card to theme/category data. | Implemented through static preference data |
| H | 메인 지도/챗봇 진입 | Main screen provides map preview and AI planner entry. | Implemented partially |
| I | 추천 진입 방식 | User chooses map-like or chatbot-like entry. | Partial: chat is primary, map is preview |
| J | 국가/월/테마 필터 조정 | User filters on map route. | Later |
| K | 소도시 마커 클릭 | User clicks a small-city marker. | Later |
| L | 일정 유형 선택 | User selects relaxed/balanced/tight type. | Later or chat-derived |
| M | 자연어 조건 입력 | User adds trip conditions in chat. | Implemented |
| N | 필수 조건 충족 여부 | System checks duration/festival readiness. | Implemented partially |
| O | 국가/월/일정 유형 추가 질문 | Chat asks follow-up questions when missing. | Partial |
| P | 추천 조건 확정 | System confirms recommendation conditions. | Partial |
| Q | 축제/행사 포함 여부 선택 | User chooses festival include/exclude. | Implemented in chat |
| R | 여행 일정 추천 받기 | System generates a mock itinerary. | Implemented with deterministic dummy plan |
| S | 추천 결과 카드 확인 | User reviews recommendation cards. | Partial: itinerary detail exists, result card list later |
| T | 상세 패널 확인 | User opens details with map/weather/external links. | Partial: detail timeline exists, external data later |
| U | 사용자 추후 행동 | User saves, likes/dislikes, changes conditions, or checks alternatives. | Partial |
| V | 저장 / 마이페이지 확인 | User saves result to My Page. | Partial |
| W | 좋아요/싫어요 피드백 | User feedback affects future recommendations. | Later dummy |
| X | 기상 악화 대체 | User sees indoor-centered alternative itinerary. | Later dummy |

## Next Implementation Slice

This task should implement only the next focused slice.

### Slice 1. My Page Preference Re-selection

Current user problem:

- My Page shows the selected preference but does not let the user reselect it.
- The user asked for "선택 취향 초기화", but destructive reset is risky if the user cancels.

Chosen UX:

- Use the visible button text `취향 다시 고르기`.
- Do not delete `lovv.preference` immediately.
- Open a preference-selection UI using the existing onboarding card experience.
- Keep the current preference selected by default.
- Save only when the user clicks `이 취향으로 저장하기`.
- Provide `취소하고 마이페이지로 돌아가기`.
- On successful save, return to My Page and show a short success message.
- Updated preference should affect the next AI Planner flow.

### Slice 2. AI Planner Summary Cards

Current user problem:

- The AI Planner summary cards (`취향 반영 완료`, `소도시 후보 탐색`, `일정 초안 구성`) look too empty.
- Adding too much text would make the cards heavier than the chat.

Chosen UX:

- Keep the three-card structure.
- Each card contains:
  - title,
  - one short summary line,
  - maximum two chips.
- No card body should exceed two visual lines.
- Detailed reasons, candidate explanations, map/weather data, and full itinerary detail stay below the chat or in later result/detail slices.

Example content:

| Card | Summary line | Chips |
| --- | --- | --- |
| 취향 반영 완료 | `{cityPair} 감성으로 시작합니다.` | `#{theme}`, `#{pace or signal}` |
| 소도시 후보 탐색 | `취향에 맞는 후보를 먼저 좁히고 있어요.` | first city, second city |
| 일정 초안 구성 | Before ready: `기간과 축제 여부를 고르면 초안이 완성됩니다.` | `대기중` |
| 일정 초안 구성 | After ready: `{duration} · {festivalLabel}로 구성 중입니다.` | `초안 준비`, intensity |

## User Flow For Preference Re-selection

| Step | Screen/state | User action | System response | Completion condition |
| --- | --- | --- | --- | --- |
| 1 | My Page | User clicks `취향 다시 고르기`. | App opens preference edit mode. | Existing preference remains stored. |
| 2 | Preference edit | User sees current preference selected. | App renders existing onboarding cards in edit context. | User understands this is re-selection, not first onboarding. |
| 3 | Preference edit | User selects another card. | UI highlights the selected card and updates preview. | New pending preference is visible. |
| 4 | Preference edit | User clicks cancel. | App returns to My Page without storage change. | Old preference remains active. |
| 5 | Preference edit | User clicks `이 취향으로 저장하기`. | App writes `lovv.preference`, updates state, resets planner draft. | My Page shows the new preference and success notice. |
| 6 | Next AI Planner | User opens AI Planner after save. | Chat and summary cards use the new preference. | New preference is reflected in planner context. |

## Requirements

### R1. Full flow alignment

- THE system SHALL keep the A-X MVP flow as the baseline for future work.
- THE implementation SHALL not add isolated UI that contradicts the full flow.
- THE current task SHALL only implement preference re-selection and planner summary-card improvement.

### R2. Dummy backend boundary

- THE system SHALL mock any backend/API/DB/AI integration point in this task.
- THE system SHALL NOT call real OAuth, backend, map, weather, AI, or database services.
- THE system SHALL keep mock data boundaries easy to replace with future adapters.
- THE system SHALL not store tokens, credentials, private keys, or server-only configuration in client code.

### R3. My Page preference re-selection

- WHEN an authenticated user opens My Page, THE system SHALL show a `취향 다시 고르기` action near the selected preference.
- WHEN the user clicks `취향 다시 고르기`, THE system SHALL show the travel mood selection UI in edit mode.
- WHILE the user is in edit mode, THE system SHALL keep the previously saved preference unchanged until explicit save.
- WHEN the user cancels edit mode, THE system SHALL return to My Page with the old preference unchanged.
- WHEN the user saves a new preference, THE system SHALL update React state and `lovv.preference`.
- WHEN the user saves a new preference, THE system SHALL reset planner draft/chat context so the next AI Planner session starts from the new preference.
- WHEN save completes, THE system SHALL return to My Page and show a short success message.

### R4. Preference edit UI

- THE edit UI SHALL reuse the existing onboarding card style and data.
- THE edit UI SHALL use context-specific copy so it does not feel like first-entry onboarding.
- THE current saved preference SHALL be selected by default.
- THE save button SHALL be disabled only if there is no selected preference.
- THE edit UI SHALL provide a visible cancel action.
- THE UI SHALL remain responsive on desktop and mobile.

### R5. AI Planner summary cards

- THE AI Planner summary area SHALL continue to show the three steps: `취향 반영 완료`, `소도시 후보 탐색`, `일정 초안 구성`.
- EACH summary card SHALL include one short status line.
- EACH summary card SHALL include zero to two chips.
- EACH summary card SHALL avoid long paragraphs.
- WHEN festival/duration are not complete, THE schedule-draft card SHALL show a waiting state.
- WHEN festival/duration are complete, THE schedule-draft card SHALL show the selected duration and festival state.
- THE summary cards SHALL derive from current frontend state and dummy preference data only.

### R6. Accessibility and responsive behavior

- Buttons and cards SHALL have clear visible text or accessible names.
- Keyboard users SHALL be able to open preference edit mode, select a preference, cancel, and save.
- The edit UI and summary cards SHALL not overflow or overlap at mobile widths.
- Success feedback SHALL be visible and understandable.

## Acceptance Criteria

- GIVEN a user is logged in and has a saved preference, WHEN they open My Page, THEN they can see `취향 다시 고르기`.
- GIVEN the user clicks `취향 다시 고르기`, WHEN the edit UI opens, THEN the current preference is selected and localStorage is unchanged.
- GIVEN the user cancels, WHEN My Page returns, THEN the previous preference is still displayed.
- GIVEN the user selects a new preference and saves, WHEN My Page returns, THEN the new preference is displayed and `lovv.preference` contains the new `cityPair`.
- GIVEN the user opens AI Planner after changing preference, THEN initial chat copy, summary cards, and plan draft use the new preference.
- GIVEN the AI Planner first opens, THEN the three summary cards each contain a short summary and no oversized paragraphs.
- GIVEN the user selects festival and duration, THEN the `일정 초안 구성` card changes from waiting to ready state.
- GIVEN the implementation runs, THEN tests, lint, build, and a browser check pass or any unavailable check is reported.

## Data And State Design

### Existing state to reuse

| State/helper | Usage |
| --- | --- |
| `selectedPreference` | Source of current saved or pending preference. |
| `setSelectedPreference` | Updates selected preference. |
| `readStoredPreference()` | Reads `lovv.preference`. |
| `preferenceStorageKey` | Storage key for selected preference. |
| `preferences` | Static preference card/city/theme data. |
| `resetPlannerFlow()` | Resets chat/plan state for new planner sessions. |
| `festivalThemeChoice` | Determines planner card waiting/ready state. |
| `selectedDurationLabel` | Determines planner card waiting/ready state. |
| `planDraft` | Provides duration/intensity labels once ready. |

### New/updated state

| State | Type | Purpose |
| --- | --- | --- |
| `activeView` | add `'preferenceEdit'` | Shows re-selection UI without treating it as first onboarding. |
| `pendingPreference` | `Preference` or reuse `selectedPreference` carefully | Allows cancel without mutating saved preference. |
| `preferenceNotice` | `string \| null` | Shows save success on My Page. |
| `plannerSummaryCards` | derived array | Keeps summary cards declarative and small. |

Implementation may avoid a separate `pendingPreference` if it can keep cancel behavior safe. However, cancel must not persist or accidentally alter the saved preference shown elsewhere.

## UI Copy

Recommended labels:

| Context | Copy |
| --- | --- |
| My Page action | `취향 다시 고르기` |
| Preference edit title | `여행의 분위기를 다시 골라주세요` |
| Preference edit helper | `새 취향은 저장한 뒤 다음 AI 일정부터 반영됩니다.` |
| Save CTA | `이 취향으로 저장하기` |
| Cancel CTA | `취소하고 마이페이지로 돌아가기` |
| Success notice | `취향이 변경됐어요. 다음 AI 일정부터 반영됩니다.` |

## Task Breakdown

### Task 5.1: 전체 MVP User Flow Spec 확정

- Purpose: A-X 전체 플로우와 이번 구현 범위를 한 기준 문서로 확정한다.
- Scope: `docs/specs/TASK5_MVP_USER_FLOW_PREFERENCE_EDIT_PLANNER_SUMMARY_SPEC.md`.
- Dependencies: None.
- Acceptance Criteria:
  - 전체 A-X 흐름이 구현 상태와 함께 정리되어 있다.
  - dummy backend rule이 명시되어 있다.
  - 이번 구현 slice가 분리되어 있다.
- Verification:
  - `git diff --check`

### Task 5.2: 마이페이지 취향 다시 고르기

- Purpose: 사용자가 My Page에서 기존 취향을 안전하게 다시 선택할 수 있게 한다.
- Scope: `frontend/src/App.tsx`, `frontend/src/App.test.tsx`.
- Dependencies: Task 5.1.
- Acceptance Criteria:
  - My Page에 `취향 다시 고르기` 버튼이 있다.
  - 버튼 클릭 시 edit mode가 열린다.
  - 취소하면 기존 preference와 localStorage가 유지된다.
  - 저장하면 새 preference가 React state와 localStorage에 반영된다.
  - 저장 후 My Page로 돌아오고 성공 메시지가 보인다.
- Verification:
  - `cd frontend && npm test -- --run src/App.test.tsx`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
  - Browser check for My Page -> preference edit -> cancel/save.

### Task 5.3: AI Planner summary cards 보강

- Purpose: AI Planner 상단 3개 단계 카드가 비어 보이지 않도록 간결한 상태 요약을 제공한다.
- Scope: `frontend/src/App.tsx`, `frontend/src/App.test.tsx`.
- Dependencies: Task 5.2 can be independent, but should use the same preference state model.
- Acceptance Criteria:
  - 세 카드가 제목, 1줄 요약, 최대 2개 칩으로 구성된다.
  - duration/festival 선택 전에는 waiting state를 보여준다.
  - duration/festival 선택 후에는 ready state를 보여준다.
  - 카드가 모바일에서 과도하게 길어지지 않는다.
- Verification:
  - `cd frontend && npm test -- --run src/App.test.tsx`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
  - Browser check for initial planner and after selecting festival/duration.

### Task 5.4: Flow regression review

- Purpose: 이번 slice가 전체 MVP flow를 깨지 않는지 확인한다.
- Scope: Tests and manual browser verification only unless a bug is found.
- Dependencies: Task 5.2 and Task 5.3.
- Acceptance Criteria:
  - Auth -> onboarding -> home still works.
  - Returning user -> home still works.
  - Header still shows only `마이페이지` and `로그아웃`.
  - Chat entry still works after preference change.
  - No real backend/API calls were introduced.
- Verification:
  - `cd frontend && npm test`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
  - Browser smoke check.

## Risks

- `App.tsx` is already large. Adding another view can make it harder to maintain. If edits become hard to review, extract small helper render functions or components within the frontend scope.
- If `selectedPreference` is reused directly as pending edit state, cancel behavior can become incorrect. Verify cancel explicitly.
- If summary cards include too much text, they will compete with the chat. Keep the card content intentionally compact.
- If mock backend boundaries are not named clearly, later API integration will require broader refactoring.

## Approval Gate

Implementation should start only after this spec is reviewed and accepted. The first implementation step should be Task 5.2 unless the user asks to change the order.
