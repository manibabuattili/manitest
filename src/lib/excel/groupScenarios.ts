import type { TestScenario, ValidationIssue, WorkflowStep } from "@/lib/types";

function isTruthyEndFlag(value: string): boolean {
  const v = value.trim().toLowerCase();
  return ["y", "yes", "true", "1", "end", "x"].includes(v);
}

export function groupRowsIntoScenarios(
  rows: Array<Omit<WorkflowStep, "endOfScenario"> & { endOfScenarioRaw: string; scenarioId: string; scenarioName: string }>,
): { scenarios: TestScenario[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const byId = new Map<
    string,
    { name: string; steps: WorkflowStep[]; names: Set<string> }
  >();

  for (const row of rows) {
    const id = row.scenarioId.trim();
    if (!id) {
      issues.push({
        level: "error",
        row: row.rowNumber,
        message: "Scenario_ID is required.",
      });
      continue;
    }

    const existing = byId.get(id) ?? {
      name: row.scenarioName.trim() || id,
      steps: [],
      names: new Set<string>(),
    };
    if (row.scenarioName.trim()) existing.names.add(row.scenarioName.trim());
    existing.steps.push({
      stepNo: row.stepNo,
      actor: row.actor,
      inputType: row.inputType,
      message: row.message,
      expectedResponse: row.expectedResponse,
      testData: row.testData,
      endOfScenario: isTruthyEndFlag(row.endOfScenarioRaw),
      rowNumber: row.rowNumber,
    });
    byId.set(id, existing);
  }

  const scenarios: TestScenario[] = [];

  for (const [id, group] of byId) {
    if (group.names.size > 1) {
      issues.push({
        level: "warning",
        scenarioId: id,
        message: `Scenario ${id} has multiple names: ${[...group.names].join(", ")}. Using "${group.name}".`,
      });
    }

    const sorted = [...group.steps].sort((a, b) => a.stepNo - b.stepNo || a.rowNumber - b.rowNumber);
    const seen = new Set<number>();
    for (const step of sorted) {
      if (seen.has(step.stepNo)) {
        issues.push({
          level: "error",
          scenarioId: id,
          row: step.rowNumber,
          message: `Duplicate Step_No ${step.stepNo} in scenario ${id}.`,
        });
      }
      seen.add(step.stepNo);
      if (!step.actor) {
        issues.push({
          level: "error",
          scenarioId: id,
          row: step.rowNumber,
          message: `Actor is required on step ${step.stepNo} of ${id}.`,
        });
      }
      if (!Number.isFinite(step.stepNo) || step.stepNo < 1) {
        issues.push({
          level: "error",
          scenarioId: id,
          row: step.rowNumber,
          message: `Step_No must be a positive integer in scenario ${id}.`,
        });
      }
    }

    const expectedSeq = sorted.map((_, i) => i + 1);
    const actualSeq = sorted.map((s) => s.stepNo);
    if (expectedSeq.some((n, i) => actualSeq[i] !== n)) {
      issues.push({
        level: "warning",
        scenarioId: id,
        message: `Scenario ${id} step numbers are not a contiguous sequence starting at 1 (${actualSeq.join(", ")}).`,
      });
    }

    const endFlags = sorted.map((s) => s.endOfScenario);
    const lastEnd = endFlags[endFlags.length - 1];
    const earlierEnds = endFlags.slice(0, -1).some(Boolean);
    if (!lastEnd) {
      issues.push({
        level: "warning",
        scenarioId: id,
        message: `Scenario ${id} does not mark End_of_Scenario on the last step.`,
      });
    }
    if (earlierEnds) {
      issues.push({
        level: "warning",
        scenarioId: id,
        message: `Scenario ${id} has End_of_Scenario flagged before the last step.`,
      });
    }

    scenarios.push({
      id,
      name: group.name,
      steps: sorted.map((step, index) => ({
        ...step,
        endOfScenario: index === sorted.length - 1 ? true : step.endOfScenario,
      })),
    });
  }

  scenarios.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return { scenarios, issues };
}
