"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { useI18n } from "@/lib/i18n/use-i18n";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function buildKnowledgeBase(
  isJa: boolean,
): Record<string, { q: RegExp; a: string }[]> {
  if (isJa) {
    return {
      肺: [
        {
          q: /鑑別|考えられる|診断/i,
          a: "肺結節の鑑別として原発性肺癌・転移性病変・良性肉芽腫などが考えられます。12mmかつ辺縁不整のため悪性リスク評価を優先してください。",
        },
        {
          q: /治療|方針|プラン/i,
          a: "推奨方針は造影CT、必要時PET-CT、生検評価、呼吸器外科カンファレンスです。短期フォローCTも検討してください。",
        },
      ],
      default: [
        {
          q: /ガイドライン|基準|エビデンス/i,
          a: "国内外ガイドラインを参照し、患者背景（年齢・併存疾患・希望）を反映した個別化方針で最終判断してください。",
        },
        {
          q: /治療|方針|プラン/i,
          a: "標準治療を基盤に、禁忌・合併症リスク・フォロー体制を加味して段階的に治療計画を決めてください。",
        },
      ],
    };
  }

  return {
    lung: [
      {
        q: /differential|diagnosis/i,
        a: "For pulmonary nodules, key differentials include primary lung cancer, metastatic lesions, and benign granulomatous disease. Given 12mm size and irregular margin, prioritize malignant-risk workup.",
      },
      {
        q: /treatment|plan|management/i,
        a: "Recommended pathway includes contrast CT, PET-CT if indicated, biopsy evaluation, and multidisciplinary thoracic review. Consider short-interval follow-up CT.",
      },
    ],
    default: [
      {
        q: /guideline|evidence|standard/i,
        a: "Use guideline-based care and tailor final decisions to age, comorbidities, and patient preference.",
      },
      {
        q: /treatment|plan|management/i,
        a: "Base on standard-of-care while adjusting for contraindications, complication risk, and follow-up capacity.",
      },
    ],
  };
}

function getAIResponse(
  patient: Patient | null,
  question: string,
  isJa: boolean,
  noPatientText: string,
): string {
  if (!patient) return noPatientText;

  const kb = buildKnowledgeBase(isJa);
  const condition = patient.condition.toLowerCase();
  const selected =
    (condition.includes("肺") || condition.includes("lung")
      ? kb[isJa ? "肺" : "lung"]
      : kb.default) ?? kb.default;

  const match = selected.find((item) => item.q.test(question));
  if (match) return match.a;

  if (isJa) {
    if (question.includes("リスク") || question.includes("予後")) {
      return (
        `${patient.name}さん（${patient.age}歳）のリスクスコアは${patient.riskScore}です。` +
        (patient.riskScore >= 80
          ? "高リスク群に該当します。早期介入と定期モニタリングを推奨します。"
          : patient.riskScore >= 50
            ? "中リスク群です。生活習慣改善と3か月ごとのフォローが推奨です。"
            : "低リスク群です。年次検診の継続で問題ありません。")
      );
    }
    return `${patient.name}さんの${patient.condition}について、どの観点を深掘りしますか？（例: 鑑別診断、治療方針、ガイドライン）`;
  }

  if (/risk|prognosis/i.test(question)) {
    return `${patient.name} (${patient.age}) has a risk score of ${patient.riskScore}. ${
      patient.riskScore >= 80
        ? "This falls into a high-risk tier requiring early intervention and close monitoring."
        : patient.riskScore >= 50
          ? "This is a moderate-risk tier; lifestyle optimization and 3-month follow-ups are recommended."
          : "This is a low-risk tier; annual checkups are generally sufficient."
    }`;
  }

  return `Understood. For ${patient.condition}, which angle should I support first (differential, treatment, or guideline references)?`;
}

export function AIChat({ patient }: { patient: Patient | null }) {
  const { messages, locale } = useI18n();
  const isJa = locale === "ja";

  const [messagesState, setMessagesState] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQuestions = useMemo(
    () => messages.aiChat.quickQuestions,
    [messages.aiChat.quickQuestions],
  );

  useEffect(() => {
    setMessagesState([]);
    setInput("");
  }, [patient?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesState, isTyping]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      setMessagesState((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      setTimeout(
        () => {
          const response = getAIResponse(
            patient,
            text,
            isJa,
            messages.aiChat.noPatientResponse,
          );
          const aiMsg: Message = {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: response,
          };
          setMessagesState((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        },
        800 + Math.random() * 1000,
      );
    },
    [isJa, messages.aiChat.noPatientResponse, patient],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">
            {messages.aiChat.title}
          </span>
          {patient && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {patient.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messagesState.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {messagesState.length}
              {messages.aiChat.countSuffix}
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
            <div
              ref={scrollRef}
              className="flex flex-col gap-3 overflow-y-auto p-4"
              style={{ maxHeight: 280, minHeight: 160 }}
            >
              {messagesState.length === 0 && !patient && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bot className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    {messages.aiChat.emptyNoPatient}
                  </p>
                </div>
              )}

              {messagesState.length === 0 && patient && (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Sparkles className="mb-2 h-5 w-5 text-primary/40" />
                  <p className="text-xs text-muted-foreground">
                    {patient.name} {messages.aiChat.emptyWithPatient}
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

              {messagesState.map((msg) => (
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
                      {messages.aiChat.typing}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {messagesState.length > 0 && patient && (
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

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  patient
                    ? messages.aiChat.inputPlaceholder
                    : messages.aiChat.inputDisabled
                }
                className="h-9 flex-1 rounded-lg border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                disabled={!patient || isTyping}
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3"
                disabled={!patient || !input.trim() || isTyping}
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
