"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" }
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl"
    >
      <div className="container flex items-center justify-between gap-6 py-5">
        <Link href="/" className="flex items-center gap-3 text-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">PayPredict</p>
            <p className="text-xs text-slate-500">AI Credit Intelligence</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
            <Link href="/login">
              <ShieldCheck className="mr-2 h-4 w-4" /> Demo Access
            </Link>
          </Button>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
