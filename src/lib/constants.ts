import type { TicketPriority, TicketStatus } from "@prisma/client";

export const SLA_HOURS: Record<TicketPriority, number> = {
  LOW: 7 * 24,
  MEDIUM: 3 * 24,
  HIGH: 24,
  CRITICAL: 4,
};

/** Default SLA length in whole days when a ticket is created. */
export const SLA_DAYS: Record<TicketPriority, number> = {
  LOW: 7,
  MEDIUM: 3,
  HIGH: 1,
  CRITICAL: 1,
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In-progress",
  WAITING_FOR_CUSTOMER: "Waiting for Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const STATUS_FLOW: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

export const DEMO_CUSTOMER_EMAIL = "shivani@bluconn.com";
export const DEMO_AGENT_EMAIL = "olivia@untitledui.com";
export const WHATSAPP_CUSTOMER_EMAIL = "ravi.site@jmrconstructions.com";
export const WHATSAPP_DEMO_TICKET = "SUP-2027";

export const COMPONENT_NAMES = [
  "Attendance",
  "Leave",
  "Trip",
  "Workflow",
  "Face Attendance",
  "Reports",
  "Payroll",
  "General",
] as const;

export const LABEL_DEFS = [
  { name: "Bug", color: "#7F56D9" },
  { name: "Feature Request", color: "#F04438" },
  { name: "Configuration", color: "#F79009" },
  { name: "Question", color: "#12B76A" },
  { name: "Data Issue", color: "#EE46BC" },
  { name: "Enhancement", color: "#F04438" },
  { name: "Service", color: "#F79009" },
  { name: "Knowledge Gap", color: "#12B76A" },
  { name: "Duplicate", color: "#EE46BC" },
] as const;
