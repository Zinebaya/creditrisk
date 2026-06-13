"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  Zap,
  TrendingUp,
  Award,
  CreditCard,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { api, Analytics, Prediction } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "sonner"

export default function ClientDashboard() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [history, setHistory] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState({ used: 0, limit: 3, plan_tier: "free", limit_reached: false })

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [analyticsData, historyData, usageData] = await Promise.all([
        api.analytics(),
        api.history(),
        api.usage(),
      ])

      setAnalytics(analyticsData)
      setHistory(historyData.predictions || [])
      setUsage({
        used: usageData.used,
        limit: usageData.limit || 3,
        plan_tier: usageData.plan_tier,
        limit_reached: usageData.limit_reached,
      })
    } catch (error: any) {
      toast.error("Failed to load dashboard")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5 gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>
          <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>
          <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>
        </div>
      </div>
    )
  }

  const total = analytics?.total_predictions || 0
  const highRisk = analytics?.risk_distribution?.high_risk || 0
  const averageRisk = Math.round((analytics?.average_probability || 0) * 100)
  const isFree = usage.plan_tier === "free"
  const remainingPredictions = Math.max(0, (usage.limit || 3) - (usage.used || 0))
  const usagePercent = usage.limit ? Math.round(((usage.used || 0) / usage.limit) * 100) : 0

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("dashboard.title") || "Dashboard"}
        description={t("dashboard.description") || "Your credit risk analysis dashboard"}
        actions={
          <>
            <Link href="/dashboard/predict">
              <Button className="gap-2" disabled={isFree && usage.limit_reached}>
                <Zap className="size-4" />
                {t("dashboard.predict") || "New Prediction"}
              </Button>
            </Link>
          </>
        }
      />

      {/* UPGRADE PROMPT — Free plan limit reached */}
      {isFree && usage.limit_reached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#F1B24A]/40 bg-gradient-to-r from-[#F1B24A]/10 to-[#F1B24A]/5 p-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="size-10 rounded-lg bg-[#F1B24A] flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-[#164A41]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Limite atteinte</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Vous avez utilisé vos {usage.limit} prédictions gratuites. Passez à Pro pour des prédictions illimitées.
              </p>
            </div>
            <Link href="/dashboard/subscriptions">
              <Button className="bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41] gap-2 shrink-0">
                <Sparkles className="size-4" />
                Passer à Pro
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* KPI CARDS */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label={t("dashboard.total") || "Total Predictions"}
          value={total}
          icon={Activity}
          accent="dark"
          spark={analytics?.monthly_predictions?.map(m => m.count) || [0]}
        />
        <StatCard
          label={t("dashboard.highRisk") || "High Risk Cases"}
          value={highRisk}
          icon={TrendingUp}
          accent="soft"
          spark={[0, highRisk]}
        />
        <StatCard
          label="Average Risk"
          value={`${averageRisk}%`}
          icon={BarChart3}
          accent="gold"
          spark={[0, averageRisk]}
        />
        <StatCard
          label={t("dashboard.plan") || "Current Plan"}
          value={isFree ? "Free" : "Pro"}
          icon={Award}
          accent="green"
          spark={[0, usage.used || 0]}
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* USAGE / QUOTA */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Usage</CardTitle>
            <CardDescription>
              {isFree ? "Free tier — 3 predictions" : "Pro subscription"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{usage.used || 0} used</span>
                <span className="text-sm text-muted-foreground">
                  {usage.limit ? `${usage.limit} limit` : "Unlimited"}
                </span>
              </div>
              {usage.limit && (
                <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {isFree && remainingPredictions <= 1 && !usage.limit_reached && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Plus que {remainingPredictions} prédiction{remainingPredictions > 1 ? "s" : ""} gratuite{remainingPredictions > 1 ? "s" : ""}. Pensez à upgrader.
                </p>
              </div>
            )}

            <div className="pt-3 border-t space-y-2">
              {isFree && (
                <Link href="/dashboard/subscriptions" className="block">
                  <Button className="w-full bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41]" size="sm">
                    Passer à Pro
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/profile" className="block">
                <Button variant="outline" className="w-full" size="sm">
                  View Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* QUICK ACTIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/predict" className="block">
              <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Zap className="size-4 mr-2" />
                  Single Prediction
                </Button>
              </motion.div>
            </Link>

            <Link href="/dashboard/analytics" className="block">
              <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BarChart3 className="size-4 mr-2" />
                  Analytics
                </Button>
              </motion.div>
            </Link>
            <Link href="/dashboard/subscriptions" className="block">
              <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <CreditCard className="size-4 mr-2" />
                  Billing
                </Button>
              </motion.div>
            </Link>
          </CardContent>
        </Card>

        {/* RECENT PREDICTIONS */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Predictions</CardTitle>
                <CardDescription>Your latest credit risk analyses</CardDescription>
              </div>
              <Link href="/dashboard/predict">
                <Button size="sm" variant="outline">New</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon"><Activity /></EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No predictions yet</EmptyTitle>
                  <EmptyDescription>Get started by creating your first credit risk analysis.</EmptyDescription>
                </EmptyHeader>
                <Link href="/dashboard/predict">
                  <Button size="sm">Create First Prediction</Button>
                </Link>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Decision</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Probability</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((pred) => (
                      <tr key={pred.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-xs text-muted-foreground">
                            {new Date(pred.created_at).toLocaleDateString(locale)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              pred.decision === "approve" ? "default" :
                              pred.decision === "review" ? "outline" :
                              "destructive"
                            }
                          >
                            {pred.decision}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium tabular-nums">
                          {Math.round(pred.probability * 100)}%
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={pred.prediction === "high_risk" ? "destructive" : "secondary"}>
                            {pred.prediction === "high_risk" ? "High Risk" : "Low Risk"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
