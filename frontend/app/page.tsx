"use client"

import { SiteNav } from "@/components/landing/site-nav"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Solutions } from "@/components/landing/solutions"
import { Pricing } from "@/components/landing/pricing"
import { CtaSection, SiteFooter } from "@/components/landing/cta-footer"
import { ChatbotWidget } from "@/components/landing/chatbot-widget"

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <div id="home">
          <Hero />
        </div>
        <Features />
        <Solutions />
        <Pricing />
        <CtaSection />
      </main>
      <SiteFooter />
      <ChatbotWidget />
    </>
  )
}
