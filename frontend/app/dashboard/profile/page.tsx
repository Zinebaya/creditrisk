"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Mail,
  ShieldCheck,
  User,
  LogOut,
  Calendar,
  CreditCard,
  Activity,
  Briefcase,
  Phone,
  MapPin,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/dashboard/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { globalRegions } from "@/lib/localization"
import { api } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, logout, login } = useAuth()
  const { t, locale } = useLanguage()

  // Profile fields state
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [companySector, setCompanySector] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [wilaya, setWilaya] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Password fields state
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "")
      setLastName(user.last_name || "")
      setCompanyName(user.company_name || "")
      setCompanySector(user.company_sector || "")
      setPhone(user.phone || "")
      setWilaya(user.wilaya || "")
      setAddress(user.address || "")
    }
  }, [user])

  const initials = user?.first_name && user?.last_name
    ? (user.first_name[0] + user.last_name[0]).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "PP"

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : "—"

  const roleLabel =
    user?.role === "admin"
      ? "Super Admin"
      : user?.role === "client"
      ? "Admin d'Entreprise"
      : "Collaborateur"

  const planLabel = user?.plan_tier ? user.plan_tier.charAt(0).toUpperCase() + user.plan_tier.slice(1) : "Free"
  const statusLabel = user?.is_active !== false ? "Active" : "Inactive"

  const isClientAdmin = user?.role === "client"
  const isEditable = user?.role === "client" || user?.role === "admin"

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      let res
      if (user.role === "admin") {
        res = await api.updateAdminProfile({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          wilaya: wilaya,
          address: address,
        })
      } else {
        res = await api.updateEnterpriseProfile({
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          company_sector: companySector,
          phone: phone,
          wilaya: wilaya,
          address: address,
        })
      }
      
      // Update session storage / auth state
      if (typeof window !== "undefined") {
        localStorage.setItem("paypredict.user", JSON.stringify(res.profile))
      }
      toast.success("Profil mis à jour avec succès.")
      // Trigger a light page reload or context refresh if necessary
      window.location.reload()
    } catch (err: any) {
      toast.error(err?.message || "Erreur de mise à jour du profil.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }
    setIsChangingPassword(true)
    try {
      if (user.role === "admin") {
        await api.updateAdminProfile({
          current_password: currentPassword,
          new_password: newPassword,
        })
      } else {
        await api.updateEnterpriseProfile({
          current_password: currentPassword,
          new_password: newPassword,
        })
      }
      toast.success("Mot de passe modifié avec succès.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors du changement de mot de passe.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <PageHeader
        title="Mon Profil"
        description="Gérez les informations d'accès de votre compte et la configuration de votre institution."
      />

      {/* Profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden premium-shadow rounded-2xl border">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="size-20">
                <AvatarFallback className="bg-gradient-to-br from-[#164A41] to-[#4D774E] text-xl font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-bold">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.email}
                </h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="gap-1 bg-[#164A41]/10 text-[#164A41] border-[#164A41]/20">
                    {user?.role === "admin" ? <ShieldCheck className="size-3" /> : <User className="size-3" />}
                    {roleLabel}
                  </Badge>
                  {user?.role === "client" && (
                    <Badge variant="outline" className="capitalize text-[#F1B24A] border-[#F1B24A]/30">
                      {planLabel}
                    </Badge>
                  )}
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    {statusLabel}
                  </Badge>
                </div>
                <p className="pt-1.5 text-xs text-muted-foreground">
                  Membre depuis le {memberSince}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form Editing (Client only) */}
        <div className="lg:col-span-2 space-y-8">
          {isEditable ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="premium-shadow rounded-2xl border">
                <CardHeader>
                  <CardTitle className="text-base font-bold">
                    {user?.role === "admin" ? "Informations Personnelles" : "Profil de l'Institution"}
                  </CardTitle>
                  <CardDescription>
                    {user?.role === "admin"
                      ? "Mettez à jour vos informations personnelles de profil."
                      : "Mettez à jour les coordonnées et les informations d'identification de votre banque."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="first_name">
                          {user?.role === "admin" ? "Prénom" : "Prénom Contact"}
                        </Label>
                        <Input
                          id="first_name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Prénom"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last_name">
                          {user?.role === "admin" ? "Nom" : "Nom Contact"}
                        </Label>
                        <Input
                          id="last_name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Nom"
                          className="h-10"
                        />
                      </div>
                    </div>

                    {user?.role === "client" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="company_name">Nom de l'Institution</Label>
                          <Input
                            id="company_name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Ex: Banque Centrale Algérienne"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="company_sector">Secteur</Label>
                          <Select value={companySector || "banque"} onValueChange={setCompanySector}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Sélectionner le secteur" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="banque">Banques</SelectItem>
                              <SelectItem value="credit">Organismes de crédit</SelectItem>
                              <SelectItem value="financement">Sociétés de financement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+213 21 00 00 00"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Wilaya d'implantation</Label>
                      <Select value={wilaya} onValueChange={setWilaya}>
                        <SelectTrigger className="h-10">
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
                      <Label htmlFor="address">
                        {user?.role === "admin" ? "Adresse" : "Adresse du Siège Social"}
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={
                          user?.role === "admin"
                            ? "Adresse de résidence / bureau"
                            : "Ex: 12 Rue des Frères Bouadou, Bir Mourad Raïs"
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="submit" disabled={isSaving} className="bg-[#164A41] hover:bg-[#164A41]/90 text-white font-semibold rounded-lg px-6">
                        {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="premium-shadow rounded-2xl border">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Détails du Compte</CardTitle>
                  <CardDescription>Informations d'identification de votre compte de connexion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                    <Mail className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Adresse Email</p>
                      <p className="text-sm font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                    <ShieldCheck className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Rôle Système</p>
                      <p className="text-sm font-medium">{roleLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                    <Calendar className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Date d'inscription</p>
                      <p className="text-sm font-medium">{memberSince}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                    <Activity className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">État du Compte</p>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{statusLabel}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column: Security (Change password) & Sign Out */}
        <div className="space-y-8">
          {/* Password change (available for Client Enterprise Admin or Admin) */}
          {isEditable && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="premium-shadow rounded-2xl border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Lock className="size-4 text-[#F1B24A]" /> Sécurité
                  </CardTitle>
                  <CardDescription>Mettez à jour votre mot de passe d'accès.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="current_password">Mot de passe actuel</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password">Nouveau mot de passe</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-10"
                      />
                    </div>
                    <Button type="submit" disabled={isChangingPassword} className="w-full bg-[#164A41] hover:bg-[#164A41]/90 text-white font-semibold">
                      {isChangingPassword ? "Modification..." : "Modifier le mot de passe"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Connection security info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card className="premium-shadow rounded-2xl border">
              <CardContent className="pt-6 space-y-3">
                <h4 className="font-semibold text-sm">Sécurité de session</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Votre connexion est protégée par chiffrement de bout en bout et jeton d'authentification JWT expirable sous 24h.
                </p>
                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2 w-full font-semibold rounded-lg">
                        <LogOut className="size-4" />
                        Se déconnecter
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogTitle>Se déconnecter de la session ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir fermer votre session active ? Vous devrez ressaisir vos identifiants pour accéder de nouveau au tableau de bord.
                      </AlertDialogDescription>
                      <div className="flex justify-end gap-2 mt-4">
                        <AlertDialogCancel className="rounded-lg">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
                          onClick={logout}
                        >
                          Fermer la session
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
