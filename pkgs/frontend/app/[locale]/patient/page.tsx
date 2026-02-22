"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import { DataUpload } from "@/components/patient/data-upload";
import { TrustExchange } from "@/components/patient/trust-exchange";
import {
  BlockchainConsole,
  type BlockchainEvent,
} from "@/components/patient/blockchain-console";
import { useI18n } from "@/lib/i18n/use-i18n";

function randomHash() {
  return `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

export default function PatientPage() {
  const { locale, messages } = useI18n();
  const [uploadComplete, setUploadComplete] = useState(false);
  const [balance, setBalance] = useState(2450);
  const [events, setEvents] = useState<BlockchainEvent[]>([]);

  const pushEvent = useCallback(
    (event: Omit<BlockchainEvent, "id" | "timestamp">) => {
      setEvents((prev) => [
        ...prev,
        {
          ...event,
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date(),
        },
      ]);
    },
    [],
  );

  const handleUploadStage = useCallback(
    (stage: "scanning" | "masked") => {
      if (stage === "scanning") {
        pushEvent({
          type: "info",
          label: "UPLOAD",
          message: messages.patientPage.uploadStart,
        });
        pushEvent({
          type: "hash",
          label: "MIDNIGHT",
          message: messages.patientPage.txContext,
        });
      }
      if (stage === "masked") {
        pushEvent({
          type: "success",
          label: "AI",
          message: messages.patientPage.anonymized,
        });
        pushEvent({
          type: "hash",
          label: "MIDNIGHT",
          message: `${messages.patientPage.hashCommitted} ${randomHash()}`,
        });
        pushEvent({
          type: "success",
          label: "MIDNIGHT",
          message: messages.patientPage.ledgerStored,
        });
      }
    },
    [messages.patientPage, pushEvent],
  );

  const handleUploadComplete = useCallback(() => {
    setUploadComplete(true);
    pushEvent({
      type: "success",
      label: "WALLET",
      message: messages.patientPage.nftMinted,
    });
  }, [messages.patientPage.nftMinted, pushEvent]);

  const handleTransaction = useCallback(
    (reward: number, orgName: string) => {
      setBalance((prev) => prev + reward);
      pushEvent({
        type: "info",
        label: "EXCHANGE",
        message: `${messages.patientPage.tradeInitiated} ${orgName}`,
      });
      pushEvent({
        type: "hash",
        label: "MIDNIGHT",
        message: messages.patientPage.zkGenerated,
      });
      pushEvent({
        type: "success",
        label: "TRUST",
        message: `+${reward.toLocaleString()} ${messages.patientPage.credited}`,
      });
    },
    [messages.patientPage, pushEvent],
  );

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
              / {messages.patientPage.subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <motion.span
            key={balance}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="font-medium"
          >
            {balance.toLocaleString(locale === "ja" ? "ja-JP" : "en-US")}
          </motion.span>
          <span className="text-muted-foreground">$TRUST</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <div className="flex flex-1 flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DataUpload
              onStageChange={handleUploadStage}
              onComplete={handleUploadComplete}
            />
          </motion.div>

          <AnimatePresence>
            {uploadComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TrustExchange onTransaction={handleTransaction} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full shrink-0 lg:w-96">
          <div className="sticky top-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <BlockchainConsole balance={balance} events={events} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
