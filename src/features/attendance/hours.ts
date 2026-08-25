import type { ShiftId } from "./types";

export const SHIFTS: { id: ShiftId; label: string }[] = [
  { id: "night-6pm-6am", label: "Night (6pm–6am)" },
  { id: "day-6am-6pm", label: "Day (6am–6pm)" },
  { id: "0930-1815", label: "09:30 AM – 06:15 PM" },
  { id: "2000-0800", label: "08:00 PM – 08:00 AM" },
  { id: "0800-1700", label: "08:00 AM – 05:00 PM" },
];

export function shiftLabel(id: ShiftId | null): string {
  if (!id) return "—";
  return SHIFTS.find((shift) => shift.id === id)?.label ?? "—";
}

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTimeInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function totalHours(clockIn: string | null, clockOut: string | null): string {
  if (!clockIn || !clockOut) return "—";
  const start = toMinutes(clockIn);
  let end = toMinutes(clockOut);
  if (end <= start) end += 24 * 60;
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
