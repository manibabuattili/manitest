"use client";

import { Eye } from "lucide-react";
import type { TestScenario } from "@/lib/types";

export function ScenarioList({
  scenarios,
  selectedIds,
  previewId,
  onToggle,
  onSelectAll,
  onPreview,
}: {
  scenarios: TestScenario[];
  selectedIds: Set<string>;
  previewId: string | null;
  onToggle: (id: string) => void;
  onSelectAll: (on: boolean) => void;
  onPreview: (id: string) => void;
}) {
  const allOn = scenarios.length > 0 && scenarios.every((s) => selectedIds.has(s.id));

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-ink-850 shadow-panel">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Scenarios
        </h2>
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          <input
            type="checkbox"
            checked={allOn}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="accent-teal-400"
          />
          Select all
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-ink-850 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium"></th>
              <th className="px-2 py-2 font-medium">ID</th>
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Steps</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => {
              const selected = selectedIds.has(scenario.id);
              const active = previewId === scenario.id;
              return (
                <tr
                  key={scenario.id}
                  className={`border-t border-white/5 ${active ? "bg-accent/10" : "hover:bg-white/[0.03]"}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggle(scenario.id)}
                      className="accent-teal-400"
                    />
                  </td>
                  <td className="px-2 py-2 font-mono text-accent">{scenario.id}</td>
                  <td className="px-2 py-2 text-slate-200">{scenario.name}</td>
                  <td className="px-2 py-2 font-mono text-slate-400">{scenario.steps.length}</td>
                  <td className="px-2 py-2">
                    <span className="status-pill bg-slate-700/70 text-slate-300">Ready</span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onPreview(scenario.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      <Eye size={12} />
                      Preview
                    </button>
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
