# 국내 도시 변경 destination 메타데이터 일관성 설계

## 배경

PR #21 리뷰에서 전체 도시 변경 후 새 `destinationId`와 이름만 별도 상태에 저장되고, 후속 요청과 저장 payload의 `country`·`region`은 기존 `plannerCityContext`에서 가져오는 문제가 확인됐다. 예를 들어 아산에서 동해로 변경하면 새 ID·이름에 기존 지역 `충남`이 결합될 수 있다.

Lovv의 현재 서비스 범위는 한국 도시뿐이며 Agent도 일본 도시를 반환하지 않는다. 따라서 국가 간 변경 방어 로직은 이번 범위에 포함하지 않는다.

## 목표

- 국내 도시 전체 변경 후 destination ID·이름·국가·지역을 하나의 상태 단위로 유지한다.
- 후속 일정 수정 요청이 새 도시 ID와 `country: KR`을 사용한다.
- 백엔드 저장 payload가 새 도시의 ID·이름·지역을 일관되게 사용한다.
- 응답에 새 지역이 없을 때 기존 도시의 지역을 섞지 않는다.

## 비목표

- 일본 또는 기타 국가 도시 지원
- Agent 응답의 국가 범위 검증·거절 로직
- 백엔드 API 계약 변경
- 도시 카탈로그 재조회나 destination ID 기반 지역 추론

## 설계

### 원자적 destination override

`usePlanner`의 생성 결과 destination 상태를 다음 단위로 관리한다.

```ts
type GeneratedPlanDestination = {
  destinationId: string
  name: string
  country: 'KR'
  region?: string
}
```

Agent 응답에 destination ID와 표시 이름이 있으면 전체 일정 변경 시 객체 전체를 한 번에 갱신한다. `country`는 한국 전용 서비스 규칙에 따라 `KR`로 정규화한다. `region`은 응답에 있는 경우에만 저장한다.

### fallback 규칙

- override가 없으면 기존 `plannerCityContext`를 사용한다.
- override가 있으면 ID·이름·국가·지역을 override에서만 사용한다.
- override의 region이 없으면 기존 도시 region으로 fallback하지 않고 저장 payload에서 생략한다.
- 일부 필드만 새 도시, 일부 필드는 기존 도시에서 가져오는 조합은 허용하지 않는다.

### 소비 지점

- 상세 화면 destination 이름과 ID
- 후속 `modify` 추천 요청의 `destinationId`와 `country`
- 생성 일정 저장 payload의 `destination`
- 로컬 저장 일정의 `destinationId`와 `cityPair`
- 조건 snapshot의 `cityId`

기존 외부 반환 필드가 다른 컴포넌트에서 사용된다면 호환 가능한 파생 값으로 유지하되, 내부 source of truth는 override 객체 하나로 제한한다.

## 테스트

기존 `App.test.tsx` 도시 교체 회귀 테스트를 아산(KR/충남) → 동해(KR/강원) 시나리오로 강화한다.

- 도시 변경 후 상세 화면은 동해를 표시한다.
- 후속 modify 요청은 `destinationId: KR-Donghae`, `country: KR`을 보낸다.
- API 인증 모드의 `requestCreateSavedPlan` payload destination은 `{ destinationId: KR-Donghae, name: 동해시, country: KR, region: 강원 }`이다.
- 지역이 없는 새 국내 도시 응답에서는 저장 payload에 기존 `충남`이 포함되지 않는다.

관련 테스트 통과 후 전체 Vitest, lint, production build, 기존 Chromium E2E를 실행한다.

## 보안 및 호환성

- 사용자 입력 렌더링이나 인증·권한 로직은 변경하지 않는다.
- 실제 API 키·토큰·환경 변수는 다루지 않는다.
- 요청/응답 스키마는 기존 optional `country`·`region` 필드를 그대로 사용한다.
