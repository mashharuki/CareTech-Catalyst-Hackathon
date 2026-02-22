"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Brain,
  CheckCircle2,
  Loader2,
  Upload,
  FileText,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "./patient-list";
import { useI18n } from "@/lib/i18n/use-i18n";

type Result = {
  marker: { top: string; left: string };
  label: string;
  confidence: number;
  category: string;
  detail: string;
};

function getAiResults(isJa: boolean): Record<string, Result> {
  if (isJa) {
    return {
      p1: {
        marker: { top: "35%", left: "55%" },
        label: "肺結節の疑い",
        confidence: 89,
        category: "Lung-RADS 4B",
        detail: "右肺上葉に約12mmの結節影を検出。CT精密検査を推奨。",
      },
      p2: {
        marker: { top: "55%", left: "45%" },
        label: "腎皮質菲薄化",
        confidence: 82,
        category: "CKD Stage 3b",
        detail: "両側腎エコーにて皮質菲薄化を確認。eGFR低下傾向。",
      },
      p5: {
        marker: { top: "38%", left: "48%" },
        label: "心房細動",
        confidence: 91,
        category: "AF Persistent",
        detail: "Holter心電図にて持続性心房細動を確認。CHA2DS2-VAScスコア4点。",
      },
      default: {
        marker: { top: "40%", left: "50%" },
        label: "異常所見なし",
        confidence: 95,
        category: "Normal",
        detail: "画像解析の結果、明らかな異常所見は認められません。",
      },
    };
  }

  return {
    p1: {
      marker: { top: "35%", left: "55%" },
      label: "Suspected pulmonary nodule",
      confidence: 89,
      category: "Lung-RADS 4B",
      detail: "Detected a ~12mm nodule in right upper lung lobe. Contrast CT recommended.",
    },
    p2: {
      marker: { top: "55%", left: "45%" },
      label: "Renal cortical thinning",
      confidence: 82,
      category: "CKD Stage 3b",
      detail: "Bilateral renal cortical thinning observed with declining eGFR trend.",
    },
    p5: {
      marker: { top: "38%", left: "48%" },
      label: "Atrial fibrillation",
      confidence: 91,
      category: "AF Persistent",
      detail: "Persistent AF identified on Holter ECG with CHA2DS2-VASc score 4.",
    },
    default: {
      marker: { top: "40%", left: "50%" },
      label: "No abnormal finding",
      confidence: 95,
      category: "Normal",
      detail: "No significant abnormality detected in imaging analysis.",
    },
  };
}

export function AIViewer({
  patient,
  onAdopt,
}: {
  patient: Patient | null;
  onAdopt: () => void;
}) {
  const { messages, locale } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const aiResults = useMemo(() => getAiResults(locale === "ja"), [locale]);

  const currentResult = patient
    ? (aiResults[patient.id] ?? aiResults.default)
    : null;

  useEffect(() => {
    if (patient) {
      setScanning(true);
      setScanComplete(false);
      setUploadedFile(null);
      const timer = setTimeout(() => {
        setScanning(false);
        setScanComplete(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [patient?.id]);

  const processFile = useCallback((file: File) => {
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
    setUploadedFile({ name: file.name, size: sizeStr, type: file.type });
    setScanning(true);
    setScanComplete(false);
    const timer = setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && patient) processFile(file);
    },
    [patient, processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && patient) processFile(file);
      e.target.value = "";
    },
    [patient, processFile],
  );

  if (!patient) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Brain
          className="mb-4 h-10 w-10 text-muted-foreground/40"
          strokeWidth={1.5}
        />
        <p className="text-sm text-muted-foreground">{messages.aiViewer.emptyTitle}</p>
        <p className="mt-1.5 text-xs text-muted-foreground/60">
          {messages.aiViewer.emptySub}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className={`relative flex-1 overflow-hidden rounded-2xl border bg-card transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/80 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              {messages.aiViewer.viewerTitle}
            </span>
            {uploadedFile && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                {uploadedFile.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-secondary">
              <Upload className="h-3 w-3" />
              {messages.aiViewer.uploadLabel}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dcm"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            {scanning && (
              <motion.div
                className="flex items-center gap-1.5 text-xs text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{messages.aiViewer.scanning}</span>
              </motion.div>
            )}
            {scanComplete && (
              <motion.div
                className="flex items-center gap-1.5 text-xs text-emerald-600"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>{messages.aiViewer.complete}</span>
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {dragOver && (
            <motion.div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-primary/5 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Upload className="mb-3 h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-primary">
                {messages.aiViewer.dropTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DICOM, JPEG, PNG
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex h-full min-h-[280px] items-center justify-center bg-secondary/20 pt-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />

          {uploadedFile && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-1.5 backdrop-blur-sm">
              {uploadedFile.type === "application/pdf" ? (
                <FileText className="h-4 w-4 text-red-500" />
              ) : (
                <ImageIcon className="h-4 w-4 text-blue-500" />
              )}
              <div>
                <p className="text-[10px] font-medium text-foreground">
                  {uploadedFile.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {uploadedFile.size}
                </p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <svg
            viewBox="0 0 200 180"
            className="h-48 w-48 text-muted-foreground/20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <ellipse cx="70" cy="90" rx="45" ry="65" />
            <ellipse cx="130" cy="90" rx="45" ry="65" />
            <path d="M100 30 L100 140" strokeWidth="2" />
            <path d="M100 50 L75 70" />
            <path d="M100 50 L125 70" />
            <path d="M100 80 L70 100" />
            <path d="M100 80 L130 100" />
            <path d="M100 110 L75 125" />
            <path d="M100 110 L125 125" />
          </svg>

          <AnimatePresence>
            {scanning && (
              <motion.div
                className="pointer-events-none absolute right-0 left-0 h-0.5 bg-primary/40"
                initial={{ top: "10%" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {scanComplete && currentResult && (
              <motion.div
                className="absolute"
                style={{
                  top: currentResult.marker.top,
                  left: currentResult.marker.left,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <motion.div
                  className="h-12 w-12 rounded-full border-2 border-red-500/60"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(239,68,68,0.2)",
                      "0 0 0 10px rgba(239,68,68,0)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="absolute -bottom-1 left-full ml-2 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] text-red-700 shadow-sm">
                  {currentResult.label} ({messages.aiViewer.confidence} {currentResult.confidence}%)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {scanComplete && currentResult && (
          <motion.div
            className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {messages.aiViewer.inferenceResult}
                  </p>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {currentResult.category}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {currentResult.detail}
                </p>
              </div>
            </div>
            <Button
              onClick={onAdopt}
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {messages.aiViewer.adoptButton}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
