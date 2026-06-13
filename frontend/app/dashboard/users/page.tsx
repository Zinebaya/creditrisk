"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAuth } from "@/contexts/auth-context"
import { api, ApiUser } from "@/lib/api"
import { toast } from "sonner"
import { globalRegions } from "@/lib/localization"

const PAGE_SIZE = 10

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = React.useState<ApiUser[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)

  // Create admin form
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [newAdminEmail, setNewAdminEmail] = React.useState("")
  const [newAdminPassword, setNewAdminPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Create client form
  const [showCreateClient, setShowCreateClient] = React.useState(false)
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPassword, setClientPassword] = React.useState("")
  const [clientFirstName, setClientFirstName] = React.useState("")
  const [clientLastName, setClientLastName] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [clientGender, setClientGender] = React.useState("M")
  const [clientWilaya, setClientWilaya] = React.useState("")
  const [clientAddress, setClientAddress] = React.useState("")
  const [clientSector, setClientSector] = React.useState("banque")
  const [clientPlan, setClientPlan] = React.useState("free")

  // Edit user form
  const [editingUser, setEditingUser] = React.useState<ApiUser | null>(null)
  const [showEditForm, setShowEditForm] = React.useState(false)
  const [editFirstName, setEditFirstName] = React.useState("")
  const [editLastName, setEditLastName] = React.useState("")
  const [editPhone, setEditPhone] = React.useState("")
  const [editWilaya, setEditWilaya] = React.useState("")
  const [editAddress, setEditAddress] = React.useState("")
  const [editCompanyName, setEditCompanyName] = React.useState("")
  const [editCompanySector, setEditCompanySector] = React.useState("")
  const [editPlan, setEditPlan] = React.useState("free")
  const [editPassword, setEditPassword] = React.useState("")
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.listUsers()
      setUsers(response.users || [])
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const startEditUser = (u: ApiUser) => {
    setEditingUser(u)
    setEditFirstName(u.first_name || "")
    setEditLastName(u.last_name || "")
    setEditPhone(u.phone || "")
    setEditWilaya(u.wilaya || "")
    setEditAddress(u.address || "")
    setEditCompanyName(u.company_name || "")
    setEditCompanySector(u.company_sector || "")
    setEditPlan(u.plan_tier || "free")
    setEditPassword("")
    setShowEditForm(true)
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientEmail || !clientPassword) {
      toast.error("Veuillez remplir les champs Email et Mot de passe")
      return
    }
    if (clientPassword.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères")
      return
    }
    try {
      setIsSubmitting(true)
      const response = await api.adminCreateUser({
        email: clientEmail,
        password: clientPassword,
        first_name: clientFirstName,
        last_name: clientLastName,
        phone: clientPhone,
        gender: clientGender,
        wilaya: clientWilaya,
        address: clientAddress,
        company_name: clientFirstName ? `${clientFirstName} ${clientLastName}`.trim() : undefined,
        company_sector: clientSector,
        plan_tier: clientPlan
      })
      toast.success(`Client créé avec succès : ${response.user.email}`)
      setClientEmail("")
      setClientPassword("")
      setClientFirstName("")
      setClientLastName("")
      setClientPhone("")
      setClientWilaya("")
      setClientAddress("")
      setShowCreateClient(false)
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Échec de création du client")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      setIsSubmitting(true)
      const payload: any = {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        wilaya: editWilaya,
        address: editAddress,
        company_name: editCompanyName,
        company_sector: editCompanySector,
        plan_tier: editPlan,
      }
      if (editPassword) {
        if (editPassword.length < 8) {
          toast.error("Le mot de passe doit faire au moins 8 caractères")
          setIsSubmitting(false)
          return
        }
        payload.password = editPassword
      }

      await api.adminUpdateUser(editingUser.id, payload)
      toast.success("Utilisateur mis à jour avec succès")
      setEditingUser(null)
      setShowEditForm(false)
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Échec de la mise à jour de l'utilisateur")
    } finally {
      setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    loadUsers()
  }, [currentUser])

  if (currentUser?.role !== "admin") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Unauthorized"
          description="This view is restricted to administrators."
        />
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">You must be an admin to manage users.</p>
          </CardContent>
        </Card>
      </div>
    )
  }



  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail || !newAdminPassword) {
      toast.error("Please fill in all fields")
      return
    }
    if (newAdminPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    try {
      setIsSubmitting(true)
      const response = await api.createAdmin(newAdminEmail, newAdminPassword)
      toast.success(`Admin created: ${response.user.email}`)
      setNewAdminEmail("")
      setNewAdminPassword("")
      setShowCreateForm(false)
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create admin")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (userId: number) => {
    try {
      await api.adminToggleUserActive(userId)
      toast.success("User status updated")
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user status")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error("Cannot delete your own account")
      return
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return
    try {
      await api.deleteUser(userId)
      toast.success("User deleted")
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete user")
    }
  }

  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      await api.updateUserRole(userId, role)
      toast.success("Role updated")
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update role")
    }
  }

  const handleUpdatePlan = async (userId: number, plan: string) => {
    try {
      await api.updateUserPlan(userId, plan)
      toast.success("Plan updated")
      loadUsers()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update plan")
    }
  }

  // Filter + search
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      u.email.toLowerCase().includes(query) ||
      (u.first_name || "").toLowerCase().includes(query) ||
      (u.last_name || "").toLowerCase().includes(query) ||
      (u.wilaya || "").toLowerCase().includes(query)
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const adminCount = users.filter((u) => u.role === "admin").length
  const clientCount = users.filter((u) => u.role === "client").length
  const activeCount = users.filter((u) => u.is_active !== false).length

  if (currentUser?.role !== "admin") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Unauthorized"
          description="This view is restricted to administrators."
        />
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">You must be an admin to manage users.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Manage platform users, roles, and permissions"
      />

      {/* KPI CARDS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-4"
      >
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#164A41]/10 flex items-center justify-center">
              <UserIcon className="size-4 text-[#164A41]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#F1B24A]/15 flex items-center justify-center">
              <ShieldCheck className="size-4 text-[#F1B24A]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admins</p>
              <p className="text-xl font-bold">{adminCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#4D774E]/15 flex items-center justify-center">
              <UserIcon className="size-4 text-[#4D774E]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clients</p>
              <p className="text-xl font-bold">{clientCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ToggleRight className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </div>
        </Card>
          </>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        {/* CREATE ADMIN DIALOG */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password (8+ characters)</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create Admin"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* CREATE CLIENT DIALOG */}
        <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#164A41] hover:bg-[#164A41]/90 text-white">
              <Plus className="size-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input
                    placeholder="Prénom"
                    value={clientFirstName}
                    onChange={(e) => setClientFirstName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input
                    placeholder="Nom"
                    value={clientLastName}
                    onChange={(e) => setClientLastName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={clientPassword}
                  onChange={(e) => setClientPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Téléphone</Label>
                  <Input
                    placeholder="+213..."
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sexe</Label>
                  <Select value={clientGender} onValueChange={setClientGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sexe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Wilaya</Label>
                <Select value={clientWilaya} onValueChange={setClientWilaya}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {globalRegions.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input
                  placeholder="Adresse postale..."
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Secteur</Label>
                  <Select value={clientSector} onValueChange={setClientSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banque">Banques</SelectItem>
                      <SelectItem value="credit">Crédits</SelectItem>
                      <SelectItem value="financement">Financement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Plan d'abonnement</Label>
                  <Select value={clientPlan} onValueChange={setClientPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#164A41] hover:bg-[#164A41]/90">
                {isSubmitting ? "Création..." : "Créer Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* EDIT USER DIALOG */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'Utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input
                    placeholder="Prénom"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input
                    placeholder="Nom"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input
                  placeholder="Numéro de téléphone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Wilaya</Label>
                <Select value={editWilaya} onValueChange={setEditWilaya}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {globalRegions.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input
                  placeholder="Adresse postale..."
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {editingUser?.role === "client" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nom de l'Institution</Label>
                    <Input
                      placeholder="Institution"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Secteur</Label>
                    <Select value={editCompanySector} onValueChange={setEditCompanySector}>
                      <SelectTrigger>
                        <SelectValue placeholder="Secteur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banque">Banques</SelectItem>
                        <SelectItem value="credit">Crédits</SelectItem>
                        <SelectItem value="financement">Financement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 border-t pt-3">
                <Label>Changer le mot de passe (Laisser vide pour ne pas modifier)</Label>
                <Input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#164A41] hover:bg-[#164A41]/90">
                {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTERS + TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage roles, plans, and access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TABLE */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-6 w-16 ml-auto" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : paginatedUsers.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon"><UserIcon /></EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No users found</EmptyTitle>
                  <EmptyDescription>Users will appear here once they register on the platform.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Nom Complet</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Wilaya</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Secteur</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Plan</th>
                      <th className="text-center py-3 px-4 font-semibold text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Created</th>
                      <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-sm">
                            {u.first_name || u.last_name
                              ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                              : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="size-4 text-muted-foreground" />
                            <span className="font-medium">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {u.wilaya || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {u.company_sector || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Select
                            value={u.role}
                            onValueChange={(v) => handleUpdateRole(u.id, v)}
                            disabled={u.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="size-3" /> Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="client">
                                <div className="flex items-center gap-1.5">
                                  <UserIcon className="size-3" /> Client
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4">
                          <Select
                            value={u.plan_tier || "free"}
                            onValueChange={(v) => handleUpdatePlan(u.id, v)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                              <SelectItem value="unlimited">Unlimited</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            disabled={u.id === currentUser?.id}
                            className="inline-flex items-center gap-1.5"
                            title={u.is_active !== false ? "Click to disable" : "Click to enable"}
                          >
                            {u.is_active !== false ? (
                              <Badge variant="default" className="gap-1 cursor-pointer">
                                <ToggleRight className="size-3" /> Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1 cursor-pointer">
                                <ToggleLeft className="size-3" /> Inactive
                              </Badge>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(u.created_at || "").toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-primary hover:text-primary-dark"
                              onClick={() => startEditUser(u)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === currentUser?.id}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
