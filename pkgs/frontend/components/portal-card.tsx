"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Building2, User, ArrowRight } from "lucide-react"
import Link from "next/link"

export function PortalCard({
  type,
}: {
  type: "hospital" | "patient"
}) {
  const [isHovered, setIsHovered] = useState(false)

  const isHospital = type === "hospital"
  const title = isHospital ? "For Medical Institutions" : "For Patients"
  const subtitle = isHospital ? "病院向けポータル" : "個人向けポータル"
  const description = isHospital
    ? "AI診断補助ワークフローで、医療の質と効率を向上"
    : "あなたの医療データを安全に管理・活用"
  const href = isHospital ? "/hospital" : "/patient"
  const Icon = isHospital ? Building2 : User

  return (
    <Link href={href} className="block flex-1">
      <motion.div
        className="relative flex h-full min-h-[420px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-10 text-card-foreground transition-shadow"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, boxShadow: "0 20px 60px -15px rgba(0,0,0,0.08)" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Background gradient on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: isHospital
              ? "linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(59,130,246,0.01) 100%)"
              : "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(16,185,129,0.01) 100%)",
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center gap-6 text-center"
          animate={{ y: isHovered ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${isHospital ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent-foreground"}`}>
            <Icon className="h-10 w-10" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-medium tracking-tight text-foreground">{title}</h2>
            <p className="text-sm font-light text-muted-foreground">{subtitle}</p>
          </div>

          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <motion.div
            className={`flex items-center gap-2 text-sm font-medium ${isHospital ? "text-primary" : "text-trust-mint"}`}
            animate={{ opacity: isHovered ? 1 : 0.6 }}
          >
            <span>Enter Portal</span>
            <motion.span animate={{ x: isHovered ? 4 : 0 }}>
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </motion.div>
        </motion.div>
      </motion.div>
    </Link>
  )
}
