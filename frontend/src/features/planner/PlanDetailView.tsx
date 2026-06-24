import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ChatMessage, PlanDay, PlanDraft, PlanStop, SavedPlanLike } from '../../shared/types/app'
import type { SmallCityCountry } from '../map-city/smallCities'
import { requestGetSmallCityPlaces } from '../../shared/api/smallCityApi'
import { PlanDetailGoogleMap } from './PlanDetailGoogleMap'
import { SavedPlanLikeControls } from '../saved-plans/SavedPlanLikeControls'
import {
  createDayReplacementCandidate,
  createStopReplacementCandidate,
  parsePlannerEditCommand,
} from './plannerEditModel'
import { searchKakaoMealPlaces } from './kakaoMealSearch'
import {
  createKakaoMapSearchUrl,
  createMealSlotDescriptors,
  type MealSlotDescriptor,
  type SelectedMealPlace,
} from './plannerMealModel'
import { buildAttractionImageUrl as buildAttractionImageUrlFromModel } from './plannerImageModel'

// ---------------------------------------------------------------------------
// Image URL helpers (Task 13 – S3 / CloudFront integration)
// ---------------------------------------------------------------------------

const IMAGE_CDN_BASE = (import.meta.env.VITE_IMAGE_CDN_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') ?? ''

/**
 * Build the CloudFront URL for an attraction image.
 * Current deployed image source is KR-only; pass country into the image model
 * when JP attraction image keys are confirmed.
 * Pattern: images/KR/<cityEnglishName>/<RomanizedTitle>_1.jpg
 *
 * @param cityEnglishName  – e.g. "Gangneung"
 * @param title            – Korean attraction name, e.g. "경포해수욕장"
 */
const buildAttractionImageUrl = (cityEnglishName: string, title: string): string => {
  return buildAttractionImageUrlFromModel(IMAGE_CDN_BASE, cityEnglishName, title, 'KR')
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
}

const AttractionImage = ({ src, alt }: AttractionImageProps) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [errorSrc, setErrorSrc] = useState<string | null>(null)
  const isLoaded = loadedSrc === src

  if (!src || errorSrc === src) {
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
        key={src}
        src={src}
        alt={alt}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setErrorSrc(src)}
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
  const [nameToImageUrl, setNameToImageUrl] = useState<Record<string, string>>({})
  const [nameToCoords, setNameToCoords] = useState<Record<string, { lat: number; lng: number }>>({})
  const [countryCode, setCountryCode] = useState<SmallCityCountry>('KR')
  const prevId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!destinationId || destinationId === prevId.current) return
    prevId.current = destinationId

    let cancelled = false

    const fetchPlaces = async () => {
      try {
        const result = await requestGetSmallCityPlaces(destinationId)
        if (cancelled) return

        const derivedCountry = destinationId.startsWith('JP') ? 'JP' : 'KR'
        setCountryCode(derivedCountry)

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
            buildAttractionImageUrl(derivedEnglishName, place.name)
          const key = place.name.trim().toLowerCase().replace(/\s+/g, '')
          if (url) {
            imgMap[key] = url
          }
          if (place.latitude != null && place.longitude != null) {
            coordsMap[key] = { lat: place.latitude, lng: place.longitude }
          }
        })
        setNameToImageUrl(imgMap)
        setNameToCoords(coordsMap)
      } catch {
        // Silently ignore – images will show fallback
      }
    }

    void fetchPlaces()
    return () => { cancelled = true }
  }, [destinationId])

  return { cityEnglishName, nameToImageUrl, nameToCoords, countryCode }
}

/**
 * Resolve the best image URL for a stop.
 * Priority: stop.imageUrl → places map → CDN-constructed → ''
 */
const resolveStopImageUrl = (
  stop: PlanStop,
  nameToImageUrl: Record<string, string>,
  cityEnglishName: string,
): string => {
  if (stop.imageUrl?.trim()) return stop.imageUrl.trim()

  const key = stop.title.trim().toLowerCase().replace(/\s+/g, '')
  if (nameToImageUrl[key]) return nameToImageUrl[key]

  // Fallback: construct CDN URL directly from title romanization
  return buildAttractionImageUrl(cityEnglishName, stop.title)
}

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
  planLike: SavedPlanLike
  onSelectSavedPlanLike: (planId: string, like: Exclude<SavedPlanLike, null>) => void
  savedPlanLikePending?: boolean
  savedPlanLikeError?: string | null
  isSavedPlanDetailLoading?: boolean
  saveGeneratedPlan: () => void
  isCurrentPlanSaved: boolean
  isPlanSaving?: boolean
  savedPlanDeletePending?: boolean
  onDeleteSavedPlan: (planId: string, options?: { navigateToMyPage?: boolean }) => void
  openMyPage: () => void
  savedPlanNotice: string | null
  chatMessages?: ChatMessage[]
  onReplacePlanStop?: (dayNumber: number, stopIndex: number, replacement: PlanStop) => void
  onReplacePlanDay?: (dayNumber: number, replacement: PlanDay) => void
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

type MealSearchPanelState = {
  slot: MealSlotDescriptor
  query: string
  status: 'idle' | 'loading' | 'ready' | 'missing-key' | 'unavailable' | 'zero-result'
  places: SelectedMealPlace[]
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
  planLike,
  onSelectSavedPlanLike,
  savedPlanLikePending = false,
  savedPlanLikeError = null,
  isSavedPlanDetailLoading = false,
  saveGeneratedPlan,
  isCurrentPlanSaved,
  isPlanSaving = false,
  savedPlanDeletePending = false,
  onDeleteSavedPlan,
  openMyPage,
  savedPlanNotice,
  chatMessages = [],
  onReplacePlanStop,
  onReplacePlanDay,
}: PlanDetailViewProps) {
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
  const [selectedMealPlaces, setSelectedMealPlaces] = useState<Record<string, SelectedMealPlace>>({})
  const [mealSearchPanel, setMealSearchPanel] = useState<MealSearchPanelState | null>(null)

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
  const { cityEnglishName, nameToImageUrl, nameToCoords, countryCode } = usePlaceDataMap(destinationId)

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

    const days = planDraft.days
    const safeDayIndex = Math.min(activeDayIndex, Math.max(0, days.length - 1))
    const activeDay = days[safeDayIndex]
    const dayTabLabel = (dayNumber: number) => (days.length <= 1 ? '당일' : `${dayNumber}일차`)
    const displayDestinationName = destinationName ?? plannerBasisLabel
    const canEditGeneratedPlan = Boolean(onReplacePlanStop && onReplacePlanDay)
    const recentChatMessages = chatMessages.slice(-4)
    const selectedMealCount = Object.keys(selectedMealPlaces).length

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

    const openMealSearchPanel = (slot: MealSlotDescriptor) => {
      setMealSearchPanel({
        slot,
        query: slot.query,
        status: 'idle',
        places: [],
      })
    }

    const runMealSearch = async (panel = mealSearchPanel) => {
      if (!panel) {
        return
      }

      const query = panel.query.trim()

      if (!query) {
        setMealSearchPanel({
          ...panel,
          status: 'zero-result',
          places: [],
        })
        return
      }

      setMealSearchPanel({
        ...panel,
        status: 'loading',
      })

      const result = await searchKakaoMealPlaces(query)

      setMealSearchPanel({
        ...panel,
        status: result.status,
        places: result.places,
      })
    }

    const selectMealPlace = (slotId: string, place: SelectedMealPlace) => {
      setSelectedMealPlaces((currentPlaces) => ({
        ...currentPlaces,
        [slotId]: place,
      }))
      setMealSearchPanel(null)
      setFloatingChatNotice('선택한 식사 장소를 세부 일정에 추가했어요. 아직 이 화면 안에서만 반영됩니다.')
    }

    const removeMealPlace = (slotId: string) => {
      setSelectedMealPlaces((currentPlaces) => {
        const nextPlaces = { ...currentPlaces }

        delete nextPlaces[slotId]

        return nextPlaces
      })
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
          className="overflow-hidden rounded-[24px] border border-transparent bg-[#fffffa] shadow-[0_18px_48px_-32px_rgba(51,39,30,0.35)]"
        >
          {cityImageUrl && (
            <div className="relative h-52 w-full overflow-hidden max-sm:h-36">
              <img
                src={cityImageUrl}
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
                      {currentPlanTitle}
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
                      {canEditGeneratedPlan ? (
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

                  <div className="mt-4 space-y-4">
                    {activeDay.stops.map((item, index) => {
                      const imageUrl = resolveStopImageUrl(item, nameToImageUrl, cityEnglishName)
                      const mealSlot = createMealSlotDescriptors(activeDay).find((slot) => slot.afterStopIndex === index)
                      const selectedMealPlace = mealSlot ? selectedMealPlaces[mealSlot.id] : null
                      const isStopActive = index === activeStopIndex

                      return (
                        <div
                          key={`${activeDay.day}-${item.time}-${item.title}`}
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
                              <div className="relative h-40 w-full overflow-hidden max-sm:h-32">
                                <AttractionImage src={imageUrl} alt={item.title} />
                              </div>

                              <div className="p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-black leading-4 text-[#33271E]">
                                    {item.time}
                                  </span>
                                  <span className="rounded-full bg-[#fffffa] px-3 py-1 text-[12px] font-bold leading-4 text-[#33271E]">
                                    다음 장소까지 {item.move}
                                  </span>
                                  {canEditGeneratedPlan ? (
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
                                <p className="mt-2 break-keep text-sm font-semibold leading-7 text-[#33271E]">
                                  {item.body}
                                </p>
                                <div className="mt-4 rounded-[16px] border border-transparent bg-[#fffffa] px-4 py-3">
                                  <p className="text-[12px] font-black text-[#A92B10]">추천 이유</p>
                                  <p className="mt-1 break-keep text-sm font-semibold leading-6 text-[#33271E]">
                                    {item.reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </article>
                          {mealSlot ? (
                            <div className="ml-[58px] rounded-[18px] border border-dashed border-[#F3B489] bg-[#fffffa] p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[12px] font-black text-[#A92B10]">{mealSlot.label}</p>
                                  {selectedMealPlace ? (
                                    <>
                                      <h5 className="mt-2 break-keep text-base font-black leading-6 text-[#33271E]">
                                        {selectedMealPlace.placeName}
                                      </h5>
                                      <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                                        {selectedMealPlace.roadAddressName ?? selectedMealPlace.addressName ?? '주소 정보 없음'}
                                      </p>
                                      <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                                        {selectedMealPlace.phone ? `전화 ${selectedMealPlace.phone}` : '영업 정보는 카카오맵 상세에서 확인해 주세요.'}
                                      </p>
                                      {selectedMealPlace.placeUrl ? (
                                        <a
                                          href={selectedMealPlace.placeUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-2 inline-flex text-[12px] font-black text-[#A92B10] underline-offset-4 hover:underline"
                                        >
                                          카카오맵 상세 보기
                                        </a>
                                      ) : null}
                                    </>
                                  ) : (
                                    <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#6E5A50]">
                                      {mealSlot.query}으로 음식점을 고르면 이 구간에만 반영됩니다.
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openMealSearchPanel(mealSlot)}
                                    className="inline-flex min-h-9 items-center rounded-full border border-[#F3B489] bg-[#FFF8F6] px-4 text-[12px] font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                  >
                                    {selectedMealPlace ? '다시 고르기' : '식사 장소 고르기'}
                                  </button>
                                  {selectedMealPlace ? (
                                    <button
                                      type="button"
                                      onClick={() => removeMealPlace(mealSlot.id)}
                                      className="inline-flex min-h-9 items-center rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-[12px] font-black text-[#A92B10] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                                    >
                                      제거
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Right Column: Sticky Sidebar containing Interactive Map & Actions */}
            <div className="space-y-6 lg:sticky lg:top-[96px] lg:h-[calc(100dvh-9rem)] lg:min-h-[640px] flex flex-col min-w-0 max-lg:h-auto max-lg:min-h-0">
              {/* Interactive Route Map Panel */}
              <div className="flex-1 min-h-[380px] overflow-hidden rounded-[24px] border border-white/50 bg-[#fffffa]/30 shadow-[0_16px_42px_-28px_rgba(51,39,30,0.2)] backdrop-blur-sm max-lg:h-[420px]">
                <PlanDetailGoogleMap
                  stops={activeDay?.stops ?? []}
                  nameToCoords={nameToCoords}
                  countryCode={countryCode}
                  activeStopIndex={activeStopIndex}
                  onSelectStopIndex={setActiveStopIndex}
                />
              </div>

              {/* Itinerary Actions Panel */}
              <aside className="rounded-[20px] border border-transparent bg-[#FFF0E4] p-5 shrink-0">
                <p className="text-sm font-black text-[#33271E]">일정 액션</p>
                <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#33271E]/80">
                  일정을 살펴본 뒤 피드백을 남기거나 마이페이지에 저장해 다시 확인할 수 있습니다.
                </p>
                <div className="mt-5 rounded-[14px] border border-transparent bg-[#fffffa] p-4">
                  <p id="plan-detail-like-title" className="break-keep text-sm font-black text-[#33271E]">
                    이 일정은 어땠나요?
                  </p>
                  <p className="mt-1 break-keep text-[12px] font-bold leading-5 text-[#6E5A50]">
                    좋아요를 누르면 저장되고, 다시 누르면 해제됩니다.
                  </p>
                  <div className="mt-3">
                    <SavedPlanLikeControls
                      planId={planId}
                      like={planLike}
                      onSelectLike={onSelectSavedPlanLike}
                      pending={savedPlanLikePending}
                      errorMessage={savedPlanLikeError}
                      labelledBy="plan-detail-like-title"
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={saveGeneratedPlan}
                    disabled={isCurrentPlanSaved || isPlanSaving}
                    className={`inline-flex min-h-12 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] ${
                      isCurrentPlanSaved
                        ? 'disabled:cursor-default disabled:bg-[#FF8A2A]'
                        : isPlanSaving
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
                    {isCurrentPlanSaved ? '마이페이지에 저장됨' : isPlanSaving ? '저장 중...' : '마이페이지에 저장'}
                  </button>
                  {isCurrentPlanSaved ? (
                    <button
                      type="button"
                      aria-label="저장 일정 삭제"
                      onClick={() => onDeleteSavedPlan(planId, { navigateToMyPage: true })}
                      disabled={savedPlanDeletePending}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#A92B10] transition hover:border-[#A92B10] hover:bg-[#FFE0CA] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                    >
                      {savedPlanDeletePending ? '삭제 중' : '저장 일정 삭제'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={returnToChatWorkspace}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                  >
                    채팅으로 돌아가기
                  </button>
                  <button
                    type="button"
                    onClick={openMyPage}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                  >
                    마이페이지로 이동
                  </button>
                </div>
                {savedPlanNotice ? (
                  <p aria-live="polite" className="mt-4 break-keep text-sm font-black leading-6 text-[#33271E]">
                    {savedPlanNotice}
                  </p>
                ) : null}
              </aside>
            </div>
          </div>
        </div>
        {mealSearchPanel ? (
          <section
            aria-label={`${mealSearchPanel.slot.label} 장소 검색`}
            className="fixed bottom-24 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] border border-white/65 bg-[#fffffa]/95 shadow-[0_24px_56px_-28px_rgba(51,39,30,0.3)] backdrop-blur-2xl max-sm:bottom-20 max-sm:right-4"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[#F3B489]/35 bg-[#FFF0E4]/80 px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#A92B10]">
                  Meal place
                </p>
                <h3 className="mt-1 break-keep text-lg font-black leading-7 text-[#33271E]">
                  {mealSearchPanel.slot.label} 장소 고르기
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMealSearchPanel(null)}
                aria-label="식사 장소 검색 닫기"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] text-sm font-black text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
              >
                ×
              </button>
            </header>
            <div className="p-5">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void runMealSearch()
                }}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
              >
                <label htmlFor="meal-place-query" className="sr-only">
                  식사 장소 검색어
                </label>
                <input
                  id="meal-place-query"
                  value={mealSearchPanel.query}
                  onChange={(event) =>
                    setMealSearchPanel((currentPanel) =>
                      currentPanel
                        ? {
                            ...currentPanel,
                            query: event.target.value,
                          }
                        : currentPanel,
                    )
                  }
                  className="min-h-11 rounded-full border border-[#F3B489] bg-[#fffffa] px-4 text-sm font-semibold text-[#33271E] outline-none transition placeholder:text-[#6E5A50]/65 focus:border-[#F36B12] focus:ring-2 focus:ring-[#F36B12]/20"
                />
                <button
                  type="submit"
                  disabled={mealSearchPanel.status === 'loading'}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-4 text-sm font-black text-[#33271E] transition hover:bg-[#FF8A2A] disabled:cursor-wait disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                >
                  {mealSearchPanel.status === 'loading' ? '검색 중' : '검색'}
                </button>
              </form>

              <a
                href={createKakaoMapSearchUrl(mealSearchPanel.query)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-[12px] font-black text-[#A92B10] underline-offset-4 hover:underline"
              >
                카카오맵에서 직접 검색하기
              </a>

              {mealSearchPanel.status === 'idle' ? (
                <p className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-semibold leading-5 text-[#6E5A50]">
                  검색 버튼을 누르면 Kakao Places 후보를 불러옵니다. 키가 없거나 실패하면 위 링크로 직접 확인할 수 있어요.
                </p>
              ) : null}
              {mealSearchPanel.status === 'missing-key' || mealSearchPanel.status === 'unavailable' ? (
                <p className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-semibold leading-5 text-[#6E5A50]">
                  현재 브라우저에서 Kakao Places 검색을 사용할 수 없어 링크 검색으로 확인해 주세요.
                </p>
              ) : null}
              {mealSearchPanel.status === 'zero-result' ? (
                <p className="mt-4 break-keep rounded-[14px] bg-[#FFF0E4] px-3 py-2 text-[12px] font-semibold leading-5 text-[#6E5A50]">
                  검색 결과가 없습니다. 장소명이나 지역명을 조금 바꿔 검색해 주세요.
                </p>
              ) : null}
              {mealSearchPanel.places.length > 0 ? (
                <ol className="mt-4 grid max-h-[300px] gap-2 overflow-y-auto" aria-label="식사 장소 후보">
                  {mealSearchPanel.places.map((place) => (
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
                          onClick={() => selectMealPlace(mealSearchPanel.slot.id, place)}
                          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-[#A92B10] bg-[#F36B12] px-3 text-[12px] font-black text-[#33271E] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                        >
                          선택
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </section>
        ) : null}
        {canEditGeneratedPlan ? (
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
                  {recentChatMessages.length > 0 ? (
                    <div className="mt-4 space-y-3" aria-label="최근 대화">
                      {recentChatMessages.map((message) => {
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
            <button
              type="button"
              onClick={() => setFloatingChatOpen((isOpen) => !isOpen)}
              aria-expanded={floatingChatOpen}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-sm font-black text-[#33271E] shadow-[0_16px_34px_-20px_rgba(51,39,30,0.45)] transition hover:bg-[#FF8A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
            >
              <span aria-hidden="true">✦</span>
              일정 수정 챗봇
            </button>
          </div>
        ) : null}
      </section>
    )
}
