"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Patient } from "./patient-list";
import { useI18n } from "@/lib/i18n/use-i18n";

function buildAutoFillData(isJa: boolean): Record<
  string,
  { diagnosis: string; findings: string; plan: string }
> {
  if (isJa) {
    return {
      p1: {
        diagnosis: "右肺上葉 結節影（Lung-RADS 4B）",
        findings:
          "胸部X線にてAI解析を実施。右肺上葉S1に約12mmの充実性結節を検出。辺縁不整あり。AI確信度89%。",
        plan: "胸部CT精密検査を予約。呼吸器外科コンサルト依頼。2週間後フォローアップ。",
      },
      p2: {
        diagnosis: "糖尿病性腎症（CKD Stage 3b）",
        findings:
          "腎エコーにて両側腎皮質菲薄化を確認。eGFR 38 mL/min。尿蛋白(2+)。",
        plan: "SGLT2阻害薬導入検討。腎臓内科紹介。食事指導（蛋白制限0.8g/kg/日）。",
      },
      p5: {
        diagnosis: "持続性心房細動（CHA2DS2-VASc 4点）",
        findings:
          "Holter心電図にて持続性心房細動を確認。平均心拍数92bpm。心エコー上LA拡大。",
        plan: "DOAC開始。レートコントロール。カテーテルアブレーション適応検討。",
      },
      default: {
        diagnosis: "健診結果: 特記所見なし",
        findings: "AI画像解析および血液検査所見に明らかな異常を認めず。",
        plan: "定期健診を継続。生活習慣指導（運動・食事）。次回1年後。",
      },
    };
  }

  return {
    p1: {
      diagnosis: "Right upper lobe lung nodule (Lung-RADS 4B)",
      findings:
        "AI analysis on chest X-ray detected a ~12mm solid nodule in right upper lobe S1 with irregular margin. AI confidence 89%.",
      plan:
        "Schedule contrast chest CT. Request respiratory surgery consult. Follow-up in 2 weeks.",
    },
    p2: {
      diagnosis: "Diabetic nephropathy (CKD Stage 3b)",
      findings:
        "Bilateral renal cortical thinning on renal ultrasound. eGFR 38 mL/min, proteinuria (2+).",
      plan:
        "Consider SGLT2 inhibitor initiation. Refer to nephrology. Dietary counseling (protein 0.8 g/kg/day).",
    },
    p5: {
      diagnosis: "Persistent atrial fibrillation (CHA2DS2-VASc 4)",
      findings:
        "Holter ECG confirms persistent AF with average HR 92 bpm. Left atrial enlargement on echo.",
      plan:
        "Start DOAC, rate control, and evaluate catheter ablation eligibility.",
    },
    default: {
      diagnosis: "Checkup result: no significant findings",
      findings:
        "No clear abnormalities detected in AI imaging analysis or bloodwork.",
      plan:
        "Continue annual checkups with lifestyle counseling and follow-up in 1 year.",
    },
  };
}

export function MedicalRecordForm({
  patient,
  adopted,
}: {
  patient: Patient | null;
  adopted: boolean;
}) {
  const { messages, locale } = useI18n();
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [findings, setFindings] = useState("");
  const [plan, setPlan] = useState("");

  const autoFillData = useMemo(() => buildAutoFillData(locale === "ja"), [locale]);

  useEffect(() => {
    if (adopted && patient) {
      const data = autoFillData[patient.id] ?? autoFillData.default;
      setFilling(true);
      setFilled(false);
      setSubmitted(false);
      setDiagnosis("");
      setFindings("");
      setPlan("");

      const timer1 = setTimeout(() => setDiagnosis(data.diagnosis), 400);
      const timer2 = setTimeout(() => setFindings(data.findings), 800);
      const timer3 = setTimeout(() => {
        setPlan(data.plan);
        setFilling(false);
        setFilled(true);
      }, 1200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    setDiagnosis("");
    setFindings("");
    setPlan("");
    setFilled(false);
    setSubmitted(false);
  }, [adopted, autoFillData, patient]);

  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <div>
          <FileText
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">{messages.medicalRecord.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-medium text-foreground">{messages.medicalRecord.title}</h3>
        {filling && (
          <motion.div
            className="ml-auto flex items-center gap-1 text-[10px] text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="h-3 w-3" />
            <span>{messages.medicalRecord.aiFilling}</span>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <Label htmlFor="patient-name" className="text-[10px] text-muted-foreground">
            {messages.medicalRecord.patientName}
          </Label>
          <Input
            id="patient-name"
            value={`${patient.name} (${patient.age}${messages.medicalRecord.yearsOld} ${patient.gender})`}
            readOnly
            className="mt-1 h-8 bg-secondary/50 text-xs"
          />
        </div>

        <div>
          <Label htmlFor="diagnosis" className="text-[10px] text-muted-foreground">
            {messages.medicalRecord.diagnosis}
          </Label>
          <Input
            id="diagnosis"
            value={diagnosis}
            readOnly
            placeholder={messages.medicalRecord.diagnosisPlaceholder}
            className={`mt-1 h-8 text-xs transition-colors ${
              diagnosis
                ? "border-primary/20 bg-primary/5 text-foreground"
                : "bg-card text-foreground"
            }`}
          />
        </div>

        <div>
          <Label htmlFor="findings" className="text-[10px] text-muted-foreground">
            {messages.medicalRecord.findings}
          </Label>
          <Textarea
            id="findings"
            value={findings}
            readOnly
            placeholder={messages.medicalRecord.findingsPlaceholder}
            rows={3}
            className={`mt-1 text-xs transition-colors ${
              findings
                ? "border-primary/20 bg-primary/5 text-foreground"
                : "bg-card text-foreground"
            }`}
          />
        </div>

        <div>
          <Label htmlFor="plan" className="text-[10px] text-muted-foreground">
            {messages.medicalRecord.plan}
          </Label>
          <Textarea
            id="plan"
            value={plan}
            readOnly
            placeholder={messages.medicalRecord.planPlaceholder}
            rows={2}
            className={`mt-1 text-xs transition-colors ${
              plan ? "border-primary/20 bg-primary/5 text-foreground" : "bg-card text-foreground"
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {filled && !submitted && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
              onClick={() => setSubmitted(true)}
            >
              {messages.medicalRecord.save}
            </Button>
          </motion.div>
        )}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-xs font-medium text-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {messages.medicalRecord.saved}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
