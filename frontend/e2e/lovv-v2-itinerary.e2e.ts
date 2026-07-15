/**
 * @file lovv-v2-itinerary.e2e.ts
 * @description End-to-end coverage for the AgentCore V2 itinerary workflow.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { expect, test, type Route, type Page } from '@playwright/test'

const fixedNow = '2026-07-13T03:00:00.000Z'
const recommendationId = 'rec-e2e-001'
const recommendationSessionId = 'session-e2e-0000000000000000000000000001'
const itineraryId = 'itinerary-e2e-001'
const destinationId = 'KR-51-170'
const createQuery = '동해 1박 2일 바다 여행을 추천해줘.'
const modifyQuery = '1일차 첫 장소 바꿔줘. 더 조용한 곳을 원해.'

type JsonRecord = Record<string, unknown>

const itineraryItem = ({
  itemId,
  contentId,
  title,
  body,
  day,
  order,
  timeOfDay,
  latitude,
  longitude,
}: {
  itemId: string
  contentId: string
  title: string
  body: string
  day: number
  order: number
  timeOfDay: string
  latitude: number
  longitude: number
}) => ({
  itemId,
  contentId,
  itemType: 'attraction',
  day,
  order,
  sortOrder: order,
  timeOfDay,
  title,
  body,
  reason: '바다·해안 취향과 조용한 동선을 반영했어요.',
  isSeed: order === 1,
  cityId: destinationId,
  theme: '바다·해안',
  indoorOutdoor: 'outdoor',
  moveMinutes: order === 1 ? 0 : 20,
  latitude,
  longitude,
})

const initialDays = [
  {
    day: 1,
    title: '해안 산책',
    summary: '묵호등대에서 시작하는 동해 해안 산책입니다.',
    items: [
      itineraryItem({
        itemId: 'item-initial-001',
        contentId: 'A-100',
        title: '묵호등대',
        body: '바다를 보며 걷는 아침 산책',
        day: 1,
        order: 1,
        timeOfDay: 'morning',
        latitude: 37.5547,
        longitude: 129.1162,
      }),
    ],
  },
  {
    day: 2,
    title: '느린 바다 아침',
    summary: '추암해변에서 여유롭게 여행을 마무리합니다.',
    items: [
      itineraryItem({
        itemId: 'item-initial-002',
        contentId: 'A-300',
        title: '추암해변',
        body: '촛대바위와 잔잔한 바다를 둘러봅니다.',
        day: 2,
        order: 1,
        timeOfDay: 'morning',
        latitude: 37.4791,
        longitude: 129.1598,
      }),
    ],
  },
]

const modifiedDays = [
  {
    ...initialDays[0],
    summary: '한섬감성바닷길에서 시작하는 조용한 해안 산책입니다.',
    items: [
      itineraryItem({
        itemId: 'item-modified-001',
        contentId: 'A-200',
        title: '한섬감성바닷길',
        body: '조용한 바닷길을 따라 걷는 아침 산책',
        day: 1,
        order: 1,
        timeOfDay: 'morning',
        latitude: 37.5219,
        longitude: 129.1143,
      }),
    ],
  },
  initialDays[1],
]

const recommendationResponse = (sessionId: string, days: typeof initialDays) => ({
  status: 'completed',
  state: 'ready',
  sessionId,
  threadId: sessionId,
  recommendationId,
  destination: {
    destinationId,
    cityId: destinationId,
    name: '동해시',
    country: 'KR',
    region: '강원',
  },
  itinerary: {
    tripType: '2d1n',
    title: '동해시 1박 2일 조용한 해안 여행',
    summary: '조용한 해안과 산책로를 이어 보는 일정입니다.',
    durationLabel: '1박 2일',
    days,
  },
  explainability: {
    recommendationReasons: ['조용한 해안 선호를 반영했어요.'],
    itineraryFlowReason: '아침 해안 산책으로 시작해요.',
  },
})

const fulfillJson = (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

const installFixedDate = (page: Page) =>
  page.addInitScript(({ now }) => {
    const NativeDate = Date
    const fixedTimestamp = NativeDate.parse(now)

    class FixedDate extends NativeDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        super(...(args.length === 0 ? [fixedTimestamp] : args))
      }

      static now() {
        return fixedTimestamp
      }
    }

    Object.setPrototypeOf(FixedDate, NativeDate)
    globalThis.Date = FixedDate as DateConstructor
  }, { now: fixedNow })

const installDeterministicIds = (page: Page) =>
  page.addInitScript(({ sessionIdSuffix }) => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: () => sessionIdSuffix,
    })
  }, { sessionIdSuffix: recommendationSessionId.replace(/^session-/, '') })

test('authenticated onboarded user can clarify, modify, save, and reopen a V2 itinerary', async ({ page }) => {
  await installFixedDate(page)
  await installDeterministicIds(page)

  const recommendationRequests: JsonRecord[] = []
  const unexpectedRequests: string[] = []
  let savedPayload: JsonRecord | null = null
  let savedRecord: JsonRecord | null = null
  let releaseSaveResponse: (() => void) | null = null
  let markSaveRequestStarted: (() => void) | null = null
  const saveResponseGate = new Promise<void>((resolve) => {
    releaseSaveResponse = resolve
  })
  const saveRequestStarted = new Promise<void>((resolve) => {
    markSaveRequestStarted = resolve
  })

  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname

    if (path === '/api/v1/auth/session' && method === 'GET') {
      await fulfillJson(route, {
        authenticated: true,
        accessToken: 'e2e-access-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        session: {
          sessionId: 'auth-session-e2e-001',
          expiresAt: '2026-07-13T04:00:00.000Z',
        },
        user: {
          userId: 'user-e2e-001',
          displayName: 'E2E 사용자',
          email: 'e2e@example.invalid',
          provider: 'google',
          roles: ['R-USER'],
        },
        preferences: {
          version: 2,
          countryTrack: 'KR',
          selectedThemeIds: ['sea_coast'],
          source: 'onboarding',
          updatedAt: fixedNow,
        },
        onboardingCompleted: true,
      })
      return
    }

    if (path === '/api/small-cities' && method === 'GET') {
      await fulfillJson(route, {
        items: [],
        page: { page: 1, pageSize: 120, total: 0, hasNext: false },
      })
      return
    }

    if (path.startsWith('/api/small-cities/') && method === 'GET') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'E2E_STATIC_FALLBACK' } }),
      })
      return
    }

    if (path === '/api/v1/auth/social-accounts' && method === 'GET') {
      await fulfillJson(route, { socialAccounts: [] })
      return
    }

    if (path === '/api/v1/recommendations' && method === 'POST') {
      const body = request.postDataJSON() as JsonRecord
      const expectedEntryTypes = ['create', 'clarify', 'modify']
      const expectedEntryType = expectedEntryTypes[recommendationRequests.length]

      if (body.entryType !== expectedEntryType) {
        unexpectedRequests.push(
          `${method} ${path} expected ${expectedEntryType ?? 'no further call'}, received ${String(body.entryType)}`,
        )
        await route.abort('failed')
        return
      }

      recommendationRequests.push(body)

      if (recommendationRequests.length === 1) {
        if (body.sessionId !== recommendationSessionId) {
          unexpectedRequests.push(`${method} ${path} invalid create sessionId`)
          await route.abort('failed')
          return
        }

        await fulfillJson(route, {
          status: 'clarification_required',
          state: 'clarify',
          sessionId: recommendationSessionId,
          threadId: recommendationSessionId,
          recommendationId,
          clarification: {
            reasonCode: 'COAST_STYLE',
            question: '어떤 바다 여행을 원하세요?',
            options: [
              {
                optionId: 'quiet-coast',
                label: '조용한 해안 중심',
                helperText: '혼잡한 명소보다 여유로운 동선을 우선해요.',
                apply: { coastStyle: 'quiet' },
              },
            ],
          },
        })
        return
      }

      if (recommendationRequests.length === 2) {
        if (body.threadId !== recommendationSessionId || body.selectedOptionId !== 'quiet-coast') {
          unexpectedRequests.push(`${method} ${path} invalid clarify continuity`)
          await route.abort('failed')
          return
        }

        await fulfillJson(route, recommendationResponse(recommendationSessionId, initialDays))
        return
      }

      if (recommendationRequests.length === 3) {
        if (body.sessionId !== recommendationSessionId || body.threadId !== recommendationSessionId) {
          unexpectedRequests.push(`${method} ${path} invalid modify continuity`)
          await route.abort('failed')
          return
        }

        await fulfillJson(route, recommendationResponse(recommendationSessionId, modifiedDays))
        return
      }

      unexpectedRequests.push(`${method} ${path} unexpected recommendation call`)
      await route.abort('failed')
      return
    }

    if (path === '/api/v1/me/itineraries' && method === 'POST') {
      savedPayload = request.postDataJSON() as JsonRecord
      const destination = savedPayload.destination as JsonRecord
      const itinerary = savedPayload.itinerary as JsonRecord

      savedRecord = {
        id: itineraryId,
        itineraryId,
        sourceRecommendationId: savedPayload.sourceRecommendationId,
        ownerId: 'user-e2e-001',
        title: savedPayload.title,
        cityPair: destination.name,
        destination,
        destinationId: destination.destinationId,
        themeLabels: savedPayload.themes,
        themeTag: '바다·해안',
        conditionSummary: savedPayload.requestSummary,
        durationLabel: savedPayload.durationLabel,
        festivalThemeLabel: '축제 제외',
        intensityLabel: savedPayload.intensityLabel,
        summary: savedPayload.summary,
        itinerary,
        isLiked: false,
        isPublic: false,
        createdAt: fixedNow,
        savedAt: fixedNow,
      }

      markSaveRequestStarted?.()
      await saveResponseGate

      await fulfillJson(route, {
        itineraryId,
        sourceRecommendationId: savedPayload.sourceRecommendationId,
        savedAt: fixedNow,
        duplicate: false,
      })
      return
    }

    if (path === '/api/v1/me/itineraries' && method === 'GET') {
      await fulfillJson(route, { items: savedRecord ? [savedRecord] : [] })
      return
    }

    if (path === `/api/v1/itineraries/${itineraryId}` && method === 'GET' && savedRecord) {
      await fulfillJson(route, savedRecord)
      return
    }

    if (path.startsWith('/api/')) {
      unexpectedRequests.push(`${method} ${path}`)
      await route.abort('failed')
      return
    }

    if (
      url.hostname === 'fonts.googleapis.com' ||
      (url.hostname === 'cdn.jsdelivr.net' && path.endsWith('.css'))
    ) {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' })
      return
    }

    if (url.hostname === 'cdn.jsdelivr.net' && path.endsWith('.woff2')) {
      await route.fulfill({ status: 200, contentType: 'font/woff2', body: '' })
      return
    }

    if (url.origin !== 'http://127.0.0.1:4173') {
      unexpectedRequests.push(`${method} ${request.url()}`)
      await route.abort('blockedbyclient')
      return
    }

    const resourceType = request.resourceType()
    const isAllowedDocument = method === 'GET' && resourceType === 'document' && path === '/planner'
    const isAllowedViteAsset =
      method === 'GET' &&
      (path === '/@vite/client' ||
        path === '/@react-refresh' ||
        path.startsWith('/src/') ||
        path.startsWith('/node_modules/') ||
        path.startsWith('/@fs/'))

    if (isAllowedDocument || isAllowedViteAsset) {
      await route.continue()
      return
    }

    unexpectedRequests.push(`${method} ${path} (${resourceType})`)
    await route.abort('failed')
  })

  await page.goto('/planner')
  await expect(page).toHaveURL(/\/planner$/)
  await expect(page).not.toHaveURL(/\/(auth|onboarding)$/)

  await page.getByRole('button', { name: '1박 2일', exact: true }).click()
  await page.getByRole('button', { name: '7월', exact: true }).click()
  await page.getByRole('button', { name: '축제 제외', exact: true }).click()

  const plannerInput = page.getByRole('textbox', { name: '여행 조건 입력' })
  await expect(plannerInput).toBeEnabled()
  await plannerInput.fill(createQuery)
  await page.getByRole('button', { name: '메시지 보내기' }).click()

  await expect(page.getByText(createQuery, { exact: true })).toHaveCount(1)
  await expect(page.getByText('어떤 바다 여행을 원하세요?', { exact: true })).toBeVisible()
  const clarificationOption = page.getByRole('button', { name: /조용한 해안 중심/ })
  await expect(clarificationOption).toContainText('조용한 해안 중심')
  await expect(clarificationOption).toContainText('혼잡한 명소보다 여유로운 동선을 우선해요.')
  await expect(clarificationOption).toBeEnabled()
  await clarificationOption.click()
  await expect(clarificationOption).toBeDisabled()

  await expect(page.getByRole('button', { name: '세부 일정 보기' })).toBeVisible()

  const createRequest = recommendationRequests[0]
  expect(createRequest.entryType).toBe('create')
  expect(createRequest.requestId).toEqual(expect.any(String))
  expect(String(createRequest.requestId)).not.toHaveLength(0)
  expect(createRequest.sessionId).toEqual(expect.any(String))
  expect(createRequest.sessionId).toBe(recommendationSessionId)
  expect(createRequest.rawQuery).toBe(createQuery)
  expect(createRequest.country).toBe('KR')
  expect(createRequest.travelYear).toBe(2026)
  expect(createRequest.travelMonth).toBe(7)
  expect(createRequest.tripType).toBe('2d1n')
  expect(createRequest.themes).toEqual(['sea_coast'])
  expect(createRequest.activeRequiredThemes).toEqual(['바다·해안'])
  expect(createRequest.includeFestivals).toBe(false)
  expect(createRequest.destinationId).toBeNull()
  expect(createRequest.executionMode).toBe('city_discovery')
  expect(createRequest.userLocation).toBeNull()
  expect(createRequest.onboardingProfile).toEqual({
    themes: ['sea_coast'],
    selectedThemeIds: ['sea_coast'],
  })

  const clarifyRequest = recommendationRequests[1]
  expect(clarifyRequest).toEqual({
    entryType: 'clarify',
    threadId: recommendationSessionId,
    recommendationId,
    selectedOptionId: 'quiet-coast',
  })

  await page.getByRole('button', { name: '세부 일정 보기' }).click()
  await expect(page).toHaveURL(/\/plans\//)
  const dayOnePanel = page.getByRole('tabpanel', { name: '1일차' })
  await expect(dayOnePanel.getByText('묵호등대', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Lovv 챗봇' }).click()
  const modifyInput = page.getByRole('textbox', { name: '세부 일정 수정 요청' })
  await modifyInput.fill(modifyQuery)
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page.getByRole('group', { name: /한섬감성바닷길 장소 변경 확인/ })).toBeVisible()
  await page.getByRole('button', { name: '바꾸기', exact: true }).click()
  await expect(dayOnePanel.getByText('한섬감성바닷길', { exact: true })).toBeVisible()
  await expect(dayOnePanel.getByText('묵호등대', { exact: true })).toHaveCount(0)

  const modifyRequest = recommendationRequests[2]
  expect(modifyRequest.entryType).toBe('modify')
  expect(modifyRequest.requestId).toEqual(expect.any(String))
  expect(modifyRequest.sessionId).toBe(recommendationSessionId)
  expect(modifyRequest.threadId).toBe(recommendationSessionId)
  expect(modifyRequest.recommendationId).toBe(recommendationId)
  expect(modifyRequest.rawModifyQuery).toBe(modifyQuery)
  expect(Array.isArray(modifyRequest.currentOrder)).toBe(true)
  expect((modifyRequest.currentOrder as JsonRecord[])[0]).toMatchObject({
    itemId: 'item-initial-001',
    contentId: 'A-100',
    itemType: 'attraction',
    day: 1,
    order: 1,
    title: '묵호등대',
    cityId: destinationId,
    theme: '바다·해안',
    latitude: 37.5547,
    longitude: 129.1162,
    indoorOutdoor: 'outdoor',
  })

  await page.getByRole('button', { name: '세부 일정 수정 챗봇 닫기' }).click()
  const saveButton = page.getByRole('button', { name: '마이페이지에 저장' })
  await saveButton.click()
  await saveRequestStarted
  const pendingSaveButton = page.getByRole('button', { name: '저장 중...' })
  await expect(pendingSaveButton).toBeDisabled()
  releaseSaveResponse?.()
  await expect(page.getByRole('button', { name: '마이페이지로 이동' })).toBeVisible()

  expect(savedPayload).not.toBeNull()
  expect(savedPayload?.sourceRecommendationId).toEqual(expect.any(String))
  expect(String(savedPayload?.sourceRecommendationId)).not.toHaveLength(0)
  expect(savedRecord?.sourceRecommendationId).toBe(savedPayload?.sourceRecommendationId)
  expect(savedPayload?.idempotencyKey).toEqual(expect.any(String))
  expect(String(savedPayload?.idempotencyKey)).not.toHaveLength(0)
  expect(savedPayload?.destination).toMatchObject({
    destinationId,
    name: '동해시',
  })
  expect(savedPayload?.durationLabel).toBe('1박 2일')
  expect(savedPayload?.themes).toEqual(['바다·해안'])
  expect(savedPayload?.preferenceSnapshot).toEqual({
    selectedThemeIds: ['sea_coast'],
    source: 'onboarding',
    updatedAt: fixedNow,
  })
  expect(savedPayload?.conditionsSnapshot).toMatchObject({
    festivalThemeChoice: 'exclude',
    selectedTravelMonth: 7,
    activeRequiredThemes: ['sea_coast'],
    softPreferences: [],
    unsupportedConditions: [],
    cityId: destinationId,
  })
  expect(savedPayload?.requestSummary).toEqual(expect.any(String))
  expect(String(savedPayload?.requestSummary)).not.toHaveLength(0)
  const savedDays = ((savedPayload?.itinerary as JsonRecord).days as Array<{ stops: Array<{ title: string }> }>)
  expect(savedDays[0].stops[0].title).toBe('한섬감성바닷길')
  expect(savedDays[0].stops.some((stop) => stop.title === '묵호등대')).toBe(false)

  await page.getByRole('button', { name: '마이페이지로 이동' }).click()
  await expect(page).toHaveURL(/\/mypage$/)

  const savedList = page.getByRole('list', { name: '저장 일정 목록' })
  await expect(savedList.getByRole('listitem')).toHaveCount(1)
  await expect(savedList.getByText('동해시 1박 2일 일정', { exact: true })).toBeVisible()
  await expect(savedList.getByText(/동해시 · 1박 2일 · 바다·해안/)).toBeVisible()
  await savedList.getByRole('button', { name: '상세 보기' }).click()

  await expect(page).toHaveURL(`/plans/${itineraryId}`)
  const reopenedPlanRegion = page.getByRole('region', { name: '동해시' })
  await expect(reopenedPlanRegion.getByRole('heading', { level: 1, name: '동해시' })).toBeVisible()
  await expect(reopenedPlanRegion.getByText('1박 2일', { exact: true })).toBeVisible()
  const reopenedDayOnePanel = page.getByRole('tabpanel', { name: '1일차' })
  await expect(reopenedDayOnePanel.getByText('한섬감성바닷길', { exact: true })).toBeVisible()
  await expect(reopenedDayOnePanel.getByText('묵호등대', { exact: true })).toHaveCount(0)

  const unexpectedCountBeforeProbe = unexpectedRequests.length
  const probeWasBlocked = await page.evaluate(async () => {
    try {
      await fetch('/e2e-unhandled-probe')
      return false
    } catch {
      return true
    }
  })
  expect(probeWasBlocked).toBe(true)
  expect(unexpectedRequests.slice(unexpectedCountBeforeProbe)).toEqual([
    'GET /e2e-unhandled-probe (fetch)',
  ])
  unexpectedRequests.splice(unexpectedCountBeforeProbe, 1)

  expect(recommendationRequests.map((request) => request.entryType)).toEqual([
    'create',
    'clarify',
    'modify',
  ])
  expect(unexpectedRequests).toEqual([])
})

// EOF: lovv-v2-itinerary.e2e.ts
