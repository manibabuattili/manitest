"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, CalendarDays } from "lucide-react";
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
import { StatusBadge } from "@/components/tickets/badges";
import { RaiseTicketModal } from "@/features/tickets/components/raise-ticket-modal";
import { formatTicketDate } from "@/lib/dates";
import type { TicketStatus } from "@prisma/client";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function CustomerTicketsView({
  tickets,
  total,
  page,
  totalPages,
}: {
  tickets: TicketRow[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === "ALL") params.delete(k);
      else params.set(k, v);
    });
    startTransition(() => {
      router.push(`/support?${params.toString()}`);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 px-8 pt-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Tickets</h1>
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
          Jan 10, 2025 - Jan 18, 2025
        </Button>
        <Select
          defaultValue={searchParams.get("status") ?? "ALL"}
          onValueChange={(v) => updateParams({ status: v, page: "1" })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In-progress</SelectItem>
            <SelectItem value="WAITING_FOR_CUSTOMER">Waiting</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setRaiseOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Raise Ticket
        </Button>
      </div>

      <div className="mx-8 mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox />
              </th>
              <th className="px-3 py-3">Ticket ID</th>
              <th className="px-3 py-3">Subject</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Raised On</th>
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
                  <Link href={`/support/${t.ticketNumber}`} className="hover:text-brand-700">
                    {t.ticketNumber}
                  </Link>
                </td>
                <td className="px-3 py-3 text-gray-700">{t.subject}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-3 py-3 text-gray-600">{formatTicketDate(t.createdAt)}</td>
                <td className="px-3 py-3 text-gray-600">{formatTicketDate(t.updatedAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No tickets found. Raise your first ticket to get started.
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

      <RaiseTicketModal open={raiseOpen} onOpenChange={setRaiseOpen} />
    </div>
  );
}
