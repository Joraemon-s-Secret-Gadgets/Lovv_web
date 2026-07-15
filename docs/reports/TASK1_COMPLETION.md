# TASK1 Completion: 세부 일정 수정 채팅 기록 및 도시 변경 반영

## Completion

- Completed at: 2026-07-15T21:45:38+09:00
- Responsible agent: Main Codex (Implementation Agent / Review Agent)
- Working branch: `codex/fix-modification-chat-history`
- Implementation commit: `ea29538`

## Spec Alignment

- [x] 연속된 수정 요청을 user 메시지로 누적한다.
- [x] 후보, 적용 성공, 입력 거절, API 실패를 assistant 메시지로 누적한다.
- [x] 챗봇을 닫았다 다시 열어도 현재 상세 화면 세션의 기록을 유지한다.
- [x] 전체 도시 변경 응답의 itinerary와 destination 이름/ID를 함께 반영한다.
- [x] 후속 수정 요청과 저장 데이터가 변경된 destination을 사용한다.
- [x] 백엔드 및 추천 API 계약은 변경하지 않는다.

## Changed Files and Implementation Summary

- `frontend/src/features/planner/PlanDetailView.tsx`
  - user/assistant 로컬 메시지 추가 helper를 도입했다.
  - 수정 후보, 성공, 거절, 실패 결과를 채팅 기록과 안내 문구에 함께 반영한다.
  - 최근 대화 영역에 접근 가능한 group 역할을 추가했다.
- `frontend/src/features/planner/PlanDetailView.test.tsx`
  - 연속 수정, 닫기/재열기, 지원하지 않는 요청, API 실패 누적 회귀 테스트를 추가했다.
- `frontend/src/features/planner/usePlanner.ts`
  - 전체 일정 변경 응답의 destination을 활성 생성 일정 상태에 반영한다.
  - 후속 수정 요청과 저장 payload에서 변경된 destination을 우선한다.
- `frontend/src/App.tsx`
  - 상세 화면과 플래너에 변경된 destination 이름/ID를 우선 전달한다.
- `frontend/src/App.test.tsx`
  - 도시 변경 후 화면, 후속 수정 요청, 로컬 저장 destination을 검증한다.
- `frontend/e2e/lovv-v2-itinerary.e2e.ts`
  - 실제 Chromium에서 수정 요청·응답 누적과 챗봇 닫기/재열기 후 기록 유지를 검증한다.

## Test and Verification Results

- `npm test -- src/features/planner/PlanDetailView.test.tsx`: 6 passed.
- `npm test -- src/App.test.tsx -t "applies a city replacement destination"`: 1 passed.
- `npm test`: 33 files, 349 tests passed.
- `npm run test:e2e`: Chromium 1 scenario passed. 로그인, 일정 생성, 수정 적용, 연속 기록 누적, 닫기/재열기, 저장, 재열람을 검증했다.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Security review: no Blocker findings. 사용자 입력은 React 텍스트로 렌더링되며 HTML 삽입, 로그, 토큰, 신규 외부 저장은 추가하지 않았다.
- Existing non-blocking warnings: jsdom `Window.scrollTo()` 미구현 경고와 Vite 500 kB 초과 청크 경고.

## Remaining Risks and User Confirmation

- 수정 채팅 기록은 의도대로 현재 상세 화면 컴포넌트 세션 동안만 유지되며 새로고침 후에는 보존하지 않는다.
- 실제 AgentCore/AWS 환경의 종단 간 수동 확인은 로컬 자격 증명과 배포 환경 없이 수행하지 않았다.
- 개인 fork `main` 푸시 및 Organization PR은 TASK2이며 사용자 확인 후 수행한다.
- AWS S3 서울 리전 배포는 사용자가 다음 날 직접 진행하기로 하여 범위에서 제외했다.

## 추가 보완: 위시리스트 검색 및 데스크톱 레이아웃

- 추가 완료 시각: 2026-07-15T23:47:00+09:00
- 구현 커밋:
  - `97a2f7d fix(planner): expand wishlist search candidates`
  - `72da7cd fix(planner): prevent wishlist cards from clipping`
- Kakao Places 검색 후보를 최대 5개에서 10개로 확대했다.
- 노트북·PC에서 위시리스트 패널 높이를 400px로 확보하고 목록은 최대 300px 이후 내부 스크롤되도록 했다.
- 카드 축소를 방지하고 긴 주소를 두 줄로 제한해 이미지·전화·링크·위치 선택·제거 버튼이 잘리지 않도록 했다.
- 데스크톱 지도 최소 높이는 220px로 조정하고 모바일·태블릿의 280px 최소 높이는 유지했다.
- `npm test`: 34개 파일, 351개 테스트 통과.
- `npm run lint`: 통과.
- `npm run build`: 통과. 기존 대형 번들 경고만 존재.
- `npm run test:e2e`: Chromium 1개 시나리오 통과.
  - 검색 후보 10개 노출과 장소 선택을 검증했다.
  - 1366x768 및 1440x900에서 패널 높이 400px, 카드와 버튼 가시성, 패널 하단의 뷰포트 경계를 검증했다.
- 실제 Kakao 키는 사용하거나 기록하지 않았으며 E2E에는 `e2e-test-key` 더미 값만 사용했다.

## PR #21 리뷰 반영: 도시 변경 메타데이터 일관성

- 리뷰 반영 시각: 2026-07-16T00:26:00+09:00
- 전체 도시 변경 후 `destinationId`/이름만 바뀌고 국가/권역은 이전 도시에서 가져오던 문제를 수정했다.
- 생성된 목적지를 `{ destinationId, name, country: 'KR', region? }` 단일 객체로 관리해 저장과 후속 수정 요청이 같은 메타데이터를 사용한다.
- 새 응답에 `region`이 없으면 이전 도시의 `region`을 섞지 않고 생략한다.
- 한국 전용 서비스 범위에 맞춰 생성 목적지의 `country`는 `KR`로 정규화했으며 일본 도시 분기는 추가하지 않았다.
- 회귀 테스트는 아산(`KR`/충남) → 동해(`KR`/강원) 변경과 `region` 누락 응답을 검증한다.
- `npm test`: 34개 파일, 353개 테스트 통과.
- `npm run lint`: 경고 및 오류 없이 통과.
- `npm run build`: 통과. 기존 500 kB 초과 청크 경고만 존재.
- `npm run test:e2e`: Chromium 1개 시나리오 통과. 정적 API fallback 404 로그는 의도된 테스트 환경 동작이다.
- `git diff --check`: 통과.
- 보안 리뷰: 신규 시크릿, 토큰, 로그, HTML 삽입, 외부 저장소 변경 없음. 저장 API payload의 도시 메타데이터 일관성을 강화했다.
