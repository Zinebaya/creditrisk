"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Plus,
  Trash2,
  Mail,
  MapPin,
  Phone,
  Edit2,
  User,
  Activity,
  Briefcase,
  FileText,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, Client } from "@/lib/api"
import { globalRegions, formatLocaleDate, isValidPhone } from "@/lib/localization"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  "Crédit remboursé": "bg-green-500/15 text-green-600 border-green-500/20",
  "Crédit en cours": "bg-blue-500/15 text-blue-600 border-blue-500/20",
  "Crédit en retard": "bg-amber-500/15 text-amber-600 border-amber-500/20",
  "Crédit impayé": "bg-red-500/15 text-red-600 border-red-500/20",
}

export default function ClientsPage() {
  const { user: currentUser } = useAuth()
  const { t, locale } = useLanguage()
  const [clients, setClients] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)

  const isClientOrUser = currentUser?.role === "client" || currentUser?.role === "client_user"

  const load = React.useCallback(async () => {
    if (!isClientOrUser) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await api.clients()
      setClients(res.clients || [])
    } catch (e: any) {
      toast.error(e?.message || "Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [isClientOrUser])

  React.useEffect(() => {
    load()
  }, [load])

  const filtered = clients.filter((c) =>
    [c.name, c.first_name, c.email, c.phone, c.wilaya, c.city, c.sector]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditingClient(null)
    setOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client)
    setOpen(true)
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    
    const payload: any = {
      name: String(f.get("name") || "").trim(),
      first_name: String(f.get("first_name") || "").trim(),
      gender: String(f.get("gender") || ""),
      email: String(f.get("email") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      address: String(f.get("address") || "").trim(),
      wilaya: String(f.get("wilaya") || ""),
      city: String(f.get("city") || "").trim(),
      sector: String(f.get("sector") || ""),
      repayment_status: String(f.get("repayment_status") || "Crédit en cours"),
      notes: String(f.get("notes") || "").trim(),
    }

    if (!payload.name || !payload.first_name || !payload.email || !payload.phone || !payload.wilaya || !payload.city) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    if (!isValidPhone(payload.phone)) {
      toast.error("Format de téléphone invalide.")
      return
    }

    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, payload)
        toast.success("Client modifié avec succès.")
      } else {
        await api.createClient(payload)
        toast.success("Client ajouté avec succès.")
      }
      setOpen(false)
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue.")
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client final ?")) return
    try {
      await api.deleteClient(id)
      toast.success("Client supprimé avec succès.")
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Erreur de suppression.")
    }
  }

  if (!isClientOrUser) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={t("common.unauthorized") || "Accès non autorisé"}
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
        title="Gestion des clients finaux"
        description="Consultez, ajoutez et gérez le portefeuille de clients de votre banque."
        actions={
          <Button className="gap-2 rounded-lg" onClick={handleOpenAdd}>
            <Plus className="size-4" />
            Ajouter un client
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email, téléphone, wilaya..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 border-border bg-card shadow-sm rounded-xl"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden premium-shadow rounded-2xl border">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-[#164A41]/10 border-t-[#164A41]" />
              <p className="text-sm text-muted-foreground">Chargement du portefeuille clients…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="size-16 rounded-2xl bg-secondary/30 flex items-center justify-center text-muted-foreground">
                <User className="size-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">Aucun client trouvé</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Commencez à bâtir votre portefeuille d'analyse en ajoutant votre premier client final.
                </p>
              </div>
              <Button onClick={handleOpenAdd} size="sm" className="mt-2">
                Ajouter un client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold text-xs py-4 px-6">Client</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Contact</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Localisation</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Secteur</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Remboursement</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
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
                              {c.gender === "M" ? "Homme" : c.gender === "F" ? "Femme" : c.gender || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="size-3" />
                            {c.email}
                          </p>
                          <p className="text-xs flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            {c.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium flex items-center gap-1">
                            <MapPin className="size-3 text-[#F1B24A]" />
                            {c.city}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={c.address || ""}>
                            {c.wilaya} · {c.address || "Aucune adresse détaillée"}
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${
                            statusColors[c.repayment_status || "Crédit en cours"] || "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {c.repayment_status || "Crédit en cours"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0"
                            onClick={() => handleOpenEdit(c)}
                            title="Modifier"
                          >
                            <Edit2 className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0 hover:bg-red-50"
                            onClick={() => handleDelete(c.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Dialog for Add/Edit Client */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl premium-shadow">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              {editingClient ? "Modifier les informations du client" : "Ajouter un client final"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-6 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  name="first_name"
                  required
                  placeholder="Ex: Mohamed"
                  defaultValue={editingClient?.first_name || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nom de famille <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Ex: Benali"
                  defaultValue={editingClient?.name || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">Sexe</Label>
                <Select name="gender" defaultValue={editingClient?.gender || "M"}>
                  <SelectTrigger className="h-10 border-border">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Homme</SelectItem>
                    <SelectItem value="F">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sector">Secteur d'activité</Label>
                <Input
                  id="sector"
                  name="sector"
                  placeholder="Ex: Agriculture, Retail, IT..."
                  defaultValue={editingClient?.sector || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nom@client.com"
                  defaultValue={editingClient?.email || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Numéro de téléphone <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  name="phone"
                  required
                  placeholder="+213 555 12 34 56"
                  defaultValue={editingClient?.phone || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Wilaya <span className="text-red-500">*</span></Label>
                <Select name="wilaya" defaultValue={editingClient?.wilaya || "16 - Alger"}>
                  <SelectTrigger className="h-10 border-border">
                    <SelectValue placeholder="Sélectionner la wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {globalRegions.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">Commune / Ville <span className="text-red-500">*</span></Label>
                <Input
                  id="city"
                  name="city"
                  required
                  placeholder="Ex: Kouba"
                  defaultValue={editingClient?.city || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Adresse complète détaillée</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Ex: Cité 100 logements, Bâtiment C, N° 4"
                  defaultValue={editingClient?.address || ""}
                  className="h-10 border-border"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="repayment_status">Statut initial du crédit</Label>
                <Select name="repayment_status" defaultValue={editingClient?.repayment_status || "Crédit en cours"}>
                  <SelectTrigger className="h-10 border-border">
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crédit en cours">Crédit en cours</SelectItem>
                    <SelectItem value="Crédit remboursé">Crédit remboursé</SelectItem>
                    <SelectItem value="Crédit en retard">Crédit en retard</SelectItem>
                    <SelectItem value="Crédit impayé">Crédit impayé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Notes sur la solvabilité, garanties, historique bancaire..."
                  defaultValue={editingClient?.notes || ""}
                  className="min-h-[80px] border-border"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-[#164A41] hover:bg-[#164A41]/90 text-white font-semibold">
                Sauvegarder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
