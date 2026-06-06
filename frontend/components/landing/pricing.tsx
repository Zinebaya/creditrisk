"use client";

import * as React from "react"
import Link from "next/link"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

type Plan = {
  name: string
  description: string
  price: string
  period: string
  features: string[]
  cta: string
  badge?: string
  highlighted?: boolean
}

export function Pricing() {
  const { t } = useLanguage()
  const [yearly, setYearly] = React.useState(false)

  const plans: Plan[] = [
    {
      name: "Gratuit",
      description: "Pour découvrir PayPredict sans engagement.",
      price: "0",
      period: "DA/mois",
      features: [
        "3 prédictions au total",
        "Tableau de bord complet",
        "Rapports basiques",
        "1 utilisateur",
        "Support par email",
      ],
      cta: t("landing.getStarted"),
    },
    {
      name: "Pro",
      description: "Pour les équipes risques à la recherche de performance.",
      price: yearly ? "24 000" : "2 500",
      period: "DA/mois",
      badge: "Plus populaire",
      highlighted: true,
      features: [
        "Analyse intelligente du risque de crédit",
        "Prédictions alimentées par l'IA",
        "Gestion centralisée des clients",
        "Tableau de bord analytique avancé",
        "Historique complet des prédictions",
        "Support multi-utilisateurs",
        "Rapports détaillés",
        "Sécurité avancée des données",
        "Infrastructure cloud sécurisée",
      ],
      cta: t("landing.getStarted"),
    },
    {
      name: "Enterprise",
      description: "Pour les banques et institutions financières.",
      price: "Sur devis",
      period: "",
      features: [
        "Prédictions illimitées",
        "Déploiement dédié",
        "Pipelines de données personnalisés",
        "Audits trimestriels du modèle",
        "CSM dédié 24/7 + SLA",
        "Déploiement on-premise disponible",
      ],
      cta: t("landing.contact"),
    },
  ]

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-secondary/30 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D774E]">
            {t("landing.pricing")}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight">
            {t("landing.pricingTitle")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground text-pretty">
            {t("landing.pricingDesc")}
          </p>

          <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t("billing.monthly")}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5",
                yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t("billing.yearly")}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1B24A] text-[#164A41] font-bold">
                {t("billing.save")}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                "relative rounded-3xl border bg-card p-7 lg:p-8 flex flex-col",
                plan.highlighted
                  ? "border-[#164A41] bg-gradient-to-b from-[#164A41] to-[#0e3a33] text-white shadow-2xl scale-[1.02]"
                  : "border-border",
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F1B24A] text-[#164A41] text-xs font-bold uppercase tracking-wide">
                  <Sparkles className="size-3" />
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 className={cn(
                  "font-display text-xl font-bold",
                  plan.highlighted ? "text-white" : "text-foreground",
                )}>
                  {plan.name}
                </h3>
                <p className={cn(
                  "mt-2 text-sm",
                  plan.highlighted ? "text-white/70" : "text-muted-foreground",
                )}>
                  {plan.description}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "font-display text-5xl font-bold tracking-tight tabular-nums",
                    plan.highlighted ? "text-white" : "text-foreground",
                  )}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={cn(
                      "text-sm",
                      plan.highlighted ? "text-white/60" : "text-muted-foreground",
                    )}>
                      {yearly ? "DA/an" : plan.period}
                    </span>
                  )}
                </div>
                {yearly && plan.highlighted && (
                  <p className="mt-2 text-xs text-[#F1B24A] font-medium">
                    Économisez 20% — soit 2 000 DA/mois au lieu de 2 500 DA/mois
                  </p>
                )}
              </div>

              <Button
                asChild
                className={cn(
                  "mt-6 rounded-full h-11",
                  plan.highlighted
                    ? "bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41]"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground",
                )}
              >
                <Link href="/dashboard">{plan.cta}</Link>
              </Button>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      "size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      plan.highlighted
                        ? "bg-[#F1B24A]/25 text-[#F1B24A]"
                        : "bg-[#9DC88D]/30 text-[#164A41]",
                    )}>
                      <Check className="size-3" strokeWidth={3} />
                    </div>
                    <span className={cn(
                      plan.highlighted ? "text-white/90" : "text-foreground",
                    )}>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
