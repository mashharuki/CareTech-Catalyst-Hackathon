"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Terminal, Shield, ExternalLink } from "lucide-react"

export interface BlockchainEvent {
  id: string
  type: "info" | "success" | "hash" | "warning"
  label: string
  message: string
  timestamp: Date
}

function generateHash() {
  const chars = "0123456789abcdef"
  let hash = "0x"
  for (let i = 0; i < 12; i++) {
    hash += chars[Math.floor(Math.random() * 16)]
  }
  return hash + "..."
}

export function BlockchainConsole({
  balance,
  events,
}: {
  balance: number
  events: BlockchainEvent[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [blockHeight, setBlockHeight] = useState(1_482_910)
  const [peers, setPeers] = useState(47)

  // Simulate Midnight network heartbeat (ambient logs)
  const [ambientLogs, setAmbientLogs] = useState<BlockchainEvent[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight((h) => h + 1)
      setPeers((p) => Math.max(40, Math.min(60, p + Math.floor(Math.random() * 3) - 1)))

      const ambient: BlockchainEvent = {
        id: `amb-${Date.now()}`,
        type: "info",
        label: "MIDNIGHT",
        message: (() => {
          const msgs = [
            `Block #${(blockHeight + 1).toLocaleString()} finalized`,
            `Peer sync: ${peers} nodes connected`,
            `Shielded pool: ${generateHash()} verified`,
            `ZK-circuit compilation cached`,
            `Network health: 99.97% uptime`,
          ]
          return msgs[Math.floor(Math.random() * msgs.length)]
        })(),
        timestamp: new Date(),
      }
      setAmbientLogs((prev) => [...prev.slice(-10), ambient])
    }, 2500)

    return () => clearInterval(interval)
  }, [blockHeight, peers])

  // Merge ambient + real events, sorted by time
  const allLogs = [...ambientLogs, ...events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  ).slice(-40)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [allLogs.length])

  const labelColor = (label: string) => {
    switch (label) {
      case "MIDNIGHT":
        return "text-primary"
      case "TRUST":
        return "text-emerald-600"
      case "EXCHANGE":
        return "text-amber-600"
      case "AI":
        return "text-pink-600"
      case "UPLOAD":
        return "text-sky-600"
      case "WALLET":
        return "text-emerald-600"
      default:
        return "text-muted-foreground"
    }
  }

  const typeColor = (type: BlockchainEvent["type"]) => {
    switch (type) {
      case "success":
        return "text-emerald-600"
      case "hash":
        return "text-primary"
      case "warning":
        return "text-amber-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Blockchain Provenance</h3>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[10px] text-muted-foreground">Midnight Connected</span>
        </div>
      </div>

      {/* Network status */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-center">
          <p className="font-mono text-xs font-medium text-foreground">
            {blockHeight.toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground">Block Height</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-center">
          <p className="font-mono text-xs font-medium text-foreground">{peers}</p>
          <p className="text-[9px] text-muted-foreground">Peers</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-center">
          <p className="font-mono text-xs font-medium text-emerald-600">
            {events.length}
          </p>
          <p className="text-[9px] text-muted-foreground">Your Txns</p>
        </div>
      </div>

      {/* Console */}
      <div
        ref={scrollRef}
        className="h-64 overflow-auto rounded-xl bg-foreground/[0.03] p-3 font-mono text-[10px] leading-5"
      >
        {allLogs.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Waiting for blockchain events...
          </div>
        )}
        <AnimatePresence initial={false}>
          {allLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-1 ${typeColor(log.type)}`}
            >
              <span className="flex-shrink-0 text-muted-foreground/50">
                {log.timestamp.toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className={`flex-shrink-0 font-semibold ${labelColor(log.label)}`}>
                [{log.label}]
              </span>
              <span>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Wallet Balance</span>
        </div>
        <motion.span
          key={balance}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          className="text-lg font-medium text-foreground"
        >
          {balance.toLocaleString()}{" "}
          <span className="text-xs text-muted-foreground">$TRUST</span>
        </motion.span>
      </div>

      {/* Midnight link */}
      <a
        href="https://midnight.network"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ExternalLink className="h-3 w-3" />
        Powered by Midnight Protocol - Data Protection by Design
      </a>
    </div>
  )
}
