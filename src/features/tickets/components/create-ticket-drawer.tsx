"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { FileUploadZone } from "@/components/tickets/file-upload";
import { createTicketAction } from "@/features/tickets/actions";

type Option = { id: string; name: string };
type CustomerOption = Option & { company: string };

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
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);

  const pocOptions = useMemo(
    () => (account ? customers.filter((c) => c.company === account) : customers),
    [account, customers]
  );

  const canSubmit =
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
    startTransition(async () => {
      const result = await createTicketAction({
        subject: subject.trim(),
        description: description.trim(),
        componentId,
        labelIds: labelId ? [labelId] : [],
        customerId: pocId || undefined,
        accountCompany: account || undefined,
        assigneeId: assigneeId || undefined,
        priority: "MEDIUM",
      });
      if (!result.ok) {
        toast.error("Could not create ticket");
        return;
      }
      toast.success("Ticket Raised Successfully");
      reset();
      onOpenChange(false);
      router.push(`/partner/support/${result.ticket.ticketNumber}`);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader onClose={() => onOpenChange(false)}>
        <h2 className="text-lg font-semibold text-gray-900">Create Ticket</h2>
        <p className="text-sm text-gray-500">Raise a ticket for a customer</p>
      </SheetHeader>
      <SheetBody className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Select Account <span className="text-red-500">*</span>
          </Label>
          <Select value={account} onValueChange={setAccount}>
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
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <FileUploadZone
            files={files}
            onFiles={(list) => {
              if (!list) return;
              setFiles(Array.from(list).map((f) => ({ name: f.name, size: f.size })));
            }}
          />
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
          <Label>
            Assign To <span className="text-red-500">*</span>
          </Label>
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
          {pending ? "Creating..." : "Create"}
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
