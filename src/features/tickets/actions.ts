"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, TicketPriority, TicketSource, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEMO_AGENT_EMAIL,
  DEMO_CUSTOMER_EMAIL,
  SLA_HOURS,
  WHATSAPP_CUSTOMER_EMAIL,
  WHATSAPP_DEMO_TICKET,
} from "@/lib/constants";
import { createTicketSchema, replySchema, updateTicketSchema } from "./schemas";

async function nextTicketNumber() {
  const latest = await prisma.ticket.findFirst({
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  const n = latest ? parseInt(latest.ticketNumber.replace("SUP-", ""), 10) + 1 : 2000;
  return `SUP-${n}`;
}

async function deleteTicketCascade(ticketNumber: string) {
  const existing = await prisma.ticket.findUnique({ where: { ticketNumber } });
  if (!existing) return;
  await prisma.attachment.deleteMany({ where: { ticketId: existing.id } });
  await prisma.ticketMessage.deleteMany({ where: { ticketId: existing.id } });
  await prisma.ticketActivity.deleteMany({ where: { ticketId: existing.id } });
  await prisma.statusHistory.deleteMany({ where: { ticketId: existing.id } });
  await prisma.ticketLabel.deleteMany({ where: { ticketId: existing.id } });
  await prisma.ticket.delete({ where: { id: existing.id } });
}

function slaDueAt(priority: TicketPriority, from = new Date()) {
  return new Date(from.getTime() + SLA_HOURS[priority] * 60 * 60 * 1000);
}

export async function getDemoActors() {
  let customer = await prisma.customer.findFirst({ where: { email: DEMO_CUSTOMER_EMAIL } });
  if (!customer) customer = await prisma.customer.findFirst();
  let agent = await prisma.supportAgent.findFirst({ where: { email: DEMO_AGENT_EMAIL } });
  if (!agent) agent = await prisma.supportAgent.findFirst();
  return { customer, agent };
}

export async function getWhatsAppCustomer() {
  let customer = await prisma.customer.findFirst({ where: { email: WHATSAPP_CUSTOMER_EMAIL } });
  if (!customer) {
    customer = await prisma.customer.findFirst({
      where: { company: { contains: "JMR" } },
    });
  }
  if (!customer) customer = await prisma.customer.findFirst();
  return customer;
}

export async function getMetaOptions() {
  const [labels, components, agents, customers, companies] = await Promise.all([
    prisma.label.findMany({ orderBy: { name: "asc" } }),
    prisma.component.findMany({ orderBy: { name: "asc" } }),
    prisma.supportAgent.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({
      distinct: ["company"],
      select: { company: true },
      orderBy: { company: "asc" },
    }),
  ]);
  return {
    labels,
    components,
    agents,
    customers,
    companies: companies.map((c) => c.company),
  };
}

export type TicketListParams = {
  q?: string;
  status?: TicketStatus | "ALL";
  priority?: TicketPriority | "ALL";
  source?: TicketSource | "ALL";
  company?: string;
  page?: number;
  pageSize?: number;
  sort?: "updatedAt" | "createdAt" | "priority" | "status";
  order?: "asc" | "desc";
  customerId?: string;
};

export async function listTickets(params: TicketListParams = {}) {
  const {
    q,
    status,
    priority,
    source,
    company,
    page = 1,
    pageSize = 20,
    sort = "updatedAt",
    order = "desc",
    customerId,
  } = params;

  const where: Prisma.TicketWhereInput = {};
  if (customerId) where.customerId = customerId;
  if (status && status !== "ALL") where.status = status;
  if (priority && priority !== "ALL") where.priority = priority;
  if (source && source !== "ALL") where.source = source;
  if (company && company !== "ALL") where.customer = { company };
  if (q) {
    where.OR = [
      { ticketNumber: { contains: q } },
      { subject: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { company: { contains: q } } },
    ];
  }

  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: {
        customer: true,
        assignee: true,
        component: true,
        labels: { include: { label: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // refresh SLA breach flags
  const now = new Date();
  await Promise.all(
    tickets
      .filter(
        (t) =>
          !t.slaBreached &&
          t.slaDueAt < now &&
          t.status !== "RESOLVED" &&
          t.status !== "CLOSED"
      )
      .map((t) =>
        prisma.ticket.update({ where: { id: t.id }, data: { slaBreached: true } })
      )
  );

  return {
    tickets: tickets.map((t) => ({
      ...t,
      slaBreached:
        t.slaBreached ||
        (t.slaDueAt < now && t.status !== "RESOLVED" && t.status !== "CLOSED"),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTicketById(idOrNumber: string) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { ticketNumber: idOrNumber }],
    },
    include: {
      customer: true,
      assignee: true,
      component: true,
      labels: { include: { label: true } },
      attachments: true,
      messages: {
        include: {
          customer: true,
          agent: true,
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { agent: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  return ticket;
}

export async function createTicketAction(raw: unknown) {
  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const { customer: demoCustomer, agent } = await getDemoActors();
  if (!demoCustomer) return { ok: false as const, error: { subject: ["No customer found. Seed the database."] } };

  let customer = demoCustomer;
  if (data.source === "WHATSAPP") {
    const waCustomer = await getWhatsAppCustomer();
    if (waCustomer) customer = waCustomer;
  }
  if (data.customerId) {
    const found = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (found) customer = found;
  } else if (data.accountCompany) {
    const found = await prisma.customer.findFirst({ where: { company: data.accountCompany } });
    if (found) customer = found;
  }

  const priority = data.priority ?? "MEDIUM";
  const preferred =
    data.preferredTicketNumber ||
    (data.source === "WHATSAPP" ? WHATSAPP_DEMO_TICKET : undefined);
  if (preferred) {
    await deleteTicketCascade(preferred);
  }
  const ticketNumber = preferred ?? (await nextTicketNumber());
  const now = new Date();
  const skipAutoReply = data.skipAutoReply ?? data.source === "WHATSAPP";

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: data.subject,
      description: data.description,
      status: "OPEN",
      priority,
      source: data.source ?? "PORTAL",
      slaDueAt: slaDueAt(priority, now),
      customerId: customer.id,
      assigneeId: data.assigneeId ?? null,
      componentId: data.componentId ?? null,
      lastMessageAt: now,
      lastMessagePreview: data.description.slice(0, 120),
      unreadCount: 1,
      labels: data.labelIds?.length
        ? { create: data.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
      attachments: data.attachments?.length
        ? {
            create: data.attachments.map((a) => ({
              fileName: a.fileName,
              fileSize: a.fileSize || 0,
              mimeType: a.mimeType || "image/png",
              url: a.url || `/demo/${a.fileName}`,
            })),
          }
        : undefined,
      messages: {
        create: [
          {
            body: data.description,
            senderType: "CUSTOMER",
            customerId: customer.id,
            attachments: data.attachments?.length
              ? {
                  create: data.attachments.map((a) => ({
                    fileName: a.fileName,
                    fileSize: a.fileSize || 0,
                    mimeType: a.mimeType || "image/png",
                    url: a.url || `/demo/${a.fileName}`,
                  })),
                }
              : undefined,
          },
          ...(skipAutoReply
            ? []
            : [
                {
                  body: "Hi! Thanks for reaching out — we've received your ticket and will get back to you shortly.",
                  senderType: "SUPPORT" as const,
                  agentId: agent?.id,
                },
              ]),
        ],
      },
      statusHistory: {
        create: { fromStatus: null, toStatus: "OPEN" },
      },
      activities: {
        create: {
          action: "TICKET_CREATED",
          description:
            data.source === "WHATSAPP"
              ? `Ticket ${ticketNumber} created via WhatsApp`
              : `Ticket ${ticketNumber} created`,
          agentId: agent?.id,
          metadata: { source: data.source ?? "PORTAL" },
        },
      },
    },
  });

  revalidatePath("/support");
  revalidatePath("/partner/support");
  revalidatePath("/partner");
  revalidatePath("/whatsapp");
  return { ok: true as const, ticket };
}

export async function replyToTicketAction(raw: unknown) {
  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid message" };
  }

  const { ticketId, body, isInternal, asAgent, attachments } = parsed.data;
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { ok: false as const, error: "Ticket not found" };
  if (ticket.status === "CLOSED") return { ok: false as const, error: "Closed tickets cannot receive replies" };

  const { customer: demoCustomer, agent } = await getDemoActors();
  const waCustomer = await getWhatsAppCustomer();
  const customer =
    !asAgent && !isInternal && ticket.customerId === waCustomer?.id ? waCustomer : demoCustomer;
  const now = new Date();

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      body,
      isInternal,
      senderType: isInternal ? "INTERNAL" : asAgent ? "SUPPORT" : "CUSTOMER",
      agentId: asAgent || isInternal ? agent?.id : null,
      customerId: !asAgent && !isInternal ? customer?.id : null,
      createdAt: now,
      attachments: attachments?.length
        ? {
            create: attachments.map((a) => ({
              fileName: a.fileName,
              fileSize: a.fileSize || 0,
              mimeType: a.mimeType || "image/png",
              url: a.url || `/demo/${a.fileName}`,
              ticketId,
            })),
          }
        : undefined,
    },
  });

  if (!isInternal) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: now,
        lastMessagePreview: body.slice(0, 120),
        updatedAt: now,
        unreadCount: asAgent ? 0 : { increment: 1 },
        status:
          ticket.status === "RESOLVED"
            ? "OPEN"
            : asAgent && ticket.status === "OPEN"
              ? "IN_PROGRESS"
              : ticket.status,
      },
    });

    if (ticket.status === "RESOLVED") {
      await prisma.statusHistory.create({
        data: { ticketId, fromStatus: "RESOLVED", toStatus: "OPEN", note: "Reopened by reply" },
      });
    }
  }

  await prisma.ticketActivity.create({
    data: {
      ticketId,
      action: isInternal ? "INTERNAL_NOTE" : "REPLY",
      description: isInternal ? "Internal note added" : "Reply added",
      agentId: asAgent || isInternal ? agent?.id : null,
    },
  });

  revalidatePath(`/support/${ticket.ticketNumber}`);
  revalidatePath(`/partner/support/${ticket.ticketNumber}`);
  revalidatePath("/support");
  revalidatePath("/partner/support");
  revalidatePath("/partner");
  revalidatePath("/whatsapp");
  return { ok: true as const };
}

export async function updateTicketAction(raw: unknown) {
  const parsed = updateTicketSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid update" };

  const { ticketId, ...updates } = parsed.data;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { labels: true },
  });
  if (!ticket) return { ok: false as const, error: "Ticket not found" };
  if (ticket.status === "CLOSED" && updates.status && updates.status !== "CLOSED") {
    return { ok: false as const, error: "Closed is final and cannot be reopened" };
  }

  const { agent } = await getDemoActors();
  const data: Prisma.TicketUpdateInput = {};

  if (updates.subject) data.subject = updates.subject;
  if (updates.priority) {
    data.priority = updates.priority;
    data.slaDueAt = slaDueAt(updates.priority, ticket.createdAt);
  }
  if (updates.componentId !== undefined) {
    data.component = updates.componentId
      ? { connect: { id: updates.componentId } }
      : { disconnect: true };
  }
  if (updates.assigneeId !== undefined) {
    data.assignee = updates.assigneeId
      ? { connect: { id: updates.assigneeId } }
      : { disconnect: true };
  }
  if (updates.status && updates.status !== ticket.status) {
    if (ticket.status === "CLOSED") {
      return { ok: false as const, error: "Closed tickets are final" };
    }
    data.status = updates.status;
    if (updates.status === "CLOSED") data.closedAt = new Date();
    await prisma.statusHistory.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: updates.status,
      },
    });
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        body: `Status changed to ${updates.status.replace(/_/g, " ").toLowerCase()}`,
        senderType: "SYSTEM",
      },
    });
  }

  if (updates.labelIds) {
    await prisma.ticketLabel.deleteMany({ where: { ticketId } });
    if (updates.labelIds.length) {
      await prisma.ticketLabel.createMany({
        data: updates.labelIds.map((labelId) => ({ ticketId, labelId })),
      });
    }
  }

  await prisma.ticket.update({ where: { id: ticketId }, data });
  await prisma.ticketActivity.create({
    data: {
      ticketId,
      action: "TICKET_UPDATED",
      description: "Ticket details updated",
      agentId: agent?.id,
      metadata: updates,
    },
  });

  revalidatePath(`/partner/support/${ticket.ticketNumber}`);
  revalidatePath("/partner/support");
  revalidatePath("/partner");
  revalidatePath(`/support/${ticket.ticketNumber}`);
  revalidatePath("/support");
  revalidatePath("/whatsapp");
  return { ok: true as const };
}

export async function assignToMeAction(ticketId: string) {
  const { agent } = await getDemoActors();
  if (!agent) return { ok: false as const, error: "No agent" };
  return updateTicketAction({ ticketId, assigneeId: agent.id, status: "IN_PROGRESS" });
}

export async function getPartnerDashboardStats() {
  const now = new Date();
  const [
    total,
    open,
    inProgress,
    waiting,
    resolved,
    closed,
    breached,
    unassigned,
    whatsapp,
    portal,
    critical,
    high,
    recent,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: "WAITING_FOR_CUSTOMER" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.ticket.count({ where: { status: "CLOSED" } }),
    prisma.ticket.count({
      where: {
        OR: [{ slaBreached: true }, { slaDueAt: { lt: now }, status: { notIn: ["RESOLVED", "CLOSED"] } }],
      },
    }),
    prisma.ticket.count({
      where: { assigneeId: null, status: { notIn: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.ticket.count({ where: { source: "WHATSAPP" } }),
    prisma.ticket.count({ where: { source: "PORTAL" } }),
    prisma.ticket.count({
      where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.ticket.count({
      where: { priority: "HIGH", status: { notIn: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.ticket.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: true,
        assignee: true,
        labels: { include: { label: true } },
      },
    }),
  ]);

  return {
    totals: {
      total,
      open,
      inProgress,
      waiting,
      resolved,
      closed,
      breached,
      unassigned,
      whatsapp,
      portal,
      critical,
      high,
      active: open + inProgress + waiting,
    },
    recent,
  };
}

export async function closeTicketAction(ticketId: string) {
  return updateTicketAction({ ticketId, status: "CLOSED" });
}

/** Poll helper for WhatsApp demo — returns ticket + latest public support reply after creation. */
export async function getWhatsAppTicketSnapshot(ticketNumber = WHATSAPP_DEMO_TICKET) {
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber },
    include: {
      customer: true,
      assignee: true,
      component: true,
      labels: { include: { label: true } },
      attachments: true,
      messages: {
        where: { isInternal: false, senderType: { not: "SYSTEM" } },
        include: {
          customer: true,
          agent: true,
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) return { ok: false as const, ticket: null };

  const supportReplies = ticket.messages.filter((m) => m.senderType === "SUPPORT");
  const latestSupport = supportReplies[supportReplies.length - 1] ?? null;

  return {
    ok: true as const,
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      createdAt: ticket.createdAt,
      customer: ticket.customer,
      assignee: ticket.assignee,
      component: ticket.component,
      labels: ticket.labels,
      attachments: ticket.attachments,
      messages: ticket.messages,
      latestSupportReply: latestSupport
        ? {
            id: latestSupport.id,
            body: latestSupport.body,
            createdAt: latestSupport.createdAt,
            agentName: latestSupport.agent?.name ?? "Bluconn Support",
          }
        : null,
      supportReplyCount: supportReplies.length,
    },
  };
}
