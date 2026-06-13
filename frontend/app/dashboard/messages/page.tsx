"use client"

import React from "react"
import { MessageSquare, Eye, Plus, Send, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/dashboard/page-header"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api, ClientMessage } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "sonner"

export default function ClientMessagesPage() {
  const { t, locale } = useLanguage()
  const [messages, setMessages] = React.useState<ClientMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMessage, setSelectedMessage] = React.useState<ClientMessage | null>(null)
  
  // New message form state
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [subject, setSubject] = React.useState("")
  const [messageText, setMessageText] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const loadMessages = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.clientMessages()
      setMessages(data.messages || [])
    } catch (error: any) {
      toast.error(error?.message || "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const markReplyAsReadLocally = (msgId: number) => {
    try {
      const stored = localStorage.getItem("paypredict.read_replies")
      const readIds = stored ? JSON.parse(stored) : []
      if (!readIds.includes(msgId)) {
        readIds.push(msgId)
        localStorage.setItem("paypredict.read_replies", JSON.stringify(readIds))
        // Trigger topbar to update its unread count
        window.dispatchEvent(new Event("notifications_updated"))
      }
    } catch (e) {
      console.error("Failed to mark notification as read locally", e)
    }
  }

  const handleViewMessage = (message: ClientMessage) => {
    setSelectedMessage(message)
    if (message.response_message) {
      markReplyAsReadLocally(message.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !messageText.trim()) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setSubmitting(true)
    try {
      await api.clientCreateMessage({
        subject: subject.trim(),
        message: messageText.trim(),
      })
      toast.success("Votre message a été envoyé avec succès.")
      setSubject("")
      setMessageText("")
      setShowCreateDialog(false)
      loadMessages()
    } catch (error: any) {
      toast.error(error?.message || "Échec de l'envoi du message")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("nav.messages") || "Messages & Réclamations"}
        description="Envoyez vos réclamations ou questions à l'administration et suivez les réponses"
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Nouveau Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envoyer une réclamation</DialogTitle>
                <DialogDescription>
                  Détaillez votre problème ou votre question pour obtenir une assistance rapide.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Sujet / Motif</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Problème d'importation de fichier, Facturation..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre demande en détail (minimum 10 caractères)..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={6}
                    required
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  <Send className="size-4" />
                  {submitting ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Historique de vos messages</CardTitle>
          <CardDescription>
            Consultez le statut de vos demandes d'assistance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center border-dashed border rounded-xl p-10 text-center">
              <MessageSquare className="size-10 text-muted-foreground opacity-50 mb-4" />
              <h2 className="text-lg font-semibold">Aucun message</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Vous n'avez pas encore envoyé de message ou de réclamation. Cliquez sur "Nouveau Message" pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const hasReply = !!message.response_message
                return (
                  <div
                    key={message.id}
                    className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {message.subject}
                        </span>
                        <Badge variant={hasReply ? "default" : "secondary"} className={hasReply ? "bg-green-600 text-white hover:bg-green-600" : ""}>
                          {hasReply ? "Répondu" : "En attente"}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {message.message}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground pt-1">
                        Envoyé le : {new Date(message.created_at).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-DZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>

                    <div className="flex shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 w-full sm:w-auto"
                            onClick={() => handleViewMessage(message)}
                          >
                            <Eye className="size-4" />
                            Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Détail de la demande</DialogTitle>
                            <DialogDescription>
                              Créé le {new Date(message.created_at).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedMessage?.id === message.id && (
                            <div className="space-y-6 pt-2">
                              {/* Client Message */}
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Votre message</Label>
                                <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                                  <p className="font-semibold mb-1 text-sm border-b pb-1">
                                    Sujet : {selectedMessage.subject}
                                  </p>
                                  {selectedMessage.message}
                                </div>
                              </div>

                              {/* Admin Response */}
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Réponse de l'admin</Label>
                                {selectedMessage.response_message ? (
                                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/50 rounded-lg text-sm space-y-2">
                                    <p className="whitespace-pre-wrap">
                                      {selectedMessage.response_message}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground text-right">
                                      Répondu le {selectedMessage.responded_at && new Date(selectedMessage.responded_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-lg flex items-center gap-3 text-sm text-amber-800 dark:text-amber-200">
                                    <AlertCircle className="size-5 shrink-0" />
                                    <span>Votre message est en attente de traitement par nos administrateurs.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
