"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Legacy /login route — redirects to the dedicated client login.
 * Keeps backward compatibility for users who have /login bookmarked.
 */
export default function LoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/client/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06201c]">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm text-white/50">Redirection…</p>
      </div>
    </div>
  )
}
