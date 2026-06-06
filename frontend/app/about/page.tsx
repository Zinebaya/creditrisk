import { ShieldCheck, Brain, MapPinned, LockKeyhole, Sparkles, Users2 } from "lucide-react"
import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/cta-footer"
import { ChatbotWidget } from "@/components/landing/chatbot-widget"
import { Card } from "@/components/ui/card"

const values = [
  {
    icon: Brain,
    title: "Explainable risk intelligence",
    text: "PayPredict combines machine-learning scoring with clear decision signals so credit teams can move quickly without losing auditability.",
  },
  {
    icon: MapPinned,
    title: "Built for Algeria",
    text: "The platform supports DZD, Algerian date formats, local phone validation, and all 58 wilayas across client workflows.",
  },
  {
    icon: LockKeyhole,
    title: "Secure by default",
    text: "Dashboard access is protected with encrypted sessions, hashed passwords, and an admin-first operating model.",
  },
]

const metrics = [
  { label: "Wilayas supported", value: "58" },
  { label: "Languages", value: "3" },
  { label: "Protected routes", value: "100%" },
]

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="relative overflow-hidden pb-16 pt-32 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-10 grid-bg radial-fade" aria-hidden="true" />
          <div className="absolute -right-32 -top-40 -z-10 size-[480px] rounded-full bg-[#F1B24A]/10 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-32 -z-10 size-[480px] rounded-full bg-[#4D774E]/15 blur-3xl" aria-hidden="true" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F1B24A]/30 bg-[#F1B24A]/10 px-3 py-1.5">
                <Sparkles className="size-3.5 text-[#F1B24A]" />
                <span className="text-xs font-semibold text-[#164A41]">
                  About PayPredict
                </span>
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Credit risk software with a local, professional operating model.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
                PayPredict helps lending teams evaluate borrowers, understand model decisions,
                and manage credit workflows from a secure SaaS dashboard tailored for the
                Algerian market.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <Card key={metric.label} className="glass border-border/60 p-5 premium-shadow">
                  <p className="font-display text-3xl font-bold text-[#164A41]">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-5 lg:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <Card key={value.title} className="p-6 premium-shadow">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#164A41] text-white">
                      <Icon className="size-5" />
                    </div>
                    <h2 className="mt-5 font-display text-lg font-semibold">
                      {value.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {value.text}
                    </p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="pb-20 lg:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#164A41] via-[#0e3a33] to-[#164A41] p-8 text-white lg:p-14">
              <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#F1B24A]/25 blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
                    <ShieldCheck className="size-4 text-[#F1B24A]" />
                    Production-minded SaaS architecture
                  </div>
                  <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    Designed to keep underwriting focused, fast, and defensible.
                  </h2>
                  <p className="mt-4 max-w-2xl text-white/70">
                    The original premium experience is preserved: animated landing sections,
                    glass surfaces, dashboard navigation, dark mode, and responsive layouts
                    remain part of the product.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
                  <Users2 className="size-8 text-[#F1B24A]" />
                  <p className="mt-4 text-sm leading-relaxed text-white/75">
                    Start with the default admin, add real clients, then run predictions only
                    against the clients you create.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <ChatbotWidget />
    </>
  )
}
