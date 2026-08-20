"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { TicketStatus } from "@prisma/client";
import {
  Plus,
  Search,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  UserRound,
  Tag,
  Boxes,
  CircleCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LabelPill } from "@/components/tickets/badges";
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
  updatedAt: Date | string;
  createdAt: Date | string;
  slaBreached: boolean;
  customer: { name: string; company: string };
  labels: { label: { id: string; name: string; color: string } }[];
};

type TabId = "tickets" | "analytics";
type FilterSection = "assignee" | "label" | "component" | "status" | "sla";

type DraftFilters = {
  statuses: string[];
  assignees: string[];
  labels: string[];
  components: string[];
  slaBreached: Array<"yes" | "no">;
};

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

function filtersFromParams(searchParams: URLSearchParams): DraftFilters {
  return {
    statuses: splitCsv(searchParams.get("status")),
    assignees: splitCsv(searchParams.get("assigneeId")),
    labels: splitCsv(searchParams.get("labelId")),
    components: splitCsv(searchParams.get("componentId")),
    slaBreached: splitCsv(searchParams.get("slaBreached")).filter(
      (v): v is "yes" | "no" => v === "yes" || v === "no",
    ),
  };
}

function countActive(filters: DraftFilters) {
  return (
    filters.statuses.length +
    filters.assignees.length +
    filters.labels.length +
    filters.components.length +
    filters.slaBreached.length
  );
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [openSection, setOpenSection] = useState<FilterSection | null>("assignee");
  const [draft, setDraft] = useState<DraftFilters>(() => filtersFromParams(searchParams));
  const selectedCompany = searchParams.get("company") ?? "ALL";
  const appliedFilters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const activeFilterCount = countActive(appliedFilters);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (filterOpen) {
      setDraft(filtersFromParams(searchParams));
    }
  }, [filterOpen, searchParams]);

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

  function applyFilters(next: DraftFilters = draft) {
    updateParams({
      status: next.statuses.join(","),
      assigneeId: next.assignees.join(","),
      labelId: next.labels.join(","),
      componentId: next.components.join(","),
      slaBreached: next.slaBreached.join(","),
      page: "1",
    });
    setFilterOpen(false);
  }

  function clearFilters() {
    const empty: DraftFilters = {
      statuses: [],
      assignees: [],
      labels: [],
      components: [],
      slaBreached: [],
    };
    setDraft(empty);
    applyFilters(empty);
  }

  function switchTab(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "analytics") params.set("tab", "analytics");
    else params.delete("tab");
    startTransition(() => router.push(`/partner/support?${params.toString()}`));
  }

  function toggleSection(section: FilterSection) {
    setOpenSection((current) => (current === section ? null : section));
  }

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

      <div className="mt-6 flex items-center justify-between gap-3 px-8">
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

        {tab === "tickets" && (
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className={cn(
                "relative h-10 w-10 rounded-xl border-gray-200 text-gray-600",
                filterOpen && "bg-gray-100 text-gray-900",
                activeFilterCount > 0 && "text-brand-700"
              )}
              aria-label="Filter tickets"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {filterOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-30 cursor-default bg-transparent"
                  aria-label="Close filter"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 z-40 mt-2 w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Filter</h3>
                    <button
                      type="button"
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                      onClick={() => setFilterOpen(false)}
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto px-2 py-1">
                    <FilterAccordion
                      title="Assignee"
                      icon={UserRound}
                      open={openSection === "assignee"}
                      onToggle={() => toggleSection("assignee")}
                      count={draft.assignees.length}
                    >
                      <FilterOption
                        checked={draft.assignees.includes("UNASSIGNED")}
                        label="Unassigned"
                        onChange={() =>
                          setDraft((d) => ({
                            ...d,
                            assignees: toggleValue(d.assignees, "UNASSIGNED"),
                          }))
                        }
                      />
                      {agents.map((agent) => (
                        <FilterOption
                          key={agent.id}
                          checked={draft.assignees.includes(agent.id)}
                          label={agent.name}
                          onChange={() =>
                            setDraft((d) => ({
                              ...d,
                              assignees: toggleValue(d.assignees, agent.id),
                            }))
                          }
                        />
                      ))}
                    </FilterAccordion>

                    <FilterAccordion
                      title="Label"
                      icon={Tag}
                      open={openSection === "label"}
                      onToggle={() => toggleSection("label")}
                      count={draft.labels.length}
                    >
                      {labels.map((label) => (
                        <FilterOption
                          key={label.id}
                          checked={draft.labels.includes(label.id)}
                          label={label.name}
                          onChange={() =>
                            setDraft((d) => ({
                              ...d,
                              labels: toggleValue(d.labels, label.id),
                            }))
                          }
                        />
                      ))}
                    </FilterAccordion>

                    <FilterAccordion
                      title="Component"
                      icon={Boxes}
                      open={openSection === "component"}
                      onToggle={() => toggleSection("component")}
                      count={draft.components.length}
                    >
                      {components.map((component) => (
                        <FilterOption
                          key={component.id}
                          checked={draft.components.includes(component.id)}
                          label={component.name}
                          onChange={() =>
                            setDraft((d) => ({
                              ...d,
                              components: toggleValue(d.components, component.id),
                            }))
                          }
                        />
                      ))}
                    </FilterAccordion>

                    <FilterAccordion
                      title="Status"
                      icon={CircleCheck}
                      open={openSection === "status"}
                      onToggle={() => toggleSection("status")}
                      count={draft.statuses.length}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <FilterOption
                          key={status}
                          checked={draft.statuses.includes(status)}
                          label={STATUS_LABELS[status]}
                          onChange={() =>
                            setDraft((d) => ({
                              ...d,
                              statuses: toggleValue(d.statuses, status),
                            }))
                          }
                        />
                      ))}
                    </FilterAccordion>

                    <FilterAccordion
                      title="SLA Breached"
                      icon={AlertTriangle}
                      open={openSection === "sla"}
                      onToggle={() => toggleSection("sla")}
                      count={draft.slaBreached.length}
                    >
                      <FilterOption
                        checked={draft.slaBreached.includes("yes")}
                        label="Yes"
                        onChange={() =>
                          setDraft((d) => ({
                            ...d,
                            slaBreached: toggleValue(d.slaBreached, "yes") as Array<"yes" | "no">,
                          }))
                        }
                      />
                      <FilterOption
                        checked={draft.slaBreached.includes("no")}
                        label="No"
                        onChange={() =>
                          setDraft((d) => ({
                            ...d,
                            slaBreached: toggleValue(d.slaBreached, "no") as Array<"yes" | "no">,
                          }))
                        }
                      />
                    </FilterAccordion>
                  </div>

                  <div className="space-y-2 border-t border-gray-100 p-3">
                    <Button className="w-full" onClick={() => applyFilters()}>
                      Apply
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {tab === "analytics" ? (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <PartnerSupportAnalytics initialData={analytics} companies={companies} />
        </div>
      ) : (
        <div className="mx-8 mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Checkbox />
                </th>
                <th className="px-3 py-3">Ticket ID</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Customer Name</th>
                <th className="px-3 py-3">Account Name</th>
                <th className="px-3 py-3">Label</th>
                <th className="px-3 py-3">SLA Breached</th>
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
                    <Link href={`/partner/support/${t.ticketNumber}`} className="hover:text-brand-700">
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{t.subject}</td>
                  <td className="px-3 py-3 text-gray-700">{t.customer.name}</td>
                  <td className="px-3 py-3 text-gray-700">{t.customer.company}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.labels.map((l) => (
                        <LabelPill key={l.label.id} name={l.label.name} color={l.label.color} />
                      ))}
                    </div>
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
                  <td className="px-3 py-3 text-gray-600">{formatTicketDate(t.updatedAt)}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No tickets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

function FilterAccordion({
  title,
  icon: Icon,
  open,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
        onClick={onToggle}
      >
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="flex-1">{title}</span>
        {count > 0 && (
          <span className="rounded-full bg-brand-50 px-1.5 text-[10px] font-semibold text-brand-700">
            {count}
          </span>
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="space-y-1 px-2 pb-3">{children}</div>}
    </div>
  );
}

function FilterOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="truncate">{label}</span>
    </label>
  );
}
