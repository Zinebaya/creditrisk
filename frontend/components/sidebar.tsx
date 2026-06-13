"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronsLeft,
  X,
  Home,
  LogOut,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  isAuthenticated?: boolean
  userRole?: "admin" | "user" | "client"
}

/**
 * Main Sidebar Component for PAYPREDICT
 * Responsive desktop/mobile with collapse functionality
 */
export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  isAuthenticated = false,
  userRole = "user",
}: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const { t } = useLanguage()

  // Navigation groups based on authentication status
  const getNavGroups = (): NavGroup[] => {
    if (!isAuthenticated) {
      return [
        {
          label: t("nav.operations"),
          items: [
            { href: "/", label: t("nav.dashboard"), icon: Home },
            { href: "/pricing", label: t("billing.title"), icon: CreditCard },
            { href: "/features", label: "Features", icon: Sparkles },
          ],
        },
      ]
    }

    // Authenticated user navigation
    const dashboardItems = [
      { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { href: "/dashboard/predict", label: t("nav.predict"), icon: Sparkles, badge: "AI" },
      { href: "/dashboard/analytics", label: t("nav.analytics"), icon: BarChart3 },
    ]

    const workspaceItems = [
      { href: "/dashboard/clients", label: t("nav.clients"), icon: Users },
      ...(userRole === "admin" 
        ? [{ href: "/dashboard/admins", label: t("nav.admins"), icon: ShieldCheck }]
        : []),
      { href: "/dashboard/subscriptions", label: t("nav.subscriptions"), icon: CreditCard },
    ]

    const accountItems = [
      { href: "/dashboard/profile", label: t("nav.profile"), icon: Users },
      { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
    ]

    return [
      {
        label: t("nav.operations"),
        items: dashboardItems,
      },
      {
        label: t("nav.workspace"),
        items: workspaceItems,
      },
      {
        label: t("nav.account"),
        items: accountItems,
      },
    ]
  }

  const navGroups = getNavGroups()
  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.startsWith(href)) return true
    return pathname === href
  }

  const SidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div
        className={cn(
          "flex items-center px-4 h-16 border-b border-sidebar-border transition-all duration-300",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <Link href="/" className="flex items-center justify-center">
            <Logo showWordmark={false} />
          </Link>
        ) : (
          <Link href="/" className="flex items-center">
            <Logo variant="light" />
          </Link>
        )}

        {/* Desktop Collapse Button */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          aria-label="Collapse sidebar"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronsLeft
            className={cn(
              "size-4 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-2 mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45 transition-colors duration-300">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon as React.ComponentType<{ className?: string }>
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      {/* Active Indicator */}
                      {active && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#F1B24A] transition-colors duration-300"
                        />
                      )}

                      {/* Icon */}
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors duration-200",
                          active && "text-[#F1B24A]",
                        )}
                      />

                      {/* Label */}
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Badge */}
                      {!collapsed && "badge" in item && item.badge && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#F1B24A] text-[#164A41] ml-auto"
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer - Upgrade Card & Help */}
      {isAuthenticated && !collapsed && (
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Upgrade Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gradient-to-br from-[#F1B24A]/15 to-[#F1B24A]/5 border border-[#F1B24A]/20 p-3.5 hover:border-[#F1B24A]/40 transition-colors duration-300"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="size-7 rounded-lg bg-[#F1B24A] text-[#164A41] flex items-center justify-center flex-shrink-0">
                <Sparkles className="size-3.5" />
              </div>
              <p className="text-xs font-semibold text-sidebar-foreground leading-tight">
                Upgrade to Pro
              </p>
            </div>
            <p className="text-xs text-sidebar-foreground/65 leading-relaxed mb-2.5">
              Get advanced analytics, unlimited predictions, and premium support.
            </p>
            <Link
              href="/dashboard/subscriptions"
              className="block w-full text-center text-xs font-semibold py-2 px-3 rounded-lg bg-[#F1B24A] text-[#164A41] hover:bg-[#F1B24A]/90 transition-all duration-200 active:scale-95"
            >
              Upgrade now
            </Link>
          </motion.div>

          {/* Help Button */}
          <button className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200">
            <HelpCircle className="size-4 flex-shrink-0" />
            <span>Help & Support</span>
          </button>
        </div>
      )}

      {/* Footer - Authenticated User */}
      {isAuthenticated && collapsed && (
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <HelpCircle className="size-4" />
          </button>
          <button className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground hover:text-red-500">
            <LogOut className="size-4" />
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-border transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden bg-sidebar border-r border-sidebar-border"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Compact Sidebar for embedding in layouts
 */
export function SidebarCompact({ className }: { className?: string }) {
  return (
    <aside className={cn("hidden lg:block w-64 h-screen overflow-hidden", className)}>
      <Sidebar isAuthenticated={true} />
    </aside>
  )
}
