"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-[320px] rounded-[2rem] border border-white/70 p-5 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Astra Assistant</p>
              <p className="text-xs text-slate-500">Instant credit risk guidance</p>
            </div>
            <button className="rounded-full bg-slate-100 p-2 text-slate-700" onClick={() => setOpen(false)} aria-label="Close chat widget">
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-3xl bg-slate-50 p-4">Ask me about a loan file, risk explanation, or model why.</div>
            <div className="rounded-3xl bg-gradient-to-r from-brand-500 to-forest-600 p-4 text-white shadow-glow">"Suggest the best risk mitigation plan for a high-risk client."</div>
          </div>
          <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
            Start prediction chat
          </Button>
        </motion.div>
      ) : null}
      <Button variant="secondary" size="lg" className="gap-3 rounded-full px-5 shadow-glow" onClick={() => setOpen(!open)}>
        <MessageCircle size={18} /> {open ? "Close assistant" : "AI Assistant"}
      </Button>
    </div>
  );
}
