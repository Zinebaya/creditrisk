import React from "react"
import { cn } from "@/lib/utils"

interface PaypredictLogoProps {
  className?: string
  variant?: "default" | "light" | "dark"
  showWordmark?: boolean
  animated?: boolean
}

/**
 * PAYPREDICT Premium Logo
 * Design: Modern FinTech AI SaaS style (Stripe/Revolut/Linear inspiration)
 * Colors: Dark Green Premium + Gold Accent + White
 */
export function PaypredictLogo({
  className,
  variant = "default",
  showWordmark = true,
  animated = false,
}: PaypredictLogoProps) {
  const isDark = variant === "dark"
  const isLight = variant === "light"

  return (
    <div
      className={cn(
        "flex items-center gap-2.5",
        animated && "group"
      )}
    >
      {/* Logo Mark */}
      <div
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-lg font-bold text-lg transition-all duration-300",
          animated && "group-hover:scale-110 group-hover:shadow-lg",
          isDark && "bg-gradient-to-br from-white to-gray-100 text-[#1a472d]",
          isLight && "bg-gradient-to-br from-[#1a472d] to-[#0d2818] text-white",
          !isDark && !isLight && "bg-gradient-to-br from-[#1a472d] to-[#0d2818] text-white",
          className
        )}
      >
        {/* Premium Circle Background */}
        <div className={cn(
          "absolute inset-0.5 rounded-lg opacity-50 transition-opacity duration-300",
          animated && "group-hover:opacity-100",
          isDark ? "bg-gradient-to-br from-[#F1B24A]/20 to-transparent" : "bg-gradient-to-br from-[#F1B24A]/30 to-transparent"
        )} />

        {/* Gold Accent Bar (P symbol inspired) */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="flex flex-col items-center justify-center">
            <div className={cn(
              "w-1.5 h-4 rounded-full transition-colors duration-300",
              animated && "group-hover:bg-[#F1B24A]",
              isDark ? "bg-[#F1B24A]" : "bg-[#F1B24A]"
            )} />
          </div>
        </div>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-sm font-bold tracking-tight transition-colors duration-300",
              animated && "group-hover:text-[#F1B24A]",
              isDark && "text-white",
              isLight && "text-[#1a472d]",
              !isDark && !isLight && "text-[#1a472d]"
            )}
          >
            PAYPREDICT
          </span>
          <span
            className={cn(
              "text-[9px] font-semibold tracking-widest opacity-60 transition-opacity duration-300",
              animated && "group-hover:opacity-100",
              isDark && "text-white",
              isLight && "text-[#1a472d]",
              !isDark && !isLight && "text-[#1a472d]"
            )}
          >
            AI FINANCE
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Icon-only version for mobile/favicon
 */
export function PaypredictIcon({
  className,
  variant = "default",
}: Omit<PaypredictLogoProps, "showWordmark" | "animated">) {
  const isDark = variant === "dark"

  return (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-lg relative transition-all duration-300 hover:scale-110 hover:shadow-lg",
        isDark && "bg-gradient-to-br from-white to-gray-100 text-[#1a472d]",
        !isDark && "bg-gradient-to-br from-[#1a472d] to-[#0d2818] text-white",
        className
      )}
    >
      <div className={cn(
        "absolute inset-0.5 rounded-lg opacity-50",
        isDark ? "bg-gradient-to-br from-[#F1B24A]/20 to-transparent" : "bg-gradient-to-br from-[#F1B24A]/30 to-transparent"
      )} />
      <div className="relative flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center justify-center">
          <div className={cn(
            "w-1.5 h-4 rounded-full",
            isDark ? "bg-[#F1B24A]" : "bg-[#F1B24A]"
          )} />
        </div>
      </div>
    </div>
  )
}

/**
 * Horizontal Logo for Headers
 */
export function PaypredictLogoHorizontal({
  className,
}: Pick<PaypredictLogoProps, "className">) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a472d] to-[#0d2818]">
        <div className="absolute inset-1 rounded-[10px] opacity-30 bg-gradient-to-br from-[#F1B24A]/30 to-transparent" />
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-2 h-5 rounded-full bg-[#F1B24A]" />
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-[#1a472d]">
          PAYPREDICT
        </span>
        <span className="text-[10px] font-semibold tracking-widest text-[#1a472d] opacity-50">
          AI CREDIT ENGINE
        </span>
      </div>
    </div>
  )
}
