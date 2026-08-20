import { Suspense } from "react";
import type { TicketStatus } from "@prisma/client";
import { listTickets } from "@/features/tickets/actions";
import { CustomerTicketsView } from "@/features/tickets/components/customer-tickets-view";

export default async function CustomerSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const status = (params.status as TicketStatus | undefined) ?? undefined;

  const result = await listTickets({
    q: params.q,
    status: status ?? "ALL",
    page,
    pageSize: 20,
  });

  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading tickets...</div>}>
      <CustomerTicketsView
        tickets={result.tickets}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </Suspense>
  );
}
