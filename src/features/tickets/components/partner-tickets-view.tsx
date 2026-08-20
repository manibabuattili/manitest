"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { TicketStatus } from "@prisma/client";
import { Plus, Search, CalendarDays, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TicketStatus[];

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
  const selectedCompany = searchParams.get("company") ?? "ALL";
  const selectedStatus = searchParams.get("status") ?? "ALL";
  const selectedAssignee = searchParams.get("assigneeId") ?? "ALL";
  const selectedLabel = searchParams.get("labelId") ?? "ALL";
  const selectedComponent = searchParams.get("componentId") ?? "ALL";
  const selectedSlaBreached = searchParams.get("slaBreached") ?? "ALL";
  const [, startTransition] = useTransition();

  const companyLabel = useMemo(() => {
    if (selectedCompany === "ALL") return "Select Account";
    return selectedCompany;
  }, [selectedCompany]);

  const hasActiveFilters =
    selectedStatus !== "ALL" ||
    selectedAssignee !== "ALL" ||
    selectedLabel !== "ALL" ||
    selectedComponent !== "ALL" ||
    selectedSlaBreached !== "ALL";

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === "ALL") params.delete(k);
      else params.set(k, v);
    });
    startTransition(() => router.push(`/partner/support?${params.toString()}`));
  }

  function clearFilters() {
    updateParams({
      status: "ALL",
      assigneeId: "ALL",
      labelId: "ALL",
      componentId: "ALL",
      slaBreached: "ALL",
      page: "1",
    });
  }

  function switchTab(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "analytics") params.set("tab", "analytics");
    else params.delete("tab");
    startTransition(() => router.push(`/partner/support?${params.toString()}`));
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
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 px-8">
            <Select
              value={selectedStatus}
              onValueChange={(value) => updateParams({ status: value, page: "1" })}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedAssignee}
              onValueChange={(value) => updateParams({ assigneeId: value, page: "1" })}
            >
              <SelectTrigger className="h-9 w-[170px] rounded-lg border-gray-200">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All assignees</SelectItem>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedLabel}
              onValueChange={(value) => updateParams({ labelId: value, page: "1" })}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200">
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All labels</SelectItem>
                {labels.map((label) => (
                  <SelectItem key={label.id} value={label.id}>
                    {label.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedComponent}
              onValueChange={(value) => updateParams({ componentId: value, page: "1" })}
            >
              <SelectTrigger className="h-9 w-[170px] rounded-lg border-gray-200">
                <SelectValue placeholder="Component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All components</SelectItem>
                {components.map((component) => (
                  <SelectItem key={component.id} value={component.id}>
                    {component.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSlaBreached}
              onValueChange={(value) => updateParams({ slaBreached: value, page: "1" })}
            >
              <SelectTrigger className="h-9 w-[170px] rounded-lg border-gray-200">
                <SelectValue placeholder="SLA Breached" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">SLA Breached: All</SelectItem>
                <SelectItem value="yes">SLA Breached: Yes</SelectItem>
                <SelectItem value="no">SLA Breached: No</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 gap-1 text-gray-600"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>

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
        </>
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
