import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  differenceInHours,
  differenceInMinutes,
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

export function getSlaCountdown(dueAt: Date | string, breached: boolean): {
  label: string;
  breached: boolean;
  hoursLeft: number;
} {
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const now = new Date();
  const hoursLeft = differenceInHours(due, now);
  const minutesLeft = differenceInMinutes(due, now);

  if (breached || minutesLeft < 0) {
    const overdueHours = Math.abs(hoursLeft);
    return {
      label: overdueHours >= 24
        ? `Breached ${Math.floor(overdueHours / 24)}d ago`
        : `Breached ${Math.max(1, overdueHours)}h ago`,
      breached: true,
      hoursLeft,
    };
  }

  if (hoursLeft < 1) {
    return { label: `${Math.max(1, minutesLeft)}m left`, breached: false, hoursLeft };
  }
  if (hoursLeft < 24) {
    return { label: `${hoursLeft}h left`, breached: false, hoursLeft };
  }
  return {
    label: `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h left`,
    breached: false,
    hoursLeft,
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
