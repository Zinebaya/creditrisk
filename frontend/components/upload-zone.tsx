"use client";

import { useState } from "react";
import { CloudUpload, FileText, Trash2 } from "lucide-react";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileUpload?: (file: File) => void;
  loading?: boolean;
}

export default function UploadZone({ onFileUpload, loading = false }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (!droppedFile) return;
    setFile(droppedFile);
    setProgress(0);
    window.setTimeout(() => setProgress(100), 450);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setProgress(0);
    window.setTimeout(() => setProgress(100), 450);
  };

  const handleUpload = () => {
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2rem] border border-white/70 p-6 shadow-soft">
      <div className="flex flex-col gap-4">
        <label onDrop={onDrop} onDragOver={(event) => event.preventDefault()} className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition hover:border-brand-400 hover:bg-white">
          <CloudUpload size={32} className="text-brand-600 transition group-hover:text-brand-700" />
          <div>
            <p className="text-lg font-semibold text-slate-950">Drag & Drop CSV / XLS</p>
            <p className="mt-2 text-sm text-slate-500">or browse to upload your credit portfolio data.</p>
          </div>
          <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={onFileChange} />
        </label>

        {file ? (
          <div className="rounded-[2rem] bg-slate-900/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600">Selected file</p>
                <p className="font-medium text-slate-950">{file.name}</p>
              </div>
              <button className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200" onClick={() => setFile(null)}>
                <Trash2 size={18} />
              </button>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-forest-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}

        <Button className="w-full" disabled={!file || loading} onClick={handleUpload}>
          {loading ? "Processing..." : "Validate & Predict"}
        </Button>
      </div>
    </motion.div>
  );
}

