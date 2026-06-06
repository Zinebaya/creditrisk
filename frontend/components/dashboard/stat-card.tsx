"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ComponentType<{ className?: string }>
  accent?: "gold" | "green" | "soft" | "dark"
  spark?: number[]
  delay?: number
}

const accentMap = {
  gold: { bg: "bg-[#F1B24A]/15", fg: "text-[#a07919]", line: "#F1B24A" },
  green: { bg: "bg-[#4D774E]/15", fg: "text-[#4D774E]", line: "#4D774E" },
  soft: { bg: "bg-[#9DC88D]/25", fg: "text-[#2f5b34]", line: "#4D774E" },
  dark: { bg: "bg-[#164A41]/10", fg: "text-[#164A41]", line: "#164A41" },
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  accent = "green",
  spark,
  delay = 0,
}: StatCardProps) {
  const a = accentMap[accent]
  const isUp = (change ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="p-5 border-border premium-shadow gap-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn("size-10 rounded-xl flex items-center justify-center", a.bg)}>
              <Icon className={cn("size-5", a.fg)} />
            </div>
          )}
        </div>

        <div className="flex items-end justify-between gap-3 -mt-1">
          {typeof change === "number" && (
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold",
                  isUp ? "bg-[#9DC88D]/25 text-[#2f5b34]" : "bg-destructive/10 text-destructive",
                )}
              >
                {isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(change)}%
              </div>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
          {spark && <Sparkline data={spark} color={a.line} />}
        </div>
      </Card>
    </motion.div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80
  const h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ")
  const id = React.useId()
  return (
    <svg width={w} height={h} className="ml-auto" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#${id})`}
        stroke="none"
        points={`0,${h} ${points} ${w},${h}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}
