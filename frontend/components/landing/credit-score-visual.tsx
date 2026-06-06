"use client";

import * as React from "react"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Sparkles, TrendingUp, ShieldCheck, Brain } from "lucide-react"

const factors = [
  { label: "Payment history", weight: 92, color: "#164A41" },
  { label: "Credit utilization", weight: 78, color: "#4D774E" },
  { label: "Credit length", weight: 64, color: "#9DC88D" },
  { label: "Debt-to-income", weight: 81, color: "#F1B24A" },
]

export function CreditScoreVisual() {
  const score = useMotionValue(420)
  const spring = useSpring(score, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [scoreText, setScoreText] = React.useState(420)

  React.useEffect(() => {
    const unsub = display.on("change", (v) => setScoreText(v))
    score.set(782)
    return () => unsub()
  }, [display, score])

  // arc geometry
  const radius = 110
  const circumference = Math.PI * radius
  const progress = (scoreText - 300) / (850 - 300)
  const offset = circumference * (1 - progress)

  return (
    <div className="relative">
      {/* glow halo */}
      <div className="absolute -inset-8 -z-10">
        <div className="absolute top-1/3 left-1/4 size-48 rounded-full bg-[#F1B24A]/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 size-56 rounded-full bg-[#9DC88D]/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl bg-card/90 backdrop-blur-xl border border-border premium-shadow p-6 md:p-8"
      >
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Live AI Prediction</p>
              <p className="text-sm font-semibold">Borrower example</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#9DC88D]/15 text-[#164A41] font-medium">
            <span className="relative flex size-2">
              <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-[#4D774E] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#4D774E]" />
            </span>
            Analyzing
          </div>
        </div>

        {/* gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-[260px] h-[140px]">
            <svg viewBox="0 0 260 140" className="w-full h-full">
              <defs>
                <linearGradient id="gauge-grad" x1="0" y1="0" x2="260" y2="0">
                  <stop offset="0%" stopColor="#c0392b" />
                  <stop offset="40%" stopColor="#F1B24A" />
                  <stop offset="100%" stopColor="#4D774E" />
                </linearGradient>
              </defs>
              <path
                d={`M 20 130 A ${radius} ${radius} 0 0 1 240 130`}
                fill="none"
                stroke="currentColor"
                className="text-secondary"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <motion.path
                d={`M 20 130 A ${radius} ${radius} 0 0 1 240 130`}
                fill="none"
                stroke="url(#gauge-grad)"
                strokeWidth="14"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                }}
                transition={{ duration: 1.4 }}
              />
            </svg>
            <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Credit Score</p>
              <motion.p className="font-display text-5xl font-bold gradient-text-green tabular-nums">
                {scoreText}
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-[#9DC88D]/20 border border-[#9DC88D]/40">
            <ShieldCheck className="size-3.5 text-[#164A41]" />
            <span className="text-xs font-semibold text-[#164A41]">LOW RISK - confidence ready</span>
          </div>
        </div>

        {/* factors */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature importance</p>
            <Sparkles className="size-3.5 text-[#F1B24A]" />
          </div>
          {factors.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-foreground font-medium">{f.label}</span>
                <span className="tabular-nums text-muted-foreground">{f.weight}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.weight}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: f.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* floating badges */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="hidden md:flex absolute -left-6 top-1/3 items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border premium-shadow animate-float-slow"
      >
        <div className="size-7 rounded-md bg-[#F1B24A]/15 flex items-center justify-center">
          <TrendingUp className="size-3.5 text-[#F1B24A]" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Default risk</p>
          <p className="text-xs font-bold text-[#164A41]">Low signal</p>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        style={{ animationDelay: "1.5s" }}
        className="hidden md:flex absolute -right-4 top-12 items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border premium-shadow animate-float-slow"
      >
        <div className="size-7 rounded-md bg-[#4D774E]/15 flex items-center justify-center">
          <ShieldCheck className="size-3.5 text-[#4D774E]" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Approved</p>
          <p className="text-xs font-bold text-[#164A41]">850,000 DA</p>
        </div>
      </motion.div>
    </div>
  )
}
