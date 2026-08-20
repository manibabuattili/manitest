"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { TicketStatus } from "@prisma/client";
import { Plus, Search, CalendarDays, ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LabelPill, StatusBadge } from "@/components/tickets/badges";
import { CreateTicketDrawer } from "@/features/tickets/components/create-ticket-drawer";
import { PartnerSupportAnalytics } from "@/features/tickets/components/partner-support-analytics";
import { STATUS_LABELS } from "@/lib/constants";
import { formatTicketDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { SupportAnalyticsData } from "@/features/tickets/analytics";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  updatedAt: Date | string;
  createdAt: Date | string;
  slaBreached: boolean;
  customer: { name: string; company: string };
  assignee: { id: string; name: string } | null;
  component: { id: string; name: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
};

type TabId = "tickets" | "analytics";
type FilterKey = "status" | "assigneeId" | "labelId" | "componentId" | "slaBreached";

type FilterOption = { value: string; label: string };

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TicketStatus[];

function splitCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function PartnerTicketsView({
  tickets,
  total,
  page,
  totalPages,
  companies,
  customers,
  components,
  labels,
  agents,
  analytics,
  initialTab = "tickets",
}: {
  tickets: TicketRow[];
  total: number;
  page: number;
  totalPages: number;
  companies: string[];
  customers: { id: string; name: string; company: string }[];
  components: { id: string; name: string }[];
  labels: { id: string; name: string }[];
  agents: { id: string; name: string }[];
  analytics: SupportAnalyticsData;
  initialTab?: TabId;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [accountOpen, setAccountOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const selectedCompany = searchParams.get("company") ?? "ALL";
  const [, startTransition] = useTransition();

  const selectedStatuses = useMemo(() => splitCsv(searchParams.get("status")), [searchParams]);
  const selectedAssignees = useMemo(() => splitCsv(searchParams.get("assigneeId")), [searchParams]);
  const selectedLabels = useMemo(() => splitCsv(searchParams.get("labelId")), [searchParams]);
  const selectedComponents = useMemo(
    () => splitCsv(searchParams.get("componentId")),
    [searchParams],
  );
  const selectedSla = useMemo(
    () =>
      splitCsv(searchParams.get("slaBreached")).filter(
        (v): v is "yes" | "no" => v === "yes" || v === "no",
      ),
    [searchParams],
  );

  const activeFilterCount =
    selectedStatuses.length +
    selectedAssignees.length +
    selectedLabels.length +
    selectedComponents.length +
    selectedSla.length;

  const companyLabel = useMemo(() => {
    if (selectedCompany === "ALL") return "Select Account";
    return selectedCompany;
  }, [selectedCompany]);

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === "ALL") params.delete(k);
      else params.set(k, v);
    });
    startTransition(() => router.push(`/partner/support?${params.toString()}`));
  }

  function applyColumnFilter(key: FilterKey, values: string[]) {
    updateParams({
      [key]: values.join(","),
      page: "1",
    });
    setOpenFilter(null);
  }

  function clearAllFilters() {
    updateParams({
      status: "",
      assigneeId: "",
      labelId: "",
      componentId: "",
      slaBreached: "",
      page: "1",
    });
    setOpenFilter(null);
  }

  function switchTab(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "analytics") params.set("tab", "analytics");
    else params.delete("tab");
    startTransition(() => router.push(`/partner/support?${params.toString()}`));
  }

  const statusOptions: FilterOption[] = STATUS_OPTIONS.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  }));
  const assigneeOptions: FilterOption[] = [
    { value: "UNASSIGNED", label: "Unassigned" },
    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
  ];
  const labelOptions: FilterOption[] = labels.map((label) => ({
    value: label.id,
    label: label.name,
  }));
  const componentOptions: FilterOption[] = components.map((component) => ({
    value: component.id,
    label: component.name,
  }));
  const slaOptions: FilterOption[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-2xl font-semibold text-gray-900">Support</h1>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 px-8">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search Ticket ID/Subject"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ q, page: "1" });
            }}
          />
        </div>
        <Button variant="secondary" className="gap-2 text-gray-600">
          <CalendarDays className="h-4 w-4" />
          Jan 10, 2025 - Jan 16, 2025
        </Button>
        <div className="relative">
          <Button
            variant="secondary"
            className="gap-2 text-gray-600"
            onClick={() => setAccountOpen((v) => !v)}
          >
            {companyLabel}
            <ChevronDown className="h-4 w-4" />
          </Button>
          {accountOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {["ALL", ...companies.slice(0, 12)].map((c) => (
                <button
                  key={c}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50",
                    selectedCompany === c && "bg-gray-100 font-medium"
                  )}
                  onClick={() => {
                    updateParams({ company: c, page: "1" });
                    setAccountOpen(false);
                  }}
                >
                  <Checkbox checked={selectedCompany === c} />
                  {c === "ALL" ? "All" : c}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Raise Ticket
        </Button>
      </div>

      <div className="mt-6 px-8">
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => switchTab("tickets")}
            className={cn(
              "rounded-lg px-5 py-2.5 text-sm font-semibold transition",
              tab === "tickets"
                ? "bg-white text-brand-700 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Tickets Raised
          </button>
          <button
            type="button"
            onClick={() => switchTab("analytics")}
            className={cn(
              "rounded-lg px-5 py-2.5 text-sm font-semibold transition",
              tab === "analytics"
                ? "bg-white text-brand-700 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Analytics
          </button>
        </div>
      </div>

      {tab === "analytics" ? (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <PartnerSupportAnalytics initialData={analytics} companies={companies} />
        </div>
      ) : (
        <div className="mx-8 mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-2 text-xs text-gray-600">
              <span>
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} applied
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800"
                onClick={clearAllFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox />
                  </th>
                  <th className="px-3 py-3">Ticket ID</th>
                  <th className="px-3 py-3">Subject</th>
                  <th className="px-3 py-3">Customer Name</th>
                  <th className="px-3 py-3">Account Name</th>
                  <ColumnFilterHeader
                    label="Status"
                    filterKey="status"
                    openFilter={openFilter}
                    setOpenFilter={setOpenFilter}
                    selected={selectedStatuses}
                    options={statusOptions}
                    onApply={(values) => applyColumnFilter("status", values)}
                  />
                  <ColumnFilterHeader
                    label="Assignee"
                    filterKey="assigneeId"
                    openFilter={openFilter}
                    setOpenFilter={setOpenFilter}
                    selected={selectedAssignees}
                    options={assigneeOptions}
                    onApply={(values) => applyColumnFilter("assigneeId", values)}
                  />
                  <ColumnFilterHeader
                    label="Label"
                    filterKey="labelId"
                    openFilter={openFilter}
                    setOpenFilter={setOpenFilter}
                    selected={selectedLabels}
                    options={labelOptions}
                    onApply={(values) => applyColumnFilter("labelId", values)}
                  />
                  <ColumnFilterHeader
                    label="Component"
                    filterKey="componentId"
                    openFilter={openFilter}
                    setOpenFilter={setOpenFilter}
                    selected={selectedComponents}
                    options={componentOptions}
                    onApply={(values) => applyColumnFilter("componentId", values)}
                  />
                  <ColumnFilterHeader
                    label="SLA Breached"
                    filterKey="slaBreached"
                    openFilter={openFilter}
                    setOpenFilter={setOpenFilter}
                    selected={selectedSla}
                    options={slaOptions}
                    onApply={(values) => applyColumnFilter("slaBreached", values)}
                  />
                  <th className="px-3 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <Checkbox />
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-900">
                      <Link
                        href={`/partner/support/${t.ticketNumber}`}
                        className="hover:text-brand-700"
                      >
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-gray-700">{t.subject}</td>
                    <td className="px-3 py-3 text-gray-700">{t.customer.name}</td>
                    <td className="px-3 py-3 text-gray-700">{t.customer.company}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {t.assignee?.name ?? (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.labels.map((l) => (
                          <LabelPill key={l.label.id} name={l.label.name} color={l.label.color} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {t.component?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          t.slaBreached
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {t.slaBreached ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {formatTicketDate(t.updatedAt)}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                      No tickets match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
            <span>
              Showing page {page} of {totalPages || 1} · {total} tickets
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateTicketDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies}
        customers={customers}
        components={components}
        labels={labels}
        agents={agents}
      />
    </div>
  );
}

function ColumnFilterHeader({
  label,
  filterKey,
  openFilter,
  setOpenFilter,
  selected,
  options,
  onApply,
}: {
  label: string;
  filterKey: FilterKey;
  openFilter: FilterKey | null;
  setOpenFilter: (key: FilterKey | null) => void;
  selected: string[];
  options: FilterOption[];
  onApply: (values: string[]) => void;
}) {
  const open = openFilter === filterKey;
  const [draft, setDraft] = useState<string[]>(selected);
  const rootRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (open) setDraft(selected);
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenFilter(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpenFilter]);

  const active = selected.length > 0;

  return (
    <th ref={rootRef} className="relative px-3 py-3">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-medium transition hover:bg-gray-100 hover:text-gray-800",
          active ? "text-brand-700" : "text-gray-500",
          open && "bg-gray-100 text-gray-800"
        )}
        onClick={() => setOpenFilter(open ? null : filterKey)}
        aria-label={`Filter by ${label}`}
      >
        <span>{label}</span>
        <Filter className={cn("h-3.5 w-3.5", active && "text-brand-600")} />
        {active && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            aria-label="Close column filter"
            onClick={() => setOpenFilter(null)}
          />
          <div className="absolute left-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <p className="text-xs font-semibold text-gray-900">Filter {label}</p>
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                onClick={() => setOpenFilter(null)}
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-56 space-y-0.5 overflow-y-auto p-2">
              {options.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-gray-400">No options</p>
              ) : (
                options.map((option) => {
                  const checked = draft.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => setDraft((prev) => toggleValue(prev, option.value))}
                      />
                      <span className="truncate">{option.label}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 border-t border-gray-100 p-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setDraft([]);
                  onApply([]);
                }}
              >
                Clear
              </Button>
              <Button type="button" size="sm" className="flex-1" onClick={() => onApply(draft)}>
                Apply
              </Button>
            </div>
          </div>
        </>
      )}
    </th>
  );
}
