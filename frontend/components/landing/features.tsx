"use client";

import * as React from "react"

import { motion } from "framer-motion"
import {
  BrainCircuit,
  ShieldCheck,
  LineChart,
  FileSearch,
  Workflow,
  Zap,
  Layers,
  Lock,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

export function Features() {
  const { t } = useLanguage()

  const features = [
    {
      icon: BrainCircuit,
      title: t("landing.feature1Title"),
      desc: t("landing.feature1Desc"),
      accent: "gold",
    },
    {
      icon: FileSearch,
      title: t("landing.feature2Title"),
      desc: t("landing.feature2Desc"),
      accent: "green",
    },
    {
      icon: Workflow,
      title: t("landing.feature3Title"),
      desc: t("landing.feature3Desc"),
      accent: "soft",
    },
    {
      icon: LineChart,
      title: t("landing.feature4Title"),
      desc: t("landing.feature4Desc"),
      accent: "gold",
    },
    {
      icon: Lock,
      title: t("landing.feature5Title"),
      desc: t("landing.feature5Desc"),
      accent: "green",
    },
    {
      icon: Zap,
      title: t("landing.feature6Title"),
      desc: t("landing.feature6Desc"),
      accent: "soft",
    },
  ]

  return (
    <section id="features" className="py-20 lg:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D774E]"
          >
            Platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight"
          >
            {t("landing.featuresTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-lg text-muted-foreground text-pretty"
          >
            {t("landing.featuresDesc")}
          </motion.p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon
            const accentClass =
              f.accent === "gold"
                ? "bg-[#F1B24A]/12 text-[#a07919]"
                : f.accent === "green"
                  ? "bg-[#164A41]/10 text-[#164A41]"
                  : "bg-[#9DC88D]/22 text-[#2f5b34]"
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 lg:p-7 transition-all duration-300",
                  "hover:border-[#4D774E]/40 hover:shadow-lg",
                )}
              >
                <div
                  className={cn(
                    "size-11 rounded-xl flex items-center justify-center mb-5",
                    accentClass,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>

                <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F1B24A]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )
          })}
        </div>

        {/* big highlight card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          id="how"
          className="mt-12 relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#0e3a33] via-[#164A41] to-[#0e3a33] text-white p-8 lg:p-12"
        >
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-[#F1B24A]/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-[#9DC88D]/15 blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-xs font-medium">
                <Layers className="size-3.5" />
                {t("landing.heroBadge3")}
              </div>
              <h3 className="mt-5 font-display text-3xl lg:text-4xl font-bold tracking-tight text-balance">
                {t("landing.pipelineTitle")}
              </h3>
              <p className="mt-4 text-white/75 text-pretty leading-relaxed">
                {t("landing.pipelineDesc")}
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  t("landing.pipelineBullet1"),
                  t("landing.pipelineBullet2"),
                  t("landing.pipelineBullet3"),
                  t("landing.pipelineBullet4"),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <ShieldCheck className="size-4 text-[#F1B24A] mt-0.5 shrink-0" />
                    <span className="text-white/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PipelineGraphic />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PipelineGraphic() {
  const stages = [
    { label: "Application", value: "CSV rows" },
    { label: "Enrichment", value: "Bureau + KYC" },
    { label: "Model", value: "PayPredict Risk v1" },
    { label: "Decision", value: "✓ Approved" },
  ]
  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">
          Decisioning pipeline
        </p>
        <div className="flex items-center gap-1.5 text-xs text-[#9DC88D]">
          <span className="relative flex size-2">
            <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-[#9DC88D] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[#9DC88D]" />
          </span>
          Live
        </div>
      </div>
      <div className="space-y-2.5">
        {stages.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
          >
            <div className="size-7 rounded-lg bg-[#F1B24A]/20 text-[#F1B24A] flex items-center justify-center text-xs font-bold tabular-nums">
              {i + 1}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">{s.label}</span>
              <span className="text-xs text-white/60 font-mono">{s.value}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-[#F1B24A] text-[#164A41] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Outcome
          </span>
          <span className="text-sm font-bold">Confidence ready - LOW RISK</span>
        </div>
      </div>
    </div>
  )
}
