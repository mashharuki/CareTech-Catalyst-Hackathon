"use client"

import { motion } from "framer-motion"
import { PortalCard } from "@/components/portal-card"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      {/* Logo and heading */}
      <motion.div
        className="mb-14 flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card text-primary">
          <Shield className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            NextMed <span className="text-primary">TrustBridge</span>
          </h1>
          <p className="text-sm font-light text-muted-foreground">
            医療の信頼を、価値に変える架け橋
          </p>
        </div>
      </motion.div>

      {/* Portal Cards */}
      <motion.div
        className="flex w-full max-w-3xl flex-col gap-6 md:flex-row"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <PortalCard type="hospital" />
        <PortalCard type="patient" />
      </motion.div>

      {/* Footer */}
      <motion.div
        className="mt-12 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Link
          href="/appendix"
          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          Technical Appendix (審査員向け)
        </Link>
        <p className="text-xs text-muted-foreground">
          Powered by Midnight Protocol / AI-Driven Healthcare
        </p>
      </motion.div>
    </main>
  )
}
