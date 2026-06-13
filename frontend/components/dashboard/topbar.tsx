"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  Plus,
  CreditCard,
  Settings,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"

const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    const hostname = window.location.hostname
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:8000`
    }
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
}

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [mounted, setMounted] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Array<{ id: number; title: string; desc: string; time: string; link: string; type: string }>>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return
    try {
      if (user.role === "admin") {
        const response = await fetch(`${getApiBase()}/api/admin/messages?is_read=false`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("paypredict.token")}` }
        })
        if (response.ok) {
          const data = await response.json()
          const msgs = (data.messages || []) as any[]
          const formatted = msgs.map((m: any) => ({
            id: m.id,
            title: `Nouveau message de ${m.name}`,
            desc: m.subject,
            time: new Date(m.created_at).toLocaleDateString(),
            link: "/dashboard/admin/messages",
            type: "admin_unread"
          }))
          setNotifications(formatted)
          setUnreadCount(formatted.length)
        }
      } else {
        const response = await fetch(`${getApiBase()}/api/client/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("paypredict.token")}` }
        })
        if (response.ok) {
          const data = await response.json()
          const msgs = (data.messages || []) as any[]
          
          const stored = localStorage.getItem("paypredict.read_replies")
          const readIds: number[] = stored ? JSON.parse(stored) : []
          
          const unreadReplies = msgs.filter((m: any) => m.response_message && !readIds.includes(m.id))
          
          const formatted = unreadReplies.map((m: any) => ({
            id: m.id,
            title: `Réponse de l'admin`,
            desc: m.subject,
            time: new Date(m.responded_at || m.created_at).toLocaleDateString(),
            link: "/dashboard/messages",
            type: "client_reply"
          }))
          setNotifications(formatted)
          setUnreadCount(formatted.length)
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }, [user])

  React.useEffect(() => {
    setMounted(true)
    fetchNotifications()

    const interval = setInterval(fetchNotifications, 30000)
    window.addEventListener("notifications_updated", fetchNotifications)

    return () => {
      clearInterval(interval)
      window.removeEventListener("notifications_updated", fetchNotifications)
    }
  }, [fetchNotifications])

  const initials = user?.email?.slice(0, 2).toUpperCase() || "PP"

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 lg:px-8">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-secondary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("nav.searchPlaceholder")}
            className="h-9 border-transparent bg-secondary/50 pl-10 text-sm focus-visible:border-border focus-visible:bg-card"
          />
          <kbd className="absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
            Ctrl K
          </kbd>
        </div>

        <div className="flex-1 sm:flex-none" />

        <div className="flex items-center gap-1.5">
          {user?.role !== "admin" && (
            <Button
              asChild
              size="sm"
              className="hidden h-9 gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 md:inline-flex"
            >
              <Link href="/dashboard/predict">
                <Plus className="size-4" />
                {t("nav.newPrediction")}
              </Link>
            </Button>
          )}


          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )
            ) : (
              <div className="size-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-9 rounded-lg">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{t("nav.notifications")}</span>
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  {unreadCount}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t("nav.noNotifications")}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto py-1">
                  {notifications.map((n) => {
                    const handleNotificationClick = () => {
                      if (n.type === "client_reply") {
                        try {
                          const stored = localStorage.getItem("paypredict.read_replies")
                          const readIds = stored ? JSON.parse(stored) : []
                          if (!readIds.includes(n.id)) {
                            readIds.push(n.id)
                            localStorage.setItem("paypredict.read_replies", JSON.stringify(readIds))
                            fetchNotifications()
                          }
                        } catch (e) {
                          console.error(e)
                        }
                      }
                    }
                    return (
                      <DropdownMenuItem key={n.id} asChild>
                        <Link
                          href={n.link}
                          onClick={handleNotificationClick}
                          className="flex flex-col items-start gap-1 p-3 cursor-pointer border-b last:border-0 hover:bg-muted/50"
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">
                              {n.title}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {n.time}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {n.desc}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-lg p-1 hover:bg-secondary">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-gradient-to-br from-[#164A41] to-[#4D774E] text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden pr-2 text-left leading-tight md:block">
                  <p className="text-xs font-semibold">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">{user?.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-semibold">{user?.email}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="gap-2">
                  <User className="size-4" />
                  {t("nav.profile")}
                </Link>
              </DropdownMenuItem>
              {user?.role !== "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/subscriptions" className="gap-2">
                    <CreditCard className="size-4" />
                    {t("nav.subscriptions")}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="gap-2">
                  <Settings className="size-4" />
                  {t("nav.settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
