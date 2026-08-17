import * as XLSX from "xlsx";
import type { TestSuite } from "@/lib/types";
import { groupRowsIntoScenarios } from "./groupScenarios";
import { cell, mapHeaders, parseStepNo } from "./validate";

export async function parseTestSuiteFile(file: File): Promise<TestSuite> {
  const buffer = await file.arrayBuffer();
  return parseWorkbook(buffer, file.name);
}

export function parseWorkbook(buffer: ArrayBuffer, sourceName: string): TestSuite {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      scenarios: [],
      issues: [{ level: "error", message: "Workbook has no sheets." }],
      sourceName,
      rawRowCount: 0,
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length < 2) {
    return {
      scenarios: [],
      issues: [{ level: "error", message: "Excel file must include a header row and at least one data row." }],
      sourceName,
      rawRowCount: 0,
    };
  }

  const { index, issues: headerIssues } = mapHeaders(matrix[0] ?? []);
  if (headerIssues.some((i) => i.level === "error")) {
    return {
      scenarios: [],
      issues: headerIssues,
      sourceName,
      rawRowCount: Math.max(0, matrix.length - 1),
    };
  }

  const dataRows = matrix.slice(1).filter((row) =>
    (row ?? []).some((cellValue) => String(cellValue ?? "").trim() !== ""),
  );

  const parsedRows = [];
  const rowIssues = [...headerIssues];

  for (let i = 0; i < dataRows.length; i++) {
    const excelRow = i + 2;
    const row = dataRows[i] ?? [];
    const stepParsed = parseStepNo(cell(row, index.Step_No), excelRow);
    if (stepParsed.issue) rowIssues.push(stepParsed.issue);

    parsedRows.push({
      scenarioId: cell(row, index.Scenario_ID),
      scenarioName: cell(row, index.Scenario_Name),
      stepNo: stepParsed.value,
      actor: cell(row, index.Actor).toUpperCase(),
      inputType: cell(row, index.Input_Type).toLowerCase() || "text",
      message: cell(row, index.Message),
      expectedResponse: cell(row, index.Expected_Response),
      testData: cell(row, index.Test_Data),
      endOfScenarioRaw: cell(row, index.End_of_Scenario),
      rowNumber: excelRow,
    });
  }

  const grouped = groupRowsIntoScenarios(parsedRows);
  return {
    scenarios: grouped.scenarios,
    issues: [...rowIssues, ...grouped.issues],
    sourceName,
    rawRowCount: dataRows.length,
  };
}
