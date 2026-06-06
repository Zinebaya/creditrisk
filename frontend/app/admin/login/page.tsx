"use client"
import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight, Eye, EyeOff, Mail, Lock, Shield, Users,
  BarChart3, Activity, Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/brand/logo"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLoginPage() {
  const [showPwd, setShowPwd] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState("")
  const { login, user, loading } = useAuth()
  const router = useRouter()

  // If already logged in as admin, redirect to dashboard
  React.useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.replace("/dashboard")
      }
    }
  }, [user, loading, router])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") || "").trim().toLowerCase()
    const password = String(form.get("password") || "")

    if (!email || !password) {
      setFormError("Email et mot de passe requis.")
      return
    }
    if (!validateEmail(email)) {
      setFormError("Format d'email invalide.")
      return
    }

    setSubmitting(true)
    try {
      const userData = await login(email, password)

      if (userData.role !== "admin") {
        toast.error("Accès refusé. Ce portail est réservé aux administrateurs.")
        setFormError("Vous n'avez pas les droits d'administration. Utilisez le portail client.")
        setSubmitting(false)
        return
      }

      toast.success(`Bienvenue, Administrateur ${userData.email}`)
      router.replace("/dashboard")
    } catch (err: any) {
      const msg = err?.message?.includes("401") || err?.message?.includes("Invalid")
        ? "Email ou mot de passe incorrect."
        : err?.message?.includes("timeout")
        ? "Serveur lent. Réessayez dans quelques secondes."
        : err?.message || "Erreur de connexion."
      setFormError(msg)
      toast.error(msg)
      setSubmitting(false)
    }
  }

  const isLoading = submitting || loading

  const stats = [
    { icon: Users, label: "Clients gérés", value: "∞" },
    { icon: BarChart3, label: "Analytics", value: "Temps réel" },
    { icon: Database, label: "Base de données", value: "SQLite" },
    { icon: Activity, label: "Monitoring", value: "24/7" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0f0f1a]" />

      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#F1B24A]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative grid min-h-screen lg:grid-cols-[1fr_480px]">
        {/* Left panel */}
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14 border-r border-white/[0.06]">
          <Link href="/" aria-label="PayPredict home">
            <Logo variant="light" />
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-lg space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F1B24A]/30 bg-[#F1B24A]/10 px-3 py-1.5 text-xs font-semibold text-[#F1B24A]">
              <Shield className="size-3.5" />
              Administration Sécurisée
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight xl:text-5xl text-white">
              Panneau de contrôle administrateur
            </h1>

            <p className="text-lg leading-relaxed text-white/50">
              Gérez l'ensemble de la plateforme PayPredict, les utilisateurs, les abonnements et les analytics globales depuis un espace centralisé.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ icon: Icon, label, value }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
                >
                  <Icon className="size-5 text-[#F1B24A] mb-2 opacity-80" />
                  <p className="text-base font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-xs text-white/40">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center gap-2 text-xs text-white/30">
            <Shield className="size-3.5 text-[#F1B24A]/50" />
            Accès administrateur sécurisé · JWT HS256 · Session 60 min
          </div>
        </div>

        {/* Right panel — Admin login form */}
        <div className="flex items-center justify-center p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo variant="light" />
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7 shadow-2xl backdrop-blur-xl">
              {/* Admin badge */}
              <div className="mb-6">
                <div className="flex items-center justify-center size-12 rounded-xl bg-[#F1B24A]/10 border border-[#F1B24A]/20 mb-4 mx-auto">
                  <Shield className="size-6 text-[#F1B24A]" />
                </div>
                <h2 className="text-center font-display text-xl font-bold text-white">
                  Administration
                </h2>
                <p className="mt-1.5 text-center text-sm text-white/40">
                  Accès réservé aux administrateurs PayPredict
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-sm text-white/60">
                    Email administrateur
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <Input
                      id="admin-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="admin@paypredict.dz"
                      className="h-11 border-white/[0.1] bg-white/[0.05] pl-10 text-white placeholder:text-white/25 focus:border-[#F1B24A]/40 focus:bg-white/[0.07]"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-password" className="text-sm text-white/60">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <Input
                      id="admin-password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 border-white/[0.1] bg-white/[0.05] pl-10 pr-10 text-white placeholder:text-white/25 focus:border-[#F1B24A]/40 focus:bg-white/[0.07]"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      aria-label={showPwd ? "Masquer" : "Afficher"}
                      disabled={isLoading}
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
                  >
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{formError}</span>
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full gap-2 rounded-xl bg-[#F1B24A] font-semibold text-[#0a0a0f] hover:bg-[#F1B24A]/90 disabled:opacity-60 transition-all"
                >
                  {isLoading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f]" />
                      Authentification…
                    </>
                  ) : (
                    <>
                      Accéder au panneau
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-xs text-white/30">
                  Vous êtes client ?{" "}
                  <Link
                    href="/client/login"
                    className="text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
                  >
                    Portail Client
                  </Link>
                </p>
              </div>
            </div>

            {/* Security notice */}
            <p className="mt-4 text-center text-xs text-white/20">
              🔒 Connexion chiffrée · Accès journalisé
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
