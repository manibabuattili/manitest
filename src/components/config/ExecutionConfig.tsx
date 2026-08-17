"use client";

import { Play, Square } from "lucide-react";

export function ExecutionConfig({
  selectedCount,
  runsPerScenario,
  concurrency,
  totalExecutions,
  canRun,
  phase,
  errorCount,
  onRunsChange,
  onConcurrencyChange,
  onStart,
  onStop,
  onReset,
}: {
  selectedCount: number;
  runsPerScenario: number;
  concurrency: number;
  totalExecutions: number;
  canRun: boolean;
  phase: "idle" | "running" | "complete";
  errorCount: number;
  onRunsChange: (n: number) => void;
  onConcurrencyChange: (n: number) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Execution configuration
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[11px] text-slate-400">
          Runs per scenario
          <input
            type="number"
            min={1}
            max={50}
            value={runsPerScenario}
            disabled={phase === "running"}
            onChange={(e) => onRunsChange(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-white/10 bg-ink-900 px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-accent/50"
          />
        </label>
        <label className="text-[11px] text-slate-400">
          Parallel workers
          <input
            type="number"
            min={1}
            max={12}
            value={concurrency}
            disabled={phase === "running"}
            onChange={(e) => onConcurrencyChange(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-white/10 bg-ink-900 px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-accent/50"
          />
        </label>
      </div>
      <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Total executions</div>
        <div className="font-mono text-xl font-semibold text-accent">{totalExecutions}</div>
        <div className="text-[11px] text-slate-400">
          {selectedCount} selected × {Math.max(1, runsPerScenario)} runs · concurrency {concurrency}
        </div>
      </div>
      {errorCount > 0 ? (
        <p className="mt-2 text-[11px] text-rose-400">Fix validation errors before running.</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {phase === "running" ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500/90 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-400"
          >
            <Square size={14} />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={!canRun}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={14} />
            Start execution
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          disabled={phase === "running"}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
