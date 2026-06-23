# TASK4 Auth, Chat Conditions, Plan Save, My Page, Review Spec

## Summary

Lovv 1차 MVP를 "로그인한 사용자가 취향을 고르고, AI 일정 챗봇에서 조건을 정리한 뒤, 생성된 일정을 상세로 확인하고 저장/좋아요/리뷰까지 남기는 웹앱" 흐름으로 확장한다.

현재 앱은 첫 진입 온보딩, 메인, AI 일정 챗봇, 챗봇 아래 일정 상세를 프론트엔드 상태와 `localStorage`로 구현하고 있다. 이번 Spec은 그 앞단에 Google 간편 로그인 게이트를 추가하고, 챗봇 안으로 여행 기간/축제 포함 여부 입력을 자연스럽게 옮기며, 생성 일정의 상세 보기, 좋아요, 마이페이지 저장, 별점 리뷰 기능을 MVP 목업 수준으로 연결한다.

실제 Google OAuth, 서버 세션, 데이터베이스 저장은 이번 프론트 MVP의 직접 구현 범위가 아니다. 다만 화면과 상태 모델은 나중에 백엔드 API로 교체할 수 있도록 명확한 데이터 단위로 설계한다.

## Goals

- 서비스 진입 전 Google 간편 로그인 화면을 먼저 보여준다.
- 로그인한 사용자만 온보딩, 메인, AI 일정 챗봇, 마이페이지에 접근할 수 있게 한다.
- 기존 온보딩 취향 선택 흐름은 로그인 이후에 실행한다.
- 챗봇에서 축제 포함 여부와 여행 기간을 대화형 입력으로 받는다.
- 추천된 일정은 챗봇 아래 상세 결과로 이어지고, 별도 세부 일정 화면으로 들어갈 수 있다.
- 사용자는 추천 일정에 좋아요를 남기고 마이페이지에 저장할 수 있다.
- 사용자는 저장한 여행에 대해 별점과 짧은 리뷰를 남길 수 있다.
- 모든 기능은 1차 MVP에서 React 상태와 `localStorage` 기반으로 동작한다.
- 기존 Lovv 컬러, 캐릭터, 온보딩 도시/테마 데이터, 버튼 hover 톤을 유지한다.

## Non-Goals

- 실제 Google OAuth 인증 플로우는 구현하지 않는다.
- 실제 회원 DB, 서버 세션, refresh token, access token 저장은 구현하지 않는다.
- 실제 AI API 호출, 실시간 장소 검색, 지도 API, 결제, 알림은 포함하지 않는다.
- 비회원 사용자에게 일정 생성/저장 기능을 제공하지 않는다.
- 전체 채팅 로그를 영구 저장하지 않는다.
- 리뷰 공개 피드, 신고, 댓글, 소셜 공유는 포함하지 않는다.
- 복수 기기 동기화는 포함하지 않는다.

## Users

- Google 계정으로 빠르게 Lovv를 시작하려는 신규 사용자.
- 여행 분위기를 먼저 고른 뒤 AI 일정 대화로 여행 조건을 좁히려는 사용자.
- 추천 일정을 저장하고 나중에 다시 확인하려는 사용자.
- 다녀온 여행에 별점과 짧은 후기를 남기려는 사용자.

## Assumptions

- 이번 구현은 프론트엔드 MVP이므로 Google 로그인은 실제 OAuth가 아니라 `Google로 시작하기` 버튼을 통한 mock session으로 처리한다.
- mock session은 `localStorage`에 최소 사용자 정보만 저장한다.
- 저장/좋아요/리뷰 데이터는 현재 브라우저에만 남는다.
- 실제 OAuth로 전환할 때는 백엔드 또는 인증 제공자 설정이 별도 Task로 필요하다.
- 현재 앱은 별도 라우터 없이 `activeView` state로 화면을 전환하므로, 이번 단계도 같은 패턴을 우선 따른다.

## User Flow

| 단계 | 화면 / 상태 | 사용자 행동 | 시스템 반응 | 완료 조건 |
| --- | --- | --- | --- | --- |
| 1 | 로그인 게이트 | 사용자가 웹앱에 접속한다. | `lovv.auth.user` 저장 여부를 확인한다. | 로그인 정보가 없으면 메인/온보딩보다 로그인 화면을 먼저 보여준다. |
| 2 | 로그인 게이트 | 사용자가 `Google로 시작하기`를 누른다. | mock user session을 저장한다. | 로그인 이후 저장된 취향이 없으면 온보딩으로 이동한다. |
| 3 | 온보딩 | 사용자가 여행 분위기 카드를 선택한다. | 선택 취향을 화면 상태에 반영한다. | 선택 카드와 커버 이미지가 명확히 표시된다. |
| 4 | 온보딩 | 사용자가 `이 취향으로 Lovv 시작하기`를 누른다. | `lovv.preference`에 선택 취향을 저장한다. | 메인 화면으로 이동한다. |
| 5 | 메인 | 사용자가 `AI 일정 짜기`를 누른다. | 챗봇 워크스페이스로 이동한다. | 챗봇이 선택 취향 기반으로 시작된다. |
| 6 | 챗봇 | 사용자가 축제 포함 여부를 선택한다. | 선택값을 사용자 말풍선과 일정 조건에 반영한다. | 대화창 안에서 `축제 포함` 또는 `축제 제외`가 선택된 흐름으로 보인다. |
| 7 | 챗봇 | 사용자가 여행 기간을 선택한다. | 선택값을 사용자 말풍선과 일정 초안에 반영한다. | 일정 제목과 조건 칩이 선택 기간에 맞게 갱신된다. |
| 8 | 챗봇 | 사용자가 추가 조건을 입력한다. | deterministic assistant 응답과 일정 초안을 갱신한다. | 챗봇 아래에 생성 일정 상세가 이어진다. |
| 9 | 일정 결과 | 사용자가 `세부 일정 보기`를 누른다. | 세부 일정 화면으로 전환한다. | 시간대별 상세, 추천 이유, 이동 힌트가 보인다. |
| 10 | 세부 일정 | 사용자가 좋아요를 누른다. | 해당 일정의 like 상태를 저장/토글한다. | 좋아요 상태가 즉시 UI에 반영된다. |
| 11 | 세부 일정 | 사용자가 `마이페이지에 저장`을 누른다. | 해당 일정을 저장 목록에 추가한다. | 저장 완료 상태와 마이페이지 진입 경로가 보인다. |
| 12 | 마이페이지 | 사용자가 저장한 일정을 확인한다. | `lovv.savedPlans`를 읽어 목록을 표시한다. | 저장된 일정이 카드 목록으로 보인다. |
| 13 | 마이페이지 | 사용자가 저장된 일정에 리뷰를 남긴다. | 별점과 짧은 후기를 저장한다. | 리뷰가 해당 일정과 마이페이지 리뷰 목록에 표시된다. |
| 14 | 로그아웃 | 사용자가 로그아웃한다. | mock user session을 제거한다. | 로그인 게이트로 돌아간다. 취향/저장 데이터 삭제 여부는 별도 액션으로 분리한다. |

## Requirements

### R1. Auth Gate

- WHEN the app loads and no `lovv.auth.user` exists, THE system SHALL show the Google login gate before onboarding or main.
- WHEN the user clicks `Google로 시작하기`, THE system SHALL create a mock authenticated user with id, name, email, and avatar initial.
- WHEN login succeeds, THE system SHALL route users with no valid `lovv.preference` to onboarding.
- WHEN login succeeds and a valid `lovv.preference` exists, THE system SHALL route users to home.
- WHEN the user logs out, THE system SHALL remove only the mock auth session and show the login gate.

### R2. Onboarding After Login

- WHEN a newly logged-in user has no selected preference, THE system SHALL show the existing onboarding page.
- WHEN the user completes onboarding, THE system SHALL store the selected `cityPair` in `lovv.preference`.
- THE onboarding UI SHALL keep the current Korean-first theme order and city cover behavior.

### R3. Chat Condition Prompts

- WHEN the chat workspace opens, THE assistant SHALL ask for festival inclusion and travel duration inside the conversation area.
- THE festival choices SHALL be `축제 포함` and `축제 제외`.
- THE duration choices SHALL be `당일치기`, `1박 2일`, `2박 3일`, `3박 4일`, `4박 5일`.
- WHEN a festival or duration chip is selected, THE system SHALL append it as a user message.
- WHEN a chip is selected, THE assistant SHALL respond with a short confirmation and update the current plan draft.
- THE festival and duration controls SHALL NOT appear as disconnected controls outside the chat conversation.

### R4. Generated Plan Result

- WHEN required chat conditions are selected or a freeform message is submitted, THE system SHALL show a generated plan result below the chat panel.
- THE generated result SHALL include title, selected preference, duration, festival choice, intensity, summary, and at least three stops.
- THE generated result SHALL include `세부 일정 보기`, `좋아요`, and `마이페이지에 저장` actions.
- THE generated result SHALL include a dedicated save CTA block below the itinerary preview, inspired by Triple's result flow: a short emotional heading, helper copy, a full-width primary save button, and secondary actions.
- WHEN the user clicks `좋아요`, THE system SHALL toggle the current plan in liked state.
- WHEN the user clicks `마이페이지에 저장`, THE system SHALL add the current plan to saved plans without duplicating the same plan id.

### R5. Plan Detail View

- WHEN the user clicks `세부 일정 보기`, THE system SHALL show a plan detail view for the selected generated plan.
- THE plan detail view SHALL include the plan title, duration, selected city pair, festival choice, summary, timeline stops, movement hints, recommendation reasons, like action, and save action.
- THE user SHALL be able to return to the chat workspace or go to My Page from the detail view.

### R6. My Page

- WHEN the authenticated user opens My Page, THE system SHALL show user profile summary, saved plans, liked plans, and reviews.
- WHEN no saved plans exist, THE system SHALL show an empty state with a path back to AI planning.
- WHEN saved plans exist, THE system SHALL show plan cards with title, duration, selected theme, saved date, and review action.
- WHEN liked plans exist, THE system SHALL show liked plan cards or liked state within saved plan cards.

### R7. Review

- WHEN the user opens review entry for a saved plan, THE system SHALL show a rating control from 1 to 5 stars and a short text input.
- WHEN the user submits a review with no rating, THE system SHALL block submission and show a clear validation message.
- WHEN the user submits a valid rating, THE system SHALL store the review linked to the plan id.
- WHEN the user has already reviewed a plan, THE system SHALL allow editing the existing review instead of creating duplicates.
- THE review text SHALL be optional in MVP, but rating SHALL be required.

### R8. Persistence And Privacy

- THE system SHALL store mock auth session in `lovv.auth.user`.
- THE system SHALL store selected preference in `lovv.preference`.
- THE system SHALL store saved plans in `lovv.savedPlans`.
- THE system SHALL store liked plan ids in `lovv.likedPlanIds`.
- THE system SHALL store reviews in `lovv.reviews`.
- THE system SHALL NOT persist full chat transcripts.
- THE system SHALL NOT store real Google tokens, OAuth credentials, secrets, or environment values.
- IF any stored JSON is invalid, THE system SHALL ignore the invalid value and fall back to a safe empty state.

### R9. Responsiveness And Accessibility

- THE login, onboarding, home, chat, plan detail, and my page views SHALL be usable on desktop and mobile.
- Interactive controls SHALL use accessible names through visible text or `aria-label`.
- Chat chips, save buttons, like buttons, review stars, and navigation buttons SHALL be keyboard reachable.
- Text inside cards, buttons, and chips SHALL not overlap or overflow in common mobile widths.

## Data Model

```ts
type LovvUser = {
  id: string
  name: string
  email: string
  avatarInitial: string
}

type TripCondition = {
  durationLabel: '당일치기' | '1박 2일' | '2박 3일' | '3박 4일' | '4박 5일'
  festivalThemeChoice: 'include' | 'exclude' | 'undecided'
  freeformNote?: string
}

type SavedPlan = {
  id: string
  ownerId: string
  title: string
  cityPair: string
  themeTag: string
  durationLabel: string
  festivalThemeLabel: string
  intensityLabel: string
  summary: string
  stops: PlanStop[]
  createdAt: string
  savedAt: string
}

type PlanReview = {
  id: string
  planId: string
  ownerId: string
  rating: 1 | 2 | 3 | 4 | 5
  content: string
  updatedAt: string
}
```

## Storage Keys

| Key | Value | Notes |
| --- | --- | --- |
| `lovv.auth.user` | `LovvUser` | Mock Google login session only. |
| `lovv.preference` | `{ cityPair: string }` | Existing preference storage. |
| `lovv.savedPlans` | `SavedPlan[]` | Current browser only. |
| `lovv.likedPlanIds` | `string[]` | Plan ids liked by current mock user. |
| `lovv.reviews` | `PlanReview[]` | One review per plan per mock user. |

## Design

### Existing Context

The current app is a single React entry with view state in `src/App.tsx`. It already supports:

- first-entry onboarding before main;
- selected preference persistence through `lovv.preference`;
- main landing UI;
- chat workspace;
- festival and duration chips;
- generated schedule detail below chat;
- deterministic plan draft generation.

The next implementation should avoid adding another large, tangled block to `App.tsx` if the file becomes difficult to review. Small helpers and view components are allowed when they reduce actual complexity.

### Recommended File Structure

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Top-level view orchestration and shared state wiring. |
| `src/data/preferences.ts` | Preference data and lookup helpers if extracted. |
| `src/lib/storage.ts` | Safe `localStorage` read/write helpers. |
| `src/lib/plans.ts` | Deterministic plan creation, save/like/review helpers. |
| `src/components/AuthGate.tsx` | Login gate UI. |
| `src/components/ChatPlannerView.tsx` | Chat condition prompts and generated result. |
| `src/components/PlanDetailView.tsx` | Plan detail screen. |
| `src/components/MyPageView.tsx` | Saved plans, liked plans, reviews. |
| `src/App.test.tsx` | MVP behavior tests. Component tests may be split later if needed. |

Extraction is not mandatory for every file above in the first implementation pass, but new logic should be shaped so it can move there cleanly.

### View State

Suggested view union:

```ts
type View = 'auth' | 'onboarding' | 'home' | 'chat' | 'planDetail' | 'myPage'
```

Startup decision:

1. no valid auth user -> `auth`;
2. auth user exists but no valid preference -> `onboarding`;
3. auth user and preference exist -> `home`.

### Chat Prompt Design

The festival and duration choices should read as part of the assistant's conversation, not as detached controls. A practical layout:

- assistant bubble: "축제를 일정에 포함할까요?"
- inline chips directly beneath that bubble: `축제 포함`, `축제 제외`;
- assistant bubble after selection: "좋아요. 여행 기간도 골라주세요."
- inline chips: `당일치기` through `4박 5일`;
- freeform input remains at the bottom for additional conditions.

Selecting a chip appends a user message and updates plan draft state.

### Plan Actions

The generated plan result and plan detail view share the same actions:

- `좋아요`: toggles `plan.id` in `lovv.likedPlanIds`;
- `마이페이지에 저장`: writes the full lightweight plan into `lovv.savedPlans`;
- `세부 일정 보기`: opens `planDetail` for current plan.

Duplicate saves should update the existing saved plan by id or show saved state; they should not create repeated cards.

### Save CTA Pattern

The schedule save action should be presented as a focused block after the generated itinerary content, not only as a small inline button. The recommended MVP pattern is:

- visual cue: heart or save icon;
- heading: `추천 일정이 마음에 드세요?`;
- helper copy: `담은 일정은 마이페이지에서 다시 확인하고 리뷰를 남길 수 있어요.`;
- primary full-width action: `마이페이지에 저장`;
- secondary actions: `새로운 추천받기`, `다시하기`.

After the plan is saved, the primary action should change to a saved state such as `마이페이지에 저장됨`, and a short note should tell the user that the saved plan can be checked from My Page. This gives the save moment enough weight and makes the next actions clear.

### My Page Design

My Page should feel like a webapp workspace, not a marketing page:

- top profile strip with mock Google user info;
- saved plans section;
- liked plans section;
- reviews section;
- empty states with direct actions back to AI planning.

The review form can be inline inside a saved plan card or a small focused panel. MVP should prefer the simpler inline panel unless the layout becomes crowded.

## Acceptance Criteria

- App first load with empty storage shows Google login gate, not onboarding.
- Clicking `Google로 시작하기` stores a mock user and then shows onboarding if preference is missing.
- Completing onboarding routes to home.
- Returning authenticated users with preference skip login and onboarding.
- Logging out removes auth session and returns to login gate.
- Chat workspace shows festival and duration choices inside the chat conversation.
- Selecting festival/duration chips appends user messages and updates generated plan detail.
- Generated plan result exposes `세부 일정 보기`, `좋아요`, and `마이페이지에 저장`.
- Generated plan result includes a save CTA block with `추천 일정이 마음에 드세요?`, helper copy, primary save button, and secondary actions.
- Liked state persists after navigating between chat, detail, and my page.
- Saved plan appears in My Page without duplicate entries for repeated save.
- Plan detail view shows timeline stops and action buttons.
- Review requires a 1-5 star rating and stores one review per saved plan.
- My Page shows saved plans, liked plans, and reviews with empty states.
- Full chat transcript is not stored in `localStorage`.
- Invalid storage data does not crash the app.
- `npm test`, `npm run lint`, and `npm run build` pass.

## Constraints

- Tech stack remains React, TypeScript, Tailwind CSS, Vite, Vitest.
- Keep work inside `/Users/jeonjonghyeok/Lovv-pg`.
- Do not add backend, OAuth SDK, map SDK, AI SDK, or global dependencies for this MVP task.
- Do not hardcode secrets or read real `.env` values.
- Preserve current Lovv visual identity, color palette, character, and city image assets.
- Keep commits small and Conventional Commits compliant.
- Do not stage `.superpowers/`, `dist/`, `node_modules/`, or local/generated cache files.

## Risks

- Mock Google login can look like real auth if not labeled carefully in code/docs; product copy can say `Google로 시작하기`, but implementation must not imply secure OAuth.
- `localStorage` persistence is browser-local and not secure. It is acceptable for MVP mock but not production user data.
- `src/App.tsx` is already large. Adding all features in one file will make review and iteration slower.
- Review UX can crowd My Page if saved plan cards contain too many controls. The first pass should keep the review form compact.
- If actual Google OAuth is later required, auth flow, environment variables, redirect handling, and backend verification need a separate security-sensitive Spec.

## Task Breakdown

### Task 4.1: Auth gate and mock user session

- Purpose: 서비스 진입 전 Google 간편 로그인 흐름을 만든다.
- Scope: `auth` view, mock user storage, logout, startup routing.
- Dependencies: Existing onboarding/home startup behavior.
- Context Budget: Must read `src/App.tsx`, `src/App.test.tsx`, this Spec. Do not read `.superpowers/`, `dist/`, `node_modules/`.
- Acceptance Criteria: Empty storage shows login gate; login routes to onboarding/home correctly; logout returns to login.
- Verification: `npm test`, `npm run lint`, `npm run build`.

### Task 4.2: Chat condition prompts inside conversation

- Purpose: 축제 포함 여부와 여행 기간 선택을 채팅창 안의 대화형 플로우로 옮긴다.
- Scope: chat message model, festival chips, duration chips, assistant confirmations, plan draft updates.
- Dependencies: Task 4.1.
- Context Budget: Must read chat-related sections in `src/App.tsx`, existing chat tests, this Spec.
- Acceptance Criteria: Chips are shown inside chat flow; selecting chips appends user messages; detached footer controls are removed.
- Verification: `npm test`, manual desktop/mobile chat check.

### Task 4.3: Generated plan actions

- Purpose: 추천 일정에 세부 보기, 좋아요, 저장 액션을 추가한다.
- Scope: current generated plan result, Triple-like save CTA block, liked state, saved plan write helper, duplicate prevention.
- Dependencies: Task 4.2.
- Context Budget: Must read plan draft helper and generated detail UI sections.
- Acceptance Criteria: Like toggles; save CTA appears below the itinerary result; save persists; repeated save does not duplicate; actions are accessible.
- Verification: `npm test`, `npm run lint`.

### Task 4.4: Plan detail view

- Purpose: 추천 일정을 별도 세부 일정 화면에서 확인할 수 있게 한다.
- Scope: `planDetail` view, selected plan state, return navigation, shared like/save actions.
- Dependencies: Task 4.3.
- Context Budget: Must read generated result UI and plan data model.
- Acceptance Criteria: Detail view shows title, conditions, timeline, reasons, like/save actions, back navigation.
- Verification: `npm test`, desktop/mobile manual check.

### Task 4.5: My Page saved and liked plans

- Purpose: 저장한 일정과 좋아요한 일정을 사용자 공간에서 확인한다.
- Scope: `myPage` view, profile summary, saved plan list, liked plan list, empty states.
- Dependencies: Task 4.3.
- Context Budget: Must read auth/session helper and saved/liked storage helpers.
- Acceptance Criteria: Saved plan appears; liked state appears; empty states guide back to AI planning.
- Verification: `npm test`, `npm run lint`, manual navigation check.

### Task 4.6: Star rating review

- Purpose: 저장한 여행에 별점 리뷰를 남기고 마이페이지에서 확인한다.
- Scope: review form, rating validation, one review per plan, edit existing review.
- Dependencies: Task 4.5.
- Context Budget: Must read My Page view and review storage helper.
- Acceptance Criteria: Rating required; optional text stored; existing review updates instead of duplicating.
- Verification: `npm test`, manual keyboard/accessibility check for rating controls.

### Task 4.7: Final responsive and privacy verification

- Purpose: 기능 연결 후 모바일/데스크톱 UI와 저장 데이터 범위를 검증한다.
- Scope: visual QA, storage inspection, regression tests, cleanup.
- Dependencies: Tasks 4.1 through 4.6.
- Context Budget: Must read changed files only, test output, this Spec acceptance criteria.
- Acceptance Criteria: No text overlap; no full chat transcript stored; invalid storage fallback works; `.superpowers/` remains unstaged.
- Verification: `npm test`, `npm run lint`, `npm run build`, browser check at desktop and mobile widths.

## Approval Needed

Implementation should not start until this Spec is reviewed. The main product decision to confirm is whether the first implementation should remain a front-end mock Google session, or whether actual Google OAuth should be planned as a separate backend/authentication Task before UI work continues.
