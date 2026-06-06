"use client"
import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight, Eye, EyeOff, Mail, Lock, ShieldCheck, Sparkles,
  BarChart3, Brain, TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/brand/logo"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function ClientLoginPage() {
  const [showPwd, setShowPwd] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState("")
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, isRTL } = useLanguage()

  // If already logged in as client, redirect
  React.useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.replace("/dashboard")
      } else {
        const redirect = searchParams.get("redirect") || "/dashboard"
        router.replace(redirect)
      }
    }
  }, [user, loading, router, searchParams])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") || "").trim().toLowerCase()
    const password = String(form.get("password") || "")

    // Client-side validation
    if (!email || !password) {
      setFormError("Email et mot de passe requis.")
      return
    }
    if (!validateEmail(email)) {
      setFormError("Format d'email invalide.")
      return
    }
    if (password.length < 6) {
      setFormError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setSubmitting(true)
    try {
      const userData = await login(email, password)

      if (userData.role === "admin") {
        toast.error("Ce portail est réservé aux clients. Utilisez /admin/login pour l'administration.")
        setFormError("Accès refusé. Utilisez le portail administrateur.")
        setSubmitting(false)
        return
      }

      toast.success(`Bienvenue, ${userData.email} !`)
      const redirect = searchParams.get("redirect") || "/dashboard"
      router.replace(redirect)
    } catch (err: any) {
      const msg = err?.message?.includes("401") || err?.message?.includes("Invalid")
        ? "Email ou mot de passe incorrect."
        : err?.message?.includes("timeout")
        ? "Le serveur est lent. Réessayez dans quelques secondes."
        : err?.message || "Erreur de connexion."
      setFormError(msg)
      toast.error(msg)
      setSubmitting(false)
    }
  }

  const isLoading = submitting || loading

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#06201c] via-[#0e3a33] to-[#164A41] text-white"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Language switcher */}
      <div className="absolute right-6 top-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Left panel — Marketing */}
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <Link href="/" aria-label="PayPredict home">
            <Logo variant="light" />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5 text-[#F1B24A]" />
              Espace Client PayPredict
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
              Analysez le risque crédit avec l'IA
            </h1>

            <p className="text-lg leading-relaxed text-white/70">
              Accédez à vos prédictions, datasets et statistiques en temps réel depuis votre tableau de bord personnel.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Brain, label: "Modèles IA", value: "XGBoost" },
                { icon: TrendingUp, label: "Précision", value: "94.7%" },
                { icon: BarChart3, label: "Prédictions", value: "Illimitées" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon className="size-5 text-[#F1B24A] mb-2" />
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-xs text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck className="size-3.5" />
            Données chiffrées 256-bit · Conformité RGPD
          </div>
        </div>

        {/* Right panel — Login form */}
        <div className="flex items-center justify-center p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo variant="light" />
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-2xl lg:p-9">
              {/* Header */}
              <div className="mb-7">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F1B24A]/15 border border-[#F1B24A]/20 px-3 py-1 text-xs font-semibold text-[#F1B24A] mb-4">
                  <ShieldCheck className="size-3" />
                  Espace Client
                </div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Connexion Client
                </h2>
                <p className="mt-1.5 text-sm text-white/60">
                  Accédez à votre tableau de bord d'analyse
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm text-white/80">
                    Adresse email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="votre@email.com"
                      className="h-11 border-white/15 bg-white/[0.06] pl-10 text-white placeholder:text-white/35 focus:border-[#F1B24A]/50 focus:ring-[#F1B24A]/20"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm text-white/80">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 border-white/15 bg-white/[0.06] pl-10 pr-10 text-white placeholder:text-white/35 focus:border-[#F1B24A]/50 focus:ring-[#F1B24A]/20"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      aria-label={showPwd ? "Masquer" : "Afficher"}
                      disabled={isLoading}
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
                  >
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{formError}</span>
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full gap-2 rounded-xl bg-[#F1B24A] font-semibold text-[#164A41] hover:bg-[#F1B24A]/90 disabled:opacity-60 transition-all"
                >
                  {isLoading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-[#164A41]/30 border-t-[#164A41]" />
                      Connexion en cours…
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Footer links */}
              <div className="mt-6 flex flex-col gap-3">
                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-white/40">ou</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="text-center text-xs text-white/50">
                  Vous êtes administrateur ?{" "}
                  <Link
                    href="/admin/login"
                    className="font-medium text-[#F1B24A]/80 hover:text-[#F1B24A] transition-colors underline underline-offset-2"
                  >
                    Portail Admin
                  </Link>
                </p>
                <p className="text-center text-xs text-white/40">
                  <Link href="/" className="hover:text-white/70 transition-colors">
                    ← Retour à l'accueil
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
