import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage, PlanDay, PlanDraft, PlanStop, RoutePathCoordinate, ThemeId, LovvUser, SelectedMealPlace, SavedPlanLike } from '../../shared/types/app'
import { useTranslation } from 'react-i18next'
import type { SmallCityCountry } from '../map-city/smallCities'
import { requestGetSmallCityDetail, requestGetSmallCityPlaces } from '../../shared/api/smallCityApi'
import { PlanDetailGoogleMap } from './PlanDetailGoogleMap'
import {
  createDayReplacementCandidate,
  createStopReplacementCandidate,
  parsePlannerEditCommand,
} from './plannerEditModel'
import { isMealPlaceholderStop } from './plannerModel'
import { searchKakaoMealPlaces } from './kakaoMealSearch'
import {
  createKakaoMapSearchUrl,
} from './plannerMealModel'
import {
  DEFAULT_IMAGE_CDN_BASE_URL,
  buildAttractionImageUrl as buildAttractionImageUrlFromModel,
} from './plannerImageModel'
import { formatEstimatedMoveLabel, getPlanRouteCoordinates, getPlanStopLatLng, requestOpenRouteServicePath } from './plannerRouteModel'

// ---------------------------------------------------------------------------
// Image URL helpers (Task 13 – S3 / CloudFront integration)
// ---------------------------------------------------------------------------

const IMAGE_CDN_BASE =
  (import.meta.env.VITE_IMAGE_CDN_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') ||
  DEFAULT_IMAGE_CDN_BASE_URL
const OPEN_ROUTE_SERVICE_API_KEY = (import.meta.env.VITE_OPENROUTESERVICE_API_KEY as string | undefined)?.trim() ?? ''
let rainyMessageIdSequence = 0

const createRainyMessageId = (prefix: string) => {
  rainyMessageIdSequence += 1
  return `${prefix}-${Date.now()}-${rainyMessageIdSequence}`
}

/**
 * Build the CloudFront URL for an attraction image.
 * Current deployed image source is KR-only; pass country into the image model
 * when JP attraction image keys are confirmed.
 * Pattern: images/KR/<CITY_ENGLISH_NAME>/<RomanizedTitle>_1.jpg
 *
 * @param cityEnglishName  – e.g. "Gangneung"
 * @param title            – Korean attraction name, e.g. "경포해수욕장"
 */
const buildAttractionImageUrl = (
  cityEnglishName: string,
  title: string,
  country: SmallCityCountry = 'KR',
): string => {
  return buildAttractionImageUrlFromModel(IMAGE_CDN_BASE, cityEnglishName, title, country)
}

const normalizePlaceLookupKey = (value?: string | number | null) =>
  value == null ? '' : String(value).trim().toLowerCase().replace(/\s+/g, '')

const normalizeContentLookupKey = (value?: string | number | null) => {
  const normalized = normalizePlaceLookupKey(value).replace(/[^a-z0-9가-힣]/g, '')
  const numericMatch = normalized.match(/\d+/g)

  return numericMatch ? numericMatch.join('') : normalized
}

const addPlaceLookupValue = <T,>(
  map: Record<string, T>,
  value: string | number | null | undefined,
  mappedValue: T,
  normalize: (value?: string | number | null) => string = normalizePlaceLookupKey,
) => {
  const key = normalize(value)
  if (key) {
    map[key] = mappedValue
  }
}

// ---------------------------------------------------------------------------
// Attraction image card component
// ---------------------------------------------------------------------------

const AttractionImageFallback = () => (
  <div
    aria-label="이미지 준비 중"
    className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#FFF0E4]"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F3B489"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
    <span className="text-[11px] font-bold text-[#F3B489]">이미지 준비 중</span>
  </div>
)

type AttractionImageProps = {
  src: string
  alt: string
  fallbackSrc?: string
}

const AttractionImage = ({ src, alt, fallbackSrc }: AttractionImageProps) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [errorSrc, setErrorSrc] = useState<string | null>(null)
  const primarySrc = src.trim()
  const fallbackCandidate = fallbackSrc?.trim() ?? ''
  const safeFallbackSrc = fallbackCandidate && fallbackCandidate !== primarySrc ? fallbackCandidate : ''
  const activeSrc = primarySrc && errorSrc !== primarySrc
    ? primarySrc
    : safeFallbackSrc && errorSrc !== safeFallbackSrc
      ? safeFallbackSrc
      : ''
  const isLoaded = loadedSrc === activeSrc

  if (!activeSrc) {
    return <AttractionImageFallback />
  }

  return (
    <>
      {!isLoaded && (
        <div className="flex h-full w-full animate-pulse items-center justify-center bg-[#FFF0E4]">
          <span className="text-[11px] font-bold text-[#F3B489]">로딩 중…</span>
        </div>
      )}
      <img
        key={activeSrc}
        src={activeSrc}
        alt={alt}
        onLoad={() => setLoadedSrc(activeSrc)}
        onError={() => setErrorSrc(activeSrc)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Hook: fetch places for a destination and build a name→imageUrl map
// ---------------------------------------------------------------------------

/**
 * For a given destinationId, fetches all SmallCity places and builds a
 * map of { normalizedName → { imageUrl, coords } } so that
 * stop titles can be matched to S3 details.
 */
const usePlaceDataMap = (destinationId?: string) => {
  const [cityEnglishName, setCityEnglishName] = useState<string>('')
  const [cityFallbackImageUrl, setCityFallbackImageUrl] = useState<string>('')
  const [nameToImageUrl, setNameToImageUrl] = useState<Record<string, string>>({})
  const [nameToCoords, setNameToCoords] = useState<Record<string, { lat: number; lng: number }>>({})
  const [countryCode, setCountryCode] = useState<SmallCityCountry>('KR')
  const [loadedDestinationId, setLoadedDestinationId] = useState<string | undefined>(undefined)
  const prevId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!destinationId) {
      prevId.current = undefined
      return
    }

    if (destinationId === prevId.current) return
    prevId.current = destinationId

    let cancelled = false

    const fetchPlaces = async () => {
      try {
        const [placesResult, detailResult] = await Promise.allSettled([
          requestGetSmallCityPlaces(destinationId),
          requestGetSmallCityDetail(destinationId),
        ])
        if (cancelled) return
        if (placesResult.status === 'rejected') {
          throw placesResult.reason
        }

        const result = placesResult.value

        const derivedCountry = destinationId.startsWith('JP') ? 'JP' : 'KR'
        setCountryCode(derivedCountry)
        setCityFallbackImageUrl(
          detailResult.status === 'fulfilled'
            ? detailResult.value.detail?.city.image?.trim() ?? ''
            : '',
        )

        // Extract city English name from the first place record's cityId.
        // City IDs follow the pattern "KR-<EnglishName>" e.g. "KR-Gangneung".
        const allPlaces = Object.values(result.placesByCategory).flat()

        // Derive English city name from cityId (e.g. "KR-Gangneung" → "Gangneung")
        const rawCityId = allPlaces[0]?.cityId ?? destinationId
        const derivedEnglishName = rawCityId.includes('-')
          ? rawCityId.split('-').slice(1).join('-')
          : rawCityId

        setCityEnglishName(derivedEnglishName)

        // Build name→imageUrl and coords maps
        const imgMap: Record<string, string> = {}
        const coordsMap: Record<string, { lat: number; lng: number }> = {}

        allPlaces.forEach((place) => {
          // Use place.imageUrl when available (API-provided), else construct from CDN
          const url =
            place.imageUrl?.trim() ||
            buildAttractionImageUrl(derivedEnglishName, place.name, derivedCountry)
          if (url) {
            addPlaceLookupValue(imgMap, place.name, url)
            addPlaceLookupValue(imgMap, place.id, url, normalizeContentLookupKey)
            addPlaceLookupValue(imgMap, place.contentId, url, normalizeContentLookupKey)
          }
          if (place.latitude != null && place.longitude != null) {
            const coords = { lat: place.latitude, lng: place.longitude }
            addPlaceLookupValue(coordsMap, place.name, coords)
            addPlaceLookupValue(coordsMap, place.id, coords, normalizeContentLookupKey)
            addPlaceLookupValue(coordsMap, place.contentId, coords, normalizeContentLookupKey)
          }
        })
        setNameToImageUrl(imgMap)
        setNameToCoords(coordsMap)
        setLoadedDestinationId(destinationId)
      } catch {
        // Silently ignore – images will show fallback
      }
    }

    void fetchPlaces()
    return () => { cancelled = true }
  }, [destinationId])

  const hasLoadedCurrentDestination = Boolean(destinationId) && loadedDestinationId === destinationId

  return {
    cityEnglishName: hasLoadedCurrentDestination ? cityEnglishName : '',
    cityFallbackImageUrl: hasLoadedCurrentDestination ? cityFallbackImageUrl : '',
    nameToImageUrl: hasLoadedCurrentDestination ? nameToImageUrl : {},
    nameToCoords: hasLoadedCurrentDestination ? nameToCoords : {},
    countryCode: hasLoadedCurrentDestination ? countryCode : 'KR',
  }
}

/**
 * Resolve the best image URL for a stop.
 * Priority: stop.imageUrl → places map → CDN-constructed → ''
 */
const resolveStopImageUrl = (
  stop: PlanStop,
  nameToImageUrl: Record<string, string>,
  cityEnglishName: string,
  countryCode: SmallCityCountry,
): string => {
  if (stop.imageUrl?.trim()) return stop.imageUrl.trim()

  const contentKey = normalizeContentLookupKey(stop.contentId)
  if (contentKey && nameToImageUrl[contentKey]) return nameToImageUrl[contentKey]

  const titleKey = normalizePlaceLookupKey(stop.title)
  if (nameToImageUrl[titleKey]) return nameToImageUrl[titleKey]

  // Fallback: construct CDN URL directly from title romanization
  return buildAttractionImageUrl(cityEnglishName, stop.title, countryCode)
}

const getDropTargetTimeLabel = (stops: PlanStop[], targetIndex: number): PlanStop['time'] => {
  const previousStop = stops
    .slice(0, targetIndex)
    .reverse()
    .find((stop) => !isMealPlaceholderStop(stop))

  if (previousStop) {
    return previousStop.time
  }

  const nextStop = stops
    .slice(targetIndex)
    .find((stop) => !isMealPlaceholderStop(stop))

  return nextStop?.time ?? '점심'
}

const serializeRouteCoordinates = (coordinates: RoutePathCoordinate[]) =>
  coordinates.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join('|')

const parseRouteCoordinateKey = (coordinateKey: string): RoutePathCoordinate[] =>
  coordinateKey
    .split('|')
    .filter(Boolean)
    .map((pair) => {
      const [lng, lat] = pair.split(',').map(Number)
      return Number.isFinite(lng) && Number.isFinite(lat)
        ? ([lng, lat] as RoutePathCoordinate)
        : null
    })
    .filter((coordinate): coordinate is RoutePathCoordinate => coordinate !== null)

// ---------------------------------------------------------------------------
// PlanDetailView component
// ---------------------------------------------------------------------------

type PlanDetailViewProps = {
  isPlannerReady: boolean
  shouldAskFestivalTheme: boolean
  returnToChatWorkspace: () => void
  currentPlanTitle: string
  planDraft: PlanDraft
  plannerBasisLabel: string
  cityImageUrl?: string
  destinationName?: string
  /** destinationId is used to fetch place images from SmallCity API / S3. */
  destinationId?: string
  planId: string
  isSavedPlanDetailLoading?: boolean
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
  isPlanSaving?: boolean
  isGeneratedPlanDetail?: boolean
  allowSavedPlanActions?: boolean
  savedPlanDeletePending?: boolean
  onDeleteSavedPlan: (planId: string, options?: { navigateToMyPage?: boolean }) => void
  openMyPage: () => void
  savedPlanNotice: string | null
  chatMessages?: ChatMessage[]
  onReplacePlanStop?: (dayNumber: number, stopIndex: number, replacement: PlanStop) => void
  onReplacePlanDay?: (dayNumber: number, replacement: PlanDay) => void
  activeThemeIds?: ThemeId[]
  onAddThemePreference?: (themeId: ThemeId) => void
  onRemoveThemePreferences?: (themeIdsToRemove: ThemeId[]) => void
  getSavedPlanLike?: (planId: string) => SavedPlanLike
  onSelectSavedPlanLike?: (planId: string, like: Exclude<SavedPlanLike, null>) => void
  selectedTravelMonth?: number | null
  currentUser?: LovvUser | null
  ownerId?: string
  isPublic?: boolean
  isPlanCloning?: boolean
  cloneSavedPlan?: (planId: string) => Promise<void>
  isShareStatusUpdating?: boolean
  toggleSavedPlanShareStatus?: (planId: string, isPublic: boolean) => Promise<unknown>
  setPendingAuthRedirectPath?: (path: string | null) => void
  addWishlistRestaurant?: (restaurant: SelectedMealPlace) => void
  removeWishlistRestaurant?: (restaurantId: string) => void
}

const createPlanHeroSubtitle = (planDraft: PlanDraft) => {
  const routeStops = planDraft.days
    .flatMap((day) => day.stops)
    .filter((stop) => !isMealPlaceholderStop(stop))
  const stopCount = routeStops.length
  const dayCount = Math.max(1, planDraft.days.length)
  const stopsPerDay = Math.max(1, Math.round(stopCount / dayCount))
  const densityLabel = /덜|여유|느린/.test(planDraft.intensityLabel)
    ? '여유형'
    : /알찬|촘촘|빽빽/.test(planDraft.intensityLabel)
      ? '알찬형'
      : '맞춤형'

  if (stopCount > 0) {
    return `${stopCount}개 방문지를 하루 ${stopsPerDay}곳 안팎으로 나눈 ${densityLabel} 코스`
  }

  return '방문 순서와 이동 흐름을 정리한 맞춤 일정'
}

type PendingPlanEdit =
  | {
      kind: 'stop'
      dayNumber: number
      stopIndex: number
      candidate: PlanStop
    }
  | {
      kind: 'day-confirm'
      dayNumber: number
    }
  | {
      kind: 'day'
      dayNumber: number
      candidate: PlanDay
    }

export function PlanDetailView({
  isPlannerReady,
  shouldAskFestivalTheme,
  returnToChatWorkspace,
  currentPlanTitle,
  planDraft,
  plannerBasisLabel,
  cityImageUrl,
  destinationName,
  destinationId,
  planId,
  isSavedPlanDetailLoading = false,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  isPlanSaving = false,
  isGeneratedPlanDetail = false,
  allowSavedPlanActions = false,
  savedPlanDeletePending = false,
  onDeleteSavedPlan,
  openMyPage,
  savedPlanNotice,
  chatMessages = [],
  onReplacePlanStop,
  onReplacePlanDay,
  activeThemeIds = [],
  onAddThemePreference,
  onRemoveThemePreferences,
  getSavedPlanLike,
  onSelectSavedPlanLike,
  selectedTravelMonth = null,
  currentUser = null,
  ownerId,
  isPublic = false,
  isPlanCloning = false,
  cloneSavedPlan,
  isShareStatusUpdating = false,
  toggleSavedPlanShareStatus,
  setPendingAuthRedirectPath,
  addWishlistRestaurant,
  removeWishlistRestaurant,
}: PlanDetailViewProps) {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Day-by-day tabs (당일 / N일차) instead of one long scroll of every day.
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null)
  const [pendingEdit, setPendingEdit] = useState<PendingPlanEdit | null>(null)
  const [floatingChatOpen, setFloatingChatOpen] = useState(false)
  const [floatingChatInput, setFloatingChatInput] = useState('')
  const [floatingChatNotice, setFloatingChatNotice] = useState<string | null>(null)
  const [collapsedStops, setCollapsedStops] = useState<Record<string, boolean>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [restaurantSearchOpen, setRestaurantSearchOpen] = useState(false)
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('')
  const [restaurantSearchStatus, setRestaurantSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'missing-key' | 'unavailable' | 'zero-result'>('idle')
  const [restaurantSearchResults, setRestaurantSearchResults] = useState<SelectedMealPlace[]>([])
  const [pendingSavedPlanExitAction, setPendingSavedPlanExitAction] = useState<(() => void) | null>(null)

  const toggleStopCollapse = (dayNumber: number, stopIndex: number) => {
    const key = `${dayNumber}-${stopIndex}`
    setCollapsedStops((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const { t } = useTranslation()
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  // --- Rainy season alert & indoor alternative state ---
  const isRainySeason = selectedTravelMonth !== null && [6, 7, 8].includes(selectedTravelMonth)
  const [hasRainyAlertDismissed, setHasRainyAlertDismissed] = useState(false)
  const [showRainyOptions, setShowRainyOptions] = useState(false)
  const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([])

  const feedbackChips = [
    { id: 'healing_rest', label: t('feedback.chip_healing') },
    { id: 'nature_trekking', label: t('feedback.chip_nature') },
    { id: 'history_tradition', label: t('feedback.chip_tradition') },
    { id: 'food_local', label: t('feedback.chip_food') },
  ]

  const handleChipClick = (themeId: ThemeId) => {
    const isCurrentlySelected = activeThemeIds?.includes(themeId)
    if (isCurrentlySelected && onRemoveThemePreferences) {
      onRemoveThemePreferences([themeId])
      setFeedbackNotice(t('feedback.notice_toggled_off'))

      const remainingSelected = (activeThemeIds ?? []).filter(
        (id) => id !== themeId && ['healing_rest', 'nature_trekking', 'history_tradition', 'food_local'].includes(id),
      )
      if (remainingSelected.length === 0 && onSelectSavedPlanLike && getSavedPlanLike?.(planId) === 'like') {
        onSelectSavedPlanLike(planId, 'like')
      }
    } else if (onAddThemePreference) {
      onAddThemePreference(themeId)
      setFeedbackNotice(t('feedback.notice_positive'))

      if (onSelectSavedPlanLike && getSavedPlanLike?.(planId) !== 'like') {
        onSelectSavedPlanLike(planId, 'like')
      }
    }
    setTimeout(() => setFeedbackNotice(null), 3000)
  }

  const handleNegativeClick = () => {
    if (onRemoveThemePreferences && activeThemeIds) {
      onRemoveThemePreferences(activeThemeIds)
      setFeedbackNotice(t('feedback.notice_negative'))

      if (onSelectSavedPlanLike && getSavedPlanLike?.(planId) === 'like') {
        onSelectSavedPlanLike(planId, 'like')
      }
      setTimeout(() => setFeedbackNotice(null), 3000)
    }
  }

  // --- Indoor alternative itinerary helpers ---
  const convertToIndoorDay = (day: PlanDay): PlanDay => {
    const indoorStops = day.stops.map((stop) => {
      const isOutdoor = /해변|바다|해수욕|공원|산|계곡|폭포|올레|트레킹|등산|해안/.test(`${stop.title} ${stop.body}`)
      if (!isOutdoor) return stop
      return {
        ...stop,
        title: stop.title.replace(/해변|바다|해수욕장?/g, '실내 전시·체험관').replace(/공원|산|계곡|폭포/g, '문화·예술 공간'),
        body: '비를 피할 수 있는 실내 공간에서 여유롭게 즐길 수 있는 코스입니다.',
        reason: '우천 시에도 편하게 방문할 수 있는 실내형 대체 코스입니다.',
      }
    })
    return { ...day, stops: indoorStops, title: `${day.title} (실내 대체)`, summary: '비를 피할 수 있는 실내 코스로 구성한 일정입니다.' }
  }

  const handleRainyAlertClick = () => {
    setHasRainyAlertDismissed(true)
    setFloatingChatOpen(true)
    const assistantMsg: ChatMessage = {
      id: createRainyMessageId('rain-prompt'),
      role: 'assistant',
      content: '실내 대체 일정을 생성할 수 있어요. 생성해드릴까요?',
    }
    setLocalChatMessages((prev) => [...prev, assistantMsg])
    setShowRainyOptions(true)
  }

  const handleRainyOptionYes = () => {
    const userMsg: ChatMessage = { id: createRainyMessageId('rain-yes'), role: 'user', content: '네' }
    const replyMsg: ChatMessage = { id: createRainyMessageId('rain-yes-reply'), role: 'assistant', content: '비를 피할 수 있는 실내 코스로 일정을 변경했어요! 저장하면 마이페이지에 반영됩니다.' }
    setLocalChatMessages((prev) => [...prev, userMsg, replyMsg])
    setShowRainyOptions(false)
    if (onReplacePlanDay) {
      days.forEach((day) => {
        onReplacePlanDay(day.day, convertToIndoorDay(day))
      })
    }
  }

  const handleRainyOptionNo = () => {
    const userMsg: ChatMessage = { id: createRainyMessageId('rain-no'), role: 'user', content: '아니오' }
    const replyMsg: ChatMessage = { id: createRainyMessageId('rain-no-reply'), role: 'assistant', content: '알겠습니다. 기존 일정을 그대로 유지할게요.' }
    setLocalChatMessages((prev) => [...prev, userMsg, replyMsg])
    setShowRainyOptions(false)
  }

  // Reset active stop when day changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveStopIndex(null)
  }, [activeDayIndex])

  // Reset to the first day whenever a different plan is opened.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveDayIndex(0)
    setActiveStopIndex(null)
  }, [planId])

  // Fetch place data map (images & coords) for the current destination
  const { cityEnglishName, cityFallbackImageUrl, nameToImageUrl, nameToCoords, countryCode } = usePlaceDataMap(destinationId)
  const planHeroImageUrl = cityImageUrl?.trim() || cityFallbackImageUrl
  const days = planDraft.days
  const safeDayIndex = Math.min(activeDayIndex, Math.max(0, days.length - 1))
  const activeDay = days[safeDayIndex]
  const activeMapStops = (activeDay?.stops ?? []).filter((stop) => !isMealPlaceholderStop(stop))
  const activeRouteCoordinates = getPlanRouteCoordinates(activeMapStops, nameToCoords)
  const activeRouteCoordinateKey = serializeRouteCoordinates(activeRouteCoordinates)
  const hasUserAddedWishlistStop = activeMapStops.some((stop) => stop.wishlistRestaurantId || stop.source === 'wishlist')
  const [openRouteResult, setOpenRouteResult] = useState<{
    key: string
    path: RoutePathCoordinate[] | null
    status: 'ready' | 'fallback'
  } | null>(null)
  const currentOpenRouteResult = openRouteResult?.key === activeRouteCoordinateKey ? openRouteResult : null
  const openRoutePath = currentOpenRouteResult?.status === 'ready' ? currentOpenRouteResult.path : null
  const openRouteStatus: 'idle' | 'loading' | 'ready' | 'fallback' =
    activeRouteCoordinates.length < 2
      ? 'idle'
      : !OPEN_ROUTE_SERVICE_API_KEY
        ? 'fallback'
        : currentOpenRouteResult?.status ?? 'loading'

  useEffect(() => {
    let isCancelled = false

    if (!activeRouteCoordinateKey || !OPEN_ROUTE_SERVICE_API_KEY) {
      return () => {
        isCancelled = true
      }
    }

    const coordinates = parseRouteCoordinateKey(activeRouteCoordinateKey)

    if (coordinates.length < 2) {
      return () => {
        isCancelled = true
      }
    }

    requestOpenRouteServicePath(coordinates, OPEN_ROUTE_SERVICE_API_KEY)
      .then((routePath) => {
        if (isCancelled) {
          return
        }

        if (routePath && routePath.length > 1) {
          setOpenRouteResult({
            key: activeRouteCoordinateKey,
            path: routePath,
            status: 'ready',
          })
          return
        }

        setOpenRouteResult({
          key: activeRouteCoordinateKey,
          path: null,
          status: 'fallback',
        })
      })
      .catch(() => {
        if (!isCancelled) {
          setOpenRouteResult({
            key: activeRouteCoordinateKey,
            path: null,
            status: 'fallback',
          })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activeRouteCoordinateKey])

  const displayedRoutePath = openRoutePath ?? (hasUserAddedWishlistStop ? undefined : activeDay?.route?.geometry?.coordinates)
  const routeStatusLabel =
    openRouteStatus === 'loading'
      ? '실제 도로 동선 계산 중'
      : openRouteStatus === 'ready'
        ? '실제 도로 동선'
        : activeRouteCoordinates.length > 1
          ? '직선 동선 표시'
          : null
  const displayDestinationName = destinationName ?? plannerBasisLabel
  const planHeroSubtitle = createPlanHeroSubtitle(planDraft)
  const isReadOnly = Boolean(isCurrentPlanSaved && ownerId && ownerId !== currentUser?.id)
  const canUseSavedPlanActions = Boolean(isCurrentPlanSaved && !isReadOnly && !isGeneratedPlanDetail && allowSavedPlanActions)
  const canEditSavedPlan = canUseSavedPlanActions && Boolean(onReplacePlanStop && onReplacePlanDay)
  const canUseMealWishlist = Boolean(!isReadOnly && onReplacePlanDay && addWishlistRestaurant)
  const shouldAskSavedPlanExitFeedback =
    canUseSavedPlanActions && Boolean(onSelectSavedPlanLike) && getSavedPlanLike?.(planId) !== 'like'
  const recentChatMessages = chatMessages.slice(-4)
  const selectedMealCount = (planDraft.selectedRestaurants ?? []).length

  const requestSavedPlanExit = (nextAction: () => void) => {
    if (shouldAskSavedPlanExitFeedback) {
      setPendingSavedPlanExitAction(() => nextAction)
      return
    }

    nextAction()
  }

  const confirmSavedPlanExitWithFeedback = () => {
    onSelectSavedPlanLike?.(planId, 'like')
    const nextAction = pendingSavedPlanExitAction
    setPendingSavedPlanExitAction(null)
    nextAction?.()
  }

  const continueSavedPlanExitWithoutFeedback = () => {
    const nextAction = pendingSavedPlanExitAction
    setPendingSavedPlanExitAction(null)
    nextAction?.()
  }

  const handleSaveGeneratedPlanClick = () => {
    if (isCurrentPlanSaved) {
      requestSavedPlanExit(openMyPage)
      return
    }

    if (!currentUser) {
      alert('일정을 저장하려면 로그인이 필요합니다. 로그인 페이지로 이동합니다.')
      setPendingAuthRedirectPath?.(window.location.pathname)
      navigate('/auth')
      return
    }

    saveGeneratedPlan()
  }

  if (isSavedPlanDetailLoading) {
      return (
        <section
          role="status"
          aria-live="polite"
          className="mx-auto min-h-dvh max-w-[1120px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5"
        >
          <div className="rounded-[22px] border border-transparent bg-[#fffffa] p-8 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
            <span
              aria-hidden="true"
              className="block size-9 animate-spin rounded-full border-4 border-[#F3B489]/45 border-t-[#F36B12]"
            />
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
              Plan detail
            </p>
            <h1 className="mt-4 break-keep text-[36px] font-black leading-[46px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9">
              일정 상세를 불러오고 있어요
            </h1>
            <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
              잠시만 기다려 주세요.
            </p>
          </div>
        </section>
      )
    }

    if (!isPlannerReady) {
      return (
        <section className="mx-auto min-h-dvh max-w-[1120px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
          <div className="rounded-[22px] border border-transparent bg-[#fffffa] p-8 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.28)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
              Plan detail
            </p>
            <h1
              id="plan-detail-title"
              className="mt-4 break-keep text-[36px] font-black leading-[46px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
            >
              세부 일정 상세
            </h1>
            <p className="mt-5 break-keep text-sm font-semibold leading-6 text-[#33271E]">
              {shouldAskFestivalTheme
                ? '아직 확정된 일정 초안이 없어요. 챗봇에서 축제 포함 여부와 여행 기간을 먼저 골라주세요.'
                : '아직 확정된 일정 초안이 없어요. 챗봇에서 여행 기간을 먼저 골라주세요.'}
            </p>
            <button
              type="button"
              onClick={returnToChatWorkspace}
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              채팅으로 돌아가기
            </button>
          </div>
        </section>
      )
    }

    const dayTabLabel = (dayNumber: number) => (days.length <= 1 ? '당일' : `${dayNumber}일차`)

    const openStopReplacement = (day: PlanDay, stopIndex: number) => {
      setPendingEdit({
        kind: 'stop',
        dayNumber: day.day,
        stopIndex,
        candidate: createStopReplacementCandidate(day, stopIndex, displayDestinationName),
      })
      setFloatingChatNotice(null)
    }

    const openDayReplacementConfirmation = (dayNumber: number) => {
      setPendingEdit({
        kind: 'day-confirm',
        dayNumber,
      })
      setFloatingChatNotice(null)
    }

    const openDayReplacementCandidate = (dayNumber: number) => {
      const targetDay = days.find((day) => day.day === dayNumber)

      if (!targetDay) {
        return
      }

      setPendingEdit({
        kind: 'day',
        dayNumber,
        candidate: createDayReplacementCandidate(targetDay, displayDestinationName),
      })
    }

    const applyPendingEdit = () => {
      if (!pendingEdit) {
        return
      }

      if (pendingEdit.kind === 'stop' && onReplacePlanStop) {
        onReplacePlanStop(pendingEdit.dayNumber, pendingEdit.stopIndex, pendingEdit.candidate)
      }

      if (pendingEdit.kind === 'day' && onReplacePlanDay) {
        onReplacePlanDay(pendingEdit.dayNumber, pendingEdit.candidate)
      }

      setPendingEdit(null)
    }

    const openRestaurantSearch = () => {
      if (!canUseMealWishlist) {
        return
      }

      setRestaurantSearchQuery(`${displayDestinationName} 맛집`)
      setRestaurantSearchStatus('idle')
      setRestaurantSearchResults([])
      setRestaurantSearchOpen(true)
    }

    const runRestaurantSearch = async () => {
      const query = restaurantSearchQuery.trim()
      if (!query) {
        setRestaurantSearchStatus('zero-result')
        setRestaurantSearchResults([])
        return
      }

      setRestaurantSearchStatus('loading')
      const result = await searchKakaoMealPlaces(query)
      setRestaurantSearchStatus(result.status)
      setRestaurantSearchResults(result.places)
    }

    const selectRestaurant = (place: SelectedMealPlace) => {
      if (!canUseMealWishlist) {
        return
      }

      addWishlistRestaurant?.(place)
      setRestaurantSearchOpen(false)
    }

    const handleDropRestaurant = (restaurant: SelectedMealPlace, targetIndex: number) => {
      if (!canUseMealWishlist || !activeDay || !onReplacePlanDay) return

      const currentStops = [...activeDay.stops]

      const newStop: PlanStop = {
        time: getDropTargetTimeLabel(activeDay.stops, targetIndex),
        title: restaurant.placeName,
        body: restaurant.roadAddressName ?? restaurant.addressName ?? '주소 정보 없음',
        reason: restaurant.phone
          ? `나의 위시리스트에서 드래그하여 추가한 맛집입니다. 전화번호: ${restaurant.phone}`
          : '나의 위시리스트에서 드래그하여 추가한 맛집입니다.',
        source: 'wishlist',
        lockLevel: 'user_added',
        wishlistRestaurantId: restaurant.id,
        imageUrl: '',
        latitude: restaurant.lat ?? null,
        longitude: restaurant.lng ?? null,
        move: '이동 시간 확인 필요',
      }

      const previousStop = currentStops[targetIndex - 1]
      const nextStop = currentStops[targetIndex]
      const restaurantCoords = getPlanStopLatLng(newStop, nameToCoords)

      if (previousStop) {
        currentStops[targetIndex - 1] = {
          ...previousStop,
          move: formatEstimatedMoveLabel(getPlanStopLatLng(previousStop, nameToCoords), restaurantCoords),
        }
      }

      newStop.move = nextStop
        ? formatEstimatedMoveLabel(restaurantCoords, getPlanStopLatLng(nextStop, nameToCoords))
        : '0분'
      currentStops.splice(targetIndex, 0, newStop)

      const updatedDay: PlanDay = {
        ...activeDay,
        stops: currentStops,
      }

      onReplacePlanDay(activeDay.day, updatedDay)
      setFloatingChatNotice('선택한 맛집을 일정 코스 사이에 추가했습니다. 저장하면 반영됩니다.')
    }

    const renderDropZone = (dropIndex: number) => {
      if (!canUseMealWishlist) {
        return null
      }

      return (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('border-[#F36B12]', 'bg-[#FFF0E4]')
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-[#F36B12]', 'bg-[#FFF0E4]')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-[#F36B12]', 'bg-[#FFF0E4]')
            try {
              const data = e.dataTransfer.getData('text/plain')
              if (!data) return
              const restaurant = JSON.parse(data) as SelectedMealPlace
              if (restaurant && restaurant.id) {
                handleDropRestaurant(restaurant, dropIndex)
              }
            } catch (err) {
              console.error('Drop handling failed:', err)
            }
          }}
          aria-label={`${dropIndex + 1}번째 위치에 맛집 드롭`}
          className={`my-3 flex min-h-14 items-center justify-center rounded-[16px] border border-dashed px-4 transition-all duration-200 ${
            isDragging ? 'border-[#F36B12] bg-[#FFF0E4] shadow-[0_12px_28px_-24px_rgba(51,39,30,0.3)]' : 'border-[#F3B489]/55 bg-[#fffffa]/70'
          }`}
        >
          <span className={`break-keep text-[12px] font-black text-[#A92B10] transition-opacity duration-200 ${isDragging ? 'opacity-100' : 'opacity-70'}`}>
            맛집을 이 위치에 드롭해서 코스에 추가
          </span>
        </div>
      )
    }

    const handleFloatingChatSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const command = floatingChatInput.trim()

      if (!command) {
        return
      }

      const editIntent = parsePlannerEditCommand(command, days)

      if (!editIntent) {
        setFloatingChatNotice('현재는 “1일차 일정 바꿔줘” 또는 “1일차 아침 일정 바꿔줘”처럼 세부 일정 수정 요청만 처리할 수 있어요.')
        return
      }

      if (editIntent.type === 'replace_day_confirmation') {
        openDayReplacementConfirmation(editIntent.day)
      } else {
        const targetDay = days.find((day) => day.day === editIntent.day)

        if (targetDay) {
          openStopReplacement(targetDay, editIntent.stopIndex)
        }
      }

      setFloatingChatNotice('요청을 확인했어요. 일정 화면에서 변경 범위를 확정해 주세요.')
      setFloatingChatInput('')
      setFloatingChatOpen(false)
    }

    return (
      <section className="mx-auto min-h-dvh max-w-[1280px] px-16 pb-16 pt-28 max-lg:px-8 max-sm:px-5">
        <div
          role="region"
          aria-labelledby="plan-detail-title"
          className="rounded-[24px] border border-transparent bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]"
        >
          {planHeroImageUrl && (
            <div className="relative h-52 w-full overflow-hidden max-sm:h-36">
              <img
                src={planHeroImageUrl}
                alt={currentPlanTitle}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#33271E]/40 to-transparent" />
            </div>
          )}
          <div className="bg-[#FFF0E4] px-8 py-7 max-sm:px-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-5 max-md:grid-cols-1">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F36B12]">
                  Plan detail
                </p>
                {destinationName ? (
                  <>
                    <h1
                      id="plan-detail-title"
                      className="mt-4 break-keep text-[34px] font-black leading-[44px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                    >
                      {destinationName}
                    </h1>
                    <h2 className="mt-2 break-keep text-xl font-bold leading-8 text-[#33271E]/70 max-sm:text-lg">
                      {planHeroSubtitle}
                    </h2>
                  </>
                ) : (
                  <>
                    <h1
                      id="plan-detail-title"
                      className="mt-4 break-keep text-[34px] font-black leading-[44px] text-[#33271E] max-sm:text-[28px] max-sm:leading-9"
                    >
                      세부 일정 상세
                    </h1>
                    <h2 className="mt-3 break-keep text-[30px] font-black leading-10 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                      {currentPlanTitle}
                    </h2>
                  </>
                )}
                <p className="mt-4 max-w-[760px] break-keep text-sm font-semibold leading-7 text-[#33271E]">
                  {planDraft.summary}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
                {[
                  plannerBasisLabel,
                  planDraft.durationLabel,
                  shouldAskFestivalTheme ? planDraft.festivalThemeLabel : null,
                  planDraft.intensityLabel,
                ].filter((item): item is string => Boolean(item)).map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-9 items-center rounded-full bg-[#fffffa] px-4 py-1 text-[12px] font-black leading-4 text-[#33271E]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(360px,0.85fr)] gap-6 px-8 py-8 max-lg:grid-cols-1 max-sm:px-5">
            {/* Left Column: Timeline Flow */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#33271E]">일차별 시간대 흐름</p>
                  <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                    현재 대화에서 정리한 조건으로 만든 전체 일정 초안입니다.
                  </p>
                </div>
                <span className="rounded-full border border-[#A92B10] bg-[#F36B12] px-4 py-2 text-[12px] font-black text-[#33271E]">
                  {planDraft.dayCount}일 구성
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="일차 선택">
                {days.map((day, index) => {
                  const isActive = index === safeDayIndex
                  return (
                    <button
                      key={day.day}
                      id={`day-tab-${day.day}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`day-panel-${day.day}`}
                      onClick={() => setActiveDayIndex(index)}
                      className={`inline-flex min-h-10 items-center rounded-full px-5 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                        isActive
                          ? 'border border-[#A92B10] bg-[#F36B12] text-[#33271E]'
                          : 'border border-[#F3B489] bg-[#fffffa] text-[#33271E] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
                      }`}
                    >
                      {dayTabLabel(day.day)}
                    </button>
                  )
                })}
              </div>

              {activeDay ? (
                <section
                  role="tabpanel"
                  id={`day-panel-${activeDay.day}`}
                  aria-labelledby={`day-tab-${activeDay.day}`}
                  className="mt-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-[18px] bg-[#FFF7F0] px-5 py-4">
                    <div className="min-w-0">
                      <h3
                        id={`plan-detail-day-heading-${activeDay.day}`}
                        className="break-keep text-lg font-black leading-7 text-[#33271E]"
                      >
                        {activeDay.title}
                      </h3>
                      <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]/75">
                        {activeDay.summary}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex min-h-8 items-center rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                        {activeDay.stops.length}개 코스
                      </span>
                      {canEditSavedPlan ? (
                        <button
                          type="button"
                          onClick={() => openDayReplacementConfirmation(activeDay.day)}
                          className="inline-flex min-h-8 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#A92B10] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          이 일차 바꾸기
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {pendingEdit ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="mt-4 rounded-[18px] border border-[#F3B489] bg-[#fffffa] p-5 shadow-[0_16px_32px_-28px_rgba(51,39,30,0.25)]"
                    >
                      {pendingEdit.kind === 'day-confirm' ? (
                        <>
                          <p className="text-sm font-black text-[#33271E]">
                            {pendingEdit.dayNumber}일차 전체를 바꿀까요, 특정 시간대만 바꿀까요?
                          </p>
                          <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#6E5A50]">
                            전체 일정은 건드리지 않고 선택한 일차만 수정합니다.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openDayReplacementCandidate(pendingEdit.dayNumber)}
                              className="inline-flex min-h-10 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-[12px] font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              {pendingEdit.dayNumber}일차 전체 후보 보기
                            </button>
                            {activeDay.stops.map((stop, stopIndex) => (
                              <button
                                key={`time-choice-${activeDay.day}-${stop.time}`}
                                type="button"
                                onClick={() => openStopReplacement(activeDay, stopIndex)}
                                className="inline-flex min-h-10 items-center rounded-full border border-[#F3B489] bg-[#FFF8F6] px-4 text-[12px] font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                              >
                                {stop.time}만 바꾸기
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setPendingEdit(null)}
                              className="inline-flex min-h-10 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-[12px] font-black text-[#6E5A50] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              취소
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-black text-[#33271E]">
                            {pendingEdit.kind === 'stop'
                              ? `${pendingEdit.dayNumber}일차 ${pendingEdit.candidate.time} 카드만 바꿀까요?`
                              : `${pendingEdit.dayNumber}일차만 대체 일정으로 바꿀까요?`}
                          </p>
                          <div className="mt-3 rounded-[14px] bg-[#FFF0E4] px-4 py-3">
                            <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                              {pendingEdit.kind === 'stop'
                                ? pendingEdit.candidate.title
                                : pendingEdit.candidate.title}
                            </p>
                            <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#6E5A50]">
                              {pendingEdit.kind === 'stop'
                                ? pendingEdit.candidate.body
                                : pendingEdit.candidate.summary}
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={applyPendingEdit}
                              className="inline-flex min-h-10 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-[12px] font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              이 후보로 변경
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingEdit(null)}
                              className="inline-flex min-h-10 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-[12px] font-black text-[#6E5A50] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                            >
                              취소
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-2">
                    {/* Render Dropzone before the first stop */}
                    {renderDropZone(Math.max(0, activeDay.stops.findIndex((s) => !isMealPlaceholderStop(s))))}

                    {/* Filter out meal placeholder stops from the numbered list */}
                    {activeDay.stops.filter((s) => !isMealPlaceholderStop(s)).map((item, index) => {
                      const imageUrl = resolveStopImageUrl(item, nameToImageUrl, cityEnglishName, countryCode)
                      const isStopActive = index === activeStopIndex
                      const isStopCollapsed = collapsedStops[`${activeDay.day}-${index}`] === true

                      return (
                        <div key={`${activeDay.day}-${item.time}-${item.title}`}>
                          <div
                            className={`space-y-3 p-2 rounded-[22px] transition-all duration-200 ${
                              isStopActive ? 'ring-2 ring-[#F36B12]/40 bg-[#FFF7F0]/40 shadow-sm' : ''
                            }`}
                            onMouseEnter={() => setActiveStopIndex(index)}
                          >
                            <article className="grid grid-cols-[42px_minmax(0,1fr)] gap-4">
                              <div className="flex flex-col items-center">
                                <span className="flex size-10 items-center justify-center rounded-full bg-[#F36B12] text-sm font-black text-[#33271E] shadow-[0_8px_18px_-14px_rgba(51,39,30,0.5)]">
                                  {index + 1}
                                </span>
                                {index < activeDay.stops.length - 1 ? (
                                  <span className="mt-2 h-full min-h-8 w-px bg-[#F3B489]/45" />
                                ) : null}
                              </div>
                              <div className="min-w-0 overflow-hidden rounded-[20px] border border-transparent bg-[#FFF0E4]">
                                {/* Attraction image */}
                                {!isStopCollapsed && (
                                  <div className="relative h-40 w-full overflow-hidden max-sm:h-32">
                                    <AttractionImage
                                      src={imageUrl}
                                      alt={item.title}
                                      fallbackSrc={cityFallbackImageUrl}
                                    />
                                  </div>
                                )}

                                <div className="p-5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                                      {item.time}
                                    </span>
                                    <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                                      다음 장소까지 {item.move}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleStopCollapse(activeDay.day, index)}
                                      className="inline-flex min-h-8 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                    >
                                      {isStopCollapsed ? '펼치기 ▼' : '접기 ▲'}
                                    </button>
                                    {canEditSavedPlan ? (
                                      <button
                                        type="button"
                                        onClick={() => openStopReplacement(activeDay, index)}
                                        className="inline-flex min-h-8 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#A92B10] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                      >
                                        이 장소만 바꾸기
                                      </button>
                                    ) : null}
                                  </div>
                                  <h4 className="mt-4 break-keep text-xl font-black leading-8 text-[#33271E] max-sm:text-lg max-sm:leading-7">
                                    {item.title}
                                  </h4>
                                  {!isStopCollapsed && (
                                    <>
                                      <p className="mt-2 break-keep text-sm font-semibold leading-7 text-[#33271E]">
                                        {item.body}
                                      </p>
                                      <div className="mt-4 rounded-[16px] border border-transparent bg-[#fffffa] px-4 py-3">
                                        <p className="text-[12px] font-black text-[#A92B10]">추천 이유</p>
                                        <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                                          {item.reason}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </article>
                          </div>
                          {/* Render Dropzone after this stop */}
                          {renderDropZone(activeDay.stops.indexOf(item) + 1)}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Right Column: actions stay at the top of the detail card; map and wishlist are sticky inside the card. */}
            <div className="flex min-w-0 flex-col gap-5">
              {/* Itinerary Actions Panel */}
              <aside className="shrink-0 rounded-[20px] border border-transparent bg-[#FFF0E4] p-5 shadow-[0_16px_42px_-30px_rgba(51,39,30,0.22)] lg:max-h-[34dvh] lg:overflow-y-auto">
                <p className="text-sm font-black text-[#33271E]">
                  {canUseSavedPlanActions ? '일정 액션' : isReadOnly ? '공유 일정 담기' : '일정 저장'}
                </p>
                <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]/80">
                  {canUseSavedPlanActions
                    ? '저장된 일정에 반응을 남기고 공유 설정을 관리할 수 있습니다.'
                    : isReadOnly
                      ? '마음에 드는 공유 일정을 내 마이페이지에 담아 다시 확인할 수 있습니다.'
                      : '마이페이지에 저장하고 일정을 다시 볼 수 있습니다.'}
                </p>
                {canUseSavedPlanActions ? (
                  <div className="mt-5 rounded-[14px] border border-transparent bg-[#fffffa] p-4">
                    <p className="break-keep text-sm font-black text-[#33271E]">
                      {t('feedback.title')}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {feedbackChips.map((chip) => {
                        const isSelected = activeThemeIds?.includes(chip.id as ThemeId)
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => handleChipClick(chip.id as ThemeId)}
                            className={`inline-flex min-h-10 items-center justify-center rounded-[8px] border px-3 text-[12px] font-bold transition focus-visible:outline focus-visible:outline-2 ${
                              isSelected
                                ? 'border-[#F36B12] bg-[#FFE0CA] text-[#33271E]'
                                : 'border-[#F3B489] bg-[#fffffa] text-[#33271E]/80 hover:bg-[#FFE0CA]'
                            }`}
                          >
                            {chip.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleNegativeClick}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-[8px] border border-gray-200 bg-[#fffffa] px-3 text-[12px] font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition focus-visible:outline focus-visible:outline-2"
                      >
                        {t('feedback.chip_negative')}
                      </button>
                    </div>
                    <p className="mt-2 break-keep text-[10px] font-semibold leading-4 text-[#6E5A50]">
                      {t('feedback.guide_note')}
                    </p>
                    {feedbackNotice && (
                      <p aria-live="polite" className="mt-2 text-[11px] font-bold text-[#A92B10]">
                        {feedbackNotice}
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="mt-5 grid gap-3">
                  {isReadOnly ? (
                    /* 타인의 공유 일정을 보고 있는 읽기 전용 상태: 내 일정으로 담기 버튼 제공 */
                    <button
                      type="button"
                      disabled={isPlanCloning}
                      onClick={() => {
                        if (!currentUser) {
                          alert('일정을 담으려면 로그인이 필요합니다. 로그인 페이지로 이동합니다.')
                          setPendingAuthRedirectPath?.(window.location.pathname)
                          navigate('/auth')
                        } else {
                          cloneSavedPlan?.(planId)
                        }
                      }}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-wait disabled:opacity-75"
                    >
                      {isPlanCloning && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#33271E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isPlanCloning ? '내 일정으로 담는 중...' : '내 일정으로 담기'}
                    </button>
                  ) : (
                    /* 본인의 일정이거나 신규 생성 일정 상태 */
                    <>
                      <button
                        type="button"
                        onClick={handleSaveGeneratedPlanClick}
                        disabled={isPlanSaving}
                        className={`inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                          isPlanSaving
                            ? 'disabled:cursor-wait disabled:opacity-75'
                            : ''
                        }`}
                      >
                        {isPlanSaving && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#33271E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {isCurrentPlanSaved ? '마이페이지로 이동' : isPlanSaving ? '저장 중...' : '마이페이지에 저장'}
                      </button>

                      {canUseSavedPlanActions ? (
                        <>
                          {/* 공개/비공개 설정 토글 버튼 */}
                          <button
                            type="button"
                            disabled={isShareStatusUpdating}
                            onClick={() => toggleSavedPlanShareStatus?.(planId, !isPublic)}
                            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            {isShareStatusUpdating
                              ? '설정 변경 중...'
                              : isPublic
                              ? '공개 일정 (비공개로 변경)'
                              : '비공개 일정 (공개로 변경)'}
                          </button>

                          {/* 공유 링크 복사 버튼 */}
                          <button
                            type="button"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/plans/${planId}`
                              navigator.clipboard.writeText(shareUrl).then(() => {
                                alert('공유 링크가 클립보드에 복사되었습니다!')
                              }).catch(() => {
                                alert('링크 복사에 실패했습니다. 주소창의 URL을 직접 복사해 주세요.')
                              })
                            }}
                            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            공유 링크 복사
                          </button>

                          {/* 저장 일정 삭제 버튼 */}
                          <button
                            type="button"
                            aria-label="저장 일정 삭제"
                            onClick={() => onDeleteSavedPlan(planId, { navigateToMyPage: true })}
                            disabled={savedPlanDeletePending}
                            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#A92B10] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            {savedPlanDeletePending ? '삭제 중' : '저장 일정 삭제'}
                          </button>
                        </>
                      ) : null}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => requestSavedPlanExit(returnToChatWorkspace)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                  >
                    채팅으로 돌아가기
                  </button>
                </div>
                {savedPlanNotice ? (
                  <p aria-live="polite" className="mt-4 break-keep text-sm font-black leading-6 text-[#33271E]">
                    {savedPlanNotice}
                  </p>
                ) : null}
              </aside>

              <div className="grid min-h-0 grid-rows-[minmax(320px,1fr)_minmax(220px,0.75fr)] gap-5 lg:sticky lg:top-[96px] lg:h-[calc(100dvh-7rem)] lg:min-h-[560px] max-lg:grid-rows-none">
                {/* Interactive Route Map Panel */}
                <div className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-white/50 bg-[#fffffa]/30 shadow-[0_16px_42px_-28px_rgba(51,39,30,0.2)] backdrop-blur-sm max-lg:h-[420px]">
                  <PlanDetailGoogleMap
                    stops={activeMapStops}
                    wishlistRestaurants={planDraft.selectedRestaurants ?? []}
                    nameToCoords={nameToCoords}
                    countryCode={countryCode}
                    activeStopIndex={activeStopIndex}
                    onSelectStopIndex={setActiveStopIndex}
                    routePath={displayedRoutePath}
                  />
                  {routeStatusLabel ? (
                    <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-white/70 bg-[#fffffa]/90 px-3 py-1 text-[11px] font-black text-[#A92B10] shadow-[0_10px_28px_-20px_rgba(51,39,30,0.4)] backdrop-blur">
                      {routeStatusLabel}
                    </span>
                  ) : null}
                </div>

                {/* 나의 맛집 위시리스트 (Pocket) */}
                {canUseMealWishlist ? (
                  <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#F3B489] bg-[#fffffa] p-5 shadow-[0_14px_36px_-24px_rgba(51,39,30,0.2)] max-lg:max-h-[420px]">
                  <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-black text-[#33271E]">
                        <span>위시리스트</span>
                      </h4>
                      <p className="mt-1 break-keep text-[11px] font-semibold leading-5 text-[#6E5A50]">
                        가고 싶은 맛집을 검색해 담고, 왼쪽 코스로 드래그하여 끼워 넣으세요!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openRestaurantSearch}
                      className="inline-flex min-h-9 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-[12px] font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      검색 및 추가
                    </button>
                  </div>

                  {(planDraft.selectedRestaurants ?? []).length > 0 ? (
                    <ul className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-6 pr-1" aria-label="담아둔 맛집 목록">
                      {(planDraft.selectedRestaurants ?? []).map((restaurant) => (
                        <li
                          key={restaurant.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify(restaurant))
                            setIsDragging(true)
                          }}
                          onDragEnd={() => {
                            setIsDragging(false)
                          }}
                          className="flex cursor-grab flex-wrap items-start justify-between gap-4 rounded-[18px] border border-[#F3B489]/30 bg-[#FFF8F6] p-4 transition-colors hover:border-[#F36B12] active:cursor-grabbing"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="break-keep text-sm font-black leading-6 text-[#33271E]">
                              {restaurant.placeName}
                            </h5>
                            <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                              {restaurant.roadAddressName ?? restaurant.addressName ?? '주소 정보 없음'}
                            </p>
                            {restaurant.phone ? (
                              <p className="mt-0.5 text-[11px] font-semibold text-[#6E5A50]/80">
                                전화: {restaurant.phone}
                              </p>
                            ) : null}
                            {restaurant.placeUrl ? (
                              <a
                                href={restaurant.placeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex text-[11px] font-black text-[#A92B10] underline-offset-4 hover:underline"
                              >
                                상세 보기
                              </a>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeWishlistRestaurant?.(restaurant.id)}
                            className="inline-flex min-h-8 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-3 text-[11px] font-black text-[#A92B10] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            제거
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-dashed border-[#F3B489]/50 bg-[#FFF8F6]/30 py-7 text-center">
                      <p className="break-keep text-xs font-semibold leading-5 text-[#6E5A50]">
                        아직 담긴 장소가 없습니다.
                      </p>
                    </div>
                  )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {restaurantSearchOpen && canUseMealWishlist ? (
          <section
            aria-label="맛집 검색 및 추가"
            className="fixed bottom-24 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] border border-white/65 bg-[#fffffa]/95 shadow-[0_24px_56px_-28px_rgba(51,39,30,0.3)] backdrop-blur-2xl max-sm:bottom-20 max-sm:right-4"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[#F3B489]/35 bg-[#FFF0E4]/80 px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#A92B10]">
                  Restaurant Wishlist
                </p>
                <h3 className="mt-1 break-keep text-lg font-black leading-7 text-[#33271E]">
                  맛집 검색 및 추가
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestaurantSearchOpen(false)}
                aria-label="맛집 검색 닫기"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                ×
              </button>
            </header>
            <div className="p-5">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void runRestaurantSearch()
                }}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
              >
                <label htmlFor="restaurant-place-query" className="sr-only">
                  맛집 검색어
                </label>
                <input
                  id="restaurant-place-query"
                  value={restaurantSearchQuery}
                  onChange={(event) => setRestaurantSearchQuery(event.target.value)}
                  className="min-h-11 rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-semibold text-[#33271E] outline-none transition placeholder:text-[#6E5A50]/65 focus:border-[#F36B12] focus:ring-2 focus:ring-[#F36B12]/20"
                />
                <button
                  type="submit"
                  disabled={restaurantSearchStatus === 'loading'}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {restaurantSearchStatus === 'loading' ? '검색 중' : '검색'}
                </button>
              </form>

              <a
                href={createKakaoMapSearchUrl(restaurantSearchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-[12px] font-black text-[#A92B10] underline-offset-4 hover:underline"
              >
                카카오맵에서 직접 검색하기
              </a>

              {restaurantSearchStatus === 'idle' ? (
                <p className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-semibold leading-5 text-[#6E5A50]">
                  검색 버튼을 누르면 Kakao Places 후보를 불러옵니다. 키가 없거나 실패하면 위 링크로 직접 확인할 수 있어요.
                </p>
              ) : null}
              {restaurantSearchStatus === 'missing-key' || restaurantSearchStatus === 'unavailable' ? (
                <p className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-semibold leading-5 text-[#6E5A50]">
                  현재 브라우저에서 Kakao Places 검색을 사용할 수 없어 링크 검색으로 확인해 주세요.
                </p>
              ) : null}
              {restaurantSearchStatus === 'zero-result' ? (
                <p className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-semibold leading-5 text-[#6E5A50]">
                  검색 결과가 없습니다. 장소명이나 지역명을 조금 바꿔 검색해 주세요.
                </p>
              ) : null}
              {restaurantSearchResults.length > 0 ? (
                <ol className="mt-4 grid max-h-[300px] gap-2 overflow-y-auto" aria-label="식사 장소 후보">
                  {restaurantSearchResults.map((place) => (
                    <li key={place.id} className="rounded-[14px] border border-[#F3B489]/45 bg-[#FFF8F6] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-keep text-sm font-black leading-6 text-[#33271E]">
                            {place.placeName}
                          </p>
                          <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                            {place.roadAddressName ?? place.addressName ?? '주소 정보 없음'}
                          </p>
                          <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                            {place.phone ? `전화 ${place.phone}` : '영업 정보는 카카오맵 상세에서 확인'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectRestaurant(place)}
                          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-3 text-[12px] font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          추가
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </section>
        ) : null}
        {canEditSavedPlan ? (
          <div className="fixed bottom-6 right-6 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 max-sm:bottom-4 max-sm:right-4">
            {floatingChatOpen ? (
              <section
                aria-label="세부 일정 수정 챗봇"
                className="w-[380px] max-w-full overflow-hidden rounded-[22px] border border-white/65 bg-[#fffffa]/90 shadow-[0_24px_56px_-28px_rgba(51,39,30,0.28)] backdrop-blur-2xl"
              >
                <header className="flex items-start justify-between gap-3 border-b border-[#F3B489]/35 bg-[#FFF0E4]/80 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#A92B10]">
                      Lovv edit
                    </p>
                    <h3 className="mt-1 break-keep text-lg font-black leading-7 text-[#33271E]">
                      세부 일정 수정
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFloatingChatOpen(false)}
                    aria-label="세부 일정 수정 챗봇 닫기"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                  >
                    ×
                  </button>
                </header>
                <div className="max-h-[360px] overflow-y-auto px-5 py-4">
                  <p className="break-keep text-[13px] font-semibold leading-6 text-[#6E5A50]">
                    현재는 특정 일차나 시간대 변경 요청을 확인 후 처리합니다. 전체 일정은 그대로 유지됩니다.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2" aria-label="현재 반영된 조건">
                    {[plannerBasisLabel, planDraft.durationLabel, planDraft.intensityLabel, selectedMealCount > 0 ? `식사 ${selectedMealCount}곳` : null]
                      .filter(Boolean)
                      .map((condition) => (
                        <span
                          key={condition}
                          className="rounded-full bg-[#FFF0E4] px-3 py-1 text-[12px] font-black text-[#33271E]"
                        >
                          {condition}
                        </span>
                      ))}
                  </div>
                  {[...recentChatMessages, ...localChatMessages].length > 0 ? (
                    <div className="mt-4 space-y-3" aria-label="최근 대화">
                      {[...recentChatMessages, ...localChatMessages].map((message) => {
                        const isAssistantMessage = message.role === 'assistant'

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isAssistantMessage ? 'justify-start' : 'justify-end'}`}
                          >
                            <p
                              className={`relative max-w-[74%] break-keep rounded-[16px] px-3 py-2 text-[12px] font-semibold leading-5 shadow-[0_10px_24px_-20px_rgba(51,39,30,0.35)] ${
                                isAssistantMessage
                                  ? 'rounded-bl-[6px] bg-[#FFF0E4] text-[#33271E]'
                                  : 'rounded-br-[6px] bg-[#F36B12] text-[#33271E]'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute bottom-2 size-3 rotate-45 ${
                                  isAssistantMessage ? '-left-1 bg-[#FFF0E4]' : '-right-1 bg-[#F36B12]'
                                }`}
                              />
                              <span className="relative">{message.content}</span>
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                  {showRainyOptions ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleRainyOptionYes}
                        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-[12px] font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        네
                      </button>
                      <button
                        type="button"
                        onClick={handleRainyOptionNo}
                        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-[12px] font-black text-[#6E5A50] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                      >
                        아니오
                      </button>
                    </div>
                  ) : null}
                  {floatingChatNotice ? (
                    <p
                      role="status"
                      className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-black leading-5 text-[#A92B10]"
                    >
                      {floatingChatNotice}
                    </p>
                  ) : null}
                </div>
                <form onSubmit={handleFloatingChatSubmit} className="border-t border-[#F3B489]/35 bg-[#FFF8F6]/80 p-4">
                  <label htmlFor="plan-detail-floating-chat" className="sr-only">
                    세부 일정 수정 요청
                  </label>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <input
                      id="plan-detail-floating-chat"
                      value={floatingChatInput}
                      onChange={(event) => setFloatingChatInput(event.target.value)}
                      placeholder="예: 1일차 아침 일정 바꿔줘"
                      className="min-h-11 rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-semibold text-[#33271E] outline-none transition placeholder:text-[#6E5A50]/65 focus:border-[#F36B12] focus:ring-2 focus:ring-[#F36B12]/20"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      확인
                    </button>
                  </div>
                </form>
              </section>
            ) : null}
            {/* Rainy season floating alert bubble */}
            {isRainySeason && !hasRainyAlertDismissed && !floatingChatOpen ? (
              <button
                type="button"
                onClick={handleRainyAlertClick}
                className="animate-bounce-slow relative max-w-[260px] rounded-[16px] border border-white/65 bg-[#fffffa]/95 px-4 py-3 text-left shadow-[0_16px_40px_-20px_rgba(51,39,30,0.3)] backdrop-blur-2xl transition hover:shadow-[0_20px_48px_-20px_rgba(51,39,30,0.4)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 right-6 size-4 rotate-45 border-b border-r border-white/65 bg-[#fffffa]/95"
                />
                <p className="text-[13px] font-black leading-5 text-[#A92B10]">
                  🌧️ 해당 월에는 비가 올 수 있어요.
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-[#6E5A50]">
                  실내 대체 일정 보러가기
                </p>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setFloatingChatOpen((isOpen) => !isOpen)
                if (isRainySeason && !hasRainyAlertDismissed) {
                  handleRainyAlertClick()
                }
              }}
              aria-expanded={floatingChatOpen}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] shadow-[0_16px_34px_-20px_rgba(51,39,30,0.45)] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              <span aria-hidden="true">✦</span>
              Lovv 챗봇
            </button>
          </div>
        ) : null}
        {pendingSavedPlanExitAction ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-plan-exit-feedback-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#33271E]/35 px-5 backdrop-blur-sm"
          >
            <div className="w-full max-w-[420px] rounded-[24px] border border-white/70 bg-[#fffffa] p-6 shadow-[0_24px_70px_-30px_rgba(51,39,30,0.45)]">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#F36B12]">
                Feedback
              </p>
              <h2
                id="saved-plan-exit-feedback-title"
                className="mt-3 break-keep text-2xl font-black leading-8 text-[#33271E]"
              >
                이 일정이 마음에 드셨나요?
              </h2>
              <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#6E5A50]">
                저장된 일정을 둘러본 뒤 남긴 반응은 다음 추천과 인기 순위에 반영됩니다.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 max-sm:grid-cols-1">
                <button
                  type="button"
                  onClick={confirmSavedPlanExitWithFeedback}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  반응 남기고 이동
                </button>
                <button
                  type="button"
                  onClick={continueSavedPlanExitWithoutFeedback}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  그냥 이동
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    )
}
