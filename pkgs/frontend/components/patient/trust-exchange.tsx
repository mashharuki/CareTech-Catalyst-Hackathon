"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import {
  Store,
  FlaskConical,
  GraduationCap,
  Building,
  Fingerprint,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Clock,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DataListing {
  id: string
  title: string
  organization: string
  reward: number
  type: "sell" | "donate" | "license"
  description: string
  icon: typeof FlaskConical
  tags: string[]
  buyers: number
  rating: number
  accessLevel: "full" | "partial" | "aggregated"
  duration: string
  urgency: "high" | "normal" | "low"
  policyDetail: string
}

const listings: DataListing[] = [
  {
    id: "l1",
    title: "Phase III Clinical Trial - Diabetes Treatment Data",
    organization: "Global Pharma Corp.",
    reward: 5000,
    type: "sell",
    description:
      "Anonymized blood panel data needed for a next-generation diabetes drug trial. Your data helps accelerate drug approval and save lives.",
    icon: FlaskConical,
    tags: ["Blood Panel", "Diabetes", "Phase III"],
    buyers: 342,
    rating: 4.8,
    accessLevel: "partial",
    duration: "12 months",
    urgency: "high",
    policyDetail:
      "Smart contract enforces: read-only access, no re-identification, auto-deletion after trial period. ZK-proof verified on Midnight.",
  },
  {
    id: "l2",
    title: "AI Diagnostic Model Training - Medical Imaging",
    organization: "University of Tokyo Hospital",
    reward: 1200,
    type: "donate",
    description:
      "Contribute anonymized imaging data to improve AI-based diagnostic accuracy. Donors receive bonus $TRUST tokens and research credits.",
    icon: GraduationCap,
    tags: ["Imaging", "AI Training", "Academic"],
    buyers: 1289,
    rating: 4.9,
    accessLevel: "aggregated",
    duration: "Perpetual",
    urgency: "normal",
    policyDetail:
      "Aggregated-only access, no individual records exposed. Data mixed into federated learning pool. Midnight attestation included.",
  },
  {
    id: "l3",
    title: "Population Health Analytics - Insurance Risk Model",
    organization: "NexLife Insurance Ltd.",
    reward: 3500,
    type: "license",
    description:
      "License your de-identified health metrics for actuarial modeling. Revenue-sharing model pays recurring $TRUST per quarter.",
    icon: Building,
    tags: ["Insurance", "Analytics", "Recurring"],
    buyers: 87,
    rating: 4.3,
    accessLevel: "partial",
    duration: "Quarterly renewal",
    urgency: "low",
    policyDetail:
      "Partial access to anonymized metrics only. Strict no-discrimination clause enforced via smart contract. Opt-out anytime.",
  },
  {
    id: "l4",
    title: "Rare Disease Gene Expression Study",
    organization: "BioGenesis Research Institute",
    reward: 8000,
    type: "sell",
    description:
      "High-value rare disease genomic data request. Premium compensation reflects the rarity and research significance of matching data profiles.",
    icon: FlaskConical,
    tags: ["Genomics", "Rare Disease", "Premium"],
    buyers: 23,
    rating: 5.0,
    accessLevel: "full",
    duration: "24 months",
    urgency: "high",
    policyDetail:
      "Full anonymized dataset access. Triple-layer encryption with Midnight shielded transactions. Mandatory ethics board review.",
  },
]

type TxState = "idle" | "auth" | "zkproof" | "signing" | "complete"

export function TrustExchange({
  onTransaction,
}: {
  onTransaction: (reward: number, orgName: string) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [txState, setTxState] = useState<TxState>("idle")
  const [filter, setFilter] = useState<"all" | "sell" | "donate" | "license">("all")

  const filtered = filter === "all" ? listings : listings.filter((l) => l.type === filter)

  const handleAction = (listing: DataListing) => {
    setSelectedId(listing.id)
    setTxState("auth")

    setTimeout(() => setTxState("zkproof"), 1800)
    setTimeout(() => setTxState("signing"), 3200)
    setTimeout(() => {
      setTxState("complete")
      onTransaction(listing.reward, listing.organization)
    }, 4500)
    setTimeout(() => {
      setTxState("idle")
      setSelectedId(null)
    }, 7000)
  }

  const accessColor = (level: string) => {
    if (level === "full") return "text-emerald-600 bg-emerald-50"
    if (level === "partial") return "text-amber-600 bg-amber-50"
    return "text-primary bg-primary/10"
  }

  const urgencyBadge = (urgency: string) => {
    if (urgency === "high") return "border-red-200 bg-red-50 text-red-600"
    if (urgency === "normal") return "border-border bg-secondary text-muted-foreground"
    return "border-border bg-secondary/50 text-muted-foreground"
  }

  const typeLabel = (type: string) => {
    if (type === "sell") return "Sell"
    if (type === "donate") return "Donate"
    return "License"
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            Step 2: Trust Exchange - Data Marketplace
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          Midnight Protected
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-center">
          <p className="text-lg font-medium text-foreground">{listings.length}</p>
          <p className="text-[10px] text-muted-foreground">Active Requests</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-center">
          <p className="text-lg font-medium text-foreground">
            {listings.reduce((s, l) => s + l.buyers, 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Data Contributors</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-center">
          <p className="text-lg font-medium text-primary">
            {listings.reduce((s, l) => s + l.reward, 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Max $TRUST Available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "sell", "donate", "license"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : typeLabel(f)}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filtered.map((listing, i) => {
            const isSelected = selectedId === listing.id
            const isExpanded = expandedId === listing.id
            const Icon = listing.icon

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-sm"
              >
                {/* Main content */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground">
                              {listing.title}
                            </h4>
                            {listing.urgency === "high" && (
                              <span
                                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${urgencyBadge(listing.urgency)}`}
                              >
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {listing.organization}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 text-xs font-semibold text-foreground"
                        >
                          {listing.reward.toLocaleString()} $TRUST
                        </Badge>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {listing.buyers.toLocaleString()} contributors
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400" />
                          {listing.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {listing.duration}
                        </span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 ${accessColor(listing.accessLevel)}`}
                        >
                          <Eye className="h-3 w-3" />
                          {listing.accessLevel} access
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {listing.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                        {listing.description}
                      </p>

                      {/* Expand for policy details */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : listing.id)
                        }
                        className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        <Lock className="h-3 w-3" />
                        Data Access Policy
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
                              {listing.policyDetail}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action area */}
                      <div className="mt-3">
                        <AnimatePresence mode="wait">
                          {(!isSelected || txState === "idle") && (
                            <motion.div key="btn" exit={{ opacity: 0 }}>
                              <Button
                                size="sm"
                                onClick={() => handleAction(listing)}
                                className="h-8 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                              >
                                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                                {typeLabel(listing.type)} Data -{" "}
                                {listing.reward.toLocaleString()} $TRUST
                              </Button>
                            </motion.div>
                          )}

                          {isSelected && txState === "auth" && (
                            <motion.div
                              key="auth"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                }}
                              >
                                <Fingerprint className="h-6 w-6 text-primary" />
                              </motion.div>
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  Biometric Authentication...
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Verifying identity with DID
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {isSelected && txState === "zkproof" && (
                            <motion.div
                              key="zkproof"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3"
                            >
                              <motion.div
                                className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              />
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  Generating ZK-Proof...
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Midnight shielded transaction being created
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {isSelected && txState === "signing" && (
                            <motion.div
                              key="signing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3"
                            >
                              <motion.div
                                className="h-2 w-2 rounded-full bg-primary"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [1, 0.5, 1],
                                }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                }}
                              />
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  Signing on Midnight Ledger...
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Smart contract executing data access policy
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {isSelected && txState === "complete" && (
                            <motion.div
                              key="complete"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>
                                Transaction Complete -{" "}
                                {listing.reward.toLocaleString()} $TRUST credited
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
