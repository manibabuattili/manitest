import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  differenceInHours,
  differenceInMinutes,
  differenceInCalendarDays,
  addDays,
  startOfDay,
} from "date-fns";

export function formatTicketDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const time = format(d, "h:mm a");
  if (isToday(d)) return `Today, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  return `${format(d, "dd MMM yyyy")}, ${time}`;
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

/** Remaining SLA days (can be negative when overdue). Decrements once per calendar day. */
export function getSlaDaysRemaining(dueAt: Date | string, now = new Date()): number {
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  return differenceInCalendarDays(startOfDay(due), startOfDay(now));
}

export function computeSlaDueFromDays(createdAt: Date | string, slaDays: number): Date {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return addDays(startOfDay(created), Math.max(0, Math.floor(slaDays)));
}

export function getSlaCountdown(dueAt: Date | string, breached: boolean): {
  label: string;
  breached: boolean;
  hoursLeft: number;
  daysLeft: number;
} {
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const now = new Date();
  const hoursLeft = differenceInHours(due, now);
  const minutesLeft = differenceInMinutes(due, now);
  const daysLeft = getSlaDaysRemaining(due, now);

  if (breached || daysLeft < 0 || minutesLeft < 0) {
    return {
      label: `${daysLeft}d`,
      breached: true,
      hoursLeft,
      daysLeft,
    };
  }

  if (hoursLeft < 1) {
    return { label: `${Math.max(1, minutesLeft)}m left`, breached: false, hoursLeft, daysLeft };
  }
  if (hoursLeft < 24) {
    return { label: `${hoursLeft}h left`, breached: false, hoursLeft, daysLeft };
  }
  return {
    label: `${daysLeft}d left`,
    breached: false,
    hoursLeft,
    daysLeft,
  };
}

export function computeSlaDueAt(priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", from = new Date()): Date {
  const hours: Record<string, number> = {
    LOW: 7 * 24,
    MEDIUM: 3 * 24,
    HIGH: 24,
    CRITICAL: 4,
  };
  return new Date(from.getTime() + hours[priority] * 60 * 60 * 1000);
}
