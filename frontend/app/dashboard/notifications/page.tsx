"use client"

import { Bell } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Real system notifications will appear here."
      />
      <Card className="flex min-h-[280px] flex-col items-center justify-center border-dashed p-10 text-center">
        <Bell className="size-10 text-muted-foreground" />
        <h2 className="mt-4 font-display text-lg font-semibold">No notifications yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          This page is ready for real alerts. It does not show simulated activity.
        </p>
      </Card>
    </div>
  )
}
