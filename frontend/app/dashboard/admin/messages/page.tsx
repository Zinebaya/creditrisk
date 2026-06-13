"use client"

import React from "react"
import { Mail, MessageSquare, Eye, Trash2, Reply, Filter, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getToken } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    const hostname = window.location.hostname
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:8000`
    }
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
}

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  message_type: string
  is_read: boolean
  read_at: string | null
  response_message: string | null
  responded_at: string | null
  created_at: string
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = React.useState<ContactMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMessage, setSelectedMessage] = React.useState<ContactMessage | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [responseText, setResponseText] = React.useState("")
  const [responding, setResponding] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterRead, setFilterRead] = React.useState<"all" | "unread" | "read">("all")
  const [stats, setStats] = React.useState({ total: 0, unread: 0, responded: 0, pending: 0 })

  const loadMessages = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterRead !== "all") {
        params.append("is_read", filterRead === "read" ? "true" : "false")
      }
      const response = await fetch(`${getApiBase()}/api/admin/messages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      
      if (!response.ok) throw new Error("Failed to load messages")
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }, [filterRead])

  const loadStats = React.useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/admin/messages/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to load stats")
    }
  }, [])

  React.useEffect(() => {
    loadMessages()
    loadStats()
  }, [loadMessages, loadStats])

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message)
    setIsDialogOpen(true)
    if (!message.is_read) {
      try {
        await fetch(`${getApiBase()}/api/admin/messages/${message.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m))
        loadStats()
      } catch (error) {
        console.error("Failed to mark as read")
      }
    }
  }

  const handleRespond = async () => {
    if (!selectedMessage || !responseText.trim()) {
      toast.error("Please enter a response")
      return
    }

    setResponding(true)
    try {
      const response = await fetch(`${getApiBase()}/api/admin/messages/${selectedMessage.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ response: responseText.trim() })
      })

      if (!response.ok) throw new Error("Failed to send response")

      toast.success("Response sent successfully")
      setResponseText("")
      setIsDialogOpen(false)
      setSelectedMessage(null)
      loadMessages()
      loadStats()
    } catch (error: any) {
      toast.error(error.message || "Failed to send response")
    } finally {
      setResponding(false)
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    try {
      const response = await fetch(`${getApiBase()}/api/admin/messages/${messageId}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      })

      if (!response.ok) throw new Error("Failed to delete message")

      toast.success("Message deleted")
      loadMessages()
      loadStats()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete message")
    }
  }

  const filteredMessages = messages.filter(m => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return m.name.toLowerCase().includes(term) ||
           m.email.toLowerCase().includes(term) ||
           m.subject.toLowerCase().includes(term) ||
           m.message.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Messages de Contact"
        description="Gérez les demandes de contact des utilisateurs"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non lus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.unread}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Répondus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.responded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email, sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as "all" | "unread" | "read")}
              className="px-3 py-2 border rounded-lg bg-background text-foreground"
            >
              <option value="all">Tous les messages</option>
              <option value="unread">Non lus uniquement</option>
              <option value="read">Lus uniquement</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun message trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map(message => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg flex items-start justify-between gap-4 transition-colors ${
                    message.is_read ? "bg-muted/30" : "bg-blue-50 dark:bg-blue-950/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{message.name}</h3>
                      <Badge variant={message.is_read ? "secondary" : "default"}>
                        {message.is_read ? "Lu" : "Non lu"}
                      </Badge>
                      <Badge variant="outline">{message.message_type}</Badge>
                      {message.response_message && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Répondu
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{message.email}</p>
                    <h4 className="font-medium mb-1">{message.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(message.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMessage(message)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(message.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Dialog for Details & Response */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setSelectedMessage(null)
          setResponseText("")
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du message</DialogTitle>
            <DialogDescription>
              {selectedMessage && `Reçu le ${new Date(selectedMessage.created_at).toLocaleDateString("fr-FR")}`}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6">
              {/* Message Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">De</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sujet</p>
                  <p className="font-medium">{selectedMessage.subject}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge>{selectedMessage.message_type}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Message</p>
                  <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Response Section */}
              {selectedMessage.response_message ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Votre réponse</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessage.response_message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMessage.responded_at && new Date(selectedMessage.responded_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Entrez votre réponse..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    disabled={responding}
                  />
                  <Button
                    onClick={handleRespond}
                    disabled={responding || !responseText.trim()}
                    className="w-full"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    {responding ? "Envoi..." : "Répondre"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
