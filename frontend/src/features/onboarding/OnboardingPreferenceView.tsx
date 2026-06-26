import { useEffect } from 'react'
import logoImage from '../../assets/lovv-logo.png'
import type { CityCoverImage, Preference, ThemeId } from '../../shared/types/app'
import { themeDefinitions } from './preferenceModel'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../../shared/components/LanguageSelector'

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
  isPreferenceSaving: boolean
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
  activeThemePreferences,
  hasValidThemeSelection,
  themeSelectionNotice,
  isPreferenceSaving,
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
  const { t } = useTranslation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <section
      id="onboarding"
      aria-labelledby="onboarding-title"
      className="lovv-onboarding-liquid-shell mx-auto min-h-dvh max-w-[1440px] px-12 py-9 max-lg:px-8 max-sm:px-5"
    >
      <div className="min-h-[calc(100dvh-72px)]">
        <div className="flex items-center justify-between gap-4">
          <img src={logoImage} alt="Lovv" className="h-16 w-[116px] object-contain" />
          <LanguageSelector />
        </div>

        <div
          data-testid="onboarding-content-grid"
          className={`mt-10 grid items-stretch gap-10 max-xl:grid-cols-1 ${
            hasSelectedCover ? 'grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'
          }`}
        >
          <div className="min-w-0">
            <div
              data-testid="onboarding-hero-panel"
              className="lovv-onboarding-hero-panel lovv-liquid-panel min-w-0 rounded-[28px] border border-white/60 p-7 shadow-[0_24px_70px_-48px_rgba(51,39,30,0.42)] max-sm:p-5"
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#33271E]">
                {t('onboarding.hero_sub')}
              </p>
              <h1
                id="onboarding-title"
                className="mt-4 max-w-[820px] break-keep text-[56px] font-bold leading-[64px] text-[#33271E] max-sm:text-[34px] max-sm:leading-[42px]"
              >
                {isPreferenceEditView ? t('onboarding.hero_title_edit') : t('onboarding.hero_title_new')}
              </h1>
              <p className="mt-5 max-w-[680px] break-keep text-base leading-7 text-[#33271E] max-sm:text-[15px] max-sm:leading-6">
                {isPreferenceEditView
                  ? t('onboarding.hero_desc_edit')
                  : t('onboarding.hero_desc_new')}
              </p>
            </div>

            <section className="mt-9">
              <div className="flex items-end justify-between gap-5 max-md:block">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#33271E]">{t('onboarding.choose_title')}</p>
                  <h2 className="mt-2 break-keep text-[28px] font-bold leading-9 text-[#33271E] max-sm:text-2xl max-sm:leading-8">
                    {t('onboarding.choose_subtitle')}
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

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-disabled={isMaxed}
                      onClick={() => onToggleTheme(theme.id)}
                      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:bg-[#FFF0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:min-h-[212px] ${
                        isSelected
                          ? 'lovv-onboarding-theme-card lovv-onboarding-theme-card-selected border-[#A92B10] bg-[#FFF0E4] shadow-[0_18px_40px_-28px_rgba(51,39,30,0.55)]'
                          : isMaxed
                            ? 'lovv-onboarding-theme-card border-transparent bg-[#fffffa] opacity-55'
                            : 'lovv-onboarding-theme-card border-transparent bg-[#fffffa] shadow-[0_10px_28px_-26px_rgba(51,39,30,0.24)]'
                      }`}
                    >
                      <span className="flex shrink-0 items-center justify-between gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                          NO. {String(index + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-[#FFF0E4] px-3 text-[12px] font-bold text-[#33271E]"
                        >
                          {t('themes.' + theme.id + '.shortLabel')}
                        </span>
                      </span>
                      <span className="mt-5 min-h-0">
                        <span className="block break-keep text-[23px] font-bold leading-8 text-[#33271E] max-sm:text-xl max-sm:leading-7">
                          {t('themes.' + theme.id + '.label')}
                        </span>
                        <span className="mt-2 block line-clamp-2 break-keep text-sm leading-6 text-[#33271E]">
                          {t('themes.' + theme.id + '.description')}
                        </span>
                      </span>
                      <span className="mt-auto block w-full shrink-0 rounded-[12px] bg-[#FFF8F6] px-3 py-2 line-clamp-2 break-keep text-[12px] font-semibold leading-5 text-[#33271E]">
                        {t('preferences.' + theme.id + '.routeHint')}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                data-testid="onboarding-action-bar"
                className="lovv-onboarding-action-bar lovv-liquid-panel mt-6 grid grid-cols-[1fr_auto] items-center gap-5 rounded-[22px] border border-white/60 px-5 py-4 shadow-[0_18px_50px_-34px_rgba(51,39,30,0.24)] max-md:grid-cols-1"
              >
                <div className="flex flex-wrap gap-2">
                  {activeThemeIds.length > 0 ? (
                    activeThemeIds.map((themeId) => (
                      <span
                        key={themeId}
                        className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full bg-[#FFF0E4] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]"
                      >
                        #{t('themes.' + themeId + '.shortLabel')}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex h-auto min-h-[32px] max-w-full items-center justify-center rounded-full bg-[#FFF8F6] px-4 py-1 text-center text-[12px] font-semibold leading-5 text-[#33271E]">
                      {t('onboarding.action_notice')}
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
                      {t('onboarding.cancel_edit')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={isPreferenceEditView ? onSavePreferenceEdit : onEnterMainWithPreference}
                    disabled={!hasValidThemeSelection || isPreferenceSaving}
                    className="inline-flex h-auto min-h-[48px] w-[220px] items-center justify-center rounded-full border border-[#A92B10] bg-[#F36B12] px-5 text-center text-sm font-semibold leading-5 text-[#33271E] shadow-[0_2px_3px_rgba(0,0,0,0.04)] transition hover:border-[#A92B10] hover:bg-[#FF8A2A] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#F36B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] max-md:w-full"
                  >
                    {isPreferenceSaving
                      ? t('onboarding.saving')
                      : isPreferenceEditView
                        ? t('onboarding.save_edit')
                        : t('onboarding.save_and_start')}
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
              className="lovv-onboarding-preview-card lovv-liquid-panel sticky top-[220px] h-fit rounded-[28px] border border-white/60 p-5 shadow-[0_24px_70px_-42px_rgba(51,39,30,0.45)] max-xl:static"
            >
              <div className="lovv-onboarding-preview-media group relative overflow-hidden rounded-[24px] border border-white/50">
                <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#33271E]">
                    {t('onboarding.selected_theme_label')}
                  </span>
                  <span className="rounded-full bg-[#FFF0E4] px-3 py-1 text-[12px] font-bold text-[#33271E] shadow-[0_10px_24px_-22px_rgba(51,39,30,0.28)]">
                    {selectedPreviewThemePosition} · {t('themes.' + selectedPreviewPreference.themeId + '.label')}
                  </span>
                </div>
                <img
                  src={selectedPreviewPrimaryImage.image}
                  alt={t('onboarding.featured_label', { city: selectedPreviewPrimaryImage.city })}
                  className="h-[360px] w-full object-cover max-sm:h-[260px]"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#33271E]/80 via-[#33271E]/24 to-transparent p-5">
                  <span className="min-w-0 rounded-full bg-[#fffffa]/95 px-4 py-2 text-[12px] font-bold text-[#33271E] shadow-[0_10px_30px_-22px_rgba(0,0,0,0.5)]">
                    {t('onboarding.current_display', { city: selectedPreviewPrimaryImage.city })}
                  </span>
                  {selectedPreviewTrayCover && !isPreviewTrayOpen ? (
                    <button
                      type="button"
                      aria-label={t('onboarding.list_open_label', { city: selectedPreviewTrayCover.city, count: selectedPreviewThumbnails.length })}
                      aria-expanded={false}
                      onClick={() => onPreviewTrayOpenChange(true)}
                      className="w-[98px] shrink-0 overflow-hidden rounded-[14px] bg-[#fffffa]/95 p-1 text-[#33271E] shadow-[0_18px_36px_-24px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffffa] max-sm:w-[86px]"
                    >
                      <img
                        src={selectedPreviewTrayCover.image}
                        alt={t('onboarding.thumbnail_label', { city: selectedPreviewTrayCover.city })}
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
                          aria-label={t('onboarding.view_larger_label', { city: previewImage.city })}
                          onClick={() => onSelectPreviewImage(previewImage.key)}
                          className="w-[86px] overflow-hidden rounded-[12px] bg-[#FFF0E4] p-1 text-[#33271E] transition hover:-translate-y-0.5 hover:bg-[#FFE0CA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fffffa] max-sm:w-[76px]"
                        >
                          <img
                            src={previewImage.image}
                            alt={t('onboarding.thumbnail_label', { city: previewImage.city })}
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
                <p className="text-sm font-semibold text-[#33271E]">{t('onboarding.route_note_sub')}</p>
                <h2 className="mt-2 break-keep text-[34px] font-bold leading-10 text-[#33271E] max-sm:text-3xl max-sm:leading-9">
                  {activeThemeIds.map(themeId => t('themes.' + themeId + '.label')).join(' · ')}
                </h2>
                <p className="mt-4 line-clamp-3 break-keep text-sm leading-6 text-[#33271E]">
                  {activeThemePreferences
                    .map((preference) => t('preferences.' + preference.themeId + '.editorialNote'))
                    .slice(0, 2)
                    .join(' ')}
                </p>

                <div className="lovv-onboarding-route-note mt-5 rounded-[18px] border border-white/55 p-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#33271E]">
                    {t('onboarding.route_note_title')}
                  </p>
                  <p className="mt-2 line-clamp-2 break-keep text-sm font-bold leading-6 text-[#33271E]">
                    {activeThemePreferences
                      .map((preference) => t('preferences.' + preference.themeId + '.routeHint'))
                      .slice(0, 2)
                      .join(' · ')}
                  </p>
                </div>

                <p className="mt-5 line-clamp-3 break-keep text-[13px] leading-6 text-[#33271E]">
                  {isPreferenceEditView
                    ? t('onboarding.limitations_notice_edit')
                    : t('onboarding.limitations_notice')}
                </p>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  )
}

