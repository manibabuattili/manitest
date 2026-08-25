"use client";

import { useMemo, useState } from "react";
import { Calendar, Pencil, Search, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DEFAULT_ATTENDANCE_DATE, INITIAL_ROWS } from "./data";
import { RegularizeDialog } from "./regularize-dialog";
import { SHIFTS, totalHours } from "./hours";
import type { AttendanceRow, HistoryChange, ShiftId } from "./types";

function TimeCell({
  value,
  regularized,
  onEdit,
}: {
  value: string | null;
  regularized: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums text-sm text-gray-800">{value ?? "—"}</span>
      {value && regularized ? (
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500"
          title="Regularized"
          aria-label="Regularized"
        />
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        aria-label={value ? "Edit attendance" : "Add attendance"}
        title={value ? "Edit" : "Add"}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AttendanceDashboard() {
  const [rows, setRows] = useState<AttendanceRow[]>(INITIAL_ROWS);
  const [view, setView] = useState("daily");
  const [date, setDate] = useState(DEFAULT_ATTENDANCE_DATE);
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<AttendanceRow | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesShift = shiftFilter === "all" || row.shiftId === shiftFilter;
      const matchesQuery =
        !needle ||
        row.name.toLowerCase().includes(needle) ||
        row.employeeId.toLowerCase().includes(needle);
      return matchesShift && matchesQuery;
    });
  }, [rows, query, shiftFilter]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((row) => selected.includes(row.id));

  function openEditor(row: AttendanceRow) {
    setEditing(row);
  }

  function saveEdit(update: {
    clockIn: string | null;
    clockOut: string | null;
    shiftId: ShiftId | null;
    history: HistoryChange;
  }) {
    if (!editing) return;
    setRows((current) =>
      current.map((row) => {
        if (row.id !== editing.id) return row;
        return {
          ...row,
          clockIn: update.clockIn,
          clockOut: update.clockOut,
          shiftId: update.shiftId,
          clockInRegularized: row.clockIn !== update.clockIn ? true : row.clockInRegularized,
          clockOutRegularized: row.clockOut !== update.clockOut ? true : row.clockOutRegularized,
          history: [...row.history, update.history],
        };
      })
    );
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected(Array.from(new Set([...selected, ...filtered.map((row) => row.id)])));
    } else {
      const visible = new Set(filtered.map((row) => row.id));
      setSelected(selected.filter((id) => !visible.has(id)));
    }
  }

  return (
    <div className="min-h-full bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-8">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Attendance</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Export"
        >
          <Upload className="h-4 w-4" />
        </button>
      </header>

      <div className="p-4 sm:p-8">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Employee attendance</h2>
              <p className="text-sm text-gray-500">Keep track of employee attendance</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="h-10 w-full sm:w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-[160px]">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="pl-9"
                  aria-label="Attendance date"
                />
              </div>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[200px]" aria-label="Filter by shift">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select shift</SelectItem>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search employee..."
                  className="pl-9"
                  aria-label="Search employee"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="w-12 px-4 py-3 sm:px-6">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(value) => toggleAll(value === true)}
                      aria-label="Select all employees"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Clock in</th>
                  <th className="px-3 py-3 font-medium">Clock out</th>
                  <th className="px-3 py-3 font-medium">Overtime</th>
                  <th className="px-3 py-3 pr-6 font-medium">Total hours</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 sm:px-6">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={(value) => {
                          setSelected((current) =>
                            value === true ? [...current, row.id] : current.filter((id) => id !== row.id)
                          );
                        }}
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            row.avatarClass
                          )}
                        >
                          {row.initials}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500">{row.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <TimeCell
                        value={row.clockIn}
                        regularized={row.clockInRegularized}
                        onEdit={() => openEditor(row)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <TimeCell
                        value={row.clockOut}
                        regularized={row.clockOutRegularized}
                        onEdit={() => openEditor(row)}
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">{row.overtime ?? "—"}</td>
                    <td className="px-3 py-3 pr-6 text-sm tabular-nums text-gray-800">
                      {totalHours(row.clockIn, row.clockOut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-500">No employees match these filters.</p>
            ) : null}
          </div>
        </section>
      </div>

      <RegularizeDialog
        open={Boolean(editing)}
        row={editing}
        date={date}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={saveEdit}
      />
    </div>
  );
}
