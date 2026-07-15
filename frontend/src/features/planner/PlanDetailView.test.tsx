import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const renderPlanDetail = (planDraft: PlanDraft) => (
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
    />
  </MemoryRouter>
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
