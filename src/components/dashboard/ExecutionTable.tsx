"use client";

import type { ScenarioExecution } from "@/lib/types";
import { formatDuration } from "@/lib/reporting/stats";

const STATUS: Record<string, string> = {
  queued: "bg-slate-700/80 text-slate-300",
  running: "bg-sky-500/15 text-sky-300",
  passed: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-rose-500/15 text-rose-300",
  cancelled: "bg-amber-500/15 text-amber-300",
};

export function ExecutionTable({
  executions,
  selectedId,
  onSelect,
}: {
  executions: ScenarioExecution[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!executions.length) {
    return (
      <section className="rounded-xl border border-white/10 bg-ink-850 p-8 text-center text-sm text-slate-500 shadow-panel">
        No executions yet. Configure a run and start the mock engine.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-ink-850 shadow-panel">
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-ink-800 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Execution</th>
              <th className="px-3 py-2 font-medium">Session</th>
              <th className="px-3 py-2 font-medium">Scenario</th>
              <th className="px-3 py-2 font-medium">Run</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => {
              const doneSteps = execution.steps.filter(
                (s) => s.status === "passed" || s.status === "failed",
              ).length;
              const active = selectedId === execution.executionId;
              return (
                <tr
                  key={execution.executionId}
                  onClick={() => onSelect(execution.executionId)}
                  className={`cursor-pointer border-t border-white/5 ${
                    active ? "bg-accent/10" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-accent">{execution.executionId}</td>
                  <td className="px-3 py-2 font-mono text-slate-500">{execution.sessionId}</td>
                  <td className="px-3 py-2">
                    <div className="text-slate-200">{execution.scenarioId}</div>
                    <div className="max-w-[220px] truncate text-[11px] text-slate-500">
                      {execution.scenarioName}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {execution.runIndex}/{execution.totalRuns}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`status-pill ${STATUS[execution.status]}`}>
                      {execution.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {doneSteps}/{execution.steps.length}
                    {execution.currentStepNo ? ` · step ${execution.currentStepNo}` : ""}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-300">
                    {formatDuration(execution.durationMs)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
