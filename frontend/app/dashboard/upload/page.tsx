"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Sparkles,
  FileX2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { formatDZD } from "@/lib/localization"
import { CSV_SCHEMA } from "@/lib/schema"
import { SchemaDocumentation, FieldHint } from "@/components/schema-documentation"
import { generateCsvTemplate } from "@/lib/csv-utils"
import { useLanguage } from "@/contexts/language-context"
import { toast } from "sonner"

type Step = "idle" | "validating" | "ready" | "processing" | "done"

const requiredCols = [
  "client_id",
  "loan_amnt",
  "annual_inc",
  "dti",
  "fico_range_high",
  "revol_util",
  "open_acc",
  "total_acc",
  "inq_last_6mths",
  "delinq_2yrs",
  "acc_now_delinq",
]

const riskBadge = {
  Low: "bg-[#9DC88D]/25 text-[#2f5b34] border-[#9DC88D]/40",
  Medium: "bg-[#F1B24A]/20 text-[#a07919] border-[#F1B24A]/40",
  High: "bg-destructive/10 text-destructive border-destructive/30",
}

type BatchRow = Record<string, number>
type BatchResult = Record<string, any> & {
  rowNumber: number
  prediction: string
  probability: number
  decision: string
  status?: string
  error?: string
}

function parseCsv(text: string): { headers: string[]; rows: BatchRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error("The CSV must contain a header row and at least one data row.")
  }

  const headers = lines[0].split(",").map((header) => header.trim())
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim())
    return headers.reduce<BatchRow>((row, header, index) => {
      row[header] = Number(values[index] || 0)
      return row
    }, {})
  })

  return { headers, rows }
}

export default function UploadPage() {
  const [step, setStep] = React.useState<Step>("idle")
  const [progress, setProgress] = React.useState(0)
  const [file, setFile] = React.useState<File | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [missingCols, setMissingCols] = React.useState<string[]>([])
  const [rows, setRows] = React.useState<BatchRow[]>([])
  const [sampleRows, setSampleRows] = React.useState<BatchRow[]>([])
  const [results, setResults] = React.useState<BatchResult[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  const handleFile = async (f: File) => {
    setFile(f)
    setStep("validating")
    setProgress(0)
    setRows([])
    setSampleRows([])
    setResults([])

    try {
      const ext = f.name.toLowerCase()
      if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
        setMissingCols(requiredCols)
        setStep("ready")
        toast.error("Seuls les fichiers .csv et .xlsx/.xls sont acceptés.")
        return
      }

      if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
        setProgress(100)
        setMissingCols([])
        setRows([{} as any]) // dummy element to allow processing
        setSampleRows([])
        setStep("ready")
        toast.success("Fichier Excel détecté et prêt pour l'analyse.")
        return
      }

      const parsedRows = parseCsv(await f.text())
      const headers = parsedRows.headers.map((header) => header.toLowerCase())
      const missing = requiredCols.filter((col) => !headers.includes(col.toLowerCase()))
      setProgress(100)
      setMissingCols(missing)
      setRows(parsedRows.rows)
      setSampleRows(parsedRows.rows.slice(0, 3))
      setStep("ready")
    } catch (error) {
      setStep("idle")
      setFile(null)
      toast.error(error instanceof Error ? error.message : "Could not read the file.")
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const startProcessing = async () => {
    if (missingCols.length > 0) {
      toast.error(t("upload.fixColumns"))
      return
    }
    if (!file) {
      toast.error(t("upload.noCsvSelected"))
      return
    }
    setStep("processing")
    setProgress(0)
    setResults([])

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev
        return prev + 5
      })
    }, 200)

    try {
      const response = await api.batchPredict(file)
      clearInterval(progressInterval)
      const nextResults = response.predictions.map((row, index) => ({
        ...row,
        rowNumber: index + 1,
      }))
      setResults(nextResults)
      setProgress(100)
      setStep("done")
      const failedCount = nextResults.filter(r => r.status === "failed").length
      if (failedCount > 0) {
        toast.warning(`${nextResults.length - failedCount} lignes traitées avec succès, ${failedCount} erreurs détectées.`)
      } else {
        toast.success(`Batch scoring complete - ${nextResults.length} records`)
      }
    } catch (error) {
      clearInterval(progressInterval)
      setStep("ready")
      toast.error(error instanceof Error ? error.message : "Batch scoring failed.")
    }
  }

  const reset = () => {
    setStep("idle")
    setProgress(0)
    setFile(null)
    setMissingCols([])
    setRows([])
    setResults([])
  }

  const downloadTemplate = () => {
    const csv = generateCsvTemplate()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "paypredict-batch-template.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Template downloaded with example data")
  }

  const exportResults = () => {
    if (results.length === 0) {
      toast.info("No batch results to export.")
      return
    }
    const headers = ["row", "client_id", "annual_inc", "loan_amnt", "probability", "decision", "prediction"]
    const csv = [
      headers.join(","),
      ...results.map((row) =>
        [
          row.rowNumber,
          row.client_id,
          row.annual_inc,
          row.loan_amnt,
          row.probability,
          row.decision,
          row.prediction,
        ].join(","),
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "paypredict-batch-results.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("upload.title")}
        description={t("upload.description")}
        breadcrumbs={[{ href: "/dashboard", label: t("dashboard.title") }, { label: t("upload.breadcrumb") }]}
        actions={
          <Button variant="outline" className="h-9 rounded-lg gap-1.5" onClick={downloadTemplate}>
            <Download className="size-3.5" />
            {t("upload.downloadTemplate")}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload zone */}
        <Card className="lg:col-span-2 p-6 lg:p-8 premium-shadow">
          <AnimatePresence mode="wait">
            {step === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={cn(
                    "relative w-full rounded-2xl border-2 border-dashed bg-secondary/30 p-10 lg:p-14 flex flex-col items-center justify-center text-center transition-all",
                    dragOver
                      ? "border-[#F1B24A] bg-[#F1B24A]/5 scale-[1.005]"
                      : "border-border hover:border-[#4D774E]/50 hover:bg-secondary/40",
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={onPick}
                  />
                  <motion.div
                    animate={{ y: dragOver ? -6 : 0 }}
                    className="size-16 rounded-2xl bg-gradient-to-br from-[#164A41] to-[#4D774E] text-white flex items-center justify-center premium-shadow"
                  >
                    <Upload className="size-7" />
                  </motion.div>
                  <p className="mt-5 font-display text-lg font-semibold">
                    {dragOver ? t("upload.dropHere") : t("upload.dragDrop")}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
                    {t("upload.or")} <span className="text-foreground font-medium underline underline-offset-4">{t("upload.browse")}</span> {t("upload.selectCsv")}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-card border border-border text-xs font-mono">
                      .csv
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-card border border-border text-xs font-mono">
                      .xlsx, .xls
                    </span>
                  </div>
                </button>
              </motion.div>
            )}

            {(step === "validating" || step === "ready") && file && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/30 p-4">
                  <div className="size-12 rounded-xl bg-[#9DC88D]/30 text-[#164A41] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                      {step === "validating"
                        ? ` - ${t("upload.validating")}`
                        : ` - ${rows.length} ${t("upload.rowsDetected")}`}
                    </p>
                    <div className="mt-2 h-1.5 bg-card rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2 }}
                        className="h-full bg-gradient-to-r from-[#4D774E] to-[#F1B24A] rounded-full"
                      />
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 rounded-md hover:bg-card text-muted-foreground"
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {step === "ready" && (
                  <>
                    {missingCols.length > 0 ? (
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
                        <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-destructive">
                            {t("upload.missingColumnsTitle")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("upload.missingColumnsSubtitle")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {missingCols.map((c) => (
                              <code
                                key={c}
                                className="text-xs font-mono px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20"
                              >
                                {c}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#9DC88D]/40 bg-[#9DC88D]/10 p-4 flex gap-3">
                        <CheckCircle2 className="size-5 text-[#4D774E] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#164A41]">
                            {t("upload.fileValidated")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("upload.rowsReady", { count: rows.length })}
                          </p>
                        </div>
                      </div>
                    )}

                    {sampleRows.length > 0 && (
                      <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                        <p className="text-sm font-semibold">{t("upload.previewTitle", { count: sampleRows.length })}</p>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                              <tr>
                                <th className="px-2 py-2">#</th>
                                <th className="px-2 py-2">client_id</th>
                                <th className="px-2 py-2">loan_amnt</th>
                                <th className="px-2 py-2">annual_inc</th>
                                <th className="px-2 py-2">dti</th>
                                <th className="px-2 py-2">fico</th>
                                <th className="px-2 py-2">revol_util</th>
                                <th className="px-2 py-2">open_acc</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {sampleRows.map((row, index) => (
                                <tr key={index}>
                                  <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{index + 1}</td>
                                  <td className="px-2 py-2 font-mono text-xs">{row.client_id ?? "-"}</td>
                                  <td className="px-2 py-2 tabular-nums text-xs">{row.loan_amnt ?? "-"}</td>
                                  <td className="px-2 py-2 tabular-nums text-xs">{row.annual_inc ?? "-"}</td>
                                  <td className="px-2 py-2 tabular-nums text-xs">{row.dti ?? "-"}%</td>
                                  <td className="px-2 py-2 tabular-nums text-xs">{row.fico_range_high ?? "-"}</td>
                                  <td className="px-2 py-2 tabular-nums text-xs">{row.revol_util ?? "-"}%</td>
                                  <td className="px-2 py-2 tabular-nums text-xs">{row.open_acc ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          ℹ️ Showing sample data. Your file will include all 11 required columns.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={reset}>
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={startProcessing}
                        disabled={missingCols.length > 0}
                        className="bg-[#F1B24A] hover:bg-[#F1B24A]/90 text-[#164A41] gap-2 gold-shadow"
                      >
                        <Sparkles className="size-4" />
                        {t("upload.runScoring")}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div className="relative">
                  <div className="size-20 rounded-full bg-gradient-to-br from-[#164A41] to-[#4D774E] flex items-center justify-center">
                    <Sparkles className="size-9 text-[#F1B24A]" />
                  </div>
                  <span className="absolute inset-0 rounded-full border-2 border-[#F1B24A]/40 animate-pulse-ring" />
                </div>
                <p className="mt-6 font-display text-lg font-semibold">
                  {t("upload.processingTitle", { count: rows.length })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("upload.estimatedTime", { time: Math.max(1, Math.ceil((100 - progress) / 12)) })}
                </p>
                <div className="mt-6 w-full max-w-md">
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-[#164A41] via-[#4D774E] to-[#F1B24A] rounded-full"
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-muted-foreground tabular-nums">
                      {Math.round((rows.length * progress) / 100)} / {rows.length} {t("upload.records")}
                    </span>
                    <span className="font-semibold tabular-nums">{progress}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-[#9DC88D]/40 bg-[#9DC88D]/10 p-4 flex items-center gap-4">
                  <div className="size-11 rounded-xl bg-[#4D774E] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#164A41]">{t("upload.scoringComplete")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("upload.rowsScored", { count: results.length })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 hidden sm:inline-flex"
                    onClick={exportResults}
                  >
                    <Download className="size-3.5" />
                    Export results
                  </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { l: "Low risk", v: String(results.filter((r) => r.prediction === "low_risk").length), c: "#4D774E" },
                    { l: "High risk", v: String(results.filter((r) => r.prediction === "high_risk").length), c: "#c0392b" },
                    { l: "Approved", v: String(results.filter((r) => r.decision === "approve").length), c: "#F1B24A" },
                    { l: "Declined", v: String(results.filter((r) => r.decision === "decline").length), c: "#9DC88D" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-border bg-secondary/30 p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: s.c }} />
                        <span className="text-xs text-muted-foreground">{s.l}</span>
                      </div>
                      <p className="font-display text-2xl font-bold tabular-nums mt-1">{s.v}</p>
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={reset} className="w-full sm:w-auto gap-2">
                  <RefreshCw className="size-3.5" />
                  {t("upload.uploadAnother")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Right column - Schema Guide */}
        <Card className="p-6 premium-shadow space-y-4 max-h-[600px] overflow-y-auto">
          <div>
            <h3 className="font-display font-semibold text-base">{t("upload.requiredColumnsTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("upload.requiredColumnsDescription")}
            </p>
          </div>

          {/* Field explanations */}
          <div className="space-y-3 pt-2">
            {CSV_SCHEMA.map((field) => (
              <div
                key={field.name}
                className={cn(
                  "p-3 rounded-lg border text-xs transition-colors",
                  missingCols.includes(field.name)
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-secondary/40 border-border hover:bg-secondary/60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <code className="font-mono text-xs font-semibold block text-foreground mb-1">
                      {field.name}
                    </code>
                    <p className="text-muted-foreground leading-tight">{field.description}</p>
                    {field.range && (
                      <p className="text-[0.7rem] text-muted-foreground/70 mt-1">
                        Range: {field.range.min}–{field.range.max}
                        {field.unit ? ` ${field.unit}` : ""}
                      </p>
                    )}
                  </div>
                  {missingCols.includes(field.name) && (
                    <div className="shrink-0 px-2 py-1 rounded bg-destructive/20 text-destructive text-[0.7rem] font-semibold">
                      Missing
                    </div>
                  )}
                </div>
                {field.hint && (
                  <p className="text-[0.7rem] text-blue-600 dark:text-blue-400 mt-2 leading-tight">
                    💡 {field.hint}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gradient-to-br from-[#164A41] to-[#0e3a33] text-white p-4">
            <div className="flex items-start gap-2">
              <FileX2 className="size-4 text-[#F1B24A] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t("upload.commonPitfalls")}</p>
                <ul className="mt-2 space-y-1 text-xs text-white/75 leading-relaxed">
                  <li>- {t("upload.pitfallClientId")}</li>
                  <li>- {t("upload.pitfallNumeric")}</li>
                  <li>- {t("upload.pitfallEncoding")}</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Results table */}
      {step === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden premium-shadow gap-0 py-0">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="font-display text-base font-semibold">{t("upload.resultsTitle")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("upload.resultsSubtitle", { count: results.length })}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportResults}>
                <Download className="size-3.5" />
                {t("upload.exportCsv")}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">{t("upload.table.row")}</th>
                    <th className="text-left px-3 py-3 font-medium">{t("upload.table.client")}</th>
                    <th className="text-left px-3 py-3 font-medium">{t("upload.table.income")}</th>
                    <th className="text-left px-3 py-3 font-medium">{t("upload.table.loan")}</th>
                    <th className="text-left px-3 py-3 font-medium">{t("upload.table.pd")}</th>
                    <th className="text-left px-3 py-3 font-medium">{t("upload.table.decision")}</th>
                    <th className="text-left px-5 py-3 font-medium">{t("upload.table.risk")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r) => (
                    <tr
                      key={`${r.client_id}-${r.rowNumber}`}
                      className={cn(
                        "transition-colors",
                        r.status === "failed"
                          ? "bg-red-500/5 hover:bg-red-500/10 text-red-900 dark:text-red-200"
                          : "hover:bg-secondary/30"
                      )}
                    >
                      <td className="px-5 py-3 font-mono text-xs">#{r.rowNumber}</td>
                      {r.status === "failed" ? (
                        <td colSpan={5} className="px-3 py-3 text-xs font-medium text-destructive">
                          <span className="inline-flex items-center gap-1.5 text-red-500">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            {r.error}
                          </span>
                        </td>
                      ) : (
                        <>
                          <td className="px-3 py-3 tabular-nums">{r.client_id}</td>
                          <td className="px-3 py-3 tabular-nums">{formatDZD(r.annual_inc)}</td>
                          <td className="px-3 py-3 tabular-nums">{formatDZD(r.loan_amnt)}</td>
                          <td className="px-3 py-3 tabular-nums">{Math.round(r.probability * 100)}%</td>
                          <td className="px-3 py-3">{r.decision}</td>
                        </>
                      )}
                      <td className="px-5 py-3">
                        {r.status === "failed" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200">
                            Erreur
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${riskBadge[r.prediction === "high_risk" ? "High" : "Low"]}`}
                          >
                            {r.prediction === "high_risk" ? t("predict.high") : t("predict.low")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
