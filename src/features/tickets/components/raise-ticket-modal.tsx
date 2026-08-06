"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUploadZone, type UploadFileItem } from "@/components/tickets/file-upload";
import { createTicketAction } from "@/features/tickets/actions";
import { filesToAttachmentInputs } from "@/lib/attachments";

export function RaiseTicketModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10 && !pending;

  function reset() {
    setSubject("");
    setDescription("");
    setFiles([]);
  }

  function onSubmit() {
    startTransition(async () => {
      try {
        const attachments = await filesToAttachmentInputs(files.map((f) => f.file));
        const result = await createTicketAction({
          subject: subject.trim(),
          description: description.trim(),
          priority: "MEDIUM",
          source: "PORTAL",
          attachments,
        });
        if (!result.ok) {
          toast.error("Could not create ticket. Check required fields.");
          return;
        }
        toast.success("Ticket Raised Successfully");
        reset();
        onOpenChange(false);
        router.push(`/support/${result.ticket.ticketNumber}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Raise Ticket</DialogTitle>
          <DialogDescription>Provide the issue details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter your Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Describe your Issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <FileUploadZone files={files} onFiles={setFiles} />
        </div>

        <DialogFooter className="mt-2 justify-between sm:justify-between">
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
            {pending ? "Creating..." : "Create Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
