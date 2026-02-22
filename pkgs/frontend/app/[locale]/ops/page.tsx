import { notFound } from "next/navigation";
import JobsTable from "@/components/ops/JobsTable";
import { getMessages } from "@/lib/i18n/messages";
import { isLocale } from "@/lib/i18n/config";

async function fetchOps() {
  const BASE =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001";
  const [metricsRes, jobsRes] = await Promise.all([
    fetch(`${BASE}/api/ops/metrics`, {
      headers: { "x-role": "operator" },
      cache: "no-store",
    }),
    fetch(`${BASE}/api/outbox/jobs`, {
      headers: { "x-role": "operator" },
      cache: "no-store",
    }),
  ]);
  const metrics = await metricsRes.json();
  const jobs = await jobsRes.json();
  return { metrics, jobs: jobs.items || [] };
}

export default async function OpsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = getMessages(locale);

  const { metrics, jobs } = await fetchOps();
  const endpoints = metrics.endpoints as Array<{
    count: number;
    success: number;
    error: number;
    avgMs: number;
    successRate: number;
  }>;
  const totals = endpoints.reduce(
    (acc, e) => {
      acc.count += e.count;
      acc.success += e.success;
      acc.error += e.error;
      acc.weightedMs += e.avgMs * e.count;
      return acc;
    },
    { count: 0, success: 0, error: 0, weightedMs: 0 },
  );
  const avgMs =
    totals.count > 0 ? Math.round(totals.weightedMs / totals.count) : 0;
  const successRate =
    totals.count > 0
      ? Number(((totals.success / totals.count) * 100).toFixed(2))
      : 0;
  const outbox = metrics.outbox as {
    total: number;
    byStatus: Record<string, number>;
  };
  const recentAudit = metrics.recentAudit as Array<{
    seq: number;
    timestampMs: number;
    action: string;
    targetType: string;
    targetId: string;
    result: string;
  }>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-5 text-lg font-medium text-foreground">
        {messages.ops.title}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">
            {messages.ops.successRate}
          </div>
          <div className="mt-1 text-2xl font-semibold">{successRate}%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">
            {messages.ops.avgLatency}
          </div>
          <div className="mt-1 text-2xl font-semibold">{avgMs} ms</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">
            {messages.ops.errors}
          </div>
          <div className="mt-1 text-2xl font-semibold">{totals.error}</div>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-foreground">
            {messages.ops.outboxStatus}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded border border-border p-3">
              <div className="text-xs text-muted-foreground">
                {messages.ops.total}
              </div>
              <div className="text-lg font-semibold">{outbox.total}</div>
            </div>
            {Object.entries(outbox.byStatus || {}).map(([k, v]) => (
              <div key={k} className="rounded border border-border p-3">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-lg font-semibold">{v as number}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 text-sm font-medium text-foreground">
            {messages.ops.recentAudit}
          </div>
          <div className="space-y-2">
            {recentAudit.length === 0 && (
              <div className="text-xs text-muted-foreground">
                {messages.ops.noEvents}
              </div>
            )}
            {recentAudit.map((e) => (
              <div
                key={e.seq}
                className="flex items-center justify-between rounded border border-border p-2 text-sm"
              >
                <div className="font-mono text-xs">{e.seq}</div>
                <div className="text-xs">{e.action}</div>
                <div className="text-xs">{e.targetType}</div>
                <div className="font-mono text-xs">{e.targetId}</div>
                <div className="text-xs">{e.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <JobsTable initial={jobs} />
    </div>
  );
}
