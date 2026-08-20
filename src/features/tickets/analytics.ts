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
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_COLORS,
  ISSUE_TYPE_VALUES,
} from "@/lib/constants";

export type AnalyticsTimeframe = "daily" | "weekly" | "monthly";
export type ChartType = "bar" | "line" | "pie";

export type SeriesDef = { key: string; name: string; color: string };
export type TimePoint = { period: string } & Record<string, string | number>;

export type ChartDataset = {
  id: string;
  title: string;
  series: SeriesDef[];
  allowedTypes: ChartType[];
  defaultType: ChartType;
  byTimeframe: Record<AnalyticsTimeframe, TimePoint[]>;
  subtitle: Record<AnalyticsTimeframe, string>;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#12B76A",
  IN_PROGRESS: "#039855",
  WAITING_FOR_CUSTOMER: "#FDB022",
  RESOLVED: "#32D583",
  CLOSED: "#98A2B3",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#A6F4C5",
  MEDIUM: "#32D583",
  HIGH: "#039855",
  CRITICAL: "#027A48",
};

const PALETTE = [
  "#027A48",
  "#12B76A",
  "#32D583",
  "#F79009",
  "#F04438",
  "#2E90FA",
  "#7F56D9",
  "#EE46BC",
  "#6172F3",
  "#15B79E",
];

type Bucket = { key: string; label: string; start: Date; end: Date };

function bucketsFor(timeframe: AnalyticsTimeframe, now = new Date()): {
  from: Date;
  to: Date;
  buckets: Bucket[];
  periodLabel: string;
} {
  if (timeframe === "daily") {
    const from = startOfDay(subDays(now, 6));
    const to = endOfDay(now);
    return {
      from,
      to,
      periodLabel: `${format(from, "dd MMM")} – ${format(to, "dd MMM yyyy")}`,
      buckets: eachDayOfInterval({ start: from, end: to }).map((d) => ({
        key: format(d, "yyyy-MM-dd"),
        label: format(d, "dd MMM"),
        start: startOfDay(d),
        end: endOfDay(d),
      })),
    };
  }
  if (timeframe === "weekly") {
    const from = startOfWeek(subWeeks(now, 5), { weekStartsOn: 1 });
    const to = endOfWeek(now, { weekStartsOn: 1 });
    return {
      from,
      to,
      periodLabel: `${format(from, "dd MMM")} – ${format(to, "dd MMM yyyy")}`,
      buckets: eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map((d) => {
        const start = startOfWeek(d, { weekStartsOn: 1 });
        const end = endOfWeek(d, { weekStartsOn: 1 });
        return {
          key: format(d, "yyyy-'W'II"),
          label: `Week ${format(d, "II")}`,
          start,
          end,
        };
      }),
    };
  }
  const from = startOfMonth(subMonths(now, 5));
  const to = endOfMonth(now);
  return {
    from,
    to,
    periodLabel: `${format(from, "MMM yyyy")} – ${format(to, "MMM yyyy")}`,
    buckets: eachMonthOfInterval({ start: from, end: to }).map((d) => ({
      key: format(d, "yyyy-MM"),
      label: format(d, "MMM yyyy"),
      start: startOfMonth(d),
      end: endOfMonth(d),
    })),
  };
}

function inBucket(date: Date, b: Bucket) {
  return date >= b.start && date <= b.end;
}

function buildSeriesChart(args: {
  id: string;
  title: string;
  series: SeriesDef[];
  defaultType?: ChartType;
  allowedTypes?: ChartType[];
  classify: (ticket: TicketRow) => string | string[] | null;
  ticketsByTf: Record<AnalyticsTimeframe, TicketRow[]>;
  bucketsByTf: Record<AnalyticsTimeframe, Bucket[]>;
  periodLabels: Record<AnalyticsTimeframe, string>;
}): ChartDataset {
  const byTimeframe = {} as Record<AnalyticsTimeframe, TimePoint[]>;
  (["daily", "weekly", "monthly"] as AnalyticsTimeframe[]).forEach((tf) => {
    const buckets = args.bucketsByTf[tf];
    const tickets = args.ticketsByTf[tf];
    byTimeframe[tf] = buckets.map((b) => {
      const point: TimePoint = { period: b.label };
      args.series.forEach((s) => {
        point[s.key] = 0;
      });
      tickets.forEach((t) => {
        if (!inBucket(t.createdAt, b)) return;
        const raw = args.classify(t);
        const keys = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
        keys.forEach((k) => {
          if (k in point && typeof point[k] === "number") {
            point[k] = (point[k] as number) + 1;
          }
        });
      });
      return point;
    });
  });

  return {
    id: args.id,
    title: args.title,
    series: args.series,
    allowedTypes: args.allowedTypes ?? ["bar", "line", "pie"],
    defaultType: args.defaultType ?? "bar",
    byTimeframe,
    subtitle: {
      daily: `${args.title} · daily (${args.periodLabels.daily})`,
      weekly: `${args.title} · weekly (${args.periodLabels.weekly})`,
      monthly: `${args.title} · monthly (${args.periodLabels.monthly})`,
    },
  };
}

type TicketRow = {
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  status: string;
  priority: string;
  issueType: string | null;
  slaDueAt: Date;
  slaBreached: boolean;
  assigneeId: string | null;
  customer: { company: string };
  component: { name: string } | null;
  labels: { label: { name: string; color: string } }[];
  messages: { createdAt: Date }[];
};

export async function getSupportAnalytics(params: { company?: string } = {}) {
  const now = new Date();
  const daily = bucketsFor("daily", now);
  const weekly = bucketsFor("weekly", now);
  const monthly = bucketsFor("monthly", now);

  // Load once for the widest window (monthly)
  const where: Prisma.TicketWhereInput = {
    createdAt: { gte: monthly.from, lte: monthly.to },
  };
  if (params.company && params.company !== "ALL") {
    where.customer = { company: params.company };
  }

  const ticketsRaw = await prisma.ticket.findMany({
    where,
    include: {
      customer: true,
      component: true,
      labels: { include: { label: true } },
      messages: {
        where: { senderType: "SUPPORT", isInternal: false },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const tickets: TicketRow[] = ticketsRaw.map((t) => ({
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    closedAt: t.closedAt,
    status: t.status,
    priority: t.priority,
    issueType: t.issueType,
    slaDueAt: t.slaDueAt,
    slaBreached: t.slaBreached,
    assigneeId: t.assigneeId,
    customer: { company: t.customer.company },
    component: t.component ? { name: t.component.name } : null,
    labels: t.labels.map((l) => ({ label: { name: l.label.name, color: l.label.color } })),
    messages: t.messages.map((m) => ({ createdAt: m.createdAt })),
  }));

  const filterTf = (tf: AnalyticsTimeframe) => {
    const { from, to } = tf === "daily" ? daily : tf === "weekly" ? weekly : monthly;
    return tickets.filter((t) => t.createdAt >= from && t.createdAt <= to);
  };

  const ticketsByTf: Record<AnalyticsTimeframe, TicketRow[]> = {
    daily: filterTf("daily"),
    weekly: filterTf("weekly"),
    monthly: filterTf("monthly"),
  };
  const bucketsByTf = {
    daily: daily.buckets,
    weekly: weekly.buckets,
    monthly: monthly.buckets,
  };
  const periodLabels = {
    daily: daily.periodLabel,
    weekly: weekly.periodLabel,
    monthly: monthly.periodLabel,
  };

  // Overview uses weekly window by default (matches prior UX)
  const overviewTickets = ticketsByTf.weekly;
  const total = overviewTickets.length;
  const resolved = overviewTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
  const open = overviewTickets.filter((t) => t.status === "OPEN").length;
  const inProgress = overviewTickets.filter((t) => t.status === "IN_PROGRESS").length;
  const waiting = overviewTickets.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length;
  const breached = overviewTickets.filter((t) => t.slaBreached).length;
  const unassigned = overviewTickets.filter((t) => !t.assigneeId).length;
  const active = overviewTickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const highPriority = overviewTickets.filter(
    (t) => t.priority === "HIGH" || t.priority === "CRITICAL",
  ).length;
  const slaAtRisk = overviewTickets.filter((t) => {
    if (t.slaBreached || t.status === "RESOLVED" || t.status === "CLOSED") return false;
    const hoursLeft = differenceInHours(t.slaDueAt, now);
    return hoursLeft >= 0 && hoursLeft <= 48;
  }).length;

  const resolutionHours = resolved
    .map((t) => Math.max(0, differenceInHours(t.closedAt ?? t.updatedAt, t.createdAt)))
    .filter((h) => Number.isFinite(h));
  const avgResolutionHours =
    resolutionHours.length > 0
      ? Math.round((resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10) / 10
      : 0;

  const firstResponseHours = overviewTickets
    .map((t) => (t.messages[0] ? Math.max(0, differenceInHours(t.messages[0].createdAt, t.createdAt)) : null))
    .filter((h): h is number => h != null);
  const avgFirstResponseHours =
    firstResponseHours.length > 0
      ? Math.round(
          (firstResponseHours.reduce((a, b) => a + b, 0) / firstResponseHours.length) * 10,
        ) / 10
      : 0;
  const slaCompliancePct = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

  const statusSeries: SeriesDef[] = (Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map(
    (k) => ({ key: k, name: STATUS_LABELS[k], color: STATUS_COLORS[k] })
  );
  const prioritySeries: SeriesDef[] = (
    Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>
  ).map((k) => ({ key: k, name: PRIORITY_LABELS[k], color: PRIORITY_COLORS[k] }));

  const componentNames = [...new Set(tickets.map((t) => t.component?.name ?? "Unassigned"))].sort();
  const componentSeries: SeriesDef[] = componentNames.map((name, i) => ({
    key: name,
    name,
    color: PALETTE[i % PALETTE.length],
  }));

  const customerNames = [...new Set(tickets.map((t) => t.customer.company))].sort().slice(0, 10);
  const customerSeries: SeriesDef[] = customerNames.map((name, i) => ({
    key: name,
    name,
    color: PALETTE[i % PALETTE.length],
  }));

  const labelNames = [
    ...new Set(tickets.flatMap((t) => (t.labels.length ? t.labels.map((l) => l.label.name) : ["Unlabeled"]))),
  ].sort();
  const labelColorMap = new Map<string, string>();
  tickets.forEach((t) =>
    t.labels.forEach(({ label }) => {
      if (!labelColorMap.has(label.name)) labelColorMap.set(label.name, label.color);
    })
  );
  const labelSeries: SeriesDef[] = labelNames.map((name, i) => ({
    key: name,
    name,
    color: labelColorMap.get(name) ?? PALETTE[i % PALETTE.length],
  }));

  const issueSeries: SeriesDef[] = [
    ...ISSUE_TYPE_VALUES.map((k) => ({
      key: k,
      name: ISSUE_TYPE_LABELS[k],
      color: ISSUE_TYPE_COLORS[k],
    })),
    { key: "UNSET", name: "Not classified", color: "#D0D5DD" },
  ];

  const volumeSeries: SeriesDef[] = [
    { key: "created", name: "Created", color: "#027A48" },
    { key: "resolved", name: "Resolved", color: "#12B76A" },
    { key: "breached", name: "SLA Breached", color: "#F04438" },
  ];

  const slaSeries: SeriesDef[] = [
    { key: "onTrack", name: "On Track", color: "#12B76A" },
    { key: "breached", name: "Breached", color: "#F04438" },
  ];

  const chartCommon = { ticketsByTf, bucketsByTf, periodLabels };

  const charts: ChartDataset[] = [
    buildSeriesChart({
      ...chartCommon,
      id: "by-status",
      title: "Tickets by Status",
      series: statusSeries,
      defaultType: "bar",
      classify: (t) => t.status,
    }),
    buildSeriesChart({
      ...chartCommon,
      id: "by-priority",
      title: "Tickets by Priority",
      series: prioritySeries,
      defaultType: "bar",
      classify: (t) => t.priority,
    }),
    buildSeriesChart({
      ...chartCommon,
      id: "by-component",
      title: "Tickets by Component",
      series: componentSeries,
      defaultType: "bar",
      classify: (t) => t.component?.name ?? "Unassigned",
    }),
    buildSeriesChart({
      ...chartCommon,
      id: "by-customer",
      title: "By Customer (Account)",
      series: customerSeries,
      defaultType: "bar",
      classify: (t) => (customerNames.includes(t.customer.company) ? t.customer.company : null),
    }),
    buildSeriesChart({
      ...chartCommon,
      id: "by-label",
      title: "Labels",
      series: labelSeries,
      defaultType: "line",
      classify: (t) => (t.labels.length ? t.labels.map((l) => l.label.name) : ["Unlabeled"]),
    }),
    buildSeriesChart({
      ...chartCommon,
      id: "by-issue-type",
      title: "Issue Type",
      series: issueSeries,
      defaultType: "bar",
      classify: (t) => t.issueType ?? "UNSET",
    }),
    (() => {
      const byTimeframe = {} as Record<AnalyticsTimeframe, TimePoint[]>;
      (["daily", "weekly", "monthly"] as AnalyticsTimeframe[]).forEach((tf) => {
        byTimeframe[tf] = bucketsByTf[tf].map((b) => {
          const inPeriod = ticketsByTf[tf].filter((t) => inBucket(t.createdAt, b));
          const created = inPeriod.length;
          const resolvedCount = ticketsByTf[tf].filter((t) => {
            const end = t.closedAt ?? (t.status === "RESOLVED" || t.status === "CLOSED" ? t.updatedAt : null);
            return end != null && inBucket(end, b);
          }).length;
          const breachedCount = inPeriod.filter((t) => t.slaBreached).length;
          return {
            period: b.label,
            created,
            resolved: resolvedCount,
            breached: breachedCount,
          };
        });
      });
      return {
        id: "volume",
        title: "Ticket Volume",
        series: volumeSeries,
        allowedTypes: ["bar", "line"] as ChartType[],
        defaultType: "line" as ChartType,
        byTimeframe,
        subtitle: {
          daily: `Ticket volume · daily (${periodLabels.daily})`,
          weekly: `Ticket volume · weekly (${periodLabels.weekly})`,
          monthly: `Ticket volume · monthly (${periodLabels.monthly})`,
        },
      };
    })(),
    (() => {
      const byTimeframe = {} as Record<AnalyticsTimeframe, TimePoint[]>;
      (["daily", "weekly", "monthly"] as AnalyticsTimeframe[]).forEach((tf) => {
        byTimeframe[tf] = bucketsByTf[tf].map((b) => {
          const inPeriod = ticketsByTf[tf].filter((t) => inBucket(t.createdAt, b));
          const breachedCount = inPeriod.filter((t) => t.slaBreached).length;
          return {
            period: b.label,
            onTrack: Math.max(0, inPeriod.length - breachedCount),
            breached: breachedCount,
          };
        });
      });
      return {
        id: "sla-breach",
        title: "SLA Breach",
        series: slaSeries,
        allowedTypes: ["bar", "line", "pie"] as ChartType[],
        defaultType: "bar" as ChartType,
        byTimeframe,
        subtitle: {
          daily: `SLA breach · daily (${periodLabels.daily})`,
          weekly: `SLA breach · weekly (${periodLabels.weekly})`,
          monthly: `SLA breach · monthly (${periodLabels.monthly})`,
        },
      };
    })(),
  ];

  const companies = await prisma.customer.findMany({
    distinct: ["company"],
    select: { company: true },
    orderBy: { company: "asc" },
  });

  return {
    timeframe: "weekly" as AnalyticsTimeframe,
    periodLabel: weekly.periodLabel,
    periodLabels,
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
      highPriority,
      slaAtRisk,
      avgResolutionHours,
      avgFirstResponseHours,
      slaCompliancePct,
    },
    charts,
  };
}

export type SupportAnalyticsData = Awaited<ReturnType<typeof getSupportAnalytics>>;
