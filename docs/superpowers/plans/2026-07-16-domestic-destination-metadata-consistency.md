# Domestic Destination Metadata Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국내 도시 전체 변경 후 새 destination의 ID·이름·국가·지역이 후속 수정 요청과 저장 payload에서 일관되게 사용되도록 한다.

**Architecture:** `usePlanner` 내부에 `{ destinationId, name, country: 'KR', region? }` 형태의 단일 generated destination override 상태를 둔다. 기존 이름·ID 소비자는 객체에서 파생한 호환 값을 사용하고, override가 존재하면 저장·후속 수정에서 기존 `plannerCityContext`의 메타데이터를 섞지 않는다.

**Tech Stack:** React 19, TypeScript 6, TanStack Query, Vitest 4, Testing Library

## Global Constraints

- 서비스 범위는 한국 도시뿐이며 국가 간 변경 방어 로직은 추가하지 않는다.
- Agent 응답의 `country`는 국내 서비스 규칙에 따라 `KR`로 정규화한다.
- 새 응답에 `region`이 없으면 기존 도시 region으로 fallback하지 않는다.
- 백엔드 추천·저장 API 계약은 변경하지 않는다.
- 실제 키·토큰·환경 변수는 코드와 테스트에 포함하지 않는다.
- 관련 테스트가 실패하는 것을 확인하기 전 production code를 변경하지 않는다.

---

### Task 1: Keep domestic destination metadata atomic

**Files:**
- Modify: `frontend/src/App.test.tsx` inside `applies a city replacement destination...`
- Modify: `frontend/src/features/planner/usePlanner.test.ts`
- Modify: `frontend/src/features/planner/usePlanner.ts:250-370, 490-535, 570-605, 1031-1115, 1240-1580, 1715-1735`
- Modify: `docs/reports/TASK1_COMPLETION.md`

**Interfaces:**
- Consumes: `RecommendationApiResponse['destination']` with optional `destinationId`, `cityId`, `name`, `country`, `region`.
- Produces: internal `GeneratedPlanDestination` and existing public derived values `generatedPlanDestinationName`, `generatedPlanDestinationId`.
- Preserves: `requestCreateRecommendation(payload, options)` and `requestCreateSavedPlan(payload, options)` API signatures.

- [ ] **Step 1: Strengthen the API-mode domestic city replacement test**

Update the existing App integration test to restore an authenticated API session and return a backend save result:

```tsx
vi.stubEnv('VITE_LOVV_AUTH_MODE', 'api')
vi.mocked(requestAuthSession).mockResolvedValue(restoredGoogleAuthState)
vi.mocked(requestCreateSavedPlan).mockResolvedValue({
  itineraryId: 'saved-donghae-plan',
  sourceRecommendationId: 'city-replacement-recommendation',
  savedAt: '2026-07-16T00:00:00Z',
  duplicate: false,
})
```

After applying the Asan (`KR/충남`) to Donghae (`KR/강원`) replacement, save and assert the backend payload:

```tsx
await waitFor(() => {
  expect(requestCreateSavedPlan).toHaveBeenCalledWith(
    expect.objectContaining({
      destination: {
        destinationId: 'KR-Donghae',
        name: '동해시',
        country: 'KR',
        region: '강원',
      },
    }),
    { accessToken: 'restored-access-token' },
  )
})
```

Keep the following modification assertion and add `country: 'KR'`:

```tsx
expect(requestCreateRecommendation).toHaveBeenLastCalledWith(
  expect.objectContaining({
    entryType: 'modify',
    destinationId: 'KR-Donghae',
    country: 'KR',
  }),
  expect.anything(),
)
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
cd frontend
npm test -- src/App.test.tsx -t "applies a city replacement destination"
```

Expected: FAIL because the save payload still contains the original Asan region (`충남`) instead of `강원`.

- [ ] **Step 3: Introduce the atomic generated destination state**

In `usePlanner.ts`, define:

```ts
type GeneratedPlanDestination = {
  destinationId: string
  name: string
  country: 'KR'
  region?: string
}
```

Replace the two source-of-truth states with:

```ts
const [generatedPlanDestination, setGeneratedPlanDestination] =
  useState<GeneratedPlanDestination | null>(null)
const generatedPlanDestinationName = generatedPlanDestination?.name ?? null
const generatedPlanDestinationId = generatedPlanDestination?.destinationId ?? null
```

Add this focused mapper. It must not accept a previous region, so it cannot accidentally copy metadata from the old city:

```ts
export const createGeneratedPlanDestination = (
  destination: RecommendationApiResponse['destination'],
  fallbackName?: string,
): GeneratedPlanDestination | null => {
  const destinationId = destination?.cityId?.trim() || destination?.destinationId?.trim()
  const name = resolveSmallCityDisplayName(destination?.name, destinationId, fallbackName)

  if (!destinationId || !name) {
    return null
  }

  const region = destination?.region?.trim()

  return {
    destinationId,
    name,
    country: 'KR',
    ...(region ? { region } : {}),
  }
}
```

- [ ] **Step 4: Update every generated destination write atomically**

For initial generation, clarification, selected-city generation, fallback, and whole-plan modification, replace separate name/ID setters with one `setGeneratedPlanDestination(...)` call. For a whole-plan replacement, build the object only from the current response destination:

```ts
const responseDestination = createGeneratedPlanDestination(response.destination)
if (responseDestination) {
  setGeneratedPlanDestination(responseDestination)
}
```

For fallback based on an existing planner city, explicitly construct all known domestic fields:

```ts
setGeneratedPlanDestination({
  destinationId: plannerCityContext.cityId,
  name: plannerCityContext.cityName,
  country: 'KR',
  region: plannerCityContext.region,
})
```

- [ ] **Step 5: Use one metadata source in modify and save payloads**

When override exists, use it exclusively:

```ts
const destination = generatedPlanDestination ?? {
  destinationId: plannerCityContext?.agentCoreId ?? plannerCityContext?.cityId ?? sourceRecommendationId,
  name: plannerCityContext?.cityName ?? plannerBasisLabel,
  country: 'KR' as const,
  ...(plannerCityContext?.region ? { region: plannerCityContext.region } : {}),
}
```

Build `SavedPlanApiCreatePayload.destination` from this object. For a subsequent modify request use:

```ts
destinationId: generatedPlanDestination?.destinationId ?? plannerCityContext?.cityId ?? undefined,
country: generatedPlanDestination?.country ?? plannerCityContext?.country ?? 'KR',
```

Do not fall back from `generatedPlanDestination.region` to `plannerCityContext.region` when the override exists.

- [ ] **Step 6: Add missing-region mapper regression coverage**

In `usePlanner.test.ts`, import `createGeneratedPlanDestination` and add:

```ts
it('does not copy a previous region when replacement metadata omits region', () => {
  expect(createGeneratedPlanDestination({
    destinationId: 'KR-Sokcho',
    name: '속초시',
    country: 'KR',
  }, '아산')).toEqual({
    destinationId: 'KR-Sokcho',
    name: '속초시',
    country: 'KR',
  })
})
```

- [ ] **Step 7: Run targeted tests and verify GREEN**

Run:

```powershell
npm test -- src/features/planner/usePlanner.test.ts src/App.test.tsx -t "destination metadata|applies a city replacement destination|does not copy a previous region"
```

Expected: all selected tests pass; backend save payload and following modify request contain consistent Donghae metadata.

- [ ] **Step 8: Run full verification**

Run:

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
```

Expected: all commands exit 0. The existing E2E Small City static fallback logs may appear without failing the scenario.

- [ ] **Step 9: Record the review fix and commit**

Append the P1 review correction and fresh verification results to `docs/reports/TASK1_COMPLETION.md`, then run:

```powershell
git add frontend/src/features/planner/usePlanner.ts frontend/src/features/planner/usePlanner.test.ts frontend/src/App.test.tsx docs/reports/TASK1_COMPLETION.md docs/superpowers/plans/2026-07-16-domestic-destination-metadata-consistency.md
git commit -m "fix(planner): keep destination metadata consistent"
```

- [ ] **Step 10: Push and verify PR #21**

Run:

```powershell
git push origin HEAD:main
```

Then verify PR #21 remains open, ready, and mergeable, and that its head SHA matches the pushed commit. Do not reply to or resolve GitHub review comments unless the user separately authorizes that action.
