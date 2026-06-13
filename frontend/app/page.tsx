"use client"

import { SiteNav } from "@/components/landing/site-nav"
import { Hero } from "@/components/landing/hero"
import { LogoCloud } from "@/components/landing/logo-cloud"
import { Stats } from "@/components/landing/stats"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { Testimonials } from "@/components/landing/testimonials"
import { CtaSection, SiteFooter } from "@/components/landing/cta-footer"
import { ChatbotWidget } from "@/components/landing/chatbot-widget"

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <LogoCloud />
        <Stats />
        <Features />
        <Pricing />
        <Testimonials />
        <CtaSection />
      </main>
      <SiteFooter />
      <ChatbotWidget />
    </>
  )
}
