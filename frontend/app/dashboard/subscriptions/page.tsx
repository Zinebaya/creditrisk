"use client"

import React from "react"
import { Check, X, Zap, Sparkles, Crown, ArrowRight, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
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
    monthlyPrice: 0,
    yearlyPrice: 0,
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
    cta: "Contact Sales",
  },
]

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "yearly">("monthly")

  const handleUpgrade = (planId: string) => {
    if (planId === "enterprise") {
      toast.info("Contactez-nous à sales@paypredict.ai pour un devis Enterprise")
      return
    }
    if (planId === user?.plan_tier) {
      toast.info("Vous êtes déjà sur ce plan")
      return
    }
    if (planId === "pro") {
      toast.success("Redirection vers le paiement...", {
        description: "Moyens acceptés : Visa, Mastercard, RedotPay, Wise"
      })
      return
    }
  }

  const yearlyDiscount = 20

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
                  ) : plan.monthlyPrice === 0 && plan.id === "enterprise" ? (
                    <div className="text-3xl font-bold">Sur devis</div>
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
                  onClick={() => handleUpgrade(plan.id)}
                  variant={plan.highlight && !isCurrent ? "default" : isCurrent ? "secondary" : "outline"}
                  className="w-full gap-2"
                  disabled={isCurrent}
                >
                  {plan.cta}
                  {!isCurrent && <ArrowRight className="size-4" />}
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
              Nous acceptons les cartes bancaires, virements bancaires et paiements mobiles. Pour Enterprise, contactez notre équipe commerciale.
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
