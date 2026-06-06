"use client";

import { motion } from "framer-motion"
import { BrainCircuit, BarChart3, Users, Building2, ShieldCheck, LineChart } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Stats() {
  const { t } = useLanguage()
  const stats = [
    { icon: BrainCircuit, value: t("landing.stat1Value"), label: t("landing.stat1Label") },
    { icon: LineChart, value: t("landing.stat2Value"), label: t("landing.stat2Label") },
    { icon: Users, value: t("landing.stat3Value"), label: t("landing.stat3Label") },
    { icon: ShieldCheck, value: t("landing.stat4Value"), label: t("landing.stat4Label") },
  ]

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-3xl border border-border bg-border/60">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="bg-card p-8 lg:p-10 flex flex-col items-start"
              >
                <Icon className="size-8 text-[#4D774E] mb-3" strokeWidth={1.5} />
                <p className="font-display text-lg lg:text-xl font-bold tracking-tight text-foreground">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  {s.label}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
