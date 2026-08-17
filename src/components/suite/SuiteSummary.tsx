"use client";

import { AlertTriangle, CheckCircle2, Layers, ListChecks } from "lucide-react";
import type { ValidationIssue } from "@/lib/types";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "warn" | "err";
}) {
  const color =
    tone === "err"
      ? "text-rose-400"
      : tone === "warn"
        ? "text-amber-300"
        : tone === "ok"
          ? "text-emerald-300"
          : "text-white";
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

export function SuiteSummary({
  scenarioCount,
  totalSteps,
  errorCount,
  warningCount,
  issues,
}: {
  scenarioCount: number;
  totalSteps: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Suite summary
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Scenarios" value={scenarioCount} />
        <Stat label="Total steps" value={totalSteps} />
        <Stat label="Errors" value={errorCount} tone={errorCount ? "err" : "ok"} />
        <Stat label="Warnings" value={warningCount} tone={warningCount ? "warn" : "ok"} />
      </div>
      <div className="mt-3 max-h-28 overflow-auto rounded-lg border border-white/5 bg-ink-900/50 p-2">
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 size={14} />
            Suite validated. Ready to execute.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {issues.map((issue, i) => (
              <li key={`${issue.message}-${i}`} className="flex gap-2 text-[11px] leading-snug">
                {issue.level === "error" ? (
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-rose-400" />
                ) : (
                  <Layers size={12} className="mt-0.5 shrink-0 text-amber-300" />
                )}
                <span className="text-slate-300">
                  {issue.row ? `Row ${issue.row}: ` : ""}
                  {issue.scenarioId ? `${issue.scenarioId} · ` : ""}
                  {issue.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-600">
        <ListChecks size={12} />
        Rows grouped by Scenario_ID into TestScenario objects
      </div>
    </section>
  );
}
