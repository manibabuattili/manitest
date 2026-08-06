import { PrismaClient, TicketPriority, TicketStatus, TicketSource, MessageSenderType } from "@prisma/client";
import { COMPONENT_NAMES, LABEL_DEFS, SLA_DAYS } from "../src/lib/constants";
import { computeSlaDueFromDays } from "../src/lib/dates";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Shivani", "Yalina", "Gautham", "Shreya", "Arjun", "Meera", "Rohan", "Ananya",
  "Vikram", "Priya", "Kabir", "Neha", "Aditya", "Sneha", "Rahul", "Isha",
  "Karan", "Divya", "Sachin", "Aisha",
];

const COMPANIES = [
  "Bluconn", "JMR Constructions", "Kajaria Constructions", "G Group Pvt. Ltd",
  "TechVista Solutions", "Apex Logistics", "Nova Retail", "Horizon Infra",
  "Pulse Healthcare", "Summit Foods", "Orbit Mobility", "Cedar Banking",
  "Lumen Energy", "Atlas Manufacturing", "Pine Softwares", "Vertex Media",
  "Cascade Hotels", "Indigo Pharma", "BrightPath Ed", "Quanta Auto",
];

const AGENT_NAMES = ["Olivia Rhye", "Yalina", "Dhruv", "Aman", "Kritika"];

const SUBJECTS = [
  "Geofence Failed",
  "Expense Approval Failed",
  "Attendance Failed",
  "Leave Approval Struck",
  "Shift Schedule Issue",
  "WhatsApp agent Not responding",
  "Payroll calculation mismatch",
  "Face attendance not syncing",
  "Trip report missing entries",
  "Workflow stuck at approval",
  "Duplicate notifications",
  "Report export timeout",
  "Unable to mark leave",
  "Login OTP not received",
  "Configuration not saving",
  "Attendance punch delay",
  "Holiday calendar wrong",
  "Overtime rule incorrect",
  "Asset check-in error",
  "Knowledge base search broken",
];

const MESSAGE_BODIES = [
  "We are seeing this issue repeatedly for field staff.",
  "Please check the backend logs before responding.",
  "Can you confirm if this is expected behavior?",
  "Thanks, that fixed part of the issue but not all devices.",
  "Sharing a screenshot of the error for reference.",
  "This started after yesterday's deployment.",
  "Urgent — payroll run is blocked because of this.",
  "Customer is waiting on a resolution today.",
  "Reproduced on Android and iOS.",
  "Looks related to the geofence radius setting.",
  "Hi! Thanks for reaching out — we've received your ticket and will get back to you shortly.",
  "We've escalated this to the product team.",
  "Could you share the employee ID and timestamp?",
  "Temporary workaround: refresh and retry punch.",
  "Issue has been resolved on our end. Please verify.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomPastDate(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

function slaDue(priority: TicketPriority, createdAt: Date): Date {
  return computeSlaDueFromDays(createdAt, SLA_DAYS[priority]);
}

async function main() {
  console.log("Seeding Bluconn Support MVP...");

  await prisma.attachment.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticketActivity.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.ticketLabel.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.label.deleteMany();
  await prisma.component.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supportAgent.deleteMany();

  const labels = await Promise.all(
    LABEL_DEFS.map((l) =>
      prisma.label.create({ data: { name: l.name, color: l.color } })
    )
  );

  const components = await Promise.all(
    COMPONENT_NAMES.map((name) => prisma.component.create({ data: { name } }))
  );

  const customers = await Promise.all(
    FIRST_NAMES.map((name, i) =>
      prisma.customer.create({
        data: {
          name,
          email:
            name === "Shivani"
              ? "shivani@bluconn.com"
              : `${name.toLowerCase().replace(/\s+/g, ".")}@${COMPANIES[i].toLowerCase().replace(/[^a-z]/g, "")}.com`,
          company: COMPANIES[i],
          phone: `+91 98${String(10000000 + i * 137).slice(0, 8)}`,
          avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        },
      })
    )
  );

  // Site engineer used by WhatsApp support demo
  const siteEngineer = await prisma.customer.create({
    data: {
      name: "Ravi Kumar",
      email: "ravi.site@jmrconstructions.com",
      company: "JMR Constructions",
      phone: "+91 98765 43210",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ravi%20Kumar",
    },
  });
  customers.push(siteEngineer);

  const agents = await Promise.all(
    AGENT_NAMES.map((name, i) =>
      prisma.supportAgent.create({
        data: {
          name,
          email: i === 0 ? "olivia@untitledui.com" : `${name.toLowerCase().replace(/\s+/g, ".")}@bluconn.com`,
          avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        },
      })
    )
  );

  const statuses: TicketStatus[] = [
    "OPEN",
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED",
  ];
  const priorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  let ticketCounter = 2000;
  let totalMessages = 0;

  for (let i = 0; i < 75; i++) {
    // Reserve SUP-2027 for the WhatsApp support demo flow
    if (ticketCounter === 2027) ticketCounter += 1;
    const customer = customers[i % customers.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const createdAt = randomPastDate(60);
    const component = pick(components);
    const assignee = Math.random() > 0.25 ? pick(agents) : null;
    const ticketNumber = `SUP-${ticketCounter++}`;
    const subject = pick(SUBJECTS);
    const due = slaDue(priority, createdAt);
    const breached = due < new Date() && status !== "RESOLVED" && status !== "CLOSED";
    const source: TicketSource =
      subject.toLowerCase().includes("whatsapp") || i % 11 === 0 ? "WHATSAPP" : "PORTAL";

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description: `The ${subject.toLowerCase()} is affecting operations for ${customer.company}. Need assistance resolving this promptly.`,
        status,
        priority,
        source,
        slaDays: SLA_DAYS[priority],
        slaDueAt: due,
        slaBreached: breached,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
        closedAt: status === "CLOSED" ? new Date() : null,
        customerId: customer.id,
        assigneeId: assignee?.id,
        componentId: component.id,
        unreadCount: status === "OPEN" || status === "IN_PROGRESS" ? Math.floor(Math.random() * 4) : 0,
        labels: {
          create: pickN(labels, Math.floor(Math.random() * 2) + 1).map((l) => ({
            labelId: l.id,
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "OPEN",
            createdAt,
          },
        },
        activities: {
          create: {
            action: "TICKET_CREATED",
            description:
              source === "WHATSAPP"
                ? `Ticket ${ticketNumber} created via WhatsApp`
                : `Ticket ${ticketNumber} created`,
            createdAt,
            agentId: null,
            metadata: { source },
          },
        },
      },
    });

    const messageCount = 4 + Math.floor(Math.random() * 6);
    let lastPreview = "";
    let lastAt = createdAt;

    for (let m = 0; m < messageCount && totalMessages < 500; m++) {
      const isCustomer = m === 0 || m % 2 === 0;
      const isInternal = !isCustomer && Math.random() < 0.15;
      const createdMsgAt = new Date(
        createdAt.getTime() + (m + 1) * (2 + Math.random() * 10) * 60 * 60 * 1000
      );
      const body =
        m === 0
          ? ticket.description
          : m === 1 && !isCustomer
            ? "Hi! Thanks for reaching out — we've received your ticket and will get back to you shortly."
            : pick(MESSAGE_BODIES);

      const senderType: MessageSenderType = isInternal
        ? "INTERNAL"
        : isCustomer
          ? "CUSTOMER"
          : "SUPPORT";

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body,
          senderType,
          isInternal,
          createdAt: createdMsgAt,
          customerId: isCustomer ? customer.id : null,
          agentId: !isCustomer ? (assignee ?? pick(agents)).id : null,
          attachments:
            Math.random() < 0.12
              ? {
                  create: {
                    fileName: `Screenshot-${formatSeedDate(createdMsgAt)}.png`,
                    fileSize: 180000 + Math.floor(Math.random() * 80000),
                    mimeType: "image/png",
                    url: "/attachments/sample.png",
                    ticketId: ticket.id,
                  },
                }
              : undefined,
        },
      });

      if (!isInternal) {
        lastPreview = body.slice(0, 120);
        lastAt = createdMsgAt;
      }
      totalMessages++;
    }

    // system message
    if (totalMessages < 500) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body: `Ticket status set to ${status.replace(/_/g, " ").toLowerCase()}`,
          senderType: "SYSTEM",
          createdAt: new Date(lastAt.getTime() + 60 * 1000),
        },
      });
      totalMessages++;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        lastMessageAt: lastAt,
        lastMessagePreview: lastPreview,
      },
    });
  }

  // top up messages to ~500
  const openTickets = await prisma.ticket.findMany({ take: 30 });
  while (totalMessages < 500) {
    const ticket = pick(openTickets);
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        body: pick(MESSAGE_BODIES),
        senderType: Math.random() > 0.5 ? "CUSTOMER" : "SUPPORT",
        customerId: Math.random() > 0.5 ? ticket.customerId : null,
        agentId: Math.random() > 0.5 ? pick(agents).id : null,
        createdAt: new Date(),
      },
    });
    totalMessages++;
  }

  console.log(`Seeded ${customers.length} customers, ${agents.length} agents, 75 tickets, ${totalMessages} messages.`);
}

function formatSeedDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
