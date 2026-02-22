"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { PatientList, type Patient } from "@/components/hospital/patient-list";
import { AIViewer } from "@/components/hospital/ai-viewer";
import { MedicalRecordForm } from "@/components/hospital/medical-record-form";
import { AIChat } from "@/components/hospital/ai-chat";

const mockPatients: Patient[] = [
  {
    id: "p1",
    name: "田中 太郎",
    age: 67,
    gender: "M",
    riskScore: 92,
    condition: "胸部異常影（肺結節）",
    lastVisit: "2026-02-20",
    department: "呼吸器内科",
  },
  {
    id: "p5",
    name: "高橋 健二",
    age: 71,
    gender: "M",
    riskScore: 88,
    condition: "心房細動",
    lastVisit: "2026-02-19",
    department: "循環器内科",
  },
  {
    id: "p6",
    name: "渡辺 幸子",
    age: 63,
    gender: "F",
    riskScore: 85,
    condition: "肝硬変",
    lastVisit: "2026-02-21",
    department: "消化器内科",
  },
  {
    id: "p10",
    name: "小林 正義",
    age: 59,
    gender: "M",
    riskScore: 83,
    condition: "冠動脈石灰化",
    lastVisit: "2026-02-17",
    department: "循環器内科",
  },
  {
    id: "p2",
    name: "佐藤 花子",
    age: 54,
    gender: "F",
    riskScore: 78,
    condition: "糖尿病性腎症",
    lastVisit: "2026-02-18",
    department: "腎臓内科",
  },
  {
    id: "p9",
    name: "中村 啓太",
    age: 52,
    gender: "M",
    riskScore: 74,
    condition: "膵管拡張",
    lastVisit: "2026-02-14",
    department: "消化器内科",
  },
  {
    id: "p7",
    name: "松本 由美",
    age: 48,
    gender: "F",
    riskScore: 67,
    condition: "甲状腺結節",
    lastVisit: "2026-02-16",
    department: "内分泌科",
  },
  {
    id: "p8",
    name: "加藤 茂",
    age: 72,
    gender: "M",
    riskScore: 62,
    condition: "胸膜肥厚",
    lastVisit: "2026-02-13",
    department: "呼吸器内科",
  },
  {
    id: "p11",
    name: "吉田 裕子",
    age: 41,
    gender: "F",
    riskScore: 55,
    condition: "椎間板ヘルニア",
    lastVisit: "2026-02-12",
    department: "整形外科",
  },
  {
    id: "p3",
    name: "山田 一郎",
    age: 45,
    gender: "M",
    riskScore: 45,
    condition: "高血圧",
    lastVisit: "2026-02-15",
    department: "循環器内科",
  },
  {
    id: "p4",
    name: "鈴木 美咲",
    age: 38,
    gender: "F",
    riskScore: 23,
    condition: "定期健診",
    lastVisit: "2026-02-10",
    department: "総合内科",
  },
  {
    id: "p12",
    name: "伊藤 大輔",
    age: 33,
    gender: "M",
    riskScore: 15,
    condition: "定期健診",
    lastVisit: "2026-02-08",
    department: "総合内科",
  },
];

export default function HospitalPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [adopted, setAdopted] = useState(false);

  const selectedPatient =
    mockPatients.find((p) => p.id === selectedPatientId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedPatientId(id);
    setAdopted(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-6 py-2.5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              TrustBridge
            </span>
            <span className="text-xs text-muted-foreground">
              / AI診断ポータル
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="rounded bg-secondary px-2 py-0.5 font-mono">
              {mockPatients.length} patients
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>AI Engine: Active</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <motion.div
        className="flex min-h-0 flex-1 gap-3 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Left sidebar - Patient list */}
        <div className="flex w-64 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-3">
          <PatientList
            patients={mockPatients}
            selectedId={selectedPatientId}
            onSelect={handleSelect}
          />
        </div>

        {/* Center - AI Viewer + AI Chat stacked */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex-1 overflow-hidden">
            <AIViewer
              patient={selectedPatient}
              onAdopt={() => setAdopted(true)}
            />
          </div>
          <div className="flex-shrink-0">
            <AIChat patient={selectedPatient} />
          </div>
        </div>

        {/* Right - Medical Record Form */}
        <div className="flex w-72 flex-shrink-0 flex-col overflow-auto">
          <MedicalRecordForm patient={selectedPatient} adopted={adopted} />
        </div>
      </motion.div>
    </div>
  );
}
