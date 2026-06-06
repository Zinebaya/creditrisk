"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Mail, MessageSquare, Send, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    const hostname = window.location.hostname
    return `http://${hostname}:8000`
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
}

export default function ContactPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "contact" as "contact" | "demo" | "support"
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères"
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      newErrors.email = "Veuillez entrer une adresse e-mail valide"
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      newErrors.subject = "Le sujet doit contenir au moins 3 caractères"
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = "Le message doit contenir au moins 10 caractères"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${getApiBase()}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          message_type: formData.type
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'envoi du message")
      }

      setSubmitted(true)
      toast.success("Merci! Votre message a été envoyé. Nous vous recontacterons bientôt.")

      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "", type: "contact" })
        setSubmitted(false)
      }, 3000)
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t("contact.title")}</h1>
            <p className="text-lg text-muted-foreground">
              {t("contact.description")}
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card>
              <CardHeader>
                <Mail className="w-6 h-6 mb-2 text-primary" />
                <CardTitle>{t("contact.emailUs")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                support@paypredict.com
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="w-6 h-6 mb-2 text-primary" />
                <CardTitle>{t("contact.support")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                24/7
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Send className="w-6 h-6 mb-2 text-primary" />
                <CardTitle>{t("contact.form")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t("contact.submit")}
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          {submitted && (
            <Alert className="mb-8 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-700">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Merci! Votre message a été reçu avec succès. Notre équipe vous contactera bientôt.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Type de demande
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                  >
                    <option value="contact">Question générale</option>
                    <option value="demo">Demande de démonstration</option>
                    <option value="support">Support technique</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-2 block">
                    Nom complet
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-red-500" : ""}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="text-sm font-medium mb-2 block">
                    Adresse email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="text-sm font-medium mb-2 block">
                    Sujet
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Le sujet de votre message"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={errors.subject ? "border-red-500" : ""}
                    disabled={loading}
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="text-sm font-medium mb-2 block">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Décrivez votre demande en détail..."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={errors.message ? "border-red-500" : ""}
                    disabled={loading}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500 mt-1">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || submitted}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-12 p-6 bg-muted rounded-lg text-center text-sm text-muted-foreground">
            <p>
              Nous répondons généralement aux demandes en moins de 24 heures.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
