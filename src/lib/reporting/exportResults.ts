import * as XLSX from "xlsx";
import type { BatchReport, ScenarioExecution } from "@/lib/types";

function flatten(executions: ScenarioExecution[]) {
  return executions.flatMap((execution) =>
    execution.steps.map((step) => ({
      execution_id: execution.executionId,
      session_id: execution.sessionId,
      scenario_id: execution.scenarioId,
      scenario_name: execution.scenarioName,
      run_index: execution.runIndex,
      execution_status: execution.status,
      execution_duration_ms: execution.durationMs,
      step_no: step.stepNo,
      actor: step.actor,
      input_type: step.inputType,
      message: step.message,
      expected_response: step.expectedResponse,
      actual_response: step.actualResponse,
      step_status: step.status,
      step_duration_ms: step.durationMs,
      failure_reason: step.failureReason ?? "",
    })),
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResultsJson(
  executions: ScenarioExecution[],
  report: BatchReport | null,
) {
  const payload = {
    generatedAt: new Date().toISOString(),
    report,
    executions,
  };
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    "test-simulator-results.json",
  );
}

export function exportResultsCsv(executions: ScenarioExecution[]) {
  const rows = flatten(executions);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "test-simulator-results.csv");
}

export function exportResultsExcel(
  executions: ScenarioExecution[],
  report: BatchReport | null,
) {
  const workbook = XLSX.utils.book_new();
  const steps = flatten(executions);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(steps), "Steps");

  const summaryRows = executions.map((e) => ({
    execution_id: e.executionId,
    session_id: e.sessionId,
    scenario_id: e.scenarioId,
    scenario_name: e.scenarioName,
    run_index: e.runIndex,
    status: e.status,
    duration_ms: e.durationMs,
    failed_step: e.steps.find((s) => s.status === "failed")?.stepNo ?? "",
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "Executions");

  if (report) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          pass_rate: report.passRate,
          avg_duration_ms: report.avgDurationMs,
          p50_duration_ms: report.p50DurationMs,
          p95_duration_ms: report.p95DurationMs,
          most_common_failure_scenario: report.mostCommonFailureScenario?.label ?? "",
          most_common_failure_step: report.mostCommonFailureStep?.label ?? "",
        },
      ]),
      "Report",
    );
  }

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "test-simulator-results.xlsx",
  );
}
