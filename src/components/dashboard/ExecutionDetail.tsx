"use client";

import type { ScenarioExecution } from "@/lib/types";
import { formatDuration } from "@/lib/reporting/stats";

const STEP_STATUS: Record<string, string> = {
  pending: "text-slate-500",
  running: "text-sky-300",
  passed: "text-emerald-300",
  failed: "text-rose-400",
  skipped: "text-amber-300",
};

export function ExecutionDetail({ execution }: { execution: ScenarioExecution | null }) {
  if (!execution) {
    return (
      <section className="rounded-xl border border-white/10 bg-ink-850 p-4 text-sm text-slate-500 shadow-panel">
        Click an execution to inspect expected vs actual responses for each step.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Execution inspector
          </h2>
          <div className="mt-1 font-mono text-xs text-accent">{execution.executionId}</div>
          <div className="text-[11px] text-slate-500">
            session {execution.sessionId} · {execution.scenarioId} run {execution.runIndex}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Duration</div>
          <div className="font-mono text-sm text-white">{formatDuration(execution.durationMs)}</div>
        </div>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
        {execution.steps.map((step) => (
          <article
            key={`${execution.executionId}-${step.stepNo}`}
            className="rounded-lg border border-white/10 bg-ink-900/70 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-200">
                <span className="font-mono text-slate-500">#{step.stepNo}</span>{" "}
                <span className="font-medium">{step.actor}</span>
                <span className="text-slate-500"> · {step.inputType}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-medium uppercase ${STEP_STATUS[step.status]}`}>
                  {step.status}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {formatDuration(step.durationMs)}
                </span>
              </div>
            </div>
            <p className="mb-2 text-xs text-slate-300">{step.message}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <pre className="overflow-auto rounded-md bg-black/30 p-2 font-mono text-[10px] text-emerald-200/90">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
                  Expected
                </div>
                {step.expectedResponse || "—"}
              </pre>
              <pre className="overflow-auto rounded-md bg-black/30 p-2 font-mono text-[10px] text-sky-200/90">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
                  Actual
                </div>
                {step.actualResponse || "—"}
              </pre>
            </div>
            {step.failureReason ? (
              <p className="mt-2 text-[11px] text-rose-300">{step.failureReason}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
