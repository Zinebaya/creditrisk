"use client"

import React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Users, Download, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAuth } from "@/contexts/auth-context"
import { api, AdminStats } from "@/lib/api"
import { toast } from "sonner"

const PLAN_COLORS: Record<string, string> = {
  free: "#8b5cf6",
  pro: "#06b6d4",
  enterprise: "#f59e0b",
  unlimited: "#10b981",
}

export default function BillingPage() {
  const { user } = useAuth()
  const [stats, setStats] = React.useState<AdminStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.adminStats()
      setStats(data)
    } catch (error) {
      toast.error("Failed to load billing data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (user?.role === "admin") {
      loadStats()
    }
  }, [user])

  if (user?.role !== "admin") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Billing"
          description="Billing analytics are available for administrators only."
        />
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact an administrator for pricing and subscription details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  const planData = stats?.plan_distribution
    ? Object.entries(stats.plan_distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : []

  const monthlyData = stats?.monthly_predictions || []
  const totalUsers = stats?.total_users || 0
  const activeSubs = stats?.active_subscriptions || 0
  const totalPredictions = stats?.total_predictions || 0

  // Pricing in Dinar Algérien
  const planPricing = [
    { name: "Free", price: 0, users: stats?.plan_distribution?.free || 0 },
    { name: "Pro", price: 2500, users: stats?.plan_distribution?.pro || 0 },
    { name: "Enterprise", price: 5000, users: stats?.plan_distribution?.enterprise || 0 },
  ]

  const estimatedMonthlyRevenue = ((stats?.plan_distribution?.pro || 0) * 2500) + ((stats?.plan_distribution?.enterprise || 0) * 5000)
  const estimatedYearlyRevenue = estimatedMonthlyRevenue * 12

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Revenue"
        description="Manage subscriptions, invoices, and revenue analytics"
      />

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedMonthlyRevenue.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Based on active Pro & Enterprise plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Yearly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedYearlyRevenue.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Projected annual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs}</div>
            <p className="text-xs text-muted-foreground mt-1">Pro & Enterprise plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalPredictions} total predictions</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend (based on monthly predictions as proxy) */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Volume Trend</CardTitle>
            <CardDescription>Monthly prediction volume (proxy for usage)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value} predictions`}
                    contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Predictions"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty>
                <EmptyMedia variant="icon"><TrendingUp /></EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No data yet</EmptyTitle>
                  <EmptyDescription>Prediction volume trends will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Users by subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name.toLowerCase()] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} users`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty>
                <EmptyMedia variant="icon"><Users /></EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No plan data yet</EmptyTitle>
                  <EmptyDescription>Plan distribution will appear as users subscribe.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PRICING DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>Current billing rates in Dinar Algérien (DA)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Free Plan</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-mono">0 DA/month</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Predictions:</span>
                  <span className="font-mono">3 total</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Users:</span>
                  <span className="font-mono">{stats?.plan_distribution?.free || 0}</span>
                </li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 border-[#F1B24A]/30 bg-[#F1B24A]/5">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold">Pro</h4>
                <Badge className="bg-[#F1B24A] text-[#164A41]">Most Popular</Badge>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Monthly:</span>
                  <span className="font-mono">2 500 DA/month</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Yearly:</span>
                  <span className="font-mono">24 000 DA/year</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Predictions:</span>
                  <span className="font-mono">Unlimited</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Users:</span>
                  <span className="font-mono">{stats?.plan_distribution?.pro || 0}</span>
                </li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Enterprise</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Monthly:</span>
                  <span className="font-mono">5 000 DA/month</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Yearly:</span>
                  <span className="font-mono">48 000 DA/year</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Predictions:</span>
                  <span className="font-mono">Unlimited</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Users:</span>
                  <span className="font-mono">{stats?.plan_distribution?.enterprise || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
