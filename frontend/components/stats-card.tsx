"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface StatsCardProps {
  title: string;
  value: string;
  label: string;
  trend?: string;
  tone?: "success" | "warning" | "danger";
}

export default function StatsCard({ title, value, label, trend, tone = "success" }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card rounded-[2rem] border border-white/70 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <Badge variant={tone === "success" ? "default" : tone === "warning" ? "secondary" : "destructive"}>{label}</Badge>
      </div>
      {trend ? <p className="mt-4 text-sm text-slate-500">{trend}</p> : null}
    </motion.div>
  );
}
