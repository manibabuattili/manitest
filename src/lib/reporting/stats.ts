import type { BatchReport, ScenarioExecution } from "@/lib/types";

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function buildBatchReport(executions: ScenarioExecution[]): BatchReport {
  const finished = executions.filter((e) => e.status === "passed" || e.status === "failed");
  const durations = finished
    .map((e) => e.durationMs)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const passed = executions.filter((e) => e.status === "passed").length;
  const considered = finished.length;

  const scenarioFails = new Map<string, { label: string; count: number }>();
  const stepFails = new Map<string, { label: string; count: number }>();

  for (const execution of executions) {
    if (execution.status !== "failed") continue;
    const sKey = execution.scenarioId;
    const prevS = scenarioFails.get(sKey) ?? {
      label: `${execution.scenarioId} · ${execution.scenarioName}`,
      count: 0,
    };
    prevS.count += 1;
    scenarioFails.set(sKey, prevS);

    const failedStep = execution.steps.find((s) => s.status === "failed");
    if (failedStep) {
      const key = `${execution.scenarioId}:${failedStep.stepNo}`;
      const prev = stepFails.get(key) ?? {
        label: `${execution.scenarioId} / step ${failedStep.stepNo} · ${failedStep.message}`,
        count: 0,
      };
      prev.count += 1;
      stepFails.set(key, prev);
    }
  }

  const topScenario = [...scenarioFails.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  const topStep = [...stepFails.entries()].sort((a, b) => b[1].count - a[1].count)[0];

  return {
    passRate: considered === 0 ? 0 : passed / considered,
    avgDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
    p50DurationMs: percentile(durations, 50),
    p95DurationMs: percentile(durations, 95),
    mostCommonFailureScenario: topScenario
      ? { key: topScenario[0], label: topScenario[1].label, count: topScenario[1].count }
      : undefined,
    mostCommonFailureStep: topStep
      ? { key: topStep[0], label: topStep[1].label, count: topStep[1].count }
      : undefined,
  };
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;
  const minutes = Math.floor(seconds / 60);
  const rem = (seconds % 60).toFixed(1);
  return `${minutes}m ${rem}s`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}
