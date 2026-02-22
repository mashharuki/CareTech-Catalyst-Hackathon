"use client";

import { useState, useTransition } from "react";

type Job = {
  id: string;
  status: string;
  attempts: number;
  updatedAtMs: number;
  payload: {
    trackingId: string;
    requesterId: string;
    consentId: string;
    dataType: string;
    recipient: string;
    purpose: string;
  };
};

export default function JobsTable({ initial }: { initial: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initial);
  const [pending, start] = useTransition();
  const BASE =
    (process.env.NEXT_PUBLIC_BACKEND_URL as string | undefined) ||
    "http://localhost:3001";

  const retry = (id: string) => {
    start(async () => {
      const r = await fetch(`/api/ops/outbox/${encodeURIComponent(id)}/retry`, {
        method: "POST",
      });
      if (r.ok) {
        const latest = await fetch(`${BASE}/api/outbox/jobs`, {
          headers: { "x-role": "operator" },
          cache: "no-store",
        });
        const data = await latest.json();
        setJobs(data.items || []);
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="text-sm font-medium text-foreground">Outbox Jobs</div>
        <div className="text-xs text-muted-foreground">
          {pending ? "Updating..." : ""}
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left">Job</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Attempts</th>
              <th className="px-3 py-2 text-left">Tracking</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-border">
                <td className="px-3 py-2 font-mono">{j.id}</td>
                <td className="px-3 py-2">{j.status}</td>
                <td className="px-3 py-2">{j.attempts}</td>
                <td className="px-3 py-2 font-mono">{j.payload?.trackingId}</td>
                <td className="px-3 py-2 text-right">
                  {j.status !== "succeeded" && j.status !== "compensated" ? (
                    <button
                      type="button"
                      className="rounded bg-primary px-3 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
                      disabled={pending}
                      onClick={() => retry(j.id)}
                    >
                      Retry
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-xs text-muted-foreground"
                  colSpan={5}
                >
                  No jobs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
