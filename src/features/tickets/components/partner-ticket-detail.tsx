"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversationThread } from "@/features/tickets/components/conversation-thread";
import {
  assignToMeAction,
  closeTicketAction,
  updateTicketAction,
} from "@/features/tickets/actions";
import { formatShortDate, getSlaCountdown, getSlaDaysRemaining, computeSlaDueFromDays } from "@/lib/dates";
import { PRIORITY_LABELS, STATUS_LABELS, ISSUE_TYPE_LABELS, ISSUE_TYPE_VALUES } from "@/lib/constants";
import { SlaBadge } from "@/components/tickets/badges";
import type { TicketPriority, TicketStatus, IssueType } from "@prisma/client";
import { differenceInCalendarDays, startOfDay } from "date-fns";

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  issueType: IssueType | null;
  slaDays: number | null;
  slaDueAt: Date | string;
  slaBreached: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer: { name: string; company: string };
  assignee: { id: string; name: string } | null;
  component: { id: string; name: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  attachments: { id: string; fileName: string; fileSize: number }[];
  messages: Parameters<typeof ConversationThread>[0]["messages"];
};

function initialSlaDays(ticket: TicketDetail): string {
  if (ticket.slaDays != null) return String(ticket.slaDays);
  const created = startOfDay(new Date(ticket.createdAt));
  const due = startOfDay(new Date(ticket.slaDueAt));
  const days = Math.max(0, differenceInCalendarDays(due, created));
  return String(days);
}

export function PartnerTicketDetailView({
  ticket,
  components,
  labels,
  agents,
}: {
  ticket: TicketDetail;
  components: { id: string; name: string }[];
  labels: { id: string; name: string }[];
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subject, setSubject] = useState(ticket.subject);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [componentId, setComponentId] = useState(ticket.component?.id ?? "");
  const [assigneeId, setAssigneeId] = useState(ticket.assignee?.id ?? "");
  const [labelId, setLabelId] = useState(ticket.labels[0]?.label.id ?? "");
  const [issueType, setIssueType] = useState<IssueType | "">(ticket.issueType ?? "");
  const [slaDaysInput, setSlaDaysInput] = useState(initialSlaDays(ticket));

  const parsedSlaDays = Number.parseInt(slaDaysInput, 10);
  const previewDueAt =
    Number.isFinite(parsedSlaDays) && parsedSlaDays >= 0
      ? computeSlaDueFromDays(ticket.createdAt, parsedSlaDays)
      : ticket.slaDueAt;
  const daysLeft = getSlaDaysRemaining(previewDueAt);
  const slaBreached = daysLeft < 0 || ticket.slaBreached;
  const sla = getSlaCountdown(previewDueAt, slaBreached);
  const closed = ticket.status === "CLOSED";

  function save() {
    const slaDays =
      slaDaysInput.trim() === "" || !Number.isFinite(parsedSlaDays)
        ? null
        : Math.max(0, parsedSlaDays);

    startTransition(async () => {
      const result = await updateTicketAction({
        ticketId: ticket.id,
        subject,
        status,
        priority,
        issueType: issueType || null,
        slaDays,
        componentId: componentId || null,
        assigneeId: assigneeId || null,
        labelIds: labelId ? [labelId] : [],
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Ticket saved");
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/partner/support" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Ticket Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Jan 10, 2025
          </Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/partner/support")}>
            Cancel
          </Button>
          <Button size="sm" className="gap-1" disabled={pending || closed} onClick={save}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_340px]">
        <div className="flex min-h-0 flex-col border-r border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-base font-semibold text-gray-900">{ticket.ticketNumber}</p>
              <p className="text-sm text-gray-500">{ticket.subject}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <button className="rounded-md p-2 hover:bg-gray-100">
                <Phone className="h-4 w-4" />
              </button>
              <button className="rounded-md p-2 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={closed}
              onClick={() =>
                startTransition(async () => {
                  await assignToMeAction(ticket.id);
                  toast.success("Assigned to you");
                  router.refresh();
                })
              }
            >
              Assign to Me
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={closed}
              onClick={() =>
                startTransition(async () => {
                  await closeTicketAction(ticket.id);
                  toast.success("Ticket closed");
                  router.refresh();
                })
              }
            >
              Close Ticket
            </Button>
            <SlaBadge label={sla.label} breached={sla.breached} />
          </div>

          <div className="min-h-0 flex-1">
            <ConversationThread ticketId={ticket.id} messages={ticket.messages} asAgent />
          </div>
        </div>

        <aside className="overflow-y-auto bg-gray-50/60 p-5">
          <div className="mb-5 space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <DetailRow label="ID" value={ticket.ticketNumber} />
            <DetailRow label="Requester" value={ticket.customer.name} />
            <DetailRow label="Company" value={ticket.customer.company} />
            <DetailRow label="Created" value={formatShortDate(ticket.createdAt)} />
            <DetailRow label="Updated" value={formatShortDate(ticket.updatedAt)} />
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <Field label="Subject *">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={closed} />
            </Field>
            <Field label="Status *">
              <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)} disabled={closed}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Label *">
              <Select value={labelId} onValueChange={setLabelId} disabled={closed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {labels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Issue Type">
              <Select
                value={issueType || undefined}
                onValueChange={(v) => setIssueType(v as IssueType)}
                disabled={closed}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ISSUE_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Component *">
              <Select value={componentId} onValueChange={setComponentId} disabled={closed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assign To *">
              <Select value={assigneeId} onValueChange={setAssigneeId} disabled={closed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority *">
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)} disabled={closed}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="SLA (days)">
              <Input
                type="number"
                min={0}
                max={365}
                inputMode="numeric"
                placeholder="e.g. 3"
                value={slaDaysInput}
                disabled={closed}
                onChange={(e) => setSlaDaysInput(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Manual SLA window in days from ticket created date.
              </p>
            </Field>
            <Field label="SLA Due">
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  daysLeft < 0
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold tabular-nums">
                    {daysLeft}
                    <span className="ml-1 font-normal text-gray-500">
                      {Math.abs(daysLeft) === 1 ? "day" : "days"}
                    </span>
                  </span>
                  {daysLeft < 0 && (
                    <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Breached
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-xs ${daysLeft < 0 ? "text-red-600" : "text-gray-500"}`}>
                  Due {formatShortDate(previewDueAt)}
                  {daysLeft < 0 ? " (Breached)" : ""}
                </p>
              </div>
            </Field>

            {ticket.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attachments</Label>
                {ticket.attachments.map((a) => (
                  <div key={a.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <p className="font-medium text-gray-800">{a.fileName}</p>
                    <p className="text-xs text-gray-500">{Math.round(a.fileSize / 1024)} KB</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-full bg-brand-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
