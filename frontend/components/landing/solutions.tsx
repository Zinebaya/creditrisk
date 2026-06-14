"use client";

import * as React from "react"
import { motion } from "framer-motion"
import { Landmark, Cpu, CreditCard, Coins, ArrowRight } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Solutions() {
  const { t } = useLanguage()

  const solutions = [
    {
      icon: Landmark,
      title: t("landing.solution1Title"),
      desc: t("landing.solution1Desc"),
      accent: "gold",
    },
    {
      icon: Cpu,
      title: t("landing.solution2Title"),
      desc: t("landing.solution2Desc"),
      accent: "green",
    },
    {
      icon: CreditCard,
      title: t("landing.solution3Title"),
      desc: t("landing.solution3Desc"),
      accent: "soft",
    },
    {
      icon: Coins,
      title: t("landing.solution4Title"),
      desc: t("landing.solution4Desc"),
      accent: "gold",
    },
  ]

  return (
    <section id="solutions" className="py-20 lg:py-28 bg-[#06201c]/5 dark:bg-[#06201c]/40 relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[#9DC88D]/5 blur-3xl -z-10" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D774E]"
          >
            {t("landing.solutions")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight"
          >
            {t("landing.solutionsTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-lg text-muted-foreground text-pretty"
          >
            {t("landing.solutionsDesc")}
          </motion.p>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 gap-6 lg:gap-8">
          {solutions.map((sol, i) => {
            const Icon = sol.icon
            const accentClass =
              sol.accent === "gold"
                ? "bg-[#F1B24A]/12 text-[#a07919] dark:text-[#F1B24A]"
                : sol.accent === "green"
                  ? "bg-[#164A41]/10 text-[#164A41] dark:text-[#9DC88D]"
                  : "bg-[#9DC88D]/22 text-[#2f5b34] dark:text-[#9DC88D]"

            return (
              <motion.div
                key={sol.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-300",
                  "hover:border-[#4D774E]/40 hover:shadow-xl hover:shadow-[#164A41]/5"
                )}
              >
                <div className="flex items-start gap-6">
                  <div
                    className={cn(
                      "size-14 rounded-2xl flex items-center justify-center shrink-0 premium-shadow",
                      accentClass
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
                      {sol.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {sol.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-end">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D774E] hover:text-[#164A41] dark:hover:text-[#9DC88D] transition-colors"
                  >
                    En savoir plus
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
