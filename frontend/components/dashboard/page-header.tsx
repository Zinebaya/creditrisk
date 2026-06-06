import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: { href?: string; label: string }[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8", className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2.5">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((b, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {b.href ? (
                    <Link href={b.href} className="hover:text-foreground transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <ChevronRight className="size-3" />}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
