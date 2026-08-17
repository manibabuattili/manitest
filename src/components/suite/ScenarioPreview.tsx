"use client";

import type { TestScenario } from "@/lib/types";

const ACTOR_TONE: Record<string, string> = {
  USER: "bg-sky-500/15 text-sky-300",
  SYSTEM: "bg-violet-500/15 text-violet-300",
  MANAGER: "bg-amber-500/15 text-amber-300",
};

export function ScenarioPreview({ scenario }: { scenario: TestScenario | null }) {
  if (!scenario) {
    return (
      <section className="rounded-xl border border-white/10 bg-ink-850 p-4 text-xs text-slate-500 shadow-panel">
        Select a scenario to preview its workflow steps.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-ink-850 p-4 shadow-panel">
      <div className="mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Step preview
        </h2>
        <div className="mt-1 font-mono text-xs text-accent">{scenario.id}</div>
        <div className="text-sm text-white">{scenario.name}</div>
      </div>
      <ol className="max-h-56 space-y-2 overflow-auto">
        {scenario.steps.map((step) => (
          <li
            key={`${scenario.id}-${step.stepNo}`}
            className="rounded-lg border border-white/5 bg-ink-900/60 p-2.5"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-500">#{step.stepNo}</span>
              <span
                className={`status-pill ${ACTOR_TONE[step.actor] ?? "bg-slate-700 text-slate-300"}`}
              >
                {step.actor}
              </span>
            </div>
            <div className="text-xs text-slate-200">{step.message}</div>
            <div className="mt-1 font-mono text-[10px] text-slate-500">
              {step.inputType}
              {step.endOfScenario ? " · END" : ""}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
