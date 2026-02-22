"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { PatientList, type Patient } from "@/components/hospital/patient-list";
import { AIViewer } from "@/components/hospital/ai-viewer";
import { MedicalRecordForm } from "@/components/hospital/medical-record-form";
import { AIChat } from "@/components/hospital/ai-chat";
import { useI18n } from "@/lib/i18n/use-i18n";

function createMockPatients(isJa: boolean): Patient[] {
  return [
    {
      id: "p1",
      name: isJa ? "田中 太郎" : "Taro Tanaka",
      age: 67,
      gender: "M",
      riskScore: 92,
      condition: isJa ? "胸部異常影（肺結節）" : "Abnormal chest shadow (lung nodule)",
      lastVisit: "2026-02-20",
      department: isJa ? "呼吸器内科" : "Pulmonology",
    },
    {
      id: "p5",
      name: isJa ? "高橋 健二" : "Kenji Takahashi",
      age: 71,
      gender: "M",
      riskScore: 88,
      condition: isJa ? "心房細動" : "Atrial fibrillation",
      lastVisit: "2026-02-19",
      department: isJa ? "循環器内科" : "Cardiology",
    },
    {
      id: "p6",
      name: isJa ? "渡辺 幸子" : "Sachiko Watanabe",
      age: 63,
      gender: "F",
      riskScore: 85,
      condition: isJa ? "肝硬変" : "Liver cirrhosis",
      lastVisit: "2026-02-21",
      department: isJa ? "消化器内科" : "Gastroenterology",
    },
    {
      id: "p10",
      name: isJa ? "小林 正義" : "Masayoshi Kobayashi",
      age: 59,
      gender: "M",
      riskScore: 83,
      condition: isJa ? "冠動脈石灰化" : "Coronary calcification",
      lastVisit: "2026-02-17",
      department: isJa ? "循環器内科" : "Cardiology",
    },
    {
      id: "p2",
      name: isJa ? "佐藤 花子" : "Hanako Sato",
      age: 54,
      gender: "F",
      riskScore: 78,
      condition: isJa ? "糖尿病性腎症" : "Diabetic nephropathy",
      lastVisit: "2026-02-18",
      department: isJa ? "腎臓内科" : "Nephrology",
    },
    {
      id: "p9",
      name: isJa ? "中村 啓太" : "Keita Nakamura",
      age: 52,
      gender: "M",
      riskScore: 74,
      condition: isJa ? "膵管拡張" : "Pancreatic duct dilation",
      lastVisit: "2026-02-14",
      department: isJa ? "消化器内科" : "Gastroenterology",
    },
    {
      id: "p7",
      name: isJa ? "松本 由美" : "Yumi Matsumoto",
      age: 48,
      gender: "F",
      riskScore: 67,
      condition: isJa ? "甲状腺結節" : "Thyroid nodule",
      lastVisit: "2026-02-16",
      department: isJa ? "内分泌科" : "Endocrinology",
    },
    {
      id: "p8",
      name: isJa ? "加藤 茂" : "Shigeru Kato",
      age: 72,
      gender: "M",
      riskScore: 62,
      condition: isJa ? "胸膜肥厚" : "Pleural thickening",
      lastVisit: "2026-02-13",
      department: isJa ? "呼吸器内科" : "Pulmonology",
    },
    {
      id: "p11",
      name: isJa ? "吉田 裕子" : "Yuko Yoshida",
      age: 41,
      gender: "F",
      riskScore: 55,
      condition: isJa ? "椎間板ヘルニア" : "Disc herniation",
      lastVisit: "2026-02-12",
      department: isJa ? "整形外科" : "Orthopedics",
    },
    {
      id: "p3",
      name: isJa ? "山田 一郎" : "Ichiro Yamada",
      age: 45,
      gender: "M",
      riskScore: 45,
      condition: isJa ? "高血圧" : "Hypertension",
      lastVisit: "2026-02-15",
      department: isJa ? "循環器内科" : "Cardiology",
    },
    {
      id: "p4",
      name: isJa ? "鈴木 美咲" : "Misaki Suzuki",
      age: 38,
      gender: "F",
      riskScore: 23,
      condition: isJa ? "定期健診" : "Regular checkup",
      lastVisit: "2026-02-10",
      department: isJa ? "総合内科" : "General medicine",
    },
    {
      id: "p12",
      name: isJa ? "伊藤 大輔" : "Daisuke Ito",
      age: 33,
      gender: "M",
      riskScore: 15,
      condition: isJa ? "定期健診" : "Regular checkup",
      lastVisit: "2026-02-08",
      department: isJa ? "総合内科" : "General medicine",
    },
  ];
}

export default function HospitalPage() {
  const { locale, messages } = useI18n();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [adopted, setAdopted] = useState(false);

  const mockPatients = useMemo(() => createMockPatients(locale === "ja"), [locale]);

  const selectedPatient =
    mockPatients.find((p) => p.id === selectedPatientId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedPatientId(id);
    setAdopted(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-6 py-2.5">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {messages.common.back}
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {messages.common.trustBridge}
            </span>
            <span className="text-xs text-muted-foreground">
              / {messages.hospital.subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="rounded bg-secondary px-2 py-0.5 font-mono">
              {mockPatients.length} {messages.hospital.patientsCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span>{messages.hospital.aiEngine}</span>
          </div>
        </div>
      </header>

      <motion.div
        className="flex min-h-0 flex-1 gap-3 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex w-64 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-3">
          <PatientList
            patients={mockPatients}
            selectedId={selectedPatientId}
            onSelect={handleSelect}
          />
        </div>

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

        <div className="flex w-72 flex-shrink-0 flex-col overflow-auto">
          <MedicalRecordForm patient={selectedPatient} adopted={adopted} />
        </div>
      </motion.div>
    </div>
  );
}
