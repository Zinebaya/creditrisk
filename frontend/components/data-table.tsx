"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn, cnStatus } from "@/lib/utils";

interface DataTableProps {
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

export default function DataTable({ columns, rows }: DataTableProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden rounded-[2rem] border border-white/70 shadow-soft">
      <table className="w-full min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-slate-200 px-6 py-4 text-left font-semibold text-slate-600">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="transition hover:bg-slate-50/80">
              {columns.map((column) => {
                const value = row[column] ?? "";
                if (column.toLowerCase().includes("risk")) {
                  return (
                    <td key={column} className="border-b border-slate-200 px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cnStatus(String(value))}`}>{value}</span>
                    </td>
                  );
                }
                return (
                  <td key={column} className="border-b border-slate-200 px-6 py-4 text-slate-700">{value}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
