import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Subscription & Billing",
  description: "Choose the perfect plan for your credit risk analysis needs",
}

export default function BillingPage() {
  redirect("/dashboard/billing")
}
