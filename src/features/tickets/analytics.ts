"use server";

import {
  differenceInHours,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";

export type AnalyticsTimeframe = "daily" | "weekly" | "monthly";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#12B76A",
  IN_PROGRESS: "#039855",
  WAITING_FOR_CUSTOMER: "#FDB022",
  RESOLVED: "#32D583",
  CLOSED: "#D0D5DD",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#A6F4C5",
  MEDIUM: "#32D583",
  HIGH: "#039855",
  CRITICAL: "#027A48",
};

function rangeFor(timeframe: AnalyticsTimeframe, now = new Date()) {
  if (timeframe === "daily") {
    const from = startOfDay(subDays(now, 6));
    const to = endOfDay(now);
    const buckets = eachDayOfInterval({ start: from, end: to }).map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      label: format(d, "dd MMM"),
      start: startOfDay(d),
      end: endOfDay(d),
    }));
    return { from, to, buckets, periodLabel: `${format(from, "dd MMM")} – ${format(to, "dd MMM yyyy")}` };
  }
  if (timeframe === "weekly") {
    const from = startOfWeek(subWeeks(now, 5), { weekStartsOn: 1 });
    const to = endOfWeek(now, { weekStartsOn: 1 });
    const buckets = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map((d) => ({
      key: format(d, "yyyy-'W'II"),
      label: `W${format(d, "II")}`,
      start: startOfWeek(d, { weekStartsOn: 1 }),
      end: endOfWeek(d, { weekStartsOn: 1 }),
    }));
    return { from, to, buckets, periodLabel: `${format(from, "dd MMM")} – ${format(to, "dd MMM yyyy")}` };
  }
  const from = startOfMonth(subMonths(now, 5));
  const to = endOfMonth(now);
  const buckets = eachMonthOfInterval({ start: from, end: to }).map((d) => ({
    key: format(d, "yyyy-MM"),
    label: format(d, "MMM"),
    start: startOfMonth(d),
    end: endOfMonth(d),
  }));
  return { from, to, buckets, periodLabel: `${format(from, "MMM yyyy")} – ${format(to, "MMM yyyy")}` };
}

export async function getSupportAnalytics(params: {
  timeframe?: AnalyticsTimeframe;
  company?: string;
} = {}) {
  const timeframe = params.timeframe ?? "weekly";
  const { from, to, buckets, periodLabel } = rangeFor(timeframe);
  const now = new Date();

  const where: Prisma.TicketWhereInput = {
    createdAt: { gte: from, lte: to },
  };
  if (params.company && params.company !== "ALL") {
    where.customer = { company: params.company };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      customer: true,
      component: true,
      assignee: true,
      labels: { include: { label: true } },
      messages: {
        where: { senderType: "SUPPORT", isInternal: false },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const total = tickets.length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const waiting = tickets.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length;
  const breached = tickets.filter((t) => t.slaBreached).length;
  const unassigned = tickets.filter((t) => !t.assigneeId).length;
  const active = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;

  const resolutionHours = resolved
    .map((t) => {
      const end = t.closedAt ?? t.updatedAt;
      return Math.max(0, differenceInHours(end, t.createdAt));
    })
    .filter((h) => Number.isFinite(h));

  const avgResolutionHours =
    resolutionHours.length > 0
      ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
      : 0;

  const firstResponseHours = tickets
    .map((t) => {
      const first = t.messages[0];
      if (!first) return null;
      return Math.max(0, differenceInHours(first.createdAt, t.createdAt));
    })
    .filter((h): h is number => h != null);

  const avgFirstResponseHours =
    firstResponseHours.length > 0
      ? firstResponseHours.reduce((a, b) => a + b, 0) / firstResponseHours.length
      : 0;

  const slaCompliancePct =
    total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

  const byStatus = (Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map(
    (status) => ({
      key: status,
      name: STATUS_LABELS[status],
      value: tickets.filter((t) => t.status === status).length,
      color: STATUS_COLORS[status],
    })
  );

  const byPriority = (Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>).map(
    (priority) => ({
      key: priority,
      name: PRIORITY_LABELS[priority],
      value: tickets.filter((t) => t.priority === priority).length,
      color: PRIORITY_COLORS[priority],
    })
  );

  const componentMap = new Map<string, number>();
  tickets.forEach((t) => {
    const name = t.component?.name ?? "Unassigned";
    componentMap.set(name, (componentMap.get(name) ?? 0) + 1);
  });
  const byComponent = [...componentMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const customerMap = new Map<string, { tickets: number; breached: number; resolved: number }>();
  tickets.forEach((t) => {
    const name = t.customer.company;
    const cur = customerMap.get(name) ?? { tickets: 0, breached: 0, resolved: 0 };
    cur.tickets += 1;
    if (t.slaBreached) cur.breached += 1;
    if (t.status === "RESOLVED" || t.status === "CLOSED") cur.resolved += 1;
    customerMap.set(name, cur);
  });
  const byCustomer = [...customerMap.entries()]
    .map(([name, v]) => ({
      name,
      tickets: v.tickets,
      breached: v.breached,
      resolved: v.resolved,
    }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 8);

  const labelMap = new Map<string, { value: number; color: string }>();
  tickets.forEach((t) => {
    if (!t.labels.length) {
      const cur = labelMap.get("Unlabeled") ?? { value: 0, color: "#98A2B3" };
      cur.value += 1;
      labelMap.set("Unlabeled", cur);
      return;
    }
    t.labels.forEach(({ label }) => {
      const cur = labelMap.get(label.name) ?? { value: 0, color: label.color };
      cur.value += 1;
      labelMap.set(label.name, cur);
    });
  });
  const byIssueType = [...labelMap.entries()]
    .map(([name, v]) => ({ name, value: v.value, color: v.color }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const volumeTrend = buckets.map((b) => {
    const created = tickets.filter((t) => t.createdAt >= b.start && t.createdAt <= b.end).length;
    const resolvedCount = tickets.filter((t) => {
      const end = t.closedAt ?? (t.status === "RESOLVED" || t.status === "CLOSED" ? t.updatedAt : null);
      return end != null && end >= b.start && end <= b.end;
    }).length;
    const breachedCount = tickets.filter(
      (t) => t.slaBreached && t.createdAt >= b.start && t.createdAt <= b.end
    ).length;
    return {
      period: b.label,
      created,
      resolved: resolvedCount,
      breached: breachedCount,
    };
  });

  const companies = await prisma.customer.findMany({
    distinct: ["company"],
    select: { company: true },
    orderBy: { company: "asc" },
  });

  return {
    timeframe,
    periodLabel,
    lastUpdated: now.toISOString(),
    companies: companies.map((c) => c.company),
    overview: {
      total,
      resolved: resolved.length,
      open,
      inProgress,
      waiting,
      active,
      breached,
      unassigned,
      avgResolutionHours,
      avgFirstResponseHours,
      slaCompliancePct,
    },
    byStatus,
    byPriority,
    byComponent,
    byCustomer,
    byIssueType,
    volumeTrend,
  };
}

export type SupportAnalyticsData = Awaited<ReturnType<typeof getSupportAnalytics>>;
