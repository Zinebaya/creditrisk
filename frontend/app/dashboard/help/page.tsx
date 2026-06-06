"use client"

import { BookOpen, LifeBuoy, Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"

const items = [
  {
    icon: BookOpen,
    title: "Documentation",
    text: "Guides for clients, predictions, analytics, and secure admin access.",
  },
  {
    icon: LifeBuoy,
    title: "Support",
    text: "Use this space to connect your production support workflow.",
  },
  {
    icon: Mail,
    title: "Contact",
    text: "For now, support requests can be handled by your administrator.",
  },
]

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Help & documentation"
        description="Reference material and support entry points for PayPredict."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="p-6 premium-shadow">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#F1B24A]/15 text-[#164A41]">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-5 font-display text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
