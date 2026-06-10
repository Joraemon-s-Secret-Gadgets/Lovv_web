import logoImage from '../../assets/lovv-logo.png'
import type { CityCoverImage, Preference, ThemeId } from '../../shared/types/app'
import { getPreferenceByThemeId, themeDefinitions } from './preferenceModel'

type PreferencePreviewImage = CityCoverImage & {
  key: string
  tag: string
  themeIndex: number
}

type OnboardingPreferenceViewProps = {
  isPreferenceEditView: boolean
  hasSelectedCover: boolean
  activeThemeIds: ThemeId[]
  activeThemeLabels: string[]
  activeThemePreferences: Preference[]
  hasValidThemeSelection: boolean
  themeSelectionNotice: string | null
  selectedPreviewThemePosition: string
  selectedPreviewPreference: Preference
  selectedPreviewPrimaryImage: PreferencePreviewImage
  selectedPreviewTrayCover?: PreferencePreviewImage
  selectedPreviewThumbnails: PreferencePreviewImage[]
  isPreviewTrayOpen: boolean
  onToggleTheme: (themeId: ThemeId) => void
  onCancelPreferenceEdit: () => void
  onSavePreferenceEdit: () => void
  onEnterMainWithPreference: () => void
  onPreviewTrayOpenChange: (isOpen: boolean) => void
  onSelectPreviewImage: (imageKey: string) => void
}

export function OnboardingPreferenceView({
  isPreferenceEditView,
  hasSelectedCover,
  activeThemeIds,
  activeThemeLabels,
  activeThemePreferences,
  hasValidThemeSelection,
  themeSelectionNotice,
  selectedPreviewThemePosition,
  selectedPreviewPreference,
  selectedPreviewPrimaryImage,
  selectedPreviewTrayCover,
  selectedPreviewThumbnails,
  isPreviewTrayOpen,
  onToggleTheme,
  onCancelPreferenceEdit,
  onSavePreferenceEdit,
  onEnterMainWithPreference,
  onPreviewTrayOpenChange,
  onSelectPreviewImage,
}: OnboardingPreferenceViewProps) {
  return (
    <section
              id="onboarding"
              aria-labelledby="onboarding-title"
              className="mx-auto min-h-dvh max-w-[1440px] px-12 py-9 max-lg:px-8 max-sm:px-5"
            >
              <div className="min-h-[calc(100dvh-72px)]">
                <div className="flex items-center justify-between gap-4">
                  <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
                </div>

                <div
                  data-testid="onboarding-content-grid"
                  className={`mt-10 grid items-stretch gap-10 max-xl:grid-cols-1 ${
                    hasSelectedCover ? 'grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#33271E]">
                        Lovv City Mood Journal
                      </p>
                      <h1
                        id="onboarding-title"
                        className="mt-4 max-w-[820px] break-keep text-[56px] font-bold leading-[64px] text-[#33271E] max-sm:text-[34px] max-sm:leading-[42px]"
                      >
                        {isPreferenceEditView ? '여행의 분위기를 다시 골라주세요' : '여행의 분위기를 골라주세요'}
                      </h1>
                      <p className="mt-5 max-w-[680px] break-keep text-base leading-7 text-[#33271E] max-sm:text-[15px] max-sm:leading-6">
                        {isPreferenceEditView
                          ? '새 취향은 저장한 뒤 다음 AI 일정부터 반영됩니다.'
                          : '익숙한 대도시 감각을 Lovv가 한국과 일본 소도시 후보로 바꿔둘게요.'}
                      </p>
                    </div>

                  <section className="mt-9">
                    <div className="flex items-end justify-between gap-5 max-md:block">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#33271E]">Choose your cover story</p>
                        <h2 className="mt-2 break-keep text-[28px] font-bold leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                          도시의 분위기로 고르는 여행 취향
                        </h2>
                      </div>
                    </div>

                    <div
                      data-testid="preference-card-grid"
                      className="mt-5 grid auto-rows-[212px] grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:auto-rows-auto max-md:grid-cols-1"
                    >
                      {themeDefinitions.map((theme, index) => {
                        const isSelected = activeThemeIds.includes(theme.id)
                        const isMaxed = !isSelected && activeThemeIds.length >= 3
                        const samplePreference = getPreferenceByThemeId(theme.id)

                        return (
                          <button
                            key={theme.id}
                            type="button"
                            aria-pressed={isSelected}
                            aria-disabled={isMaxed}
                            onClick={() => onToggleTheme(theme.id)}
                            className={`flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:min-h-[212px] ${
                              isSelected
                                ? 'border-[#A92B10] bg-[#FFF0E4] shadow-[0_18px_40px_-28px_rgba(51,39,30,0.55)]'
                                : isMaxed
                                  ? 'border-transparent bg-[#fffffa] opacity-55'
                                  : 'border-transparent bg-[#fffffa] shadow-[0_10px_28px_-26px_rgba(51,39,30,0.24)]'
                            }`}
                          >
                            <span className="flex shrink-0 items-center justify-between gap-3">
                              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                                NO. {String(index + 1).padStart(2, '0')}
                              </span>
                              <span
                                className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-[#FFF0E4] px-3 text-[12px] font-bold text-[#33271E]"
                              >
                                {theme.shortLabel}
                              </span>
                            </span>
                            <span className="mt-5 min-h-0">
                              <span className="block break-keep text-[23px] font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
                                {theme.label}
                              </span>
                              <span className="mt-2 block line-clamp-2 break-keep text-sm leading-6 text-[#33271E]">
                                {theme.description}
                              </span>
                            </span>
                            <span className="mt-auto block w-full shrink-0 rounded-[12px] bg-[#FFF8F6] px-3 py-2 line-clamp-2 break-keep text-[12px] font-semibold leading-5 text-[#33271E]">
                              {samplePreference.routeHint}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-5 rounded-[22px] border border-transparent bg-[#fffffa] px-5 py-4 shadow-[0_18px_50px_-34px_rgba(51,39,30,0.24)] max-md:grid-cols-1">
                      <div className="flex flex-wrap gap-2">
                        {activeThemeLabels.length > 0 ? (
                          activeThemeLabels.map((themeLabel) => (
                            <span
                              key={themeLabel}
                              className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full bg-[#FFF0E4] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]"
                            >
                              #{themeLabel}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full bg-[#FFF8F6] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]">
                            원하는 테마를 1개 이상 선택해 주세요
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 max-md:grid max-md:grid-cols-1">
                        {isPreferenceEditView ? (
                          <button
                            type="button"
                            onClick={onCancelPreferenceEdit}
                            className="inline-flex h-auto min-h-[48px] items-center justify-center rounded-full border border-[#F3B489] bg-[#fffffa] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] transition hover:border-[#F36B12] hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
                          >
                            취소하고 마이페이지로 돌아가기
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={isPreferenceEditView ? onSavePreferenceEdit : onEnterMainWithPreference}
                          disabled={!hasValidThemeSelection}
                          className="inline-flex h-auto min-h-[48px] w-[220px] items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:w-full"
                        >
                          {isPreferenceEditView ? '이 취향으로 저장하기' : '이 취향으로 Lovv 시작하기'}
                        </button>
                      </div>
                    </div>
                    {themeSelectionNotice ? (
                      <p role="status" className="mt-3 break-keep text-sm font-bold leading-6 text-[#A92B10]">
                        {themeSelectionNotice}
                      </p>
                    ) : null}
                  </section>
                </div>

                {hasSelectedCover ? (
                  <aside
                    data-testid="preference-preview-card"
                    className="sticky top-[220px] h-fit rounded-[28px] border border-transparent bg-[#fffffa] p-5 shadow-[0_24px_70px_-42px_rgba(51,39,30,0.45)] max-xl:static"
                  >
                    <div className="group relative overflow-hidden rounded-[24px] border border-transparent bg-[#FFF0E4]">
                      <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                          Selected Theme
                        </span>
                        <span className="rounded-full bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E] shadow-[0_10px_24px_-22px_rgba(51,39,30,0.28)]">
                          {selectedPreviewThemePosition} · {selectedPreviewPreference.tag}
                        </span>
                      </div>
                      <img
                        src={selectedPreviewPrimaryImage.image}
                        alt={`${selectedPreviewPrimaryImage.city} 대표 이미지`}
                        className="h-[360px] w-full object-cover max-sm:h-[260px]"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#33271E]/80 via-[#33271E]/24 to-transparent p-5">
                        <span className="min-w-0 rounded-full bg-[#fffffa]/95 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-[0_10px_30px_-22px_rgba(0,0,0,0.5)]">
                          현재 표시: {selectedPreviewPrimaryImage.city}
                        </span>
                        {selectedPreviewTrayCover && !isPreviewTrayOpen ? (
                          <button
                            type="button"
                            aria-label={`${selectedPreviewTrayCover.city} +${selectedPreviewThumbnails.length} 이미지 목록 펼치기`}
                            aria-expanded={false}
                            onClick={() => onPreviewTrayOpenChange(true)}
                            className="w-[98px] shrink-0 overflow-hidden rounded-[14px] bg-[#fffffa]/95 p-1 text-[#33271E] shadow-[0_18px_36px_-24px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffffa] max-sm:w-[86px]"
                          >
                            <img
                              src={selectedPreviewTrayCover.image}
                              alt={`${selectedPreviewTrayCover.city} 썸네일 이미지`}
                              className="h-[58px] w-full rounded-[10px] object-cover max-sm:h-[52px]"
                            />
                            <span className="block truncate px-1 pb-0.5 pt-1 text-center text-[10px] font-black leading-4">
                              {selectedPreviewTrayCover.city} +{selectedPreviewThumbnails.length}
                            </span>
                          </button>
                        ) : null}
                        {selectedPreviewThumbnails.length > 0 && isPreviewTrayOpen ? (
                          <div
                            role="group"
                            aria-label="선택한 테마 이미지 목록"
                            className="grid max-w-[194px] shrink-0 grid-cols-2 gap-2 rounded-[16px] bg-[#fffffa]/92 p-2 shadow-[0_18px_36px_-24px_rgba(0,0,0,0.5)] max-sm:max-w-[calc(100%-8rem)] max-sm:auto-cols-[76px] max-sm:grid-flow-col max-sm:grid-cols-none max-sm:overflow-x-auto"
                          >
                            {selectedPreviewThumbnails.map((previewImage) => (
                              <button
                                key={previewImage.key}
                                type="button"
                                aria-label={`${previewImage.city} 이미지로 크게 보기`}
                                onClick={() => onSelectPreviewImage(previewImage.key)}
                                className="w-[86px] overflow-hidden rounded-[12px] bg-[#FFF0E4] p-1 text-[#33271E] transition hover:-translate-y-0.5 hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffffa] max-sm:w-[76px]"
                              >
                                <img
                                  src={previewImage.image}
                                  alt={`${previewImage.city} 썸네일 이미지`}
                                  className="h-[52px] w-full rounded-[8px] object-cover max-sm:h-[48px]"
                                />
                                <span className="block truncate px-1 pb-0.5 pt-1 text-center text-[10px] font-black leading-4">
                                  {previewImage.city}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-2 pb-2 pt-5">
                      <p className="text-sm font-semibold text-[#33271E]">오늘의 취향 여정</p>
                      <h2 className="mt-2 break-keep text-[34px] font-bold leading-10 text-[#33271E] max-sm:text-3xl max-sm:leading-9">
                        {activeThemeLabels.join(' · ')}
                      </h2>
                      <p className="mt-4 line-clamp-3 break-keep text-sm leading-6 text-[#33271E]">
                        {activeThemePreferences
                          .map((preference) => preference.editorialNote)
                          .slice(0, 2)
                          .join(' ')}
                      </p>

                      <div className="mt-5 rounded-[18px] border border-transparent bg-[#FFF0E4] p-4">
                        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#33271E]">
                          First route note
                        </p>
                        <p className="mt-2 line-clamp-2 break-keep text-sm font-bold leading-6 text-[#33271E]">
                          {activeThemePreferences
                            .map((preference) => preference.routeHint)
                            .slice(0, 2)
                            .join(' · ')}
                        </p>
                      </div>

                      <p className="mt-5 line-clamp-3 break-keep text-[13px] leading-6 text-[#33271E]">
                        {isPreferenceEditView
                          ? '저장하기 전까지 기존 취향은 유지됩니다.'
                          : '현재 MVP는 Google mock 세션과 여행 취향 힌트만 저장하고, 전체 채팅 로그는 저장하지 않습니다.'}
                      </p>
                    </div>
                  </aside>
                ) : null}
              </div>
              </div>
            </section>
  )
}
