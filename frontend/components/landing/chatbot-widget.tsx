"use client";

import * as React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi, I'm Vera, PayPredict's AI risk assistant. Ask me about credit scoring, our API, or how to start a pilot.",
  },
]

const suggestions = [
  "How does the scoring work?",
  "What data do I need?",
  "Pricing for 50K loans/mo",
]

export function ChatbotWidget() {
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [input, setInput] = React.useState("")
  const [thinking, setThinking] = React.useState(false)

  const send = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setThinking(true)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Great question. PayPredict uses an ensemble model with explainability outputs. Want me to show you how SHAP-style explanations appear in the dashboard?",
        },
      ])
      setThinking(false)
    }, 1100)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] rounded-3xl border border-border bg-card premium-shadow overflow-hidden flex flex-col"
            style={{ height: "min(70vh, 560px)" }}
          >
            <div className="bg-gradient-to-br from-[#164A41] to-[#0e3a33] text-white p-4 flex items-center gap-3">
              <div className="relative">
                <div className="size-10 rounded-full bg-[#F1B24A] flex items-center justify-center">
                  <Sparkles className="size-4 text-[#164A41]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#9DC88D] border-2 border-[#164A41]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Vera - AI Assistant</p>
                <p className="text-xs text-white/70">Replies in seconds</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        className="size-1.5 rounded-full bg-muted-foreground"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {messages.length < 3 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="p-3 border-t border-border flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Vera anything..."
                className="rounded-full border-border h-10 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full size-10 shrink-0 bg-primary hover:bg-primary/90"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 size-14 rounded-full bg-gradient-to-br from-[#164A41] to-[#0e3a33] text-white flex items-center justify-center gold-shadow hover:scale-105 active:scale-95 transition-transform"
        aria-label="Open AI assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="size-5" />
            </motion.span>
          ) : (
            <motion.span
              key="msg"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageCircle className="size-5" />
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-[#F1B24A] border-2 border-[#164A41]" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </>
  )
}
