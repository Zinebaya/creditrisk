"use client";

import * as React from "react"
import Link from "next/link"

import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

export function SiteNav() {
  const { t } = useLanguage()
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const navItems = [
    { href: "/#features", label: t("landing.features") },
    { href: "/#how", label: t("landing.howItWorks") },
    { href: "/#pricing", label: t("landing.pricing") },
    { href: "/#testimonials", label: t("landing.customers") },
    { href: "/about", label: t("landing.about") },
    { href: "/#contact", label: t("landing.contact") },
  ]

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl border border-transparent transition-all duration-300",
            scrolled
              ? "glass border-border/60 px-4 py-2 premium-shadow"
              : "px-2 py-2",
          )}
        >
          <Link href="/" aria-label="PAYPREDICT home" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher compact />
            <Button variant="ghost" asChild className="text-sm">
              <Link href="/login">{t("landing.signIn")}</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium gap-1.5 group">
              <Link href="/dashboard">
                {t("landing.getStarted")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary/80"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 rounded-2xl glass border border-border/60 p-3 premium-shadow"
            >
              <nav className="flex flex-col">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 text-sm hover:bg-secondary/80 rounded-lg"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <div className="px-3 py-2">
                  <LanguageSwitcher compact />
                </div>
                <Button variant="ghost" asChild className="justify-start">
                  <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full mt-1">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>Get started</Link>
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
