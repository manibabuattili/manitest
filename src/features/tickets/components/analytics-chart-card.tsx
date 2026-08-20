"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Download,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AnalyticsTimeframe,
  ChartDataset,
  ChartType,
  SeriesDef,
  TimePoint,
} from "@/features/tickets/analytics";

const TIMEFRAMES: { id: AnalyticsTimeframe; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "bar", label: "Bar Chart" },
  { id: "line", label: "Line Chart" },
  { id: "pie", label: "Pie Chart" },
];

const AXIS_TICK = { fill: "#667085", fontSize: 11 } as const;
const VALUE_LABEL = { fill: "#344054", fontSize: 10, fontWeight: 600 } as const;

function hideZero(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return !n ? "" : String(n);
}

function axisLabel(tf: AnalyticsTimeframe) {
  if (tf === "daily") return "Date";
  if (tf === "weekly") return "Week number";
  return "Month";
}

function aggregateForPie(points: TimePoint[], series: SeriesDef[]) {
  return series
    .map((s) => ({
      key: s.key,
      name: s.name,
      color: s.color,
      value: points.reduce((sum, p) => sum + (Number(p[s.key]) || 0), 0),
    }))
    .filter((s) => s.value > 0);
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
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {value}
    </text>
  );
}

function Dropdown({
  label,
  open,
  onToggle,
  children,
  width = "w-44",
}: {
  label: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg",
            width
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ChartRenderer({
  type,
  points,
  series,
  timeframe,
  height,
}: {
  type: ChartType;
  points: TimePoint[];
  series: SeriesDef[];
  timeframe: AnalyticsTimeframe;
  height: number;
}) {
  if (!series.length) {
    return (
      <div style={{ height }} className="flex w-full items-center justify-center text-sm text-gray-400">
        Select at least one metric to display
      </div>
    );
  }

  if (type === "pie") {
    const pieData = aggregateForPie(points, series);
    return (
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={height > 280 ? 70 : 50}
              outerRadius={height > 280 ? 110 : 80}
              paddingAngle={2}
              labelLine={false}
              label={PieValueLabel}
            >
              {pieData.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "line") {
    return (
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 18, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
            <XAxis
              dataKey="period"
              tick={AXIS_TICK}
              interval={0}
              angle={timeframe === "monthly" ? 0 : -15}
              textAnchor={timeframe === "monthly" ? "middle" : "end"}
              height={timeframe === "monthly" ? 36 : 54}
              label={{ value: axisLabel(timeframe), position: "insideBottom", offset: -2, fill: "#98A2B3", fontSize: 11 }}
            />
            <YAxis allowDecimals={false} tick={AXIS_TICK} />
            <Tooltip />
            <Legend />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.2}
                dot={{ r: 3.5, fill: s.color, strokeWidth: 0 }}
              >
                <LabelList dataKey={s.key} position="top" offset={8} style={VALUE_LABEL} formatter={hideZero} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 18, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
          <XAxis
            dataKey="period"
            tick={AXIS_TICK}
            interval={0}
            angle={timeframe === "monthly" ? 0 : -15}
            textAnchor={timeframe === "monthly" ? "middle" : "end"}
            height={timeframe === "monthly" ? 36 : 54}
            label={{ value: axisLabel(timeframe), position: "insideBottom", offset: -2, fill: "#98A2B3", fontSize: 11 }}
          />
          <YAxis allowDecimals={false} tick={AXIS_TICK} />
          <Tooltip />
          <Legend />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]}>
              <LabelList dataKey={s.key} position="top" style={VALUE_LABEL} formatter={hideZero} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function downloadCsv(filename: string, points: TimePoint[], series: SeriesDef[]) {
  const headers = ["period", ...series.map((s) => s.name)];
  const rows = points.map((p) =>
    [p.period, ...series.map((s) => p[s.key] ?? 0)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPng(node: HTMLElement | null, filename: string) {
  if (!node) return;
  const svg = node.querySelector("svg");
  if (!svg) {
    // fallback: still offer CSV via caller
    return;
  }
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 400;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg render failed"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(2, 2);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const png = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = png;
  a.download = filename;
  a.click();
}

export function AnalyticsChartCard({
  chart,
  defaultTimeframe = "weekly",
}: {
  chart: ChartDataset;
  defaultTimeframe?: AnalyticsTimeframe;
}) {
  const allowedTypes = chart.allowedTypes;
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(defaultTimeframe);
  const [chartType, setChartType] = useState<ChartType>(
    allowedTypes.includes(chart.defaultType) ? chart.defaultType : allowedTypes[0]
  );
  const [selected, setSelected] = useState<string[]>(() => chart.series.map((s) => s.key));
  const [openMenu, setOpenMenu] = useState<"metrics" | "time" | "type" | null>(null);
  const [maximized, setMaximized] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep selection in sync if series list changes (e.g. after account filter reload)
    setSelected((prev) => {
      const keys = new Set(chart.series.map((s) => s.key));
      const kept = prev.filter((k) => keys.has(k));
      return kept.length ? kept : chart.series.map((s) => s.key);
    });
  }, [chart.series]);

  const activeSeries = useMemo(
    () => chart.series.filter((s) => selected.includes(s.key)),
    [chart.series, selected]
  );
  const points = chart.byTimeframe[timeframe] ?? [];
  const typeOptions = CHART_TYPES.filter((t) => allowedTypes.includes(t.id));

  function toggleMetric(key: string) {
    setSelected((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }

  function selectAllMetrics() {
    setSelected(chart.series.map((s) => s.key));
  }

  function clearMetrics() {
    setSelected(chart.series.slice(0, 1).map((s) => s.key));
  }

  async function onDownload() {
    const base = `${chart.id}-${timeframe}`;
    downloadCsv(`${base}.csv`, points, activeSeries);
    try {
      await downloadPng(chartRef.current, `${base}.png`);
    } catch {
      // CSV already downloaded
    }
  }

  const body = (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{chart.title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{chart.subtitle[timeframe]}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Download chart"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label={maximized ? "Minimize chart" : "Maximize chart"}
            onClick={() => setMaximized((v) => !v)}
          >
            {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Dropdown
          label={`Metrics (${selected.length})`}
          open={openMenu === "metrics"}
          onToggle={() => setOpenMenu((v) => (v === "metrics" ? null : "metrics"))}
          width="w-56"
        >
          <div className="mb-1 flex gap-1 border-b border-gray-100 px-1 pb-1">
            <button type="button" className="rounded px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-50" onClick={selectAllMetrics}>
              Select all
            </button>
            <button type="button" className="rounded px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50" onClick={clearMetrics}>
              Clear
            </button>
          </div>
          {chart.series.map((s) => {
            const checked = selected.includes(s.key);
            return (
              <label
                key={s.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
                  checked={checked}
                  onChange={() => toggleMetric(s.key)}
                />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="truncate text-gray-700">{s.name}</span>
              </label>
            );
          })}
        </Dropdown>

        <Dropdown
          label={
            <>
              <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
              {TIMEFRAMES.find((t) => t.id === timeframe)?.label}
            </>
          }
          open={openMenu === "time"}
          onToggle={() => setOpenMenu((v) => (v === "time" ? null : "time"))}
          width="w-36"
        >
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(
                "flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50",
                timeframe === t.id && "bg-brand-50 font-semibold text-brand-700"
              )}
              onClick={() => {
                setTimeframe(t.id);
                setOpenMenu(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </Dropdown>

        <Dropdown
          label={typeOptions.find((t) => t.id === chartType)?.label ?? "Chart"}
          open={openMenu === "type"}
          onToggle={() => setOpenMenu((v) => (v === "type" ? null : "type"))}
          width="w-40"
        >
          {typeOptions.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(
                "flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50",
                chartType === t.id && "bg-brand-50 font-semibold text-brand-700"
              )}
              onClick={() => {
                setChartType(t.id);
                setOpenMenu(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </Dropdown>
      </div>

      <div ref={chartRef}>
        <ChartRenderer
          type={chartType}
          points={points}
          series={activeSeries}
          timeframe={timeframe}
          height={maximized ? 420 : 280}
        />
      </div>
    </>
  );

  return (
    <>
      <div
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        onClick={() => openMenu && setOpenMenu(null)}
      >
        <div onClick={(e) => e.stopPropagation()}>{body}</div>
      </div>

      {maximized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setMaximized(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            {body}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setMaximized(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
