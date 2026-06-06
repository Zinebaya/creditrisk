"use client";

import { motion } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"

export function LogoCloud() {
  const { t } = useLanguage()
  const companies = [
    "Banks",
    "Fintech lenders",
    "Leasing teams",
    "SMB credit",
    "Auto finance",
    "Risk analysts",
    "Private equity",
  ]
  return (
    <section className="py-12 lg:py-16 border-y border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
          The infrastructure of choice for institutional credit risk.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-x-6 gap-y-8 items-center justify-items-center"
        >
          {companies.map((c) => (
            <span
              key={c}
              className="font-display text-lg font-semibold text-muted-foreground/70 hover:text-foreground transition-colors text-center"
            >
              {c}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
