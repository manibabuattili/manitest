"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Download,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSupportAnalytics,
  type SupportAnalyticsData,
} from "@/features/tickets/analytics";
import { AnalyticsChartCard } from "@/features/tickets/components/analytics-chart-card";
import { cn } from "@/lib/utils";

type PartnerSupportAnalyticsProps = {
  initialData: SupportAnalyticsData;
  companies?: string[];
};

export function PartnerSupportAnalytics({
  initialData,
  companies: companiesProp,
}: PartnerSupportAnalyticsProps) {
  const [data, setData] = useState(initialData);
  const [company, setCompany] = useState("all");
  const [isPending, startTransition] = useTransition();

  const companyOptions = useMemo(() => {
    const fromData = data.companies ?? [];
    const fromProp = companiesProp ?? [];
    const merged = [...new Set([...fromProp, ...fromData].filter(Boolean))];
    return ["all", ...merged];
  }, [companiesProp, data.companies]);

  function reload(nextCompany = company) {
    startTransition(async () => {
      try {
        const next = await getSupportAnalytics({
          company: nextCompany === "all" ? undefined : nextCompany,
        });
        setData(next);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to refresh analytics",
        );
      }
    });
  }

  function downloadOverviewCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Total Tickets", String(data.overview.total)],
      ["Open Tickets", String(data.overview.open)],
      ["In Progress", String(data.overview.inProgress)],
      ["Resolved / Closed", String(data.overview.resolved)],
      ["High / Critical", String(data.overview.highPriority)],
      [
        "Avg Resolution (hrs)",
        data.overview.avgResolutionHours
          ? String(Math.round(data.overview.avgResolutionHours * 10) / 10)
          : "—",
      ],
      ["SLA Breached", String(data.overview.breached)],
      ["SLA At Risk", String(data.overview.slaAtRisk)],
      ["Company Filter", company === "all" ? "All Accounts" : company],
      ["Generated At", data.lastUpdated],
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support-analytics-overview-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const avgResolution =
    data.overview.avgResolutionHours > 0
      ? `${Math.round(data.overview.avgResolutionHours * 10) / 10}h`
      : "—";

  return (
    <div className="space-y-6 px-8 pb-10 pt-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Analytics Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Support ticket trends · {data.periodLabel} · Last updated{" "}
            {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={company}
            onValueChange={(value) => {
              setCompany(value);
              reload(value);
            }}
          >
            <SelectTrigger className="h-9 w-[180px] rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              {companyOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All Accounts" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-slate-200"
            onClick={() => reload()}
            disabled={isPending}
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-slate-200"
            onClick={downloadOverviewCsv}
            title="Download overview CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Tickets"
          value={data.overview.total}
          hint="Matching current filters (weekly window)"
          icon={Ticket}
        />
        <KpiCard
          label="Open / In Progress"
          value={data.overview.open + data.overview.inProgress}
          hint={`${data.overview.open} open · ${data.overview.inProgress} in progress`}
          icon={Activity}
        />
        <KpiCard
          label="Avg Resolution"
          value={avgResolution}
          hint="Closed / resolved tickets"
          icon={Clock3}
        />
        <KpiCard
          label="SLA Breach"
          value={data.overview.breached}
          hint={`${data.overview.slaAtRisk} at risk · ${data.overview.highPriority} high/critical`}
          icon={AlertTriangle}
          accent={data.overview.breached > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {data.charts.map((chart) => (
          <AnalyticsChartCard key={chart.id} chart={chart} defaultTimeframe="daily" />
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p
            className={cn(
              "mt-2 text-3xl font-semibold tracking-tight",
              accent === "danger" ? "text-rose-600" : "text-slate-900",
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent === "danger" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
