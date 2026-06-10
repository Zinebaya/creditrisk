"use client"
import * as React from "react"
import { Moon, Sun, Zap, Bell, Shield, Palette, Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

export function SettingsClientComponent(){
 const {theme,setTheme}=useTheme(); const {t,isRTL}=useLanguage(); const [email,setEmail]=React.useState(true); const [push,setPush]=React.useState(true)
 const save=()=>{localStorage.setItem("paypredict.settings",JSON.stringify({email,push})); toast.success(t("settings.saved"))}
 const reset=()=>{setEmail(true); setPush(true); localStorage.removeItem("paypredict.settings")}
 React.useEffect(()=>{try{const raw=localStorage.getItem("paypredict.settings"); if(raw){const s=JSON.parse(raw); setEmail(Boolean(s.email)); setPush(Boolean(s.push))}}catch{}},[])
 return <div className="max-w-3xl space-y-8" dir={isRTL?"rtl":"ltr"}><PageHeader title={t("settings.title")} description={t("settings.description")} /><Card className="p-6"><div className="mb-5 flex items-center gap-3"><Palette className="size-5 text-[#F1B24A]"/><h3 className="font-semibold">{t("settings.appearance")}</h3></div><div className="grid grid-cols-3 gap-3">{[{v:"light",l:t("settings.light"),i:Sun},{v:"dark",l:t("settings.dark"),i:Moon},{v:"system",l:t("settings.system"),i:Zap}].map(o=>{const I=o.i; return <button key={o.v} onClick={()=>setTheme(o.v)} className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm transition ${theme===o.v?"border-[#F1B24A] bg-[#F1B24A]/10":"hover:bg-secondary"}`}><I className="size-4"/>{o.l}</button>})}</div></Card><Card className="p-6"><div className="mb-5 flex items-center gap-3"><Bell className="size-5 text-[#F1B24A]"/><h3 className="font-semibold">{t("settings.notifications")}</h3></div><div className="space-y-3"><div className="flex items-center justify-between rounded-lg border p-3"><Label>Email</Label><Switch checked={email} onCheckedChange={setEmail}/></div><div className="flex items-center justify-between rounded-lg border p-3"><Label>Push</Label><Switch checked={push} onCheckedChange={setPush}/></div></div></Card><Card className="p-6"><div className="mb-5 flex items-center gap-3"><Shield className="size-5 text-[#F1B24A]"/><h3 className="font-semibold">{t("settings.security")}</h3></div><p className="text-sm text-muted-foreground">JWT, password hashing and protected dashboard routes are active.</p></Card><div className="flex gap-3"><Button onClick={save} className="flex-1 gap-2"><Save className="size-4"/>{t("common.save")}</Button><Button onClick={reset} variant="outline" className="flex-1 gap-2"><RotateCcw className="size-4"/>{t("common.reset")}</Button></div></div>
}
