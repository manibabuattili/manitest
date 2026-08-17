"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { loadSampleSuite } from "@/lib/excel/sampleData";
import { parseTestSuiteFile } from "@/lib/excel/parseTestSuite";
import { runBatch } from "@/lib/execution/ExecutionQueue";
import { MockExecutor } from "@/lib/execution/MockExecutor";
import type { ScenarioExecution, TestSuite } from "@/lib/types";

export type SimulatorPhase = "idle" | "running" | "complete";

const emptySuite: TestSuite = {
  scenarios: [],
  issues: [],
  sourceName: "",
  rawRowCount: 0,
};

export function useTestSimulator() {
  const [suite, setSuite] = useState<TestSuite>(emptySuite);
  const [parseError, setParseError] = useState<string | null>(null);
  const [iterations, setIterations] = useState("");
  const [phase, setPhase] = useState<SimulatorPhase>("idle");
  const [executions, setExecutions] = useState<ScenarioExecution[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const errorCount = suite.issues.filter((i) => i.level === "error").length;
  const runs = Number(iterations);
  const hasIterations = Number.isFinite(runs) && runs >= 1;
  const canRun =
    suite.scenarios.length > 0 && errorCount === 0 && hasIterations && phase !== "running";

  const applySuite = useCallback((next: TestSuite) => {
    abortRef.current?.abort();
    setSuite(next);
    setParseError(null);
    setExecutions([]);
    setPhase("idle");
  }, []);

  const loadSample = useCallback(() => {
    applySuite(loadSampleSuite());
  }, [applySuite]);

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        const parsed = await parseTestSuiteFile(file);
        applySuite(parsed);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : "Failed to parse Excel file.");
      }
    },
    [applySuite],
  );

  const start = useCallback(async () => {
    if (!canRun) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("running");
    setExecutions([]);

    try {
      await runBatch({
        scenarios: suite.scenarios,
        runsPerScenario: Math.min(50, Math.floor(runs)),
        concurrency: 2,
        executor: new MockExecutor(),
        onUpdate: (snapshot) => {
          setExecutions(snapshot.executions);
          if (snapshot.done) setPhase("complete");
        },
        signal: controller.signal,
      });
    } catch {
      setPhase("complete");
    }
  }, [canRun, suite.scenarios, runs]);

  const overall = useMemo(() => {
    const done = executions.filter((e) => e.status === "passed" || e.status === "failed");
    const passed = executions.filter((e) => e.status === "passed").length;
    const failed = executions.filter((e) => e.status === "failed").length;
    const stepPassed = executions.flatMap((e) => e.steps).filter((s) => s.status === "passed").length;
    const stepFailed = executions.flatMap((e) => e.steps).filter((s) => s.status === "failed").length;
    return { done: done.length, total: executions.length, passed, failed, stepPassed, stepFailed };
  }, [executions]);

  return {
    suite,
    parseError,
    iterations,
    setIterations,
    phase,
    executions,
    errorCount,
    canRun,
    overall,
    loadSample,
    uploadFile,
    start,
  };
}
