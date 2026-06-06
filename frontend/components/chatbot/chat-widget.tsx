"use client"
import React, { useState, useRef, useEffect } from "react"
import { Send, MessageCircle, X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatWidget() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        language === "en"
          ? "Hi! I'm PayPredict Assistant. Ask me anything about credit risk analysis, predictions, or how to use the platform."
          : language === "fr"
            ? "Bonjour! Je suis l'Assistant PayPredict. Posez-moi des questions sur l'analyse du risque crédit, les prédictions ou comment utiliser la plateforme."
            : "مرحبا! أنا مساعد PayPredict. اسألني أي شيء عن تحليل مخاطر الائتمان أو التنبؤات أو كيفية استخدام المنصة.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (user?.role === "admin") {
    return null
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: input,
          language: language,
          conversation_id: "default",
        }),
      })

      if (!response.ok) throw new Error("Chat request failed")
      
      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content:
          language === "en"
            ? "Sorry, I'm having trouble connecting. Please try again."
            : language === "fr"
              ? "Désolé, j'ai du mal à me connecter. Veuillez réessayer."
              : "عذرا، أواجه مشكلة في الاتصال. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41] p-4 shadow-lg transition-all hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex flex-col w-96 h-[32rem] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#F1B24A] text-[#164A41] px-4 py-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {language === "en"
                ? "PayPredict Assistant"
                : language === "fr"
                  ? "Assistant PayPredict"
                  : "مساعد PayPredict"}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#F1B24A]/80 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-[#F1B24A] text-[#164A41]"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                  <p className="text-sm">
                    {language === "en"
                      ? "Thinking..."
                      : language === "fr"
                        ? "En train de réfléchir..."
                        : "جاري التفكير..."}
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && handleSendMessage()
                }
                placeholder={
                  language === "en"
                    ? "Ask a question..."
                    : language === "fr"
                      ? "Posez une question..."
                      : "اسأل سؤالا..."
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F1B24A]"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                className="bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41] p-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
