"use client"

import { FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Exportable risk and portfolio reports will be generated from real predictions."
      />
      <Card className="flex min-h-[280px] flex-col items-center justify-center border-dashed p-10 text-center">
        <FileText className="size-10 text-muted-foreground" />
        <h2 className="mt-4 font-display text-lg font-semibold">No reports yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Run predictions on real clients to prepare report content.
        </p>
      </Card>
    </div>
  )
}
