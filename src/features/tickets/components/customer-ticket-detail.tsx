"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge, PriorityBadge, SlaBadge } from "@/components/tickets/badges";
import { ConversationThread } from "@/features/tickets/components/conversation-thread";
import { formatShortDate, getSlaCountdown } from "@/lib/dates";
import type { TicketPriority, TicketStatus } from "@prisma/client";

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaDueAt: Date | string;
  slaBreached: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  component: { name: string } | null;
  messages: Parameters<typeof ConversationThread>[0]["messages"];
};

export function CustomerTicketDetailView({ ticket }: { ticket: TicketDetail }) {
  const sla = getSlaCountdown(ticket.slaDueAt, ticket.slaBreached);

  return (
    <div className="flex h-full min-h-0 flex-col px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/support" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{ticket.ticketNumber}</h1>
          <p className="text-sm text-gray-500">{ticket.subject}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <SlaBadge label={sla.label} breached={sla.breached} />
        {ticket.component && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {ticket.component.name}
          </span>
        )}
        <span className="text-xs text-gray-500">
          Raised {formatShortDate(ticket.createdAt)} · Updated {formatShortDate(ticket.updatedAt)}
        </span>
      </div>

      <div className="min-h-0 flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <ConversationThread ticketId={ticket.id} messages={ticket.messages} asAgent={false} />
      </div>
    </div>
  );
}
