"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} className="glass-card rounded-[2rem] border border-white/70 p-6 transition shadow-soft hover:shadow-glow">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-50 text-brand-700">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </motion.div>
  );
}
