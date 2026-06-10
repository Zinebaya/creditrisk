"use client"
import * as React from "react"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { Language, languages, messages } from "@/lib/i18n"

type LanguageContextType = { 
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, options?: Record<string, string | number>) => string
  isRTL: boolean
  locale: string 
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)
const isLanguage = (value: string | null): value is Language => value === "fr"

// Build resources with proper namespace structure
const resources = Object.fromEntries(
  Object.entries(messages).map(([lng, translation]) => [lng, { translation }])
)

// Initialize i18next once globally
const initI18n = () => {
  if (i18next.isInitialized) return
  
  i18next.use(initReactI18next).init({
    resources,
    fallbackLng: "fr",
    interpolation: { 
      escapeValue: false,
      formatSeparator: ","
    },
    react: {
      useSuspense: false
    }
  })
}

// Call this immediately when the module loads
initI18n()

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("fr")
  
  React.useEffect(() => {
    const saved = localStorage.getItem("paypredict.language") || localStorage.getItem("language")
    if (isLanguage(saved)) {
      setLanguageState(saved)
    }
  }, [])
  
  React.useEffect(() => {
    const meta = languages[language]
    i18next.changeLanguage(language)
    document.documentElement.lang = language
    document.documentElement.dir = meta.dir
    document.documentElement.setAttribute("lang", language)
    document.body.dir = meta.dir
    document.body.setAttribute("lang", language)
  }, [language])
  
  const setLanguage = (lang: Language) => { 
    setLanguageState(lang)
    localStorage.setItem("paypredict.language", lang)
  }
  
  const t = React.useCallback(
    (key: string, options?: Record<string, string | number>) =>
      i18next.t(key, options || {}),
    []
  )
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isRTL: languages[language].dir === "rtl", 
      locale: languages[language].locale 
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() { 
  const ctx = React.useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx 
}
