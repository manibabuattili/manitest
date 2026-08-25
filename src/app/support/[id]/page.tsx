import { notFound } from "next/navigation";
import { getTicketById } from "@/features/tickets/actions";
import { CustomerTicketDetailView } from "@/features/tickets/components/customer-ticket-detail";

export default async function CustomerTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  return <CustomerTicketDetailView ticket={ticket} />;
}
