"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  MapPin,
  Phone,
  Briefcase,
  FileText,
  Mail,
  Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, Client } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const statusColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  "Crédit remboursé": { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-500/20", icon: CheckCircle2 },
  "Crédit en cours": { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", icon: TrendingUp },
  "Crédit en retard": { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", icon: Clock },
  "Crédit impayé": { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20", icon: XCircle },
}

export default function SuiviRemboursementsPage() {
  const { user } = useAuth()
  const [clients, setClients] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  
  // Notes Edit Dialog
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
  const [notesText, setNotesText] = React.useState("")
  const [savingNotes, setSavingNotes] = React.useState(false)

  const isAllowed = user?.role === "client" || user?.role === "client_user"

  const load = React.useCallback(async () => {
    if (!isAllowed) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await api.clients()
      setClients(res.clients || [])
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors du chargement des clients")
    } finally {
      setLoading(false)
    }
  }, [isAllowed])

  React.useEffect(() => {
    load()
  }, [load])

  // Update payment status inline
  async function handleStatusChange(clientId: number, newStatus: string) {
    try {
      await api.updateClient(clientId, { repayment_status: newStatus })
      toast.success("Statut de remboursement mis à jour.")
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, repayment_status: newStatus } : c))
    } catch (err: any) {
      toast.error(err?.message || "Erreur de modification du statut.")
    }
  }

  // Update notes dialog handler
  function openNotesDialog(client: Client) {
    setSelectedClient(client)
    setNotesText(client.notes || "")
  }

  async function handleSaveNotes() {
    if (!selectedClient) return
    setSavingNotes(true)
    try {
      await api.updateClient(selectedClient.id, { notes: notesText })
      toast.success("Notes internes mises à jour.")
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, notes: notesText } : c))
      setSelectedClient(null)
    } catch (err: any) {
      toast.error(err?.message || "Erreur d'enregistrement des notes.")
    } finally {
      setSavingNotes(false)
    }
  }

  // Filter clients
  const filtered = clients.filter((c) => {
    const matchesSearch = [c.name, c.first_name, c.email, c.phone, c.wilaya, c.city, c.sector]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || c.repayment_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // KPI count aggregates
  const totalCredits = clients.length
  const rembourseCount = clients.filter(c => c.repayment_status === "Crédit remboursé").length
  const enCoursCount = clients.filter(c => c.repayment_status === "Crédit en cours" || !c.repayment_status).length
  const enRetardCount = clients.filter(c => c.repayment_status === "Crédit en retard").length
  const impayeCount = clients.filter(c => c.repayment_status === "Crédit impayé").length

  if (!isAllowed) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Accès non autorisé"
          description="Cet espace est réservé aux banques et institutions financières."
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Veuillez vous connecter avec un compte Entreprise.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Suivi des Remboursements"
        description="Gérez les états de remboursement, suivez l'amortissement des portefeuilles crédits et modifiez les notes de recouvrement."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#164A41]/10 flex items-center justify-center">
              <FileText className="size-4 text-[#164A41]" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Crédits</p>
              <p className="text-lg font-bold">{totalCredits}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">En cours</p>
              <p className="text-lg font-bold text-blue-600">{enCoursCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Remboursés</p>
              <p className="text-lg font-bold text-green-600">{rembourseCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">En retard</p>
              <p className="text-lg font-bold text-amber-600">{enRetardCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Impayés</p>
              <p className="text-lg font-bold text-red-600">{impayeCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, ville, wilaya, secteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 border-border bg-card shadow-sm rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[220px] h-11 rounded-xl bg-card border-border shadow-sm">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Crédit en cours">Crédit en cours</SelectItem>
            <SelectItem value="Crédit remboursé">Crédit remboursé</SelectItem>
            <SelectItem value="Crédit en retard">Crédit en retard</SelectItem>
            <SelectItem value="Crédit impayé">Crédit impayé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden premium-shadow rounded-2xl border bg-card">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-[#164A41]/10 border-t-[#164A41]" />
              <p className="text-sm text-muted-foreground">Chargement des dossiers de remboursement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="size-16 rounded-2xl bg-secondary/30 flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">Aucun dossier trouvé</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Aucun client ne correspond aux critères de recherche actuels.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold text-xs py-4 px-6">Client</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Localisation & Contact</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Secteur</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Statut Remboursement</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Notes Internes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const currentStatus = c.repayment_status || "Crédit en cours"
                    const style = statusColors[currentStatus] || statusColors["Crédit en cours"]
                    const StatusIcon = style.icon

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-[#164A41]/10 text-[#164A41] flex items-center justify-center font-bold">
                              {(c.first_name?.[0] || "") + (c.name?.[0] || "")}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {c.first_name} {c.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Créé le {new Date(c.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="size-3 text-[#F1B24A]" />
                              {c.city}, {c.wilaya}
                            </p>
                            <p className="text-xs flex items-center gap-1.5">
                              <Phone className="size-3 text-muted-foreground" />
                              {c.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Briefcase className="size-3.5" />
                            {c.sector || "Non spécifié"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Select
                            value={currentStatus}
                            onValueChange={(val) => handleStatusChange(c.id, val)}
                          >
                            <SelectTrigger className={`w-[180px] h-9 border text-xs font-semibold rounded-lg ${style.bg} ${style.text} ${style.border}`}>
                              <div className="flex items-center gap-2">
                                <StatusIcon className="size-3.5" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Crédit en cours">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                  <TrendingUp className="size-3.5" />
                                  <span>Crédit en cours</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Crédit remboursé">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="size-3.5" />
                                  <span>Crédit remboursé</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Crédit en retard">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                  <Clock className="size-3.5" />
                                  <span>Crédit en retard</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Crédit impayé">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                  <XCircle className="size-3.5" />
                                  <span>Crédit impayé</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-4 px-6 max-w-[240px]">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-muted-foreground truncate leading-relaxed" title={c.notes || ""}>
                              {c.notes || "Aucune note interne."}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 p-0 shrink-0 hover:bg-muted"
                              onClick={() => openNotesDialog(c)}
                              title="Modifier les notes"
                            >
                              <Edit3 className="size-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Edit Notes Dialog */}
      <Dialog open={selectedClient !== null} onOpenChange={(o) => !o && setSelectedClient(null)}>
        <DialogContent className="max-w-md rounded-3xl premium-shadow">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Notes de recouvrement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Dossier client : <strong>{selectedClient?.first_name} {selectedClient?.name}</strong>
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Renseignez les détails des contacts, garanties, relances, promesses de paiement..."
                className="min-h-[120px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedClient(null)} disabled={savingNotes}>
                Annuler
              </Button>
              <Button onClick={handleSaveNotes} className="bg-[#164A41] hover:bg-[#164A41]/90 text-white font-semibold" disabled={savingNotes}>
                {savingNotes ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
