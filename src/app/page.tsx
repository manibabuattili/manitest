"use client";

import { useMemo } from "react";
import { CloudUpload, Download, Play, RefreshCw } from "lucide-react";
import { BluconnShell } from "@/components/layout/PortalShell";
import { useTestSimulator } from "@/hooks/useTestSimulator";
import { exportResultsExcel } from "@/lib/reporting/exportResults";
import type { ScenarioExecution, TestScenario } from "@/lib/types";

function statusClass(status: string) {
  if (status === "passed") return "text-brand-dark bg-brand-soft";
  if (status === "failed") return "text-red-700 bg-red-50";
  if (status === "running") return "text-sky-700 bg-sky-50";
  if (status === "skipped") return "text-amber-700 bg-amber-50";
  return "text-slate-600 bg-slate-100";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusClass(status)}`}>
      {status}
    </span>
  );
}

function scenarioRollup(executions: ScenarioExecution[], scenario: TestScenario) {
  const runs = executions.filter((e) => e.scenarioId === scenario.id);
  if (!runs.length) return { status: "pending", passed: 0, failed: 0, total: 0 };
  const passed = runs.filter((e) => e.status === "passed").length;
  const failed = runs.filter((e) => e.status === "failed").length;
  const running = runs.some((e) => e.status === "running" || e.status === "queued");
  const status = running ? "running" : failed ? "failed" : passed === runs.length ? "passed" : "pending";
  return { status, passed, failed, total: runs.length };
}

export default function TestSimulatorPage() {
  const sim = useTestSimulator();

  const fileLabel = sim.suite.sourceName || "No file selected";
  const showResults = sim.executions.length > 0;

  const grouped = useMemo(() => {
    const map = new Map<string, ScenarioExecution[]>();
    for (const execution of sim.executions) {
      const list = map.get(execution.scenarioId) ?? [];
      list.push(execution);
      map.set(execution.scenarioId, list);
    }
    return map;
  }, [sim.executions]);

  return (
    <BluconnShell>
      <div className="px-8 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Test Simulator</h1>
          <div className="flex gap-3">
            <select
              className="h-10 min-w-[160px] rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
              defaultValue="Migration"
            >
              <option>Migration</option>
            </select>
            <select
              className="h-10 min-w-[140px] rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
              defaultValue="Multi Run"
            >
              <option>Multi Run</option>
              <option>Single Run</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <label className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-[#fafafa] px-6 text-center">
            <div className="mb-2 text-sm font-medium text-slate-700">Upload Workflow Excel</div>
            <CloudUpload className="mb-2 text-slate-400" size={28} />
            <div className="text-sm text-slate-500">
              <span className="font-medium text-brand">Click to upload</span> or drag and drop Excel
              workbook (.xlsx)
            </div>
            <div className="mt-2 text-xs text-slate-400">{fileLabel}</div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sim.uploadFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>

          <div className="flex flex-col justify-between rounded-lg">
            <label className="text-sm font-medium text-slate-700">
              Iterations <span className="text-red-500">*</span>
              <div className="relative mt-2">
                <RefreshCw
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  placeholder="Enter number of test runs"
                  value={sim.iterations}
                  onChange={(e) => sim.setIterations(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand"
                />
              </div>
            </label>
            <button
              type="button"
              disabled={!sim.canRun}
              onClick={sim.start}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-300 text-sm font-medium text-white disabled:cursor-not-allowed enabled:bg-brand enabled:hover:bg-brand-dark"
            >
              <Play size={16} fill="currentColor" />
              Execute
            </button>
          </div>
        </div>

        {sim.parseError ? <p className="mt-3 text-sm text-red-600">{sim.parseError}</p> : null}
        {sim.errorCount > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
            {sim.suite.issues
              .filter((i) => i.level === "error")
              .map((issue, i) => (
                <li key={`${issue.message}-${i}`}>{issue.message}</li>
              ))}
          </ul>
        ) : null}

        <p className="mt-3 text-xs text-slate-400">
          Need a file to try this?{" "}
          <button type="button" onClick={sim.loadSample} className="text-brand hover:underline">
            Load sample workbook
          </button>
        </p>

        {sim.suite.scenarios.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Identified scenarios</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Scenario ID</th>
                    <th className="px-4 py-3">Scenario name</th>
                    <th className="px-4 py-3">Total steps</th>
                    <th className="px-4 py-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.suite.scenarios.map((scenario) => {
                    const rollup = scenarioRollup(sim.executions, scenario);
                    return (
                      <tr key={scenario.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-medium text-slate-800">{scenario.id}</td>
                        <td className="px-4 py-3 text-slate-700">{scenario.name}</td>
                        <td className="px-4 py-3 text-slate-700">{scenario.steps.length}</td>
                        <td className="px-4 py-3">
                          {rollup.total === 0 ? (
                            <span className="text-slate-400">Not run</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <StatusBadge status={rollup.status} />
                              <span className="text-xs text-slate-500">
                                {rollup.passed}/{rollup.total} passed
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {sim.suite.scenarios.length} scenarios ·{" "}
              {sim.suite.scenarios.reduce((sum, s) => sum + s.steps.length, 0)} steps in workbook
            </p>
          </section>
        ) : null}

        {showResults ? (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Test results</h2>
              <button
                type="button"
                disabled={sim.phase === "running"}
                onClick={() => exportResultsExcel(sim.executions, null)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download size={16} />
                Download Excel
              </button>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-4">
              <SummaryCard label="Overall runs" value={`${sim.overall.done}/${sim.overall.total}`} />
              <SummaryCard label="Scenarios / runs passed" value={String(sim.overall.passed)} tone="ok" />
              <SummaryCard label="Scenarios / runs failed" value={String(sim.overall.failed)} tone="bad" />
              <SummaryCard
                label="Steps passed / failed"
                value={`${sim.overall.stepPassed} / ${sim.overall.stepFailed}`}
              />
            </div>

            <div className="space-y-3">
              {sim.suite.scenarios.map((scenario) => {
                const runs = grouped.get(scenario.id) ?? [];
                if (!runs.length) return null;
                const rollup = scenarioRollup(sim.executions, scenario);
                return (
                  <div key={scenario.id} className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-800">
                          {scenario.id} · {scenario.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {scenario.steps.length} steps · {rollup.passed}/{rollup.total} runs passed
                        </div>
                      </div>
                      <StatusBadge status={rollup.status} />
                    </div>
                    <div className="space-y-4 border-t border-slate-200 p-4">
                      {runs.map((run) => (
                        <div key={run.executionId}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              Run {run.runIndex}
                              {run.totalRuns > 1 ? ` of ${run.totalRuns}` : ""}
                            </span>
                            <StatusBadge status={run.status} />
                          </div>
                          <table className="w-full text-left text-xs">
                            <thead className="text-slate-500">
                              <tr>
                                <th className="py-1 pr-2">Step</th>
                                <th className="py-1 pr-2">Actor</th>
                                <th className="py-1 pr-2">Message</th>
                                <th className="py-1 pr-2">Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {run.steps.map((step) => (
                                <tr key={step.stepNo} className="border-t border-slate-100 align-top">
                                  <td className="py-2 pr-2 text-slate-500">{step.stepNo}</td>
                                  <td className="py-2 pr-2">{step.actor}</td>
                                  <td className="py-2 pr-2 text-slate-700">
                                    <div>{step.message}</div>
                                    {step.status === "failed" ? (
                                      <div className="mt-1 text-red-600">
                                        Expected: {step.expectedResponse || "—"}
                                        <br />
                                        Actual: {step.actualResponse || "—"}
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="py-2">
                                    <StatusBadge status={step.status} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </BluconnShell>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "bad";
}) {
  const color = tone === "ok" ? "text-brand-dark" : tone === "bad" ? "text-red-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
