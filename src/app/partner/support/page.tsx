import { Suspense } from "react";
import type { TicketPriority, TicketStatus } from "@prisma/client";
import { getMetaOptions, listTickets } from "@/features/tickets/actions";
import { getSupportAnalytics } from "@/features/tickets/analytics";
import { PartnerTicketsView } from "@/features/tickets/components/partner-tickets-view";

function splitCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default async function PartnerSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const tab = params.tab === "analytics" ? "analytics" : "tickets";

  const statuses = splitCsv(params.status) as TicketStatus[];
  const assignees = splitCsv(params.assigneeId);
  const labelIds = splitCsv(params.labelId);
  const componentIds = splitCsv(params.componentId);
  const slaBreached = splitCsv(params.slaBreached).filter(
    (v): v is "yes" | "no" => v === "yes" || v === "no",
  );

  const [result, meta, analytics] = await Promise.all([
    listTickets({
      q: params.q,
      status: statuses.length ? statuses : "ALL",
      priority: (params.priority as TicketPriority | "ALL" | undefined) ?? "ALL",
      company: params.company,
      assigneeId: assignees.length ? assignees : "ALL",
      labelId: labelIds.length ? labelIds : "ALL",
      componentId: componentIds.length ? componentIds : "ALL",
      slaBreached: slaBreached.length ? slaBreached : "ALL",
      page,
      pageSize: 20,
      sort: "updatedAt",
      order: "desc",
    }),
    getMetaOptions(),
    getSupportAnalytics({
      company: params.company,
    }),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading support queue...</div>}>
      <PartnerTicketsView
        tickets={result.tickets}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        companies={meta.companies}
        customers={meta.customers.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
        }))}
        components={meta.components}
        labels={meta.labels}
        agents={meta.agents}
        analytics={analytics}
        initialTab={tab}
      />
    </Suspense>
  );
}
