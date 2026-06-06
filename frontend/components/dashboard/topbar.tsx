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
import { LanguageSwitcher } from "@/components/language-switcher"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

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

          <LanguageSwitcher compact />

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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{t("nav.notifications")}</span>
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  0
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t("nav.noNotifications")}
              </div>
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
