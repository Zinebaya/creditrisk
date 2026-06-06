"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Plus,
  Trash2,
  Key,
  ToggleLeft,
  ToggleRight,
  Mail,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, ApiUser } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const PAGE_SIZE = 10

export default function EnterpriseUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = React.useState<ApiUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Dialogs
  const [addOpen, setAddOpen] = React.useState(false)
  const [editUser, setEditUser] = React.useState<ApiUser | null>(null)
  const [resetUser, setResetUser] = React.useState<ApiUser | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isEnterpriseAdmin = currentUser?.role === "client"

  const load = React.useCallback(async () => {
    if (!isEnterpriseAdmin) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await api.enterpriseUsers()
      setUsers(res.users || [])
    } catch (e: any) {
      toast.error(e?.message || "Erreur de chargement des collaborateurs")
    } finally {
      setLoading(false)
    }
  }, [isEnterpriseAdmin])

  React.useEffect(() => {
    load()
  }, [load])

  const filtered = users.filter((u) => {
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase()
    return (
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      fullName.includes(search.toLowerCase())
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get("email") || "").trim().toLowerCase()
    const password = String(f.get("password") || "")
    const first_name = String(f.get("first_name") || "").trim()
    const last_name = String(f.get("last_name") || "").trim()

    if (!email || !password || !first_name || !last_name) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    setIsSubmitting(true)
    try {
      await api.createEnterpriseUser({ email, password, first_name, last_name })
      toast.success("Collaborateur créé avec succès.")
      setAddOpen(false)
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue lors de la création.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editUser) return
    const f = new FormData(e.currentTarget)
    const first_name = String(f.get("first_name") || "").trim()
    const last_name = String(f.get("last_name") || "").trim()

    if (!first_name || !last_name) {
      toast.error("Le prénom et le nom sont obligatoires.")
      return
    }

    setIsSubmitting(true)
    try {
      await api.updateEnterpriseUser(editUser.id, { first_name, last_name })
      toast.success("Profil collaborateur mis à jour.")
      setEditUser(null)
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Erreur de modification.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resetUser) return
    const f = new FormData(e.currentTarget)
    const password = String(f.get("password") || "")

    if (!password) {
      toast.error("Le mot de passe est obligatoire.")
      return
    }

    setIsSubmitting(true)
    try {
      await api.resetEnterpriseUserPassword(resetUser.id, { password })
      toast.success("Mot de passe réinitialisé avec succès.")
      setResetUser(null)
    } catch (err: any) {
      toast.error(err?.message || "Erreur de réinitialisation.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(u: ApiUser) {
    try {
      const newStatus = u.is_active === false ? true : false
      await api.updateEnterpriseUser(u.id, { is_active: newStatus })
      toast.success(newStatus ? "Collaborateur réactivé." : "Collaborateur désactivé.")
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Erreur de mise à jour du statut.")
    }
  }

  async function handleDelete(u: ApiUser) {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${u.first_name} ${u.last_name} (${u.email}) ?`)) return
    try {
      await api.deleteEnterpriseUser(u.id)
      toast.success("Collaborateur supprimé.")
      await load()
    } catch (err: any) {
      toast.error(err?.message || "Erreur de suppression.")
    }
  }

  if (!isEnterpriseAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Accès non autorisé"
          description="Cet espace de configuration est réservé à l'administrateur de l'institution financière."
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="size-5" />
              <p className="text-sm font-medium">
                Vous ne disposez pas des permissions requises pour gérer les comptes collaborateurs de cette banque.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Collaborateurs"
        description="Gérez les comptes d'accès pour les analystes et collaborateurs de votre institution financière."
        actions={
          <Button className="gap-2 rounded-lg" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Ajouter un collaborateur
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#164A41]/10 flex items-center justify-center">
              <User className="size-4 text-[#164A41]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Collaborateurs</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ToggleRight className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comptes Actifs</p>
              <p className="text-xl font-bold">{users.filter((u) => u.is_active !== false).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ToggleLeft className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comptes Désactivés</p>
              <p className="text-xl font-bold">{users.filter((u) => u.is_active === false).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, prénom ou email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-10 h-11 border-border bg-card shadow-sm rounded-xl"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden premium-shadow rounded-2xl border">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-4 border-[#164A41]/10 border-t-[#164A41]" />
              <p className="text-sm text-muted-foreground">Chargement des collaborateurs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="size-16 rounded-2xl bg-secondary/30 flex items-center justify-center text-muted-foreground">
                <User className="size-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">Aucun collaborateur trouvé</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Créez le premier compte pour permettre à vos collaborateurs de générer des prédictions de risque crédit.
                </p>
              </div>
              <Button onClick={() => setAddOpen(true)} size="sm" className="mt-2">
                Ajouter un collaborateur
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold text-xs py-4 px-6">Nom</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Email</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6">Créé le</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6 text-center">Statut</TableHead>
                    <TableHead className="font-semibold text-xs py-4 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-[#164A41]/10 text-[#164A41] flex items-center justify-center font-bold">
                            {(u.first_name?.[0] || "") + (u.last_name?.[0] || "")}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Analyste Crédit
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Mail className="size-3.5" />
                          {u.email}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="inline-flex items-center gap-1.5"
                          title={u.is_active !== false ? "Désactiver le compte" : "Activer le compte"}
                        >
                          {u.is_active !== false ? (
                            <Badge className="bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20 cursor-pointer">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/20 cursor-pointer">
                              Désactivé
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0"
                            onClick={() => setEditUser(u)}
                            title="Modifier le collaborateur"
                          >
                            <Edit2 className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0"
                            onClick={() => setResetUser(u)}
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0 hover:bg-red-50"
                            onClick={() => handleDelete(u)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Affichage de {(page - 1) * PAGE_SIZE + 1} à {Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs px-2">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Dialog Add User */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-3xl premium-shadow">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Ajouter un collaborateur
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  name="first_name"
                  required
                  placeholder="Mohamed"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Nom <span className="text-red-500">*</span></Label>
                <Input
                  id="last_name"
                  name="last_name"
                  required
                  placeholder="Benali"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="m.benali@banque.dz"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe temporaire <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                Minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" className="bg-[#164A41] hover:bg-[#164A41]/90 text-white font-semibold" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit User */}
      <Dialog open={editUser !== null} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-md rounded-3xl premium-shadow">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Modifier le collaborateur
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_first_name">Prénom <span className="text-red-500">*</span></Label>
                <Input
                  id="edit_first_name"
                  name="first_name"
                  required
                  defaultValue={editUser?.first_name || ""}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_last_name">Nom <span className="text-red-500">*</span></Label>
                <Input
                  id="edit_last_name"
                  name="last_name"
                  required
                  defaultValue={editUser?.last_name || ""}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" className="bg-[#164A41] hover:bg-[#164A41]/90 text-white font-semibold" disabled={isSubmitting}>
                {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Reset Password */}
      <Dialog open={resetUser !== null} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className="max-w-md rounded-3xl premium-shadow">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Key className="size-5 text-[#F1B24A]" /> Réinitialiser le mot de passe
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Définissez un nouveau mot de passe sécurisé pour <strong>{resetUser?.first_name} {resetUser?.last_name}</strong> ({resetUser?.email}).
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="reset_password">Nouveau mot de passe <span className="text-red-500">*</span></Label>
              <Input
                id="reset_password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                Minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setResetUser(null)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold" disabled={isSubmitting}>
                {isSubmitting ? "Réinitialisation..." : "Réinitialiser"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
