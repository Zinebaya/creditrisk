import * as Dialog from "@radix-ui/react-dialog";
"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/40 bg-white/95 p-8 shadow-glass"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold text-slate-950">{title}</Dialog.Title>
                {description ? <Dialog.Description className="mt-2 text-sm text-slate-500">{description}</Dialog.Description> : null}
              </div>
              <Dialog.Close className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="mt-6">{children}</div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
