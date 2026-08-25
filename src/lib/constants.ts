import type { TicketPriority, TicketStatus } from "@prisma/client";

export const SLA_HOURS: Record<TicketPriority, number> = {
  LOW: 7 * 24,
  MEDIUM: 3 * 24,
  HIGH: 24,
  CRITICAL: 4,
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

export const ISSUE_TYPE_VALUES = [
  "PRODUCT_GAP",
  "CODE_ISSUE",
  "NOT_AN_ISSUE",
  "INFRA_ISSUE",
  "THIRD_PARTY",
  "USER_ERROR",
] as const;

export type IssueTypeValue = (typeof ISSUE_TYPE_VALUES)[number];

export const ISSUE_TYPE_LABELS: Record<IssueTypeValue, string> = {
  PRODUCT_GAP: "Product gap",
  CODE_ISSUE: "Code issue",
  NOT_AN_ISSUE: "Non an Issue",
  INFRA_ISSUE: "Infra issue",
  THIRD_PARTY: "Third party",
  USER_ERROR: "User error",
};

export const ISSUE_TYPE_COLORS: Record<IssueTypeValue, string> = {
  PRODUCT_GAP: "#7F56D9",
  CODE_ISSUE: "#F04438",
  NOT_AN_ISSUE: "#98A2B3",
  INFRA_ISSUE: "#F79009",
  THIRD_PARTY: "#2E90FA",
  USER_ERROR: "#12B76A",
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
