"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadZone, type UploadFileItem } from "@/components/tickets/file-upload";
import { createTicketAction } from "@/features/tickets/actions";
import { filesToAttachmentInputs } from "@/lib/attachments";

type Option = { id: string; name: string };
type CustomerOption = Option & { company: string; phone: string | null };

export function CreateTicketDrawer({
  open,
  onOpenChange,
  companies,
  customers,
  components,
  labels,
  agents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: string[];
  customers: CustomerOption[];
  components: Option[];
  labels: Option[];
  agents: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [account, setAccount] = useState("");
  const [pocId, setPocId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [componentId, setComponentId] = useState("");
  const [labelId, setLabelId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const pocOptions = useMemo(
    () => (account ? customers.filter((c) => c.company === account) : customers),
    [account, customers]
  );

  const selectedPoc = useMemo(
    () => customers.find((c) => c.id === pocId) ?? null,
    [customers, pocId]
  );

  const canSubmit =
    !!account &&
    !!pocId &&
    subject.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !!componentId &&
    !!labelId &&
    !pending;

  function reset() {
    setAccount("");
    setPocId("");
    setSubject("");
    setDescription("");
    setComponentId("");
    setLabelId("");
    setAssigneeId("");
    setFiles([]);
  }

  function onSubmit() {
    if (!pocId) {
      toast.error("Select a POC — they receive WhatsApp ticket updates");
      return;
    }
    startTransition(async () => {
      try {
        const attachments = await filesToAttachmentInputs(files.map((f) => f.file));
        const result = await createTicketAction({
          subject: subject.trim(),
          description: description.trim(),
          componentId,
          labelIds: labelId ? [labelId] : [],
          customerId: pocId,
          accountCompany: account || undefined,
          assigneeId: assigneeId || undefined,
          priority: "MEDIUM",
          source: "PORTAL",
          notifyWhatsApp: true,
          attachments,
        });
        if (!result.ok) {
          toast.error("Could not create ticket");
          return;
        }

        const number = result.ticket.ticketNumber;
        if (result.whatsapp.notified) {
          const deepLink = result.whatsapp.deepLink;
          try {
            localStorage.setItem(
              "bluconn-wa-poc-ticket",
              JSON.stringify({
                ticketNumber: number,
                customerName: result.whatsapp.customerName,
                phone: result.whatsapp.phone,
                deepLink,
              })
            );
          } catch {
            /* ignore */
          }
          toast.success(
            `Ticket ${number} raised. Updates sent to ${result.whatsapp.customerName} on WhatsApp.`,
            {
              duration: 9000,
              action: {
                label: "Open Scenario B",
                onClick: () => {
                  window.location.href = deepLink;
                },
              },
            }
          );
        } else {
          toast.success(`Ticket ${number} raised successfully`);
        }

        reset();
        onOpenChange(false);
        router.push(`/partner/support/${number}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader onClose={() => onOpenChange(false)}>
        <h2 className="text-lg font-semibold text-gray-900">Create Ticket</h2>
        <p className="text-sm text-gray-500">
          Raise a ticket for a customer POC — they get WhatsApp updates
        </p>
      </SheetHeader>
      <SheetBody className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Select Account <span className="text-red-500">*</span>
          </Label>
          <Select
            value={account}
            onValueChange={(v) => {
              setAccount(v);
              setPocId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Select POC <span className="text-red-500">*</span>
          </Label>
          <Select value={pocId} onValueChange={setPocId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {pocOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPoc ? (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-[#25D366]/30 bg-[#ecfdf3] px-3 py-2.5 text-sm text-[#065f46]">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  WhatsApp updates → {selectedPoc.name}
                  {selectedPoc.phone ? ` · ${selectedPoc.phone}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-[#047857]">
                  Ticket creation and every support reply will be sent to this POC on WhatsApp so
                  they can view &amp; respond (Scenario B).
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Choose the person who should receive WhatsApp updates and reply on this ticket.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Subject <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="E.g. Marketing site redesign"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="Enter a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[110px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Attachments</Label>
          <FileUploadZone files={files} onFiles={setFiles} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>
              Component <span className="text-red-500">*</span>
            </Label>
            <Select value={componentId} onValueChange={setComponentId}>
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
          </div>
          <div className="space-y-1.5">
            <Label>
              Label <span className="text-red-500">*</span>
            </Label>
            <Select value={labelId} onValueChange={setLabelId}>
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
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Assign To</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
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
        </div>
      </SheetBody>
      <SheetFooter>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            onOpenChange(false);
          }}
        >
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={onSubmit}>
          {pending ? "Creating..." : "Create & notify WhatsApp"}
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
