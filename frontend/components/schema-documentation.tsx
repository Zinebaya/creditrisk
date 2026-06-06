"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle } from "lucide-react"
import { CSV_SCHEMA, type SchemaField } from "@/lib/schema"

interface SchemaDocProps {
  compact?: boolean
  highlightFields?: string[]
}

export function SchemaDocumentation({ compact = false, highlightFields = [] }: SchemaDocProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        {CSV_SCHEMA.map((field) => (
          <div
            key={field.name}
            className={`text-xs p-2 rounded-lg border ${
              highlightFields.includes(field.name)
                ? "bg-amber-50 border-amber-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <code className="font-mono font-semibold text-gray-900">{field.name}</code>
              <Badge variant="outline" className="text-xs">
                {field.type}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{field.description}</p>
            {field.hint && (
              <p className="text-gray-500 mt-1 flex items-start gap-1">
                <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {field.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-4">CSV Schema Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold">Field Name</th>
                <th className="text-left py-2 px-3 font-semibold">Type</th>
                <th className="text-left py-2 px-3 font-semibold">Range/Example</th>
                <th className="text-left py-2 px-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {CSV_SCHEMA.map((field) => (
                <tr key={field.name} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <code className="font-mono text-xs font-semibold bg-gray-100 px-2 py-1 rounded">
                      {field.name}
                    </code>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="outline">{field.type}</Badge>
                  </td>
                  <td className="py-3 px-3 text-xs">
                    {field.range && `${field.range.min}–${field.range.max}`}
                    {!field.range && field.example}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600">
                    <div className="space-y-1">
                      <p>{field.description}</p>
                      {field.hint && <p className="text-gray-500">💡 {field.hint}</p>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}

export function FieldHint({ fieldName }: { fieldName: string }) {
  const field = CSV_SCHEMA.find((f) => f.name === fieldName)
  if (!field) return null

  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {field.range && (
        <p>
          Valid range: {field.range.min} – {field.range.max}
          {field.unit ? ` ${field.unit}` : ""}
        </p>
      )}
      {field.hint && <p className="text-blue-600">💡 {field.hint}</p>}
    </div>
  )
}
