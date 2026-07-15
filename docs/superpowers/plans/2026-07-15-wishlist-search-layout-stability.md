# Wishlist Search and Desktop Layout Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kakao 맛집 후보를 최대 10개 제공하고 노트북·PC의 우측 위시리스트 카드가 잘리지 않도록 내부 스크롤과 카드 레이아웃을 안정화한다.

**Architecture:** Kakao SDK 어댑터의 결과 제한만 10개로 변경하고 기존 캐시·오류 계약은 유지한다. `PlanDetailView`에서는 지도와 위시리스트가 공유하는 데스크톱 높이 안에서 위시리스트 목록만 스크롤되도록 flex/grid 경계를 조정하고, 카드 자체는 축소되지 않게 한다.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vitest 4, Testing Library, Playwright 1.61

## Global Constraints

- Kakao Places 다음 페이지 호출과 무한 스크롤은 추가하지 않는다.
- 검색 팝업, 백엔드 API, Kakao 이미지 API 계약은 변경하지 않는다.
- 모바일 레이아웃을 재설계하지 않는다.
- 기존 드래그, 클릭 위치 선택, 제거 동작과 접근 가능한 이름을 유지한다.
- 제품 코드 변경 전에 해당 동작의 실패 테스트를 실행한다.

---

### Task 1: Expand Kakao meal search candidates

**Files:**
- Create: `frontend/src/features/planner/kakaoMealSearch.test.ts`
- Modify: `frontend/src/features/planner/kakaoMealSearch.ts:118-129`

**Interfaces:**
- Consumes: `searchKakaoMealPlaces(query: string, javascriptKey?: string): Promise<KakaoMealSearchResult>`
- Produces: 같은 함수 계약으로 최대 10개의 `SelectedMealPlace`를 반환한다.

- [ ] **Step 1: Write the failing result-limit test**

Create `frontend/src/features/planner/kakaoMealSearch.test.ts` with a Kakao SDK fixture that returns 11 valid places:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { searchKakaoMealPlaces } from './kakaoMealSearch'

const createRawPlaces = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `place-${index + 1}`,
    place_name: `테스트 맛집 ${index + 1}`,
    road_address_name: `강원특별자치도 테스트로 ${index + 1}`,
    x: String(129.1 + index / 1000),
    y: String(37.5 + index / 1000),
  }))

describe('searchKakaoMealPlaces', () => {
  afterEach(() => {
    delete window.kakao
  })

  it('returns the first ten valid Kakao candidates', async () => {
    const results = createRawPlaces(11)
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        services: {
          Places: class {
            keywordSearch(
              _query: string,
              callback: (places: typeof results, status: 'OK' | 'ZERO_RESULT' | 'ERROR') => void,
            ) {
              callback(results, 'OK')
            }
          },
        },
      },
    }

    const result = await searchKakaoMealPlaces('10개 후보 회귀 테스트', 'test-key')

    expect(result.status).toBe('ready')
    expect(result.places).toHaveLength(10)
    expect(result.places.map((place) => place.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `place-${index + 1}`),
    )
    expect(result.places.some((place) => place.id === 'place-11')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
cd frontend
npm test -- src/features/planner/kakaoMealSearch.test.ts
```

Expected: FAIL because the current adapter returns 5 candidates instead of 10.

- [ ] **Step 3: Implement the minimal limit change**

In `kakaoMealSearch.ts`, change only the final limit:

```ts
places: results
  .map(adaptKakaoMealPlace)
  .filter((place): place is SelectedMealPlace => Boolean(place))
  .slice(0, 10),
```

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```powershell
npm test -- src/features/planner/kakaoMealSearch.test.ts
```

Expected: 1 test passes and the eleventh candidate remains excluded.

- [ ] **Step 5: Commit Task 1**

```powershell
git add frontend/src/features/planner/kakaoMealSearch.ts frontend/src/features/planner/kakaoMealSearch.test.ts
git commit -m "fix(planner): expand wishlist search candidates"
```

---

### Task 2: Stabilize desktop wishlist scrolling and card bounds

**Files:**
- Modify: `frontend/src/features/planner/PlanDetailView.test.tsx:90-145`
- Modify: `frontend/src/features/planner/PlanDetailView.test.tsx` inside the existing describe block
- Modify: `frontend/src/features/planner/PlanDetailView.tsx:1945-2075`

**Interfaces:**
- Consumes: `PlanDetailView` props `planDraft`, `onReplacePlanDay`, `addWishlistRestaurant`, `removeWishlistRestaurant`
- Produces: 기존 DOM semantics를 유지하며 내부 스크롤 가능한 `담아둔 맛집 목록`과 축소되지 않는 장소 카드.

- [ ] **Step 1: Add a wishlist-enabled render helper**

Add this helper after `renderEditablePlanDetail`:

```tsx
const renderWishlistPlanDetail = (planDraft: PlanDraft) => render(
  <MemoryRouter>
    <PlanDetailView
      isPlannerReady
      shouldAskFestivalTheme={false}
      returnToChatWorkspace={vi.fn()}
      currentPlanTitle="위시리스트 레이아웃 테스트"
      planDraft={planDraft}
      plannerBasisLabel="동해시"
      destinationName="동해시"
      planId="wishlist-layout-plan"
      saveGeneratedPlan={vi.fn()}
      isCurrentPlanSaved={false}
      onDeleteSavedPlan={vi.fn()}
      openMyPage={vi.fn()}
      savedPlanNotice={null}
      authAccessToken="access-token"
      onReplacePlanDay={vi.fn()}
      addWishlistRestaurant={vi.fn()}
      removeWishlistRestaurant={vi.fn()}
    />
  </MemoryRouter>,
)
```

- [ ] **Step 2: Write the failing layout-contract test**

Add a test using a selected restaurant with image, long address, phone, and Kakao link:

```tsx
it('keeps a selected wishlist card intact inside the desktop scroll list', () => {
  const planDraft = {
    ...createPlanDraft([
      createDay(1, [[129.11, 37.52]], [[129.11, 37.52], [129.12, 37.53]]),
    ]),
    selectedRestaurants: [{
      id: 'wishlist-long-card',
      placeName: '노트북 화면 위시리스트 맛집',
      roadAddressName: '강원특별자치도 동해시 아주 길고 긴 해안도로 주소 12345 테스트 빌딩 10층',
      phone: '033-123-4567',
      placeUrl: 'https://place.map.kakao.com/12345',
      imageUrl: 'https://img1.kakaocdn.net/place.jpg',
      source: 'kakao' as const,
      lat: 37.52,
      lng: 129.11,
    }],
  }

  renderWishlistPlanDetail(planDraft)

  const list = screen.getByRole('list', { name: '담아둔 맛집 목록' })
  const card = within(list).getByText('노트북 화면 위시리스트 맛집').closest('li')
  const address = within(list).getByText(/아주 길고 긴 해안도로 주소/)

  expect(list).toHaveClass('flex-1', 'overflow-y-auto', 'lg:max-h-[220px]')
  expect(card).toHaveClass('shrink-0')
  expect(address).toHaveClass('line-clamp-2')
  expect(within(list).getByRole('button', { name: '위치 선택' })).toBeVisible()
  expect(within(list).getByRole('button', { name: '제거' })).toBeVisible()
})
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```powershell
npm test -- src/features/planner/PlanDetailView.test.tsx -t "keeps a selected wishlist card intact"
```

Expected: FAIL because the list lacks `flex-1` and the card/address lack `shrink-0` and `line-clamp-2`.

- [ ] **Step 4: Implement the desktop height and card contract**

Update the right column and wishlist classes without changing event handlers:

```tsx
<div className="grid min-h-0 grid-rows-[minmax(220px,1fr)_auto] gap-5 lg:sticky lg:top-[96px] lg:max-h-[calc(100dvh-7rem)] lg:min-h-[520px] max-lg:grid-rows-none">
```

```tsx
<div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#F3B489] bg-[#fffffa] p-5 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.2)] max-lg:max-h-[420px]">
```

```tsx
<ul
  className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1 lg:max-h-[220px] max-lg:max-h-[360px]"
  aria-label="담아둔 맛집 목록"
>
```

Add `shrink-0` to each `<li>`, keep the existing responsive flex layout, and clamp only the address:

```tsx
className={`flex shrink-0 cursor-grab flex-wrap items-start justify-between gap-4 rounded-[18px] border p-4 transition-colors active:cursor-grabbing ${
  isSelectedForPlacement
    ? 'border-[#F36B12] bg-[#FFF0E4] shadow-[0_12px_28px_-24px_rgba(51,39,30,0.3)]'
    : 'border-[#F3B489]/30 bg-[#FFF8F6] hover:border-[#F36B12]'
}`}
```

```tsx
<p className="mt-1 line-clamp-2 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
```

- [ ] **Step 5: Run the targeted tests and verify GREEN**

Run:

```powershell
npm test -- src/features/planner/kakaoMealSearch.test.ts src/features/planner/PlanDetailView.test.tsx
```

Expected: all tests in both files pass.

- [ ] **Step 6: Run full automated verification**

Run:

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
```

Expected: all commands exit 0. The existing intentional Small City static fallback logs may appear in E2E without failing the scenario.

- [ ] **Step 7: Verify the layout in Chromium at laptop sizes**

Run the app with mock auth and inspect the detail wishlist at `1366x768` and `1440x900`:

- Search returns up to 10 visible candidates inside its scroll container.
- A selected card shows its full border, title, two-line address, phone, `상세 보기`, `위치 선택`, and `제거`.
- With multiple cards, only `담아둔 맛집 목록` scrolls; the page and card are not clipped.

- [ ] **Step 8: Commit Task 2**

```powershell
git add frontend/src/features/planner/PlanDetailView.tsx frontend/src/features/planner/PlanDetailView.test.tsx
git commit -m "fix(planner): prevent wishlist cards from clipping"
```
