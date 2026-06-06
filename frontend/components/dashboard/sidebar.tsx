"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Sparkles,
  Upload,
  BarChart3,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronsLeft,
  X,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: ("admin" | "client" | "client_user")[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

export function DashboardSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const { t, isRTL } = useLanguage()
  const { user } = useAuth()

  const userRole = user?.role || "client"

  const allNavGroups: NavGroup[] = [
    {
      label: t("nav.operations"),
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/dashboard/predict", label: t("nav.predict"), icon: Sparkles, badge: "AI", roles: ["client", "client_user"] },
        { href: "/dashboard/upload", label: t("nav.upload"), icon: Upload, roles: ["client", "client_user"] },
        { href: "/dashboard/analytics", label: t("nav.analytics"), icon: BarChart3, roles: ["client", "client_user"] },
      ],
    },
    {
      label: t("nav.workspace"),
      items: [
        { href: "/dashboard/clients", label: t("nav.clients"), icon: Users, roles: ["client", "client_user"] },
        { href: "/dashboard/suivi-remboursements", label: t("nav.suiviRemboursements"), icon: FileText, roles: ["client", "client_user"] },
        { href: "/dashboard/enterprise-users", label: t("nav.enterpriseUsers"), icon: Users, roles: ["client"] },
        { href: "/dashboard/subscriptions", label: t("nav.subscriptions"), icon: CreditCard, roles: ["client"] },
        { href: "/dashboard/admins", label: t("nav.admins"), icon: ShieldCheck, roles: ["admin"] },
        { href: "/dashboard/users", label: t("nav.users"), icon: Users, roles: ["admin"] },
        { href: "/dashboard/billing", label: t("nav.billing"), icon: CreditCard, roles: ["admin"] },
        { href: "/dashboard/reports", label: t("nav.reports"), icon: FileText, roles: ["admin"] },
      ],
    },
    {
      label: t("nav.account"),
      items: [
        { href: "/dashboard/profile", label: t("nav.profile"), icon: Users },
        { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
      ],
    },
  ]

  // Filter nav groups by user role
  const navGroups = allNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.includes(userRole as "admin" | "client" | "client_user")),
    }))
    .filter(group => group.items.length > 0)

  const SidebarInner = (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <Logo showWordmark={false} />
        ) : (
          <Link href="/" className="flex items-center">
            <Logo variant="light" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
        <button
          onClick={onMobileClose}
          className="rounded-md p-1.5 hover:bg-sidebar-accent lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-pill"
                          className={cn(
                            "absolute top-1.5 bottom-1.5 w-0.5 bg-[#F1B24A]",
                            isRTL ? "right-0 rounded-l" : "left-0 rounded-r",
                          )}
                        />
                      )}
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active && "text-[#F1B24A]",
                        )}
                      />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && item.badge && (
                        <span className="rounded-md bg-[#F1B24A] px-1.5 py-0.5 text-[10px] font-bold text-[#164A41]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && userRole === "client" && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-xl border border-[#F1B24A]/20 bg-gradient-to-br from-[#F1B24A]/15 to-[#F1B24A]/5 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#F1B24A] text-[#164A41]">
                <Sparkles className="size-3.5" />
              </div>
              <p className="text-xs font-semibold text-sidebar-foreground">
                {t("billing.upgrade")}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-sidebar-foreground/65">
              {t("billing.upgradeDesc")}
            </p>
            <Link
              href="/dashboard/subscriptions"
              className="mt-3 block w-full rounded-lg bg-[#F1B24A] py-2 text-center text-xs font-semibold text-[#164A41] transition-colors hover:bg-[#F1B24A]/90"
            >
              {t("billing.upgradeBtn")}
            </Link>
          </div>
        </div>
      )}
      {!collapsed && userRole !== "client" && (
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/dashboard/admin/messages"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground mb-2"
          >
            <MessageSquare className="size-4" />
            {t("nav.messages")}
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {SidebarInner}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: isRTL ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={cn(
                "fixed inset-y-0 z-50 w-72 border-r border-sidebar-border bg-sidebar lg:hidden",
                isRTL ? "right-0" : "left-0",
              )}
            >
              {SidebarInner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export const SIDEBAR_DESKTOP_WIDTH_CLASS = "lg:pl-64"
