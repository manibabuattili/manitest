"use client";

import { Cpu } from "lucide-react";
import type { WorkerSlot } from "@/lib/types";

export function WorkerStrip({ workers }: { workers: WorkerSlot[] }) {
  if (!workers.length) {
    return (
      <section className="rounded-xl border border-white/10 bg-ink-850 p-4 text-xs text-slate-500 shadow-panel">
        Workers appear here once a batch starts.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Active workers
      </h2>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {workers.map((worker) => {
          const busy = Boolean(worker.executionId);
          return (
            <div
              key={worker.slot}
              className={`rounded-lg border px-3 py-2 ${
                busy ? "border-accent/30 bg-accent/5" : "border-white/10 bg-ink-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Cpu size={12} className={busy ? "text-accent" : "text-slate-600"} />
                  Worker {worker.slot}
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${busy ? "animate-pulse bg-accent" : "bg-slate-600"}`}
                />
              </div>
              {busy ? (
                <div className="mt-1">
                  <div className="truncate font-mono text-[11px] text-accent">
                    {worker.executionId}
                  </div>
                  <div className="truncate text-xs text-slate-200">
                    {worker.scenarioId} · step {worker.stepNo} · {worker.actor}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-500">Idle</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
