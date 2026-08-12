"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Ticket,
  MessageSquareCheck,
  Clock3,
  ShieldCheck,
  RefreshCw,
  Download,
  ChevronDown,
  AlertTriangle,
  UserRoundX,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getSupportAnalytics,
  type AnalyticsTimeframe,
  type SupportAnalyticsData,
} from "@/features/tickets/analytics";

const TIMEFRAMES: { id: AnalyticsTimeframe; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const AXIS_TICK = { fill: "#667085", fontSize: 12 } as const;
const VALUE_LABEL = {
  fill: "#344054",
  fontSize: 11,
  fontWeight: 600,
} as const;

function formatDuration(hours: number) {
  if (!hours || hours <= 0) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function hideZeroLabel(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return !n ? "" : String(n);
}

function PieValueLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  value?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, value = 0 } = props;
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {value}
    </text>
  );
}

function ChartCard({
  title,
  children,
  className,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function PartnerSupportAnalytics({
  initialData,
}: {
  initialData: SupportAnalyticsData;
}) {
  const [data, setData] = useState(initialData);
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(initialData.timeframe);
  const [company, setCompany] = useState("ALL");
  const [timeOpen, setTimeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function reload(nextTimeframe = timeframe, nextCompany = company) {
    startTransition(async () => {
      const next = await getSupportAnalytics({
        timeframe: nextTimeframe,
        company: nextCompany,
      });
      setData(next);
    });
  }

  const timeframeLabel = useMemo(
    () => TIMEFRAMES.find((t) => t.id === timeframe)?.label ?? "Weekly",
    [timeframe]
  );

  const statusTotal = data.byStatus.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="px-8 pb-10 pt-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {data.periodLabel}
            <span className="mx-2 text-gray-300">·</span>
            Last updated {format(new Date(data.lastUpdated), "dd MMM yyyy, h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                setTimeOpen((v) => !v);
                setAccountOpen(false);
              }}
            >
              {timeframeLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {timeOpen && (
              <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t.id}
                    className={cn(
                      "flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50",
                      timeframe === t.id && "bg-brand-50 font-semibold text-brand-700"
                    )}
                    onClick={() => {
                      setTimeframe(t.id);
                      setTimeOpen(false);
                      reload(t.id, company);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                setAccountOpen((v) => !v);
                setTimeOpen(false);
              }}
            >
              {company === "ALL" ? "All Accounts" : company}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {accountOpen && (
              <div className="absolute right-0 z-20 mt-2 max-h-72 w-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                {["ALL", ...data.companies].map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50",
                      company === c && "bg-brand-50 font-semibold text-brand-700"
                    )}
                    onClick={() => {
                      setCompany(c);
                      setAccountOpen(false);
                      reload(timeframe, c);
                    }}
                  >
                    {c === "ALL" ? "All Accounts" : c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="icon"
            disabled={pending}
            onClick={() => reload()}
            aria-label="Refresh analytics"
          >
            <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Export">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Ticket}
            label="Total Tickets"
            value={String(data.overview.total)}
            hint={`${data.overview.active} currently active`}
          />
          <MetricCard
            icon={MessageSquareCheck}
            label="Tickets Resolved"
            value={String(data.overview.resolved)}
            hint={`${data.overview.open} open · ${data.overview.inProgress} in progress`}
          />
          <MetricCard
            icon={Clock3}
            label="Avg Resolution Time"
            value={formatDuration(data.overview.avgResolutionHours)}
            hint={`First response ${formatDuration(data.overview.avgFirstResponseHours)}`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="SLA Compliance"
            value={`${data.overview.slaCompliancePct}%`}
            hint={`${data.overview.breached} breached · ${data.overview.unassigned} unassigned`}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs font-medium text-amber-700">SLA breached</p>
              <p className="text-lg font-semibold text-amber-900">{data.overview.breached}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <UserRoundX className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">Unassigned</p>
              <p className="text-lg font-semibold text-gray-900">{data.overview.unassigned}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 px-4 py-3">
            <Clock3 className="h-5 w-5 text-brand-700" />
            <div>
              <p className="text-xs font-medium text-brand-700">Waiting for customer</p>
              <p className="text-lg font-semibold text-brand-900">{data.overview.waiting}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <Ticket className="h-5 w-5 text-brand-700" />
            <div>
              <p className="text-xs font-medium text-gray-500">In progress</p>
              <p className="text-lg font-semibold text-gray-900">{data.overview.inProgress}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Insights</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Tickets by Status">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-[220px] w-full max-w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byStatus.filter((s) => s.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                      labelLine={false}
                      label={PieValueLabel}
                    >
                      {data.byStatus
                        .filter((s) => s.value > 0)
                        .map((s) => (
                          <Cell key={s.key} fill={s.color} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} (${Math.round((value / statusTotal) * 100)}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2">
                {data.byStatus.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {s.value}
                      <span className="ml-1 text-xs font-medium text-gray-400">
                        ({Math.round((s.value / statusTotal) * 100)}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ChartCard>

          <ChartCard title="Tickets by Priority">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byPriority}
                  layout="vertical"
                  margin={{ left: 8, right: 28, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAECF0" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    tick={AXIS_TICK}
                    interval={0}
                  />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Tickets">
                    {data.byPriority.map((p) => (
                      <Cell key={p.key} fill={p.color} />
                    ))}
                    <LabelList dataKey="value" position="right" style={VALUE_LABEL} formatter={hideZeroLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Tickets by Component">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byComponent}
                  margin={{ left: 0, right: 8, top: 18, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                  <XAxis
                    dataKey="name"
                    tick={AXIS_TICK}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#039855" radius={[6, 6, 0, 0]} name="Tickets">
                    <LabelList dataKey="value" position="top" style={VALUE_LABEL} formatter={hideZeroLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="By Customer (Account)">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byCustomer}
                  margin={{ left: 0, right: 8, top: 18, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                  <XAxis
                    dataKey="name"
                    tick={AXIS_TICK}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={64}
                  />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#027A48" radius={[4, 4, 0, 0]} name="Tickets">
                    <LabelList dataKey="tickets" position="top" style={{ ...VALUE_LABEL, fill: "#027A48" }} formatter={hideZeroLabel} />
                  </Bar>
                  <Bar dataKey="resolved" fill="#32D583" radius={[4, 4, 0, 0]} name="Resolved">
                    <LabelList dataKey="resolved" position="top" style={{ ...VALUE_LABEL, fill: "#027A48" }} formatter={hideZeroLabel} />
                  </Bar>
                  <Bar dataKey="breached" fill="#F79009" radius={[4, 4, 0, 0]} name="SLA Breached">
                    <LabelList dataKey="breached" position="top" style={{ ...VALUE_LABEL, fill: "#B54708" }} formatter={hideZeroLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Issue Type">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byIssueType.filter((s) => s.value > 0)}
                  margin={{ left: 0, right: 8, top: 18, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                  <XAxis
                    dataKey="name"
                    tick={AXIS_TICK}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={64}
                  />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tickets">
                    {data.byIssueType
                      .filter((s) => s.value > 0)
                      .map((s) => (
                        <Cell key={s.key} fill={s.color} />
                      ))}
                    <LabelList dataKey="value" position="top" style={VALUE_LABEL} formatter={hideZeroLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Labels">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.byLabel} margin={{ left: 0, right: 12, top: 18, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                  <XAxis
                    dataKey="name"
                    tick={AXIS_TICK}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={64}
                  />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#12B76A"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#039855", strokeWidth: 0 }}
                    name="Tickets"
                  >
                    <LabelList dataKey="value" position="top" offset={10} style={VALUE_LABEL} formatter={hideZeroLabel} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.byLabel.slice(0, 6).map((item) => (
                <span
                  key={item.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  {item.name}
                  <strong className="text-gray-900">{item.value}</strong>
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title={
              timeframe === "daily"
                ? "Ticket Volume (last 7 days)"
                : timeframe === "weekly"
                  ? "Ticket Volume by Week"
                  : "Ticket Volume by Month"
            }
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.volumeTrend} margin={{ left: 0, right: 8, top: 20, bottom: 8 }}>
                  <defs>
                    <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#039855" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#039855" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#32D583" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#32D583" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                  <XAxis
                    dataKey="period"
                    tick={AXIS_TICK}
                    interval={0}
                    angle={timeframe === "monthly" ? 0 : -15}
                    textAnchor={timeframe === "monthly" ? "middle" : "end"}
                    height={timeframe === "monthly" ? 36 : 56}
                    label={{
                      value:
                        timeframe === "daily"
                          ? "Date"
                          : timeframe === "weekly"
                            ? "Week number"
                            : "Month",
                      position: "insideBottom",
                      offset: -2,
                      fill: "#98A2B3",
                      fontSize: 11,
                    }}
                  />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={28} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#027A48"
                    fill="url(#createdFill)"
                    strokeWidth={2}
                    name="Created"
                    dot={{ r: 4, fill: "#027A48", strokeWidth: 0 }}
                  >
                    <LabelList dataKey="created" position="top" offset={8} style={VALUE_LABEL} formatter={hideZeroLabel} />
                  </Area>
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#12B76A"
                    fill="url(#resolvedFill)"
                    strokeWidth={2}
                    name="Resolved"
                    dot={{ r: 4, fill: "#12B76A", strokeWidth: 0 }}
                  >
                    <LabelList dataKey="resolved" position="top" offset={18} style={{ ...VALUE_LABEL, fill: "#027A48" }} formatter={hideZeroLabel} />
                  </Area>
                  <Line
                    type="monotone"
                    dataKey="breached"
                    stroke="#F79009"
                    strokeWidth={2}
                    name="SLA Breached"
                    dot={{ r: 4, fill: "#F79009", strokeWidth: 0 }}
                  >
                    <LabelList dataKey="breached" position="bottom" offset={8} style={{ ...VALUE_LABEL, fill: "#B54708" }} formatter={hideZeroLabel} />
                  </Line>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              X-axis shows{" "}
              {timeframe === "daily"
                ? "calendar dates (dd MMM)"
                : timeframe === "weekly"
                  ? "ISO week numbers (Week 1–53)"
                  : "calendar months (MMM yyyy)"}
              .
            </p>
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
