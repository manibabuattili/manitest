import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  differenceInHours,
  differenceInMinutes,
  differenceInCalendarDays,
  startOfDay,
  addDays,
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

/** SLA due datetime from ticket received date + N whole days. */
export function computeSlaDueFromDays(createdAt: Date | string, slaDays: number): Date {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const days = Math.max(0, Math.floor(slaDays));
  return addDays(startOfDay(created), days);
}

/**
 * Remaining SLA days (calendar). Decrements each day.
 * Positive = days left, 0 = due today, negative = breached (-1, -2, …).
 */
export function getSlaDueDays(dueAt: Date | string, now = new Date()): number {
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  return differenceInCalendarDays(startOfDay(due), startOfDay(now));
}

export function formatSlaDueDays(daysLeft: number): string {
  if (daysLeft === 0) return "0 days";
  if (daysLeft === 1) return "1 day";
  if (daysLeft === -1) return "-1 day";
  return `${daysLeft} days`;
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
  const daysLeft = getSlaDueDays(due, now);
  const isBreached = breached || daysLeft < 0 || minutesLeft < 0;

  if (isBreached) {
    return {
      label: formatSlaDueDays(daysLeft < 0 ? daysLeft : -1),
      breached: true,
      hoursLeft,
      daysLeft: daysLeft < 0 ? daysLeft : -1,
    };
  }

  return {
    label: formatSlaDueDays(daysLeft),
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
