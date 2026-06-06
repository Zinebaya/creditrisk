"use client"

export const dynamic = 'force-dynamic'

import * as React from "react"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"

// Pages that only admins can access
const ADMIN_ONLY_PATHS = [
  "/dashboard/admins",
  "/dashboard/users",
  "/dashboard/billing",
  "/dashboard/reports",
]

// Pages that only clients (Enterprise Admins) can access
const CLIENT_ONLY_PATHS = [
  "/dashboard/subscriptions",
  "/dashboard/enterprise-users",
]

function RBACGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace("/client/login")
      return
    }

    // Block clients/collaborators from admin-only pages
    if (user.role !== "admin" && ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))) {
      router.replace("/dashboard")
      return
    }

    // Block collaborators/admins from client-only pages
    if (user.role !== "client" && CLIENT_ONLY_PATHS.some(p => pathname.startsWith(p))) {
      router.replace("/dashboard")
      return
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Show access denied for unauthorized pages
  if (user.role !== "admin" && ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">Accès refusé</p>
          <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs.</p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  if (user.role !== "client" && CLIENT_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">Accès refusé</p>
          <p className="text-sm text-muted-foreground">Cette page est réservée aux administrateurs d'entreprise.</p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <RBACGuard>
      <div className="min-h-screen bg-background">
        <DashboardSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="lg:pl-64 transition-[padding] duration-300">
          <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-4 lg:p-8"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </RBACGuard>
  )
}
