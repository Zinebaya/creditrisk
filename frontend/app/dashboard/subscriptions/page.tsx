"use client"

import React from "react"
import { Check, X, Zap, Sparkles, Crown, ArrowRight, CreditCard, ShieldCheck, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  predictions: number | "unlimited"
  features: PlanFeature[]
  cta: string
  badge?: string
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Test credit risk analysis with limited predictions",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "DA",
    predictions: 3,
    features: [
      { name: "3 predictions total", included: true },
      { name: "Single prediction", included: true },
      { name: "Basic analytics", included: true },
      { name: "Batch uploads", included: false },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Current Plan",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For active credit risk teams and professionals",
    monthlyPrice: 2500,
    yearlyPrice: 24000,
    currency: "DA",
    predictions: "unlimited",
    features: [
      { name: "Unlimited predictions", included: true },
      { name: "Single & batch predictions", included: true },
      { name: "Advanced analytics", included: true },
      { name: "CSV/Excel batch uploads", included: true },
      { name: "API access", included: true },
      { name: "Email & chat support", included: true },
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Unlimited access with dedicated support",
    monthlyPrice: 5000,
    yearlyPrice: 48000,
    currency: "DA",
    predictions: "unlimited",
    features: [
      { name: "Unlimited predictions", included: true },
      { name: "All Pro features", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom model training", included: true },
      { name: "24/7 priority support", included: true },
      { name: "On-premises deployment", included: true },
    ],
    cta: "Upgrade to Enterprise",
  },
]

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"]
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => String(currentYear + i))

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}

export default function SubscriptionsPage() {
  const { user, refresh } = useAuth()
  const { t } = useLanguage()
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "yearly">("monthly")

  // Payment modal state
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null)
  const [cardNumber, setCardNumber] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [cvc, setCvc] = React.useState("")
  const [expiryMonth, setExpiryMonth] = React.useState("01")
  const [expiryYear, setExpiryYear] = React.useState(String(currentYear))
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleUpgrade = (plan: Plan) => {
    if (plan.id === user?.plan_tier) {
      toast.info("Vous êtes déjà sur ce plan")
      return
    }
    if (plan.id === "free") return
    setSelectedPlan(plan)
    setCardNumber("")
    setFullName("")
    setCvc("")
    setExpiryMonth("01")
    setExpiryYear(String(currentYear))
    setIsPaymentOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return

    const rawCard = cardNumber.replace(/\s/g, "")
    if (rawCard.length !== 16) {
      toast.error("Numéro de carte invalide — 16 chiffres requis")
      return
    }
    if (!fullName.trim()) {
      toast.error("Veuillez saisir le nom complet sur la carte")
      return
    }
    if (cvc.replace(/\D/g, "").length !== 3) {
      toast.error("Code CVC invalide — 3 chiffres requis")
      return
    }

    setIsSubmitting(true)
    try {
      await api.subscribe({
        plan_id: selectedPlan.id,
        payment_method: "dahabia",
        billing_period: billingPeriod,
      })

      setIsPaymentOpen(false)
      toast.success("Paiement confirmé !", {
        description: `Votre abonnement ${selectedPlan.name} est maintenant actif.`,
      })
      await refresh()
    } catch (err: any) {
      toast.error("Échec du paiement", {
        description: err?.message || "Veuillez réessayer.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const yearlyDiscount = 20
  const paymentAmount = selectedPlan
    ? billingPeriod === "yearly"
      ? selectedPlan.yearlyPrice
      : selectedPlan.monthlyPrice
    : 0

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("subscriptions.title") || "Subscription Plans"}
        description={t("subscriptions.description") || "Choose the plan that fits your needs"}
      />

      {/* BILLING TOGGLE */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border bg-muted p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative ${billingPeriod === "yearly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Annuel
            <Badge variant="default" className="absolute -top-2 -right-2 text-xs bg-[#F1B24A] text-[#164A41]">
              -{yearlyDiscount}%
            </Badge>
          </button>
        </div>
      </div>

      {/* PRICING CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === user?.plan_tier
          const displayPrice = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice

          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${plan.highlight
                  ? "border-primary shadow-lg md:scale-105 md:z-10"
                  : isCurrent
                    ? "border-green-500 shadow-md"
                    : ""
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="gap-1">
                    <Sparkles className="size-3" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {isCurrent && (
                <Badge variant="secondary" className="absolute top-4 right-4">
                  Actuel
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </div>
                  {plan.name === "Pro" && <Zap className="size-5 text-amber-500 flex-shrink-0" />}
                  {plan.name === "Enterprise" && <Crown className="size-5 text-purple-500 flex-shrink-0" />}
                </div>

                {/* PRICE */}
                <div className="mt-6">
                  {plan.monthlyPrice === 0 && plan.id === "free" ? (
                    <div className="text-3xl font-bold">Gratuit</div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{displayPrice.toLocaleString()}</span>
                        <span className="text-muted-foreground">{plan.currency}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        par {billingPeriod === "yearly" ? "an" : "mois"}
                      </p>
                      {billingPeriod === "yearly" && plan.monthlyPrice > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Économisez {yearlyDiscount}% — {(plan.monthlyPrice * 12).toLocaleString()} DA/an sans réduction
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* PREDICTIONS */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    {typeof plan.predictions === "string"
                      ? "Prédictions illimitées"
                      : `${plan.predictions} prédictions`}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* CTA BUTTON */}
                <Button
                  onClick={() => handleUpgrade(plan)}
                  variant={plan.highlight && !isCurrent ? "default" : isCurrent ? "secondary" : "outline"}
                  className="w-full gap-2"
                  disabled={isCurrent || plan.id === "free"}
                >
                  {plan.cta}
                  {!isCurrent && plan.id !== "free" && <ArrowRight className="size-4" />}
                </Button>

                {/* FEATURES */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Fonctionnalités</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${!feature.included ? "text-muted-foreground line-through" : ""}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─────────────── EDAHABIA PAYMENT MODAL ─────────────── */}
      <Dialog open={isPaymentOpen} onOpenChange={(v) => { if (!isSubmitting) setIsPaymentOpen(v) }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#164A41] to-[#0e3a33] px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3 text-lg">
                <div className="flex items-center gap-2">
                  <div className="bg-[#F1B24A] text-[#164A41] rounded px-2 py-0.5 text-xs font-black tracking-widest">
                    DAHABIA
                  </div>
                  <span>Paiement sécurisé</span>
                </div>
              </DialogTitle>
            </DialogHeader>
            {/* Fake card visual */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F1B24A]/30 to-[#F1B24A]/10 border border-[#F1B24A]/30 p-4 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/60 uppercase tracking-widest">Carte Dahabia</span>
                  <span className="text-white font-mono text-sm tracking-widest">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </span>
                </div>
                <CreditCard className="size-8 text-[#F1B24A]" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[9px] text-white/50 uppercase tracking-widest block">Titulaire</span>
                  <span className="text-white text-sm font-medium">{fullName || "VOTRE NOM"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest block">Expiration</span>
                  <span className="text-white text-sm font-mono">{expiryMonth}/{expiryYear.slice(-2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            {/* Plan summary */}
            <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Plan sélectionné</p>
                <p className="font-semibold">{selectedPlan?.name} — {billingPeriod === "yearly" ? "Annuel" : "Mensuel"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Montant</p>
                <p className="text-xl font-bold text-[#164A41] dark:text-[#F1B24A]">
                  DZD {paymentAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Card number */}
            <div className="space-y-1.5">
              <Label htmlFor="card-number" className="text-sm">Numéro de carte</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="font-mono tracking-widest"
              />
            </div>

            {/* Full name + CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="full-name" className="text-sm">Nom complet</Label>
                <Input
                  id="full-name"
                  placeholder="Votre nom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cvc" className="text-sm">Code CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  maxLength={3}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Expiry date */}
            <div className="space-y-1.5">
              <Label className="text-sm">Date d&apos;expiration</Label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Security notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <ShieldCheck className="size-4 text-green-600 flex-shrink-0" />
              Paiement sécurisé — vos données bancaires sont protégées
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsPaymentOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-[#164A41] hover:bg-[#0e3a33] text-white gap-2"
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" />
                    Confirmer le paiement
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Questions Fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h4>
            <p className="text-sm text-muted-foreground">
              Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Y a-t-il un essai gratuit ?</h4>
            <p className="text-sm text-muted-foreground">
              Oui ! Le plan Free vous donne 3 prédictions gratuites pour tester la plateforme avant de passer à Pro.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quels modes de paiement acceptez-vous ?</h4>
            <p className="text-sm text-muted-foreground">
              Nous acceptons la carte Dahabia (Algérie Poste), Visa, Mastercard, RedotPay et Wise.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Y a-t-il des frais d&apos;installation ?</h4>
            <p className="text-sm text-muted-foreground">
              Non, aucun frais d&apos;installation. Vous payez uniquement votre abonnement. Annulez à tout moment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CURRENT PLAN INFO */}
      <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">Votre Plan Actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold capitalize">{user?.plan_tier || "Free"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rôle</p>
              <p className="text-lg font-semibold capitalize">{user?.role || "Client"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge variant="default" className="w-fit">
                {user?.is_active !== false ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Devise</p>
              <p className="text-lg font-semibold">Dinar Algérien (DA)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
