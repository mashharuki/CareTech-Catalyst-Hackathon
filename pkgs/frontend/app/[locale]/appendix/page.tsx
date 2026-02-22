"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Database,
  Scale,
  Coins,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/use-i18n";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function AppendixPage() {
  const { locale, messages } = useI18n();
  const isJa = locale === "ja";

  const offChainItems = isJa
    ? [
        "生の医療データ (DICOM, HL7)",
        "患者個人情報",
        "診療録・検査結果",
        "病院内サーバーに暗号化保存",
      ]
    : [
        "Raw healthcare data (DICOM, HL7)",
        "Patient personal information",
        "Medical records and test results",
        "Encrypted and stored in hospital servers",
      ];

  const onChainItems = isJa
    ? [
        "データアクセス権トークン",
        "ハッシュ値（改ざん検知）",
        "取引履歴・同意ログ",
        "インセンティブ配分記録",
      ]
    : [
        "Data access-right token",
        "Hashes for tamper detection",
        "Transaction and consent logs",
        "Incentive distribution records",
      ];

  const rows = isJa
    ? [
        { req: "匿名加工", jp: "必須", gdpr: "必須", tb: "AI自動匿名化" },
        {
          req: "本人同意",
          jp: "オプトアウト可",
          gdpr: "明示的同意",
          tb: "ブロックチェーン同意ログ",
        },
        {
          req: "データポータビリティ",
          jp: "規定なし",
          gdpr: "義務",
          tb: "Self-Sovereign ID",
        },
        {
          req: "利用目的の制限",
          jp: "必須",
          gdpr: "必須",
          tb: "スマートコントラクト制御",
        },
        {
          req: "第三者提供の記録",
          jp: "必須",
          gdpr: "必須",
          tb: "オンチェーン取引ログ",
        },
      ]
    : [
        {
          req: "Anonymization",
          jp: "Required",
          gdpr: "Required",
          tb: "AI-based anonymization",
        },
        {
          req: "Subject consent",
          jp: "Opt-out allowed",
          gdpr: "Explicit consent",
          tb: "Blockchain consent log",
        },
        {
          req: "Data portability",
          jp: "Not specified",
          gdpr: "Obligatory",
          tb: "Self-Sovereign ID",
        },
        {
          req: "Purpose limitation",
          jp: "Required",
          gdpr: "Required",
          tb: "Smart-contract controls",
        },
        {
          req: "Third-party disclosure log",
          jp: "Required",
          gdpr: "Required",
          tb: "On-chain transaction log",
        },
      ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
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
              / {messages.appendix.subtitle}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl p-6 lg:p-10">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            {messages.appendix.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {messages.appendix.description}
          </p>
        </motion.div>

        <div className="flex flex-col gap-10">
          <motion.section
            className="rounded-2xl border border-border bg-card p-6 lg:p-8"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">
                  {isJa
                    ? "図解1：データ分離構造"
                    : "Figure 1: Data Separation Structure"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Data Separation Architecture
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
              <div className="flex-1 rounded-xl border border-border bg-secondary/30 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isJa ? "Off-Chain / 病院内" : "Off-Chain / Hospital"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {offChainItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ArrowRight className="hidden h-5 w-5 lg:block" />
                <span className="rotate-90 text-xs lg:rotate-0">Hash</span>
              </div>

              <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">
                    On-Chain / Midnight
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {onChainItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-xs text-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-border bg-card p-6 lg:p-8"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">
                  {isJa
                    ? "図解2：法規制マッピング"
                    : "Figure 2: Regulatory Compliance Matrix"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Regulatory Compliance Matrix
                </p>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      {isJa ? "要件" : "Requirement"}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                      {isJa ? "次世代医療基盤法" : "JP Law"}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                      GDPR
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                      {isJa ? "TrustBridge対応" : "TrustBridge"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-foreground">
                        {row.req}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {row.jp}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {row.gdpr}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-primary">
                        {row.tb}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-border bg-card p-6 lg:p-8"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">
                  {isJa
                    ? "図解3：経済圏エコシステム"
                    : "Figure 3: Token Flow Ecosystem"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Token Flow - Win-Win-Win Ecosystem
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-4">
              <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-border bg-secondary/30 p-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg">H</span>
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  {isJa ? "医療機関" : "Medical Institutions"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isJa ? "AI診断で効率化" : "Efficiency with AI diagnostics"}
                </p>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary">
                  {isJa ? "診療効率 +40%" : "Clinical throughput +40%"}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground">$TRUST</div>
                <div className="flex gap-1">
                  <ArrowRight className="h-4 w-4 text-primary/50" />
                </div>
              </div>

              <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg">P</span>
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  {isJa ? "個人（患者）" : "Individuals (Patients)"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isJa ? "データを収益化" : "Monetize personal data"}
                </p>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary">
                  {isJa ? "報酬 $TRUST" : "Reward in $TRUST"}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground">Data</div>
                <div className="flex gap-1">
                  <ArrowRight className="h-4 w-4 text-primary/50" />
                </div>
              </div>

              <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-border bg-secondary/30 p-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg">R</span>
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  {isJa ? "研究機関" : "Research Organizations"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isJa ? "高品質データを取得" : "Access high-quality datasets"}
                </p>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary">
                  {isJa ? "データ品質 +60%" : "Data quality +60%"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-secondary/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                {isJa
                  ? "Midnight Protocolを基盤として、データ提供者（患者）、データ活用者（研究機関・製薬会社）、医療機関の3者がそれぞれ価値を享受するトークンエコノミーを実現"
                  : "Built on Midnight Protocol, TrustBridge enables a token economy where patients, data users (research/pharma), and medical institutions each receive fair value."}
              </p>
            </div>
          </motion.section>
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href={`/${locale}`}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {isJa ? "ポータル選択へ戻る" : "Back to Portal Selection"}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
