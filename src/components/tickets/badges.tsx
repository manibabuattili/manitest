import type { TicketStatus, TicketPriority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";

const statusTone: Record<TicketStatus, "warning" | "info" | "default" | "success" | "danger"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  WAITING_FOR_CUSTOMER: "default",
  RESOLVED: "success",
  CLOSED: "default",
};

const priorityTone: Record<TicketPriority, "default" | "info" | "warning" | "danger"> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={statusTone[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge tone={priorityTone[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

export function LabelPill({ name, color }: { name: string; color: string }) {
  const toneByName: Record<string, "purple" | "warning" | "danger" | "success" | "pink" | "info" | "default"> = {
    Bug: "purple",
    Service: "warning",
    Enhancement: "danger",
    "Feature Request": "danger",
    "Knowledge Gap": "success",
    Question: "success",
    Duplicate: "pink",
    Configuration: "warning",
    "Data Issue": "pink",
  };
  return (
    <Badge tone={toneByName[name] ?? "default"} style={{ borderColor: `${color}33` }}>
      {name}
    </Badge>
  );
}

export function SlaBadge({ label, breached }: { label: string; breached: boolean }) {
  return <Badge tone={breached ? "danger" : "success"}>{breached ? `⚠ ${label}` : label}</Badge>;
}
