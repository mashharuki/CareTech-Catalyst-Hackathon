"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef } from "react"
import { Upload, ScanLine, ShieldCheck, Lock, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Stage = "idle" | "scanning" | "masked"

interface DataUploadProps {
  onStageChange: (stage: "scanning" | "masked") => void
  onComplete: () => void
}

export function DataUpload({ onStageChange, onComplete }: DataUploadProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (name: string) => {
    setFileName(name)
    setStage("scanning")
    onStageChange("scanning")

    setTimeout(() => {
      setStage("masked")
      onStageChange("masked")
    }, 3000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file.name)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file.name)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDemoUpload = () => {
    processFile("sample_checkup_2026-02.dcm")
  }

  const handleReset = () => {
    setStage("idle")
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            Step 1: Data Upload & AI Anonymization
          </h3>
        </div>
        {stage === "masked" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.dcm,.csv,.json,.hl7,.dicom"
        onChange={handleFileChange}
      />

      <div
        className={`relative min-h-[280px] overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-border bg-secondary/20"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 p-6"
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
              >
                <Upload className="h-8 w-8" strokeWidth={1.5} />
              </motion.div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragOver ? "Drop your file here" : "Drag & drop your medical file"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, DICOM, CSV, HL7 formats supported
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 text-xs"
                >
                  Browse Files
                </Button>
                <span className="text-xs text-muted-foreground">or</span>
                <Button
                  size="sm"
                  onClick={handleDemoUpload}
                  className="h-9 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                >
                  Use Demo File
                </Button>
              </div>
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 p-6"
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{fileName}</span>
              </div>
              <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-5 font-mono text-xs leading-6 text-foreground">
                <p>Patient: Yamada Taro</p>
                <p>Address: Shibuya-ku, Tokyo 1-2-3</p>
                <p>DOB: 1985-03-15</p>
                <p>Phone: 090-1234-5678</p>
                <p className="mt-2">Result: Blood Glucose 126mg/dL</p>
                <p>HbA1c: 6.8%</p>
                <motion.div
                  className="pointer-events-none absolute right-0 left-0 h-0.5 bg-primary/60"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-primary">
                <ScanLine className="h-4 w-4 animate-pulse" />
                <span>AI anonymization in progress...</span>
              </div>
            </motion.div>
          )}

          {stage === "masked" && (
            <motion.div
              key="masked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 p-6"
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{fileName}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>

              <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-5 font-mono text-xs leading-6 text-foreground">
                {[
                  { label: "Patient", value: "Yamada Taro", delay: 0.2 },
                  { label: "Address", value: "Shibuya-ku, Tokyo 1-2-3", delay: 0.4 },
                  { label: "DOB", value: "1985-03-15", delay: 0.6 },
                  { label: "Phone", value: "090-1234-5678", delay: 0.8 },
                ].map((field) => (
                  <p key={field.label}>
                    {field.label}:{" "}
                    <span className="relative inline-block">
                      <span className="opacity-20">{field.value}</span>
                      <motion.span
                        className="absolute inset-0 flex items-center justify-center rounded bg-red-500/10 px-1 text-[10px] font-bold uppercase tracking-wider text-red-600"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: field.delay }}
                      >
                        REDACTED
                      </motion.span>
                    </span>
                  </p>
                ))}
                <p className="mt-2 text-emerald-700">Result: Blood Glucose 126mg/dL</p>
                <p className="text-emerald-700">HbA1c: 6.8%</p>
              </div>

              <motion.div
                className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <ShieldCheck className="h-4 w-4" />
                Anonymization Complete - ZK Commitment on Midnight
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                <Button
                  onClick={onComplete}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Proceed to Data Exchange
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
