"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Users,
  Shield,
  Activity,
  Zap,
  TrendingUp,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"
import { toast } from "sonner"

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const SECTOR_COLORS = ["#164A41", "#F1B24A", "#4D774E", "#9DC88D"]

const PLAN_BADGES: Record<string, string> = {
  free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200",
  enterprise: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200",
  unlimited: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200",
}

export default function AdminDashboard() {
  const [companies, setCompanies] = React.useState<any[]>([])
  const [sectorStats, setSectorStats] = React.useState<any>(null)
  const [globalStats, setGlobalStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const loadAllData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [companiesRes, sectorsRes, analyticsRes] = await Promise.all([
        api.superadminCompanies(),
        api.superadminSectors(),
        api.superadminAnalytics(),
      ])
      
      setCompanies(companiesRes.companies || [])
      setSectorStats(sectorsRes.sectors || null)
      setGlobalStats(analyticsRes || null)
    } catch (err: any) {
      toast.error(err?.message || "Erreur de chargement des statistiques Super Admin")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadAllData()
  }, [loadAllData])

  async function handlePlanChange(companyId: number, planTier: string) {
    try {
      await api.superadminUpdateCompanyPlan(companyId, planTier)
      toast.success("Abonnement de l'entreprise mis à jour.")
      setCompanies(prev =>
        prev.map(c => (c.id === companyId ? { ...c, plan_tier: planTier } : c))
      )
    } catch (err: any) {
      toast.error(err?.message || "Erreur de mise à jour de l'abonnement.")
    }
  }

  async function handleToggleActive(companyId: number) {
    try {
      const res = await api.superadminToggleCompanyActive(companyId)
      toast.success(res.is_active ? "Entreprise réactivée." : "Entreprise désactivée.")
      setCompanies(prev =>
        prev.map(c => (c.id === companyId ? { ...c, is_active: res.is_active } : c))
      )
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors du changement de statut.")
    }
  }

  const filteredCompanies = companies.filter(c => {
    const searchStr = `${c.company_name || ""} ${c.email || ""} ${c.wilaya || ""} ${c.company_sector || ""}`.toLowerCase()
    return searchStr.includes(search.toLowerCase())
  })

  // KPI Calculations
  const totalEnterprises = companies.length
  const totalClients = globalStats?.total_clients || companies.reduce((acc, c) => acc + (c.client_count || 0), 0)
  const totalPredictions = globalStats?.total_predictions || companies.reduce((acc, c) => acc + (c.prediction_count || 0), 0)
  const activeSubscriptions = companies.filter(c => c.plan_tier !== "free" && c.is_active !== false).length

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6"><Skeleton className="h-[280px]" /></Card>
          <Card className="p-6"><Skeleton className="h-[280px]" /></Card>
        </div>
      </div>
    )
  }

  // Sector Pie Chart Data
  const enterprisesBySectorData = sectorStats?.enterprises_by_sector
    ? Object.entries(sectorStats.enterprises_by_sector).map(([name, value]) => ({
        name: name === "banque" ? "Banques" : name === "credit" ? "Crédits" : name === "financement" ? "Financements" : name,
        value: value as number,
      }))
    : []

  // Predictions Trend Data
  const predictionTrendData = globalStats?.monthly_predictions || []

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Console de Supervision Générale"
        description="Vue d'ensemble de la plateforme SaaS, gestion des institutions financières abonnées et statistiques d'utilisation globales."
        actions={
          <Button variant="outline" className="gap-2 rounded-lg" onClick={loadAllData}>
            <RefreshCw className="size-4" />
            Actualiser
          </Button>
        }
      />

      {/* KPI Cards */}
      <motion.div {...fadeUp} className="grid gap-4 md:grid-cols-4">
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatCard
            label="Banques & Sociétés"
            value={String(totalEnterprises)}
            icon={Building2}
            accent="dark"
          />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatCard
            label="Portefeuille Clients"
            value={String(totalClients)}
            icon={Users}
            accent="green"
          />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatCard
            label="Prédictions Générées"
            value={String(totalPredictions)}
            icon={Zap}
            accent="gold"
          />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <StatCard
            label="Abonnements Actifs"
            value={String(activeSubscriptions)}
            icon={CreditCard}
            accent="soft"
          />
        </motion.div>
      </motion.div>

      {/* Chart Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Global Monthly Predictions Line Chart */}
        <Card className="premium-shadow rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Activité de la Plateforme</CardTitle>
            <CardDescription>Évolution mensuelle globale du volume d'inférence de notation de crédit.</CardDescription>
          </CardHeader>
          <CardContent>
            {predictionTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={predictionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#F1B24A"
                    strokeWidth={3}
                    dot={{ fill: "#F1B24A", r: 4 }}
                    name="Prédictions"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Aucune donnée d'activité disponible.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sector Distribution Pie Chart */}
        <Card className="premium-shadow rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Répartition des Institutions</CardTitle>
            <CardDescription>Segmentation des entreprises abonnées par secteur d'activité financier.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {enterprisesBySectorData.length > 0 ? (
              <div className="w-full flex flex-col md:flex-row items-center justify-around gap-4">
                <div className="size-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={enterprisesBySectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {enterprisesBySectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {enterprisesBySectorData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="size-3 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }} />
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-muted-foreground">({item.value} institutions)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Aucune répartition sectorielle.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription and Active Status Manager Table */}
      <Card className="premium-shadow rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base font-bold">Gestion des Banques & Abonnements</CardTitle>
          <CardDescription>Contrôlez les plans tarifaires, configurez la facturation et suspendez ou activez les accès.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de banque, email, wilaya..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10 border-border bg-card shadow-sm rounded-xl"
            />
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Aucune entreprise ne correspond à votre recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Institution</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Contact</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Activité</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Plan Tarifaire</th>
                    <th className="text-center py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Accès</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Création</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map(c => (
                    <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-[#164A41]/10 text-[#164A41] flex items-center justify-center font-bold">
                            {c.company_name?.[0] || c.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{c.company_name || "Institution sans nom"}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-[#F1B24A]" />
                              {c.wilaya || "Localisation non spécifiée"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium">{c.first_name ? `${c.first_name} ${c.last_name || ""}` : "Non renseigné"}</p>
                          <p className="text-[10px] text-muted-foreground">{c.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide py-0 px-1.5 h-5">
                            {c.company_sector === "banque" ? "Banque" : c.company_sector === "credit" ? "Crédit" : c.company_sector === "financement" ? "Financement" : c.company_sector || "Secteur inconnu"}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">
                            {c.client_count} client(s) · {c.prediction_count} prediction(s)
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={c.plan_tier || "free"}
                          onValueChange={val => handlePlanChange(c.id, val)}
                        >
                          <SelectTrigger className={`w-[130px] h-8 text-xs font-semibold rounded-lg ${PLAN_BADGES[c.plan_tier || "free"] || "bg-secondary text-secondary-foreground"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Starter (Gratuit)</SelectItem>
                            <SelectItem value="pro">Pro (Payant)</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(c.id)}
                          className="inline-flex items-center gap-1.5"
                          title={c.is_active !== false ? "Suspendre l'accès" : "Réactiver l'accès"}
                        >
                          {c.is_active !== false ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/15 cursor-pointer">
                              <ToggleRight className="size-3.5 mr-1" /> Actif
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15 cursor-pointer">
                              <ToggleLeft className="size-3.5 mr-1" /> Suspendu
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="size-3.5" />
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
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
  )
}
