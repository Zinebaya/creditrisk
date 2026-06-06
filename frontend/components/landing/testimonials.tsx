"use client";

import { motion } from "framer-motion"
import { Quote } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Testimonials() {
  const { t } = useLanguage()
  const testimonials = [
    {
      quote:
        "The AI infrastructure PayPredict provides has transformed how we approach risk. Decisions are now data-driven, explainable, and fully auditable.",
      name: "Sarah Chen",
      role: "Head of Risk",
      company: "Apex Finance",
      initials: "SC",
    },
    {
      quote:
        "Integration was seamless. The prediction API handles our bulk batch processing with remarkable speed and precision.",
      name: "Marcus Thorne",
      role: "CTO",
      company: "Velocity Lending",
      initials: "MT",
    },
    {
      quote:
        "Security and compliance were our top priorities. PayPredict's JWT-based sessions and encryption standards exceeded our expectations.",
      name: "Elena Rodriguez",
      role: "Compliance Officer",
      company: "Global Trust Bank",
      initials: "ER",
    },
  ]

  return (
    <section id="testimonials" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D774E]">
            {t("landing.customers")}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-tight">
            Trusted by the risk teams setting the standard.
          </h2>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative rounded-3xl border border-border bg-card p-7 flex flex-col"
            >
              <Quote className="size-7 text-[#F1B24A]" strokeWidth={1.5} />
              <blockquote className="mt-4 text-base text-foreground leading-relaxed text-pretty">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-[#164A41] to-[#4D774E] text-white text-sm font-bold flex items-center justify-center">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} - {t.company}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
