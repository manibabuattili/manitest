import type {
  BatchProgress,
  ScenarioExecution,
  StepExecutionResult,
  TestScenario,
  WorkerSlot,
} from "@/lib/types";
import type { AgentExecutor } from "./AgentExecutor";
import { createExecutionId, createSessionId } from "./ids";

export interface EngineSnapshot {
  executions: ScenarioExecution[];
  workers: WorkerSlot[];
  progress: BatchProgress;
  done: boolean;
}

export interface RunBatchOptions {
  scenarios: TestScenario[];
  runsPerScenario: number;
  concurrency: number;
  executor: AgentExecutor;
  onUpdate: (snapshot: EngineSnapshot) => void;
  signal?: AbortSignal;
}

export function computeProgress(executions: ScenarioExecution[]): BatchProgress {
  const total = executions.length;
  const queued = executions.filter((e) => e.status === "queued").length;
  const running = executions.filter((e) => e.status === "running").length;
  const passed = executions.filter((e) => e.status === "passed").length;
  const failed = executions.filter((e) => e.status === "failed").length;
  const cancelled = executions.filter((e) => e.status === "cancelled").length;
  const completed = passed + failed + cancelled;
  return {
    total,
    queued,
    running,
    passed,
    failed,
    cancelled,
    completed,
    percentComplete: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

function cloneExec(execution: ScenarioExecution): ScenarioExecution {
  return {
    ...execution,
    steps: execution.steps.map((s) => ({ ...s })),
  };
}

export async function runBatch(options: RunBatchOptions): Promise<EngineSnapshot> {
  const { scenarios, runsPerScenario, executor, onUpdate, signal } = options;
  const concurrency = Math.max(1, Math.min(12, Math.floor(options.concurrency)));

  const executions: ScenarioExecution[] = [];
  for (const scenario of scenarios) {
    for (let run = 1; run <= runsPerScenario; run++) {
      executions.push({
        executionId: createExecutionId(),
        sessionId: createSessionId(),
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        runIndex: run,
        totalRuns: runsPerScenario,
        status: "queued",
        durationMs: 0,
        steps: scenario.steps.map((step) => ({
          stepNo: step.stepNo,
          actor: step.actor,
          inputType: step.inputType,
          message: step.message,
          expectedResponse: step.expectedResponse,
          actualResponse: "",
          status: "pending",
          durationMs: 0,
        })),
      });
    }
  }

  const workers: WorkerSlot[] = Array.from({ length: concurrency }, (_, slot) => ({
    slot: slot + 1,
    executionId: null,
    scenarioId: null,
    scenarioName: null,
    stepNo: null,
    actor: null,
  }));

  const scenarioById = new Map(scenarios.map((s) => [s.id, s]));
  let cursor = 0;

  const emit = (done = false) => {
    onUpdate({
      executions: executions.map(cloneExec),
      workers: workers.map((w) => ({ ...w })),
      progress: computeProgress(executions),
      done,
    });
  };

  emit(false);

  const takeNext = (): ScenarioExecution | undefined => {
    while (cursor < executions.length) {
      const next = executions[cursor++];
      if (next.status === "queued") return next;
    }
    return undefined;
  };

  const runJob = async (slotIndex: number) => {
    while (!signal?.aborted) {
      const job = takeNext();
      if (!job) return;

      const scenario = scenarioById.get(job.scenarioId);
      if (!scenario) {
        job.status = "failed";
        continue;
      }

      workers[slotIndex] = {
        slot: slotIndex + 1,
        executionId: job.executionId,
        scenarioId: job.scenarioId,
        scenarioName: job.scenarioName,
        stepNo: scenario.steps[0]?.stepNo ?? null,
        actor: scenario.steps[0]?.actor ?? null,
      };

      job.status = "running";
      job.workerSlot = slotIndex + 1;
      job.startedAt = Date.now();
      job.currentStepNo = scenario.steps[0]?.stepNo;
      emit();

      try {
        await executor.beginSession(job.sessionId, job.executionId);
        const completedSteps: StepExecutionResult[] = [];

        for (const step of scenario.steps) {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

          const result = job.steps.find((s) => s.stepNo === step.stepNo);
          if (!result) continue;

          result.status = "running";
          result.startedAt = Date.now();
          job.currentStepNo = step.stepNo;
          workers[slotIndex] = {
            ...workers[slotIndex],
            stepNo: step.stepNo,
            actor: step.actor,
          };
          emit();

          const response = await executor.executeStep({
            context: {
              executionId: job.executionId,
              sessionId: job.sessionId,
              scenario,
              runIndex: job.runIndex,
            },
            step,
            priorSteps: completedSteps,
          });

          result.finishedAt = Date.now();
          result.durationMs = (result.finishedAt ?? 0) - (result.startedAt ?? result.finishedAt);
          result.actualResponse = response.actualResponse;
          result.status = response.passed ? "passed" : "failed";
          result.failureReason = response.failureReason;
          completedSteps.push({ ...result });
          emit();

          if (!response.passed) {
            for (const remaining of job.steps) {
              if (remaining.status === "pending") remaining.status = "skipped";
            }
            job.status = "failed";
            break;
          }
        }

        if (job.status === "running") job.status = "passed";
      } catch (error) {
        if ((error as DOMException).name === "AbortError") {
          job.status = "cancelled";
          for (const step of job.steps) {
            if (step.status === "pending" || step.status === "running") {
              step.status = "skipped";
            }
          }
        } else {
          job.status = "failed";
          const running = job.steps.find((s) => s.status === "running");
          if (running) {
            running.status = "failed";
            running.failureReason = error instanceof Error ? error.message : "Executor error";
            running.finishedAt = Date.now();
            running.durationMs =
              (running.finishedAt ?? 0) - (running.startedAt ?? running.finishedAt);
          }
        }
      } finally {
        job.finishedAt = Date.now();
        job.durationMs = (job.finishedAt ?? 0) - (job.startedAt ?? job.finishedAt);
        job.workerSlot = undefined;
        job.currentStepNo = undefined;
        try {
          await executor.endSession(job.sessionId);
        } catch {
          /* session cleanup is best-effort */
        }
        workers[slotIndex] = {
          slot: slotIndex + 1,
          executionId: null,
          scenarioId: null,
          scenarioName: null,
          stepNo: null,
          actor: null,
        };
        emit();
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, (_, i) => runJob(i)));

  if (signal?.aborted) {
    for (const job of executions) {
      if (job.status === "queued") job.status = "cancelled";
    }
  }

  const finalSnapshot: EngineSnapshot = {
    executions: executions.map(cloneExec),
    workers: workers.map((w) => ({ ...w })),
    progress: computeProgress(executions),
    done: true,
  };
  onUpdate(finalSnapshot);
  return finalSnapshot;
}
