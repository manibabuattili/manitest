"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendanceRow, HistoryChange, ShiftId } from "./types";
import { formatDisplayDate, formatTimeInput, SHIFTS, shiftLabel } from "./hours";

type RegularizeDialogProps = {
  open: boolean;
  row: AttendanceRow | null;
  date: string;
  onOpenChange: (open: boolean) => void;
  onSave: (update: {
    clockIn: string | null;
    clockOut: string | null;
    shiftId: ShiftId | null;
    history: HistoryChange;
  }) => void;
};

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeLine(from: string | null, to: string | null): string | null {
  if (from === to) return null;
  if (!from && to) return `Added ${to}`;
  if (from && !to) return `${from} → —`;
  if (from && to) return `${from} → ${to}`;
  return null;
}

export function RegularizeDialog({ open, row, date, onOpenChange, onSave }: RegularizeDialogProps) {
  const isAdd = Boolean(row && !row.clockIn && !row.clockOut);
  const [newClockIn, setNewClockIn] = useState("");
  const [newClockOut, setNewClockOut] = useState("");
  const [shiftId, setShiftId] = useState<ShiftId | "">("");
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!row || !open) return;
    setNewClockIn(row.clockIn ?? "");
    setNewClockOut(row.clockOut ?? "");
    setShiftId(row.shiftId ?? "");
    setError("");
    setShowHistory(row.history.length > 0);
  }, [row, open]);

  const nextClockIn = useMemo(() => formatTimeInput(newClockIn), [newClockIn]);
  const nextClockOut = useMemo(() => formatTimeInput(newClockOut), [newClockOut]);

  if (!row) return null;

  function handleSave() {
    if (!row) return;
    setError("");

    if (newClockIn.trim() && !nextClockIn) {
      setError("Enter check in as HH:MM, for example 05:50.");
      return;
    }
    if (newClockOut.trim() && !nextClockOut) {
      setError("Enter check out as HH:MM, for example 17:56.");
      return;
    }

    const clockIn = newClockIn.trim() ? nextClockIn : row.clockIn;
    const clockOut = newClockOut.trim() ? nextClockOut : row.clockOut;
    const nextShift = shiftId || null;

    if (isAdd) {
      if (!clockIn || !clockOut || !nextShift) {
        setError("Add check in, check out, and a shift for this day.");
        return;
      }
    } else {
      const unchanged =
        clockIn === row.clockIn && clockOut === row.clockOut && nextShift === row.shiftId;
      if (unchanged) {
        setError("Change a time or the shift, then save.");
        return;
      }
      if (!clockIn && !clockOut) {
        setError("Keep at least one of check in or check out.");
        return;
      }
    }

    onSave({
      clockIn,
      clockOut,
      shiftId: nextShift,
      history: {
        id: `h-${row.id}-${Date.now()}`,
        savedAt: new Date().toISOString(),
        clockInFrom: row.clockIn,
        clockInTo: clockIn,
        clockOutFrom: row.clockOut,
        clockOutTo: clockOut,
        shiftFrom: row.shiftId,
        shiftTo: nextShift,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAdd ? "Add attendance" : "Regularize attendance"}</DialogTitle>
          <DialogDescription>
            {row.name} · {formatDisplayDate(date)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Current check in</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{row.clockIn ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Current check out</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{row.clockOut ?? "—"}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Shift now: <span className="font-medium text-gray-700">{shiftLabel(row.shiftId)}</span>
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-clock-in">{isAdd ? "Check in" : "New check in"}</Label>
            <Input
              id="new-clock-in"
              type="time"
              value={newClockIn}
              onChange={(event) => setNewClockIn(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-clock-out">{isAdd ? "Check out" : "New check out"}</Label>
            <Input
              id="new-clock-out"
              type="time"
              value={newClockOut}
              onChange={(event) => setNewClockOut(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Shift</Label>
          <Select value={shiftId} onValueChange={(value) => setShiftId(value as ShiftId)}>
            <SelectTrigger aria-label="Select shift">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              {SHIFTS.map((shift) => (
                <SelectItem key={shift.id} value={shift.id}>
                  {shift.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="rounded-lg border border-gray-200">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setShowHistory((openHistory) => !openHistory)}
          >
            <History className="h-4 w-4 text-gray-400" />
            History
            <span className="text-xs font-normal text-gray-400">({row.history.length})</span>
            <ChevronDown
              className={`ml-auto h-4 w-4 text-gray-400 transition ${showHistory ? "rotate-180" : ""}`}
            />
          </button>
          {showHistory ? (
            <div className="space-y-3 border-t border-gray-200 px-3 py-3">
              {row.history.length === 0 ? (
                <p className="text-sm text-gray-500">No edits yet. This attendance is as originally marked.</p>
              ) : (
                [...row.history].reverse().map((entry) => {
                  const inChange = timeLine(entry.clockInFrom, entry.clockInTo);
                  const outChange = timeLine(entry.clockOutFrom, entry.clockOutTo);
                  const shiftChanged = entry.shiftFrom !== entry.shiftTo;
                  return (
                    <div key={entry.id} className="text-sm">
                      <p className="font-medium text-gray-900">{formatSavedAt(entry.savedAt)}</p>
                      {inChange ? <p className="text-gray-600">Check in: {inChange}</p> : null}
                      {outChange ? <p className="text-gray-600">Check out: {outChange}</p> : null}
                      {shiftChanged ? (
                        <p className="text-gray-600">
                          Shift: {shiftLabel(entry.shiftFrom)} → {shiftLabel(entry.shiftTo)}
                        </p>
                      ) : null}
                      {!inChange && !outChange && !shiftChanged ? (
                        <p className="text-gray-500">No time change recorded.</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
