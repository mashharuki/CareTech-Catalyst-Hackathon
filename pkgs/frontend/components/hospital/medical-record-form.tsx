"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Patient } from "./patient-list";

// AI auto-fill data per patient
const autoFillData: Record<
  string,
  { diagnosis: string; findings: string; plan: string }
> = {
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
  p3: {
    diagnosis: "高血圧性心疾患（LVH Grade II）",
    findings: "心エコーにて左室壁厚13mm。拡張障害の所見あり。EF 58%保持。",
    plan: "降圧薬（ARB + CCB）調整。6ヶ月後フォローアップ心エコー。減塩指導。",
  },
  p5: {
    diagnosis: "持続性心房細動（CHA2DS2-VASc 4点）",
    findings:
      "Holter心電図にて持続性心房細動を確認。平均心拍数92bpm。心エコー上LA拡大。",
    plan: "DOAC開始。レートコントロール。カテーテルアブレーション適応検討。",
  },
  p6: {
    diagnosis: "肝硬変（Child-Pugh B）",
    findings:
      "腹部CTにて肝表面不整・脾腫を確認。腹水少量。血小板8.2万。PT-INR 1.4。",
    plan: "利尿薬調整。上部内視鏡検査（静脈瘤スクリーニング）。肝臓専門医紹介。",
  },
  p7: {
    diagnosis: "甲状腺結節（TIRADS 4）",
    findings:
      "頸部エコーにて右葉に15mm低エコー結節。微小石灰化あり。血流増加。",
    plan: "穿刺吸引細胞診（FNA）予約。甲状腺機能検査結果確認。",
  },
  p8: {
    diagnosis: "胸膜肥厚（石綿曝露歴あり）",
    findings:
      "胸部CTにて両側胸膜肥厚。びまん性プラーク形成。肺野にすりガラス影散見。",
    plan: "労災申請検討。呼吸機能検査。6ヶ月毎CT。産業医連携。",
  },
  p9: {
    diagnosis: "膵管内乳頭粘液性腫瘍（IPMN）疑い",
    findings:
      "腹部MRIにて主膵管拡張(5mm)。分枝型嚢胞性病変あり。CA19-9正常範囲。",
    plan: "超音波内視鏡（EUS）精査。CA19-9・CEA定期フォロー。消化器外科カンファレンス。",
  },
  p10: {
    diagnosis: "冠動脈石灰化（Agatston Score 450）",
    findings:
      "心臓CTにて高度冠動脈石灰化。LAD・LCX・RCAの3枝に分布。狭窄疑い。",
    plan: "負荷心筋シンチグラフィ。循環器内科受診。スタチン強化。",
  },
  p11: {
    diagnosis: "腰椎椎間板ヘルニア（L4/5 Grade III）",
    findings: "腰椎MRIにてL4/5椎間板後方突出。馬尾神経圧排あり。両下肢しびれ。",
    plan: "整形外科紹介。硬膜外ブロック検討。リハビリ開始。保存療法3ヶ月。",
  },
  default: {
    diagnosis: "健診結果: 特記所見なし",
    findings: "AI画像解析および血液検査所見に明らかな異常を認めず。",
    plan: "定期健診を継続。生活習慣指導（運動・食事）。次回1年後。",
  },
};

export function MedicalRecordForm({
  patient,
  adopted,
}: {
  patient: Patient | null;
  adopted: boolean;
}) {
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [findings, setFindings] = useState("");
  const [plan, setPlan] = useState("");

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
    } else {
      setDiagnosis("");
      setFindings("");
      setPlan("");
      setFilled(false);
      setSubmitted(false);
    }
  }, [adopted, patient?.id]);

  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <div>
          <FileText
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">カルテフォーム</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-medium text-foreground">電子カルテ</h3>
        {filling && (
          <motion.div
            className="ml-auto flex items-center gap-1 text-[10px] text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="h-3 w-3" />
            <span>AI自動入力中...</span>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div>
          <Label
            htmlFor="patient-name"
            className="text-[10px] text-muted-foreground"
          >
            患者名
          </Label>
          <Input
            id="patient-name"
            value={`${patient.name}（${patient.age}歳 ${patient.gender}）`}
            readOnly
            className="mt-1 h-8 bg-secondary/50 text-xs"
          />
        </div>

        <div>
          <Label
            htmlFor="diagnosis"
            className="text-[10px] text-muted-foreground"
          >
            診断名
          </Label>
          <Input
            id="diagnosis"
            value={diagnosis}
            readOnly
            placeholder="AIの解析結果を採用するか、手動入力してください"
            className={`mt-1 h-8 text-xs transition-colors ${
              diagnosis
                ? "border-primary/20 bg-primary/5 text-foreground"
                : "bg-card text-foreground"
            }`}
          />
        </div>

        <div>
          <Label
            htmlFor="findings"
            className="text-[10px] text-muted-foreground"
          >
            所見
          </Label>
          <Textarea
            id="findings"
            value={findings}
            readOnly
            placeholder="所見を入力..."
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
            治療計画
          </Label>
          <Textarea
            id="plan"
            value={plan}
            readOnly
            placeholder="治療計画を入力..."
            rows={2}
            className={`mt-1 text-xs transition-colors ${
              plan
                ? "border-primary/20 bg-primary/5 text-foreground"
                : "bg-card text-foreground"
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {filled && !submitted && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
              onClick={() => setSubmitted(true)}
            >
              カルテを保存
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
            カルテが保存されました
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
