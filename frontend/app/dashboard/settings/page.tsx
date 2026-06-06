"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const SettingsClientComponent = dynamic(() => import("./client").then((mod) => ({ default: mod.SettingsClientComponent })), {
  loading: () => (
    <div className="space-y-8 max-w-3xl animate-pulse">
      <div className="h-20 bg-muted rounded-lg" />
      <div className="h-48 bg-muted rounded-lg" />
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  ),
  ssr: false,
})

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsClientComponent />
    </Suspense>
  )
}
