import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showWordmark?: boolean
  variant?: "default" | "light" | "dark"
}

/**
 * PAYPREDICT Premium Logo
 * Modern FinTech AI SaaS style (Stripe/Revolut/Linear inspiration)
 * Colors: Dark Green Premium #1a472d + Gold #F1B24A
 */
export function Logo({ className, showWordmark = true, variant = "default" }: LogoProps) {
  const isDark = variant === "dark"
  const isLight = variant === "light"
  
  const wordmarkColor =
    isLight
      ? "text-white"
      : isDark
        ? "text-white"
        : "text-[#1a472d]"

  return (
    <div className={cn("flex items-center gap-2.5 group transition-all duration-300", className)}>
      {/* Logo Icon */}
      <div className={cn(
        "relative flex items-center justify-center w-8 h-8 rounded-lg font-bold text-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
        isDark && "bg-gradient-to-br from-white to-gray-100 text-[#1a472d]",
        isLight && "bg-gradient-to-br from-[#1a472d] to-[#0d2818] text-white",
        !isDark && !isLight && "bg-gradient-to-br from-[#1a472d] to-[#0d2818] text-white"
      )}>
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0.5 rounded-lg opacity-50 transition-opacity duration-300",
          isDark ? "bg-gradient-to-br from-[#F1B24A]/20 to-transparent" : "bg-gradient-to-br from-[#F1B24A]/30 to-transparent"
        )} />
        
        {/* Premium P Symbol */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="w-1.5 h-4 rounded-full bg-[#F1B24A] transition-all duration-300 group-hover:shadow-md group-hover:shadow-[#F1B24A]/50" />
        </div>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-sm font-bold tracking-tight transition-colors duration-300",
              wordmarkColor,
            )}
          >
            PAYPREDICT
          </span>
          <span
            className={cn(
              "text-[9px] font-semibold tracking-widest opacity-60 transition-opacity duration-300 group-hover:opacity-100",
              wordmarkColor,
            )}
          >
            AI FINANCE
          </span>
        </div>
      )}
    </div>
  )
}
