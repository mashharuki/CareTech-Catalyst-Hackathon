"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  riskScore: number;
  condition: string;
  lastVisit: string;
  department: string;
}

const riskBg = (score: number) => {
  if (score >= 80) return "bg-red-50 text-red-600";
  if (score >= 50) return "bg-amber-50 text-amber-600";
  return "bg-emerald-50 text-emerald-600";
};

export function PatientList({
  patients,
  selectedId,
  onSelect,
}: {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const { messages } = useI18n();

  const filtered = patients
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.condition.toLowerCase().includes(search.toLowerCase()) ||
        p.department.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {messages.patientList.title}
        </h3>
        <span className="text-xs text-muted-foreground">{patients.length}</span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={messages.patientList.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {filtered.map((patient, i) => (
          <motion.button
            key={patient.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(patient.id)}
            className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              selectedId === patient.id
                ? "border-primary/20 bg-primary/5 text-foreground"
                : "border-transparent bg-card text-foreground hover:bg-secondary"
            }`}
          >
            <div className="relative flex-shrink-0">
              {patient.riskScore >= 80 && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-red-500/20"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${riskBg(patient.riskScore)}`}
              >
                {patient.riskScore}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium">
                  {patient.name}
                </span>
                {patient.riskScore >= 80 && (
                  <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-500" />
                )}
              </div>
              <p className="truncate text-[10px] text-muted-foreground">
                {patient.age}
                {messages.patientList.yearsOld} {patient.gender} /{" "}
                {patient.condition}
              </p>
            </div>

            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {messages.patientList.noResults}
          </p>
        )}
      </div>
    </div>
  );
}
