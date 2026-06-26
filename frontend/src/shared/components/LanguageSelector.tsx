import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = i18n.language || 'ko'

  const languages = [
    { code: 'ko', label: '한국어', short: 'KO' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ja', label: '日本語', short: 'JA' },
  ]

  const activeLang = languages.find((lang) => lang.code === currentLanguage) || languages[0]

  const toggleDropdown = () => setIsOpen((prev) => !prev)

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lovv_language', code)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="언어 변경 / Change Language"
        onClick={toggleDropdown}
        className="flex h-10 items-center gap-2 rounded-full border border-white/50 bg-[#fffffa]/60 px-4 text-sm font-bold text-[#33271E] shadow-sm transition hover:scale-102 hover:border-[#F3B489] hover:bg-[#FFF0E4]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E]"
      >
        <Globe className="size-4 text-[#A92B10] animate-[spin_8s_linear_infinite]" />
        <span>{activeLang.short}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-30 grid min-w-[150px] gap-1 rounded-[20px] border border-white/70 bg-white/75 p-2 shadow-[0_20px_50px_-24px_rgba(51,39,30,0.35)] backdrop-blur-xl animate-[lovv-chip-in_0.2s_ease-out]"
        >
          {languages.map((lang) => {
            const isSelected = lang.code === currentLanguage

            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectLanguage(lang.code)}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[14px] px-3.5 text-left text-sm font-bold text-[#33271E] transition hover:bg-[#FFF0E4]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33271E] ${
                  isSelected ? 'bg-[#FFF0E4]/50 font-black' : ''
                }`}
              >
                <span>{lang.label}</span>
                {isSelected && <Check className="size-4 text-[#A92B10] shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
