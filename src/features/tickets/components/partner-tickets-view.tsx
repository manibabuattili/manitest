"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ChevronDown } from "lucide-react";
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
import {
  ChannelBadge,
  LabelPill,
  PriorityBadge,
  StatusBadge,
} from "@/components/tickets/badges";
import { CreateTicketDrawer } from "@/features/tickets/components/create-ticket-drawer";
import { formatTicketDate } from "@/lib/dates";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TicketPriority, TicketSource, TicketStatus } from "@prisma/client";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  unreadCount: number;
  lastMessagePreview: string | null;
  updatedAt: Date | string;
  createdAt: Date | string;
  customer: { name: string; company: string };
  labels: { label: { id: string; name: string; color: string } }[];
};

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
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [accountOpen, setAccountOpen] = useState(false);
  const selectedCompany = searchParams.get("company") ?? "ALL";
  const selectedStatus = searchParams.get("status") ?? "ALL";
  const selectedPriority = searchParams.get("priority") ?? "ALL";
  const selectedSource = searchParams.get("source") ?? "ALL";
  const [, startTransition] = useTransition();

  const companyLabel = useMemo(() => {
    if (selectedCompany === "ALL") return "All accounts";
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-8 pt-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Support</h1>
          <p className="mt-1 text-sm text-gray-500">
            Queue, filter, and act on customer & WhatsApp tickets.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Raise Ticket
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 px-8">
        <div className="relative min-w-[220px] flex-1">
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

        <Select
          value={selectedStatus}
          onValueChange={(v) => updateParams({ status: v, page: "1" })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPriority}
          onValueChange={(v) => updateParams({ priority: v, page: "1" })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSource}
          onValueChange={(v) => updateParams({ source: v, page: "1" })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All channels</SelectItem>
            <SelectItem value="PORTAL">Portal</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
          </SelectContent>
        </Select>

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
            <div className="absolute right-0 z-20 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
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
      </div>

      <div className="mt-6 flex gap-6 border-b border-gray-200 px-8">
        <Link
          href="/partner/support"
          className="border-b-2 border-brand-600 pb-3 text-sm font-semibold text-brand-700"
        >
          Tickets
        </Link>
        <Link href="/partner" className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-800">
          Analytics
        </Link>
      </div>

      <div className="mx-8 mt-0 overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox />
              </th>
              <th className="px-3 py-3">Ticket ID</th>
              <th className="px-3 py-3">Subject</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Channel</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Label</th>
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
                  {t.unreadCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                      {t.unreadCount}
                    </span>
                  )}
                </td>
                <td className="max-w-[220px] px-3 py-3">
                  <p className="truncate font-medium text-gray-800">{t.subject}</p>
                  {t.lastMessagePreview && (
                    <p className="truncate text-xs text-gray-450 text-gray-400">
                      {t.lastMessagePreview}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-3 py-3">
                  <ChannelBadge source={t.source} />
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <p className="font-medium">{t.customer.name}</p>
                  <p className="text-xs text-gray-400">{t.customer.company}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.labels.map((l) => (
                      <LabelPill key={l.label.id} name={l.label.name} color={l.label.color} />
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-600">{formatTicketDate(t.updatedAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
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
