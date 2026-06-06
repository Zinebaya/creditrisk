"use client"
import { Globe2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { languages, Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage()
  return <div className="inline-flex items-center rounded-lg border bg-card/80 p-1 shadow-sm">
    {!compact && <Globe2 className="mx-2 size-4 text-muted-foreground" />}
    {(Object.keys(languages) as Language[]).map((lang) => <button key={lang} type="button" onClick={() => setLanguage(lang)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold transition", language === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>{languages[lang].short}</button>)}
  </div>
}
