"use client"

import React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Download, Filter, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { api, Analytics } from "@/lib/api"
import { toast } from "sonner"

const COLORS = {
  highRisk: "#ef4444",
  mediumRisk: "#f59e0b",
  lowRisk: "#10b981",
  neutral: "#6b7280",
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [timeRange, setTimeRange] = React.useState<"week" | "month" | "year">("month")

  const loadAnalytics = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.analytics()
      setAnalytics(data)
    } catch (error) {
      toast.error("Failed to load analytics")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Process risk distribution for pie chart
  const riskData = analytics?.risk_distribution
    ? Object.entries(analytics.risk_distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : []

  // Process monthly predictions
  const monthlyData = analytics?.monthly_predictions || []

  // Calculate stats
  const totalPredictions = analytics?.total_predictions || 0
  const avgProbability = Math.round((analytics?.average_probability || 0) * 100)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Insights"
        description="Detailed analytics of your credit risk predictions"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* TIME RANGE SELECTOR */}
      <div className="flex gap-2">
        {(["week", "month", "year"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className="capitalize"
          >
            {range}
          </Button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Risk Probability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgProbability}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Model validation accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Trend</CardTitle>
            <CardDescription>Monthly prediction volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
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
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Breakdown by risk level</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskData.map((entry, index) => {
                    let color = COLORS.neutral
                    if (entry.name.includes("High")) color = COLORS.highRisk
                    else if (entry.name.includes("Medium")) color = COLORS.mediumRisk
                    else if (entry.name.includes("Low")) color = COLORS.lowRisk
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Pie>
                <Tooltip formatter={(value) => `${value} cases`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Patterns and trends in your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4 py-2">
            <h4 className="font-semibold text-sm">High Risk Increase</h4>
            <p className="text-sm text-muted-foreground">
              High-risk cases have increased by 8% this month. Consider reviewing risk factors.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-semibold text-sm">Prediction Volume Peak</h4>
            <p className="text-sm text-muted-foreground">
              You reached peak volume on June 15th with 234 predictions. Consider upgrading for sustained growth.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h4 className="font-semibold text-sm">Model Performance</h4>
            <p className="text-sm text-muted-foreground">
              Your model continues to perform well with 94.2% accuracy. No retraining needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* EXPORT OPTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your analytics in various formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="size-4" />
            Export as CSV
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="size-4" />
            Export as PDF Report
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="size-4" />
            Export as JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
