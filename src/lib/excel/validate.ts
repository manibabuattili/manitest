import type { ValidationIssue } from "@/lib/types";
import { HEADER_ALIASES, REQUIRED_COLUMNS, headerKey, type ExcelColumn } from "./columns";

export function mapHeaders(rawHeaders: unknown[]): {
  index: Partial<Record<ExcelColumn, number>>;
  issues: ValidationIssue[];
} {
  const index: Partial<Record<ExcelColumn, number>> = {};
  const issues: ValidationIssue[] = [];

  rawHeaders.forEach((header, i) => {
    const alias = HEADER_ALIASES[headerKey(header)];
    if (alias) index[alias] = i;
  });

  for (const col of REQUIRED_COLUMNS) {
    if (index[col] === undefined) {
      issues.push({
        level: "error",
        message: `Missing required column: ${col}`,
      });
    }
  }

  return { index, issues };
}

export function cell(row: unknown[], idx: number | undefined): string {
  if (idx === undefined) return "";
  const value = row[idx];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function parseStepNo(raw: string, rowNumber: number): { value: number; issue?: ValidationIssue } {
  if (!raw) {
    return {
      value: Number.NaN,
      issue: { level: "error", row: rowNumber, message: "Step_No is required." },
    };
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return {
      value: Number.NaN,
      issue: { level: "error", row: rowNumber, message: `Step_No "${raw}" is not a number.` },
    };
  }
  return { value };
}
