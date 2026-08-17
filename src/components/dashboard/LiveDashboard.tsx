"use client";

import type { BatchProgress } from "@/lib/types";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-xl font-semibold ${tone ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export function LiveDashboard({ progress }: { progress: BatchProgress }) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Live execution
        </h2>
        <div className="font-mono text-sm text-white">{progress.percentComplete}% complete</div>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        <Metric label="Total" value={progress.total} />
        <Metric label="Queued" value={progress.queued} tone="text-slate-300" />
        <Metric label="Running" value={progress.running} tone="text-sky-300" />
        <Metric label="Passed" value={progress.passed} tone="text-emerald-300" />
        <Metric label="Failed" value={progress.failed} tone="text-rose-400" />
        <Metric label="Done" value={progress.completed} tone="text-accent" />
      </div>
    </section>
  );
}
