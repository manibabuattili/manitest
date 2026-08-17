"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { loadSampleSuite } from "@/lib/excel/sampleData";
import { parseTestSuiteFile } from "@/lib/excel/parseTestSuite";
import { runBatch, type EngineSnapshot } from "@/lib/execution/ExecutionQueue";
import { MockExecutor } from "@/lib/execution/MockExecutor";
import { buildBatchReport } from "@/lib/reporting/stats";
import type {
  BatchProgress,
  BatchReport,
  ScenarioExecution,
  TestScenario,
  TestSuite,
  WorkerSlot,
} from "@/lib/types";

export type SimulatorPhase = "idle" | "running" | "complete";

const emptyProgress: BatchProgress = {
  total: 0,
  queued: 0,
  running: 0,
  passed: 0,
  failed: 0,
  cancelled: 0,
  completed: 0,
  percentComplete: 0,
};

export function useTestSimulator() {
  const [suite, setSuite] = useState<TestSuite>(() => loadSampleSuite());
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(loadSampleSuite().scenarios.map((s) => s.id)),
  );
  const [runsPerScenario, setRunsPerScenario] = useState(3);
  const [concurrency, setConcurrency] = useState(3);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SimulatorPhase>("idle");
  const [executions, setExecutions] = useState<ScenarioExecution[]>([]);
  const [workers, setWorkers] = useState<WorkerSlot[]>([]);
  const [progress, setProgress] = useState<BatchProgress>(emptyProgress);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedScenarios = useMemo(
    () => suite.scenarios.filter((s) => selectedIds.has(s.id)),
    [suite.scenarios, selectedIds],
  );

  const totalExecutions = selectedScenarios.length * Math.max(1, runsPerScenario);
  const errorCount = suite.issues.filter((i) => i.level === "error").length;
  const warningCount = suite.issues.filter((i) => i.level === "warning").length;
  const totalSteps = suite.scenarios.reduce((sum, s) => sum + s.steps.length, 0);
  const canRun = selectedScenarios.length > 0 && errorCount === 0 && phase !== "running";

  const previewScenario: TestScenario | null =
    suite.scenarios.find((s) => s.id === previewId) ?? null;

  const selectedExecution =
    executions.find((e) => e.executionId === selectedExecutionId) ?? null;

  const report: BatchReport | null = useMemo(() => {
    if (phase !== "complete") return null;
    return buildBatchReport(executions);
  }, [phase, executions]);

  const applySuite = useCallback((next: TestSuite) => {
    setSuite(next);
    setParseError(null);
    setSelectedIds(new Set(next.scenarios.map((s) => s.id)));
    setPreviewId(next.scenarios[0]?.id ?? null);
    setExecutions([]);
    setWorkers([]);
    setProgress(emptyProgress);
    setPhase("idle");
    setSelectedExecutionId(null);
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

  const toggleScenario = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (on: boolean) => {
      setSelectedIds(on ? new Set(suite.scenarios.map((s) => s.id)) : new Set());
    },
    [suite.scenarios],
  );

  const start = useCallback(async () => {
    if (!canRun) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("running");
    setSelectedExecutionId(null);

    const onUpdate = (snapshot: EngineSnapshot) => {
      setExecutions(snapshot.executions);
      setWorkers(snapshot.workers);
      setProgress(snapshot.progress);
      if (snapshot.done) setPhase("complete");
    };

    try {
      await runBatch({
        scenarios: selectedScenarios,
        runsPerScenario: Math.max(1, Math.min(50, runsPerScenario)),
        concurrency,
        executor: new MockExecutor(),
        onUpdate,
        signal: controller.signal,
      });
    } catch {
      setPhase("complete");
    }
  }, [canRun, selectedScenarios, runsPerScenario, concurrency]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetRun = useCallback(() => {
    abortRef.current?.abort();
    setExecutions([]);
    setWorkers([]);
    setProgress(emptyProgress);
    setPhase("idle");
    setSelectedExecutionId(null);
  }, []);

  return {
    suite,
    parseError,
    selectedIds,
    runsPerScenario,
    setRunsPerScenario,
    concurrency,
    setConcurrency,
    previewId,
    setPreviewId,
    previewScenario,
    phase,
    executions,
    workers,
    progress,
    selectedExecutionId,
    setSelectedExecutionId,
    selectedExecution,
    selectedScenarios,
    totalExecutions,
    errorCount,
    warningCount,
    totalSteps,
    canRun,
    report,
    loadSample,
    uploadFile,
    toggleScenario,
    selectAll,
    start,
    stop,
    resetRun,
  };
}
