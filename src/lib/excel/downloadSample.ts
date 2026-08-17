import * as XLSX from "xlsx";
import { loadSampleSuite } from "./sampleData";
import { REQUIRED_COLUMNS } from "./columns";

export function buildSampleWorkbook(): ArrayBuffer {
  const suite = loadSampleSuite();
  const rows: string[][] = [ [...REQUIRED_COLUMNS] ];

  for (const scenario of suite.scenarios) {
    scenario.steps.forEach((step, index) => {
      rows.push([
        scenario.id,
        scenario.name,
        String(step.stepNo),
        step.actor,
        step.inputType,
        step.message,
        step.expectedResponse,
        step.testData,
        index === scenario.steps.length - 1 ? "YES" : "",
      ]);
    });
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "TestSuite");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function downloadSampleExcel() {
  const buffer = buildSampleWorkbook();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-expense-agent-suite.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
