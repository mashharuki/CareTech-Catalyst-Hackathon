"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "./patient-list";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Simulated AI response database per patient condition
const knowledgeBase: Record<string, { q: RegExp; a: string }[]> = {
  肺結節: [
    {
      q: /鑑別|考えられる|診断/i,
      a: "肺結節の鑑別診断としては、(1) 原発性肺癌（腺癌が最も多い）、(2) 転移性肺腫瘍、(3) 良性肉芽腫（結核、サルコイドーシス）、(4) 過誤腫が挙げられます。12mmかつ辺縁不整という所見からは、悪性の可能性を考慮すべきです。",
    },
    {
      q: /治療|方針|プラン/i,
      a: "Lung-RADS 4Bの場合、推奨される方針は：(1) 造影胸部CT精査、(2) PET-CT検査、(3) 経皮的針生検またはEBUS-TBNA、(4) 呼吸器外科カンファレンスでの検討です。3ヶ月以内のフォローCTも考慮してください。",
    },
    {
      q: /ガイドライン|基準|エビデンス/i,
      a: "肺癌取扱い規約第8版およびACR Lung-RADS v2022に準拠しています。10mm以上の充実性結節でLung-RADS 4B相当。Fleischner Societyガイドラインでは、PET-CTまたは生検が推奨されます。",
    },
  ],
  糖尿病性腎症: [
    {
      q: /鑑別|考えられる|診断/i,
      a: "糖尿病性腎症の確認には、(1) 尿中アルブミン/Cr比の推移確認、(2) eGFR推移の評価、(3) 網膜症の有無（合併することが多い）、(4) 腎生検の検討が重要です。IgA腎症等の合併も除外が必要です。",
    },
    {
      q: /治療|方針|プラン/i,
      a: "CKD Stage 3bに対する治療方針：(1) SGLT2阻害薬（ダパグリフロジン）の導入、(2) RAS阻害薬の最適化、(3) 血糖管理（HbA1c 7.0%以下目標）、(4) 食事療法（蛋白制限0.8g/kg/日）を推奨します。",
    },
  ],
  心房細動: [
    {
      q: /鑑別|考えられる|診断/i,
      a: "持続性心房細動の精査として、(1) 甲状腺機能検査（TSH）、(2) 心エコー（弁膜症の除外）、(3) BNP/NT-proBNP測定、(4) CHA2DS2-VAScスコア評価が必要です。本症例はスコア4点で高リスクです。",
    },
    {
      q: /治療|方針|プラン/i,
      a: "CHA2DS2-VASc 4点の管理：(1) DOAC（エドキサバン60mg/日）開始、(2) レートコントロール（ビソプロロール2.5mg）、(3) カテーテルアブレーションの適応検討、(4) 心不全合併のモニタリングを推奨します。",
    },
  ],
  default: [
    {
      q: /鑑別|考えられる|診断/i,
      a: "現在の検査所見からは、主病名に加えて合併症の有無を確認することを推奨します。追加の血液検査・画像検査の結果を統合的に評価してください。",
    },
    {
      q: /治療|方針|プラン/i,
      a: "エビデンスに基づいた標準治療を基本としつつ、患者の年齢・併存疾患・意向を考慮した個別化医療の方針を検討してください。",
    },
  ],
};

function getAIResponse(patient: Patient | null, question: string): string {
  if (!patient) return "患者を選択してからご質問ください。";

  const condition = patient.condition;
  const entries = Object.entries(knowledgeBase).find(([key]) =>
    condition.includes(key),
  );
  const kb = entries ? entries[1] : knowledgeBase.default;

  const match = kb.find((item) => item.q.test(question));
  if (match) return match.a;

  // Fallback generic responses
  if (question.includes("リスク") || question.includes("予後")) {
    return `${patient.name}さん（${patient.age}歳）のリスクスコアは${patient.riskScore}です。${
      patient.riskScore >= 80
        ? "高リスク群に該当します。早期介入と定期的なモニタリングが必要です。"
        : patient.riskScore >= 50
          ? "中リスク群です。生活習慣の改善と3ヶ月毎のフォローを推奨します。"
          : "低リスク群です。年次検診の継続で問題ありません。"
    }`;
  }

  if (question.includes("薬") || question.includes("処方")) {
    return `${patient.condition}に対する一般的な処方としては、ガイドラインに基づく第一選択薬の検討を推奨します。腎機能・肝機能に応じた用量調整が必要です。詳細は各診療科ガイドラインを参照してください。`;
  }

  return `${patient.name}さんの${patient.condition}について承知しました。AI解析結果と合わせて、具体的にどのような観点での支援が必要ですか？（例：鑑別診断、治療方針、ガイドライン参照）`;
}

const quickQuestions = [
  "鑑別診断は？",
  "治療方針を提案して",
  "リスク評価は？",
  "ガイドラインは？",
];

export function AIChat({ patient }: { patient: Patient | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset chat when patient changes
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [patient?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Simulate AI delay
      setTimeout(
        () => {
          const response = getAIResponse(patient, text);
          const aiMsg: Message = {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: response,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        },
        800 + Math.random() * 1000,
      );
    },
    [patient],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">
            AI診断アシスタント
          </span>
          {patient && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {patient.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {messages.length}件
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex flex-col gap-3 overflow-y-auto p-4"
              style={{ maxHeight: 280, minHeight: 160 }}
            >
              {messages.length === 0 && !patient && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bot className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    患者を選択すると、AI診断アシスタントが利用可能になります
                  </p>
                </div>
              )}

              {messages.length === 0 && patient && (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Sparkles className="mb-2 h-5 w-5 text-primary/40" />
                  <p className="text-xs text-muted-foreground">
                    {patient.name}さんの{patient.condition}について質問できます
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {quickQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-secondary/50 text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2.5"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/50 px-3 py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground">
                      分析中...
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick questions after first exchange */}
            {messages.length > 0 && patient && (
              <div className="flex gap-1.5 overflow-x-auto border-t border-border/50 px-4 py-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isTyping}
                    className="flex-shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  patient ? "質問を入力..." : "患者を選択してください"
                }
                disabled={!patient || isTyping}
                className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!patient || !input.trim() || isTyping}
                className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
