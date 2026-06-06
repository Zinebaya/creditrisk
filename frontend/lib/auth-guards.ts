import { redirect } from "next/navigation"

export interface AuthUser {
  id?: number
  email: string
  role: "admin" | "client"
  plan_tier?: string
  created_at?: string
}

export function requireAdmin(user: AuthUser | null | undefined) {
  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/dashboard")
  }
}

export function requireClient(user: AuthUser | null | undefined) {
  if (!user) {
    redirect("/login")
  }

  if (user.role !== "client") {
    redirect("/dashboard")
  }
}

export function requireAuth(user: AuthUser | null | undefined) {
  if (!user) {
    redirect("/login")
  }
}
