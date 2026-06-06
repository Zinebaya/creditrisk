"use client";

import * as React from "react"
import Link from "next/link"

import { motion } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import { ArrowRight, Sparkles, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreditScoreVisual } from "./credit-score-visual"

export function Hero() {
  const { t } = useLanguage()

  return (
    <section className="relative pt-32 lg:pt-40 pb-16 lg:pb-24 overflow-hidden">
      {/* background pattern */}
      <div className="absolute inset-0 -z-10 grid-bg radial-fade" aria-hidden="true" />
      <div className="absolute -top-40 -right-32 size-[480px] rounded-full bg-[#F1B24A]/10 blur-3xl -z-10" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-32 size-[480px] rounded-full bg-[#4D774E]/15 blur-3xl -z-10" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F1B24A]/30 bg-[#F1B24A]/8"
            >
              <Sparkles className="size-3.5 text-[#F1B24A]" />
              <span className="text-xs font-semibold text-[#164A41]">
                {t("landing.heroTag")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.05]"
            >
              {t("landing.heroTitle")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground text-pretty leading-relaxed max-w-xl"
            >
              {t("landing.heroDesc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 px-6 text-sm font-semibold gold-shadow group"
              >
                <Link href="/dashboard">
                  {t("landing.heroPrimary")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="rounded-full h-12 px-5 text-sm font-medium gap-2"
              >
                <Link href="#how">
                  <PlayCircle className="size-4" />
                  {t("landing.heroSecondary")}
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-[#4D774E]" />
                {t("landing.heroBadge1")}
              </div>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-[#4D774E]" />
                {t("landing.heroBadge2")}
              </div>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-[#4D774E]" />
                {t("landing.heroBadge3")}
              </div>
            </motion.div>
          </div>

          <CreditScoreVisual />
        </div>
      </div>
    </section>
  )
}
