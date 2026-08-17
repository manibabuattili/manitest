"use client";

import { Download } from "lucide-react";
import type { BatchReport, ScenarioExecution } from "@/lib/types";
import {
  exportResultsCsv,
  exportResultsExcel,
  exportResultsJson,
} from "@/lib/reporting/exportResults";
import { formatDuration, formatPercent } from "@/lib/reporting/stats";

export function BatchReportCard({
  report,
  executions,
}: {
  report: BatchReport | null;
  executions: ScenarioExecution[];
}) {
  if (!report) return null;

  return (
    <section className="rounded-xl border border-accent/20 bg-ink-850 p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Batch report
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportResultsExcel(executions, report)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/5"
          >
            <Download size={12} /> Excel
          </button>
          <button
            type="button"
            onClick={() => exportResultsCsv(executions)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/5"
          >
            <Download size={12} /> CSV
          </button>
          <button
            type="button"
            onClick={() => exportResultsJson(executions, report)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/5"
          >
            <Download size={12} /> JSON
          </button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Pass rate</div>
          <div className="font-mono text-lg font-semibold text-emerald-300">
            {formatPercent(report.passRate)}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg time</div>
          <div className="font-mono text-lg font-semibold text-white">
            {formatDuration(report.avgDurationMs)}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">P50</div>
          <div className="font-mono text-lg font-semibold text-white">
            {formatDuration(report.p50DurationMs)}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">P95</div>
          <div className="font-mono text-lg font-semibold text-white">
            {formatDuration(report.p95DurationMs)}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2 sm:col-span-2 lg:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Failures</div>
          <div className="mt-1 text-[11px] leading-snug text-slate-300">
            {report.mostCommonFailureScenario ? (
              <>
                <div>
                  Scenario: {report.mostCommonFailureScenario.label} (
                  {report.mostCommonFailureScenario.count})
                </div>
                <div className="mt-1 text-slate-400">
                  Step: {report.mostCommonFailureStep?.label ?? "—"}
                </div>
              </>
            ) : (
              "No failures in this batch."
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
