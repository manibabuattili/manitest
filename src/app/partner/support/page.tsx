import { Suspense } from "react";
import type { TicketPriority, TicketStatus } from "@prisma/client";
import { getMetaOptions, listTickets } from "@/features/tickets/actions";
import { getSupportAnalytics } from "@/features/tickets/analytics";
import { PartnerTicketsView } from "@/features/tickets/components/partner-tickets-view";

export default async function PartnerSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const tab = params.tab === "analytics" ? "analytics" : "tickets";

  const [result, meta, analytics] = await Promise.all([
    listTickets({
      q: params.q,
      status: (params.status as TicketStatus | "ALL" | undefined) ?? "ALL",
      priority: (params.priority as TicketPriority | "ALL" | undefined) ?? "ALL",
      company: params.company,
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
