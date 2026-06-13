"use client";

import Link from "next/link"

import { motion } from "framer-motion"
import { ArrowRight, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/brand/logo"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "sonner"

export function CtaSection() {
  const { t } = useLanguage()
  return (
    <section id="contact" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#164A41] via-[#0e3a33] to-[#164A41] p-8 lg:p-16 text-white"
        >
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-[#F1B24A]/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-[#9DC88D]/20 blur-3xl" />
          <div className="absolute inset-0 grid-bg radial-fade opacity-30" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight">
                {t("landing.ctaTitle")}
              </h2>
              <p className="mt-5 text-lg text-white/75 text-pretty">
                {t("landing.ctaDesc")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41] rounded-full h-12 px-6 font-semibold gold-shadow group"
                >
                  <Link href="/dashboard">
                    {t("landing.ctaPrimary")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-6 bg-transparent border-white/25 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="#contact">{t("landing.ctaSecondary")}</Link>
                </Button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success("Request received. Connect this form to your CRM in production.")
              }}
              className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-6 lg:p-8 space-y-4"
            >
              <p className="text-sm font-semibold text-white">
                Or get a tailored ROI report in your inbox
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  required
                  placeholder="First name"
                  className="bg-white/8 border-white/15 text-white placeholder:text-white/50 h-11"
                />
                <Input
                  required
                  placeholder="Last name"
                  className="bg-white/8 border-white/15 text-white placeholder:text-white/50 h-11"
                />
              </div>
              <Input
                required
                type="email"
                placeholder="Work email"
                className="bg-white/8 border-white/15 text-white placeholder:text-white/50 h-11"
              />
              <Input
                placeholder="Company"
                className="bg-white/8 border-white/15 text-white placeholder:text-white/50 h-11"
              />
              <Button
                type="submit"
                className="w-full h-11 bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41] rounded-full font-semibold gap-2"
              >
                <Send className="size-4" />
                Request my report
              </Button>
              <p className="text-xs text-white/50 text-center">
                We respond in under 4 business hours.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  const { t } = useLanguage()
  const cols = [
    {
      title: t("landing.features"),
      links: [
        { label: t("nav.predict"), href: "/dashboard/predict" },
        { label: t("nav.analytics"), href: "/dashboard/analytics" },
        { label: t("nav.helpDoc"), href: "/dashboard/help" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "Banks", href: "/about" },
        { label: "Consumer lending", href: "/about" },
        { label: "BNPL", href: "/about" },
        { label: "SMB underwriting", href: "/about" },
        { label: "Auto finance", href: "/about" },
      ],
    },
    {
      title: t("landing.about"),
      links: [
        { label: t("landing.about"), href: "/about" },
        { label: t("landing.customers"), href: "/#testimonials" },
        { label: "Careers", href: "/about" },
        { label: "Press", href: "/about" },
        { label: "Security", href: "/about" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/dashboard/help" },
        { label: "Changelog", href: "/about" },
        { label: "Blog", href: "/about" },
        { label: "Status", href: "/about" },
        { label: "Trust center", href: "/about" },
      ],
    },
  ]
  return (
    <footer className="bg-[#06201c] text-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-6 gap-10">
          <div className="lg:col-span-2">
            <Logo variant="light" />
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              The AI infrastructure for credit risk at institutional scale. Built
              by risk engineers, trusted by global banks.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#9DC88D]" />
              <span className="text-xs text-white/60">All systems operational</span>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/60 hover:text-[#F1B24A] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} PayPredict. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/50">
            <Link href="/about">Privacy</Link>
            <Link href="/about">Terms</Link>
            <Link href="/about">Security</Link>
            <Link href="/about">DPA</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
