/**
 * @file PlanDetailView.test.tsx
 * @description Integration tests for itinerary detail editing and day-specific route state.
 * @author JJonyeok2
 * @lastModified 2026-07-16
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../../i18n'
import type { PlanDay, PlanDraft, PlanRoute, PlanStop, RoutePathCoordinate } from '../../shared/types/app'
import { requestRecommendationRoute } from '../../shared/api/recommendationsApi'
import { PlanDetailView } from './PlanDetailView'

vi.mock('../../shared/api/recommendationsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/api/recommendationsApi')>()

  return {
    ...actual,
    requestRecommendationRoute: vi.fn(),
  }
})

vi.mock('./PlanDetailGoogleMap', () => ({
  PlanDetailGoogleMap: ({
    routePath,
    stops,
  }: {
    routePath?: RoutePathCoordinate[]
    stops: PlanStop[]
  }) => (
    <div
      data-testid="plan-detail-google-map"
      data-route-path={JSON.stringify(routePath ?? null)}
      data-stop-titles={stops.map((stop) => stop.title).join('|')}
    />
  ),
}))

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

const createDay = (
  dayNumber: number,
  stopCoordinates: RoutePathCoordinate[],
  persistedPath: RoutePathCoordinate[],
): PlanDay => ({
  day: dayNumber,
  title: `${dayNumber}일차 일정`,
  summary: `${dayNumber}일차 경로`,
  stops: stopCoordinates.map(([longitude, latitude], index) => ({
    time: index === 0 ? '아침' : '점심',
    move: '차량 10분',
    title: `${dayNumber}일차 장소 ${index + 1}`,
    body: `${dayNumber}일차 장소 설명`,
    reason: `${dayNumber}일차 추천 이유`,
    latitude,
    longitude,
  })),
  route: {
    provider: 'persisted-route',
    geometry: {
      type: 'LineString',
      coordinates: persistedPath,
    },
  },
})

const createPlanDraft = (days: PlanDay[]): PlanDraft => ({
  durationLabel: `${days.length - 1}박 ${days.length}일`,
  dayCount: days.length,
  intensityLabel: '느긋한 일정',
  festivalThemeLabel: '축제 제외',
  summary: '일차별 저장 경로 회귀 테스트 일정',
  days,
  stops: days.flatMap((day) => day.stops),
})

const createCalculatedRoute = (coordinates: RoutePathCoordinate[]): PlanRoute => ({
  provider: 'kakao-mobility',
  geometry: {
    type: 'LineString',
    coordinates,
  },
})

type PlanModificationRequest = NonNullable<ComponentProps<typeof PlanDetailView>['onRequestPlanModification']>

const renderPlanDetail = (
  planDraft: PlanDraft,
  onReplacePlanDay?: ComponentProps<typeof PlanDetailView>['onReplacePlanDay'],
) => (
  <MemoryRouter>
    <PlanDetailView
      isPlannerReady
      shouldAskFestivalTheme={false}
      returnToChatWorkspace={vi.fn()}
      currentPlanTitle="일차별 경로 테스트"
      planDraft={planDraft}
      plannerBasisLabel="강릉"
      planId="route-regression-plan"
      saveGeneratedPlan={vi.fn()}
      isCurrentPlanSaved={false}
      onDeleteSavedPlan={vi.fn()}
      openMyPage={vi.fn()}
      savedPlanNotice={null}
      authAccessToken="access-token"
      onReplacePlanDay={onReplacePlanDay}
    />
  </MemoryRouter>
)

const renderEditablePlanDetail = (
  planDraft: PlanDraft,
  onRequestPlanModification: PlanModificationRequest,
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

const renderWishlistPlanDetail = (planDraft: PlanDraft) => render(
  <MemoryRouter>
    <PlanDetailView
      isPlannerReady
      shouldAskFestivalTheme={false}
      returnToChatWorkspace={vi.fn()}
      currentPlanTitle="wishlist layout test"
      planDraft={planDraft}
      plannerBasisLabel="Donghae"
      destinationName="Donghae"
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

const expectDisplayedRoute = async (routePath: RoutePathCoordinate[] | null) => {
  await waitFor(() => {
    expect(screen.getByTestId('plan-detail-google-map')).toHaveAttribute(
      'data-route-path',
      JSON.stringify(routePath),
    )
  })
}

describe('PlanDetailView day-keyed route results', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    vi.mocked(requestRecommendationRoute).mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('keeps a selected wishlist card intact inside the desktop scroll list', () => {
    vi.mocked(requestRecommendationRoute).mockResolvedValue(null)
    const planDraft: PlanDraft = {
      ...createPlanDraft([
        createDay(1, [[129.11, 37.52]], [[129.11, 37.52], [129.12, 37.53]]),
      ]),
      selectedRestaurants: [{
        id: 'wishlist-long-card',
        placeName: 'Desktop Wishlist Restaurant',
        roadAddressName: 'Gangwon-do Donghae-si a deliberately long coastal road address for layout verification 12345',
        phone: '033-123-4567',
        placeUrl: 'https://place.map.kakao.com/12345',
        imageUrl: 'https://img1.kakaocdn.net/place.jpg',
        source: 'kakao',
        lat: 37.52,
        lng: 129.11,
      }],
    }

    renderWishlistPlanDetail(planDraft)

    const title = screen.getByText('Desktop Wishlist Restaurant')
    const list = title.closest('ul')
    const card = title.closest('li')
    const address = screen.getByText(/deliberately long coastal road address/)
    const mapPanel = screen.getByTestId('plan-detail-google-map').parentElement

    expect(list).not.toBeNull()
    expect(mapPanel).toHaveClass('min-h-[220px]', 'max-lg:min-h-[280px]')
    expect(list).toHaveClass('flex-1', 'overflow-y-auto', 'lg:max-h-[300px]')
    expect(list?.parentElement).toHaveClass('lg:h-[400px]')
    expect(card).toHaveClass('shrink-0')
    expect(address).toHaveClass('line-clamp-2')
    expect(within(list as HTMLUListElement).getAllByRole('button')).toHaveLength(2)
    within(list as HTMLUListElement).getAllByRole('button').forEach((button) => {
      expect(button).toBeVisible()
    })
  })

  it('persists an automatically calculated route without showing a day replacement notice', async () => {
    const calculatedPath: RoutePathCoordinate[] = [
      [128.91, 37.75],
      [128.92, 37.76],
      [128.93, 37.77],
    ]
    const onReplacePlanDay = vi.fn<NonNullable<ComponentProps<typeof PlanDetailView>['onReplacePlanDay']>>()
    vi.mocked(requestRecommendationRoute).mockResolvedValue(createCalculatedRoute(calculatedPath))

    render(renderPlanDetail(createPlanDraft([
      createDay(
        1,
        [[128.91, 37.75], [128.93, 37.77]],
        [[128.91, 37.75], [128.93, 37.77]],
      ),
    ]), onReplacePlanDay))

    await waitFor(() => {
      expect(onReplacePlanDay).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ day: 1 }),
        { notify: false },
      )
    })
  })

  it('keeps day 2 persisted route visible while its request is pending after day 1 completes', async () => {
    const day1Request = createDeferred<PlanRoute | null>()
    const day2Request = createDeferred<PlanRoute | null>()
    const day1Stops: RoutePathCoordinate[] = [[128.91, 37.75], [128.93, 37.77]]
    const day2Stops: RoutePathCoordinate[] = [[128.96, 37.79], [128.98, 37.81]]
    const day1PersistedPath: RoutePathCoordinate[] = [[128.91, 37.75], [128.92, 37.76], [128.93, 37.77]]
    const day2PersistedPath: RoutePathCoordinate[] = [[128.96, 37.79], [128.97, 37.8], [128.98, 37.81]]
    const day1CalculatedPath: RoutePathCoordinate[] = [[128.91, 37.75], [128.915, 37.765], [128.93, 37.77]]

    vi.mocked(requestRecommendationRoute)
      .mockReturnValueOnce(day1Request.promise)
      .mockReturnValueOnce(day2Request.promise)

    render(renderPlanDetail(createPlanDraft([
      createDay(1, day1Stops, day1PersistedPath),
      createDay(2, day2Stops, day2PersistedPath),
    ])))

    await waitFor(() => {
      expect(requestRecommendationRoute).toHaveBeenCalledTimes(1)
    })
    await expectDisplayedRoute(day1PersistedPath)

    await act(async () => {
      day1Request.resolve(createCalculatedRoute(day1CalculatedPath))
      await day1Request.promise
    })
    await expectDisplayedRoute(day1CalculatedPath)

    fireEvent.click(screen.getByRole('tab', { name: '2일차' }))

    await waitFor(() => {
      expect(requestRecommendationRoute).toHaveBeenCalledTimes(2)
    })
    await expectDisplayedRoute(day2PersistedPath)
    expect(screen.getByTestId('plan-detail-google-map')).toHaveAttribute(
      'data-stop-titles',
      '2일차 장소 1|2일차 장소 2',
    )
    expect(screen.getByTestId('plan-detail-google-map')).not.toHaveAttribute(
      'data-route-path',
      JSON.stringify(day1CalculatedPath),
    )
  })

  it('keeps consecutive modification requests and assistant results in the chat history', async () => {
    vi.mocked(requestRecommendationRoute).mockResolvedValue(null)
    const planDraft = createPlanDraft([
      createDay(1, [[128.91, 37.75], [128.93, 37.77]], [[128.91, 37.75], [128.93, 37.77]]),
    ])
    const onRequestPlanModification = vi.fn<PlanModificationRequest>()
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
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    await screen.findByRole('group', { name: /첫 번째 대체 장소 장소 변경 확인/ })

    fireEvent.change(input, { target: { value: '1일차 두 번째 장소 바꿔줘' } })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    await screen.findByRole('group', { name: /두 번째 대체 장소 장소 변경 확인/ })

    fireEvent.click(screen.getByRole('button', { name: '세부 일정 수정 챗봇 닫기' }))
    expect(screen.queryByRole('textbox', { name: '세부 일정 수정 요청' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lovv 챗봇' }))

    const history = screen.getByRole('group', { name: '최근 대화' })
    expect(within(history).getByText('1일차 첫 장소 바꿔줘')).toBeVisible()
    expect(within(history).getByText('1일차 두 번째 장소 바꿔줘')).toBeVisible()
    expect(within(history).getAllByText('에이전트가 제안한 후보를 확인해 주세요.')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '바꾸기' }))
    expect(within(history).getByText('선택한 장소 변경을 일정에 반영했어요.')).toBeVisible()
  })

  it('keeps unsupported modification requests and assistant guidance in the chat history', async () => {
    vi.mocked(requestRecommendationRoute).mockResolvedValue(null)
    const planDraft = createPlanDraft([
      createDay(1, [[128.91, 37.75], [128.93, 37.77]], [[128.91, 37.75], [128.93, 37.77]]),
    ])
    const onRequestPlanModification = vi.fn<PlanModificationRequest>()

    renderEditablePlanDetail(planDraft, onRequestPlanModification)
    fireEvent.click(screen.getByRole('button', { name: 'Lovv 챗봇' }))

    const input = screen.getByRole('textbox', { name: '세부 일정 수정 요청' })
    fireEvent.change(input, { target: { value: '첫 번째 지원하지 않는 요청' } })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    fireEvent.change(input, { target: { value: '두 번째 지원하지 않는 요청' } })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    const history = screen.getByRole('group', { name: '최근 대화' })
    expect(within(history).getByText('첫 번째 지원하지 않는 요청')).toBeVisible()
    expect(within(history).getByText('두 번째 지원하지 않는 요청')).toBeVisible()
    expect(within(history).getAllByText(
      '“도시 바꿔줘”, “1일차 2번째 장소 바꿔줘”, “1일차 점심을 OO로 바꿔줘”처럼 요청해 주세요.',
    )).toHaveLength(2)
    expect(onRequestPlanModification).not.toHaveBeenCalled()
  })

  it('keeps the modification request and failure result when the agent call rejects', async () => {
    vi.mocked(requestRecommendationRoute).mockResolvedValue(null)
    const planDraft = createPlanDraft([
      createDay(1, [[128.91, 37.75], [128.93, 37.77]], [[128.91, 37.75], [128.93, 37.77]]),
    ])
    const onRequestPlanModification = vi.fn<PlanModificationRequest>().mockRejectedValue(new Error('network unavailable'))

    renderEditablePlanDetail(planDraft, onRequestPlanModification)
    fireEvent.click(screen.getByRole('button', { name: 'Lovv 챗봇' }))

    const input = screen.getByRole('textbox', { name: '세부 일정 수정 요청' })
    fireEvent.change(input, { target: { value: '1일차 첫 장소 바꿔줘' } })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    const history = await screen.findByRole('group', { name: '최근 대화' })
    expect(within(history).getByText('1일차 첫 장소 바꿔줘')).toBeVisible()
    expect(within(history).getByText(
      '일정 수정 에이전트 연결이 끊겼어요. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
    )).toBeVisible()
  })

  it('hides the same day old persisted and calculated paths while a changed request is pending', async () => {
    const initialRequest = createDeferred<PlanRoute | null>()
    const changedRequest = createDeferred<PlanRoute | null>()
    const initialStops: RoutePathCoordinate[] = [[128.91, 37.75], [128.93, 37.77]]
    const changedStops = [...initialStops].reverse() as RoutePathCoordinate[]
    const persistedPath: RoutePathCoordinate[] = [[128.91, 37.75], [128.92, 37.76], [128.93, 37.77]]
    const initialCalculatedPath: RoutePathCoordinate[] = [[128.91, 37.75], [128.915, 37.765], [128.93, 37.77]]
    const changedCalculatedPath: RoutePathCoordinate[] = [[128.93, 37.77], [128.92, 37.76], [128.91, 37.75]]

    vi.mocked(requestRecommendationRoute)
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(changedRequest.promise)

    const view = render(renderPlanDetail(createPlanDraft([
      createDay(1, initialStops, persistedPath),
    ])))

    await waitFor(() => {
      expect(requestRecommendationRoute).toHaveBeenCalledTimes(1)
    })
    await act(async () => {
      initialRequest.resolve(createCalculatedRoute(initialCalculatedPath))
      await initialRequest.promise
    })
    await expectDisplayedRoute(initialCalculatedPath)

    view.rerender(renderPlanDetail(createPlanDraft([
      createDay(1, changedStops, persistedPath),
    ])))

    await waitFor(() => {
      expect(requestRecommendationRoute).toHaveBeenCalledTimes(2)
    })
    expect(requestRecommendationRoute).toHaveBeenNthCalledWith(
      2,
      changedStops,
      { accessToken: 'access-token' },
    )
    await expectDisplayedRoute(null)

    await act(async () => {
      changedRequest.resolve(createCalculatedRoute(changedCalculatedPath))
      await changedRequest.promise
    })
    await expectDisplayedRoute(changedCalculatedPath)
  })

  it('restores each completed day result without requesting the same route again', async () => {
    const day1Stops: RoutePathCoordinate[] = [[128.91, 37.75], [128.93, 37.77]]
    const day2Stops: RoutePathCoordinate[] = [[128.96, 37.79], [128.98, 37.81]]
    const day1CalculatedPath: RoutePathCoordinate[] = [[128.91, 37.75], [128.915, 37.765], [128.93, 37.77]]
    const day2CalculatedPath: RoutePathCoordinate[] = [[128.96, 37.79], [128.97, 37.8], [128.98, 37.81]]

    vi.mocked(requestRecommendationRoute)
      .mockResolvedValue(null)
      .mockResolvedValueOnce(createCalculatedRoute(day1CalculatedPath))
      .mockResolvedValueOnce(createCalculatedRoute(day2CalculatedPath))

    render(renderPlanDetail(createPlanDraft([
      createDay(1, day1Stops, day1Stops),
      createDay(2, day2Stops, day2Stops),
    ])))

    await expectDisplayedRoute(day1CalculatedPath)
    fireEvent.click(screen.getByRole('tab', { name: '2일차' }))
    await expectDisplayedRoute(day2CalculatedPath)
    fireEvent.click(screen.getByRole('tab', { name: '1일차' }))
    await expectDisplayedRoute(day1CalculatedPath)

    await act(async () => {
      await Promise.resolve()
    })
    expect(requestRecommendationRoute).toHaveBeenCalledTimes(2)
  })
})

// EOF: PlanDetailView.test.tsx
