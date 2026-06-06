"use client"

import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import AdminDashboard from "./admin-dashboard"
import ClientDashboard from "./client-dashboard"

export default function DashboardOverviewPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  // ADMIN VIEW
  if (user?.role === "admin") {
    return <AdminDashboard />
  }

  // CLIENT VIEW (default for 'client' or unspecified roles)
  if (user?.role === "client" || user?.role === "client_user") {
    return <ClientDashboard />
  }

  // Fallback: redirect to login if role not recognized
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-red-500">Invalid user role. Please log in again.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 text-primary hover:underline"
        >
          Return to login
        </button>
      </div>
    </div>
  )
}
