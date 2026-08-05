import { notFound } from "next/navigation";
import { getMetaOptions, getTicketById } from "@/features/tickets/actions";
import { PartnerTicketDetailView } from "@/features/tickets/components/partner-ticket-detail";

export default async function PartnerTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, meta] = await Promise.all([getTicketById(id), getMetaOptions()]);
  if (!ticket) notFound();

  return (
    <PartnerTicketDetailView
      ticket={ticket}
      components={meta.components}
      labels={meta.labels}
      agents={meta.agents}
    />
  );
}
