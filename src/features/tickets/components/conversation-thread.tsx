"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { replyToTicketAction } from "@/features/tickets/actions";
import { filesToAttachmentInputs } from "@/lib/attachments";

type Message = {
  id: string;
  body: string;
  senderType: "CUSTOMER" | "SUPPORT" | "SYSTEM" | "INTERNAL";
  isInternal: boolean;
  createdAt: Date | string;
  customer?: { name: string; avatarUrl: string | null } | null;
  agent?: { name: string; avatarUrl: string | null } | null;
  attachments?: { id: string; fileName: string; fileSize: number; url?: string; mimeType?: string }[];
};

function AttachmentChip({
  fileName,
  url,
  mimeType,
}: {
  fileName: string;
  url?: string;
  mimeType?: string;
}) {
  const isImage = Boolean(mimeType?.startsWith("image/") || url?.startsWith("data:image"));
  if (isImage && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={fileName} className="max-h-40 max-w-full object-contain" />
        <span className="flex items-center gap-1 border-t border-gray-100 px-2 py-1 text-xs text-gray-600">
          <Paperclip className="h-3 w-3" />
          {fileName}
        </span>
      </a>
    );
  }
  return (
    <a
      href={url || "#"}
      target={url ? "_blank" : undefined}
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-brand-300"
    >
      <Paperclip className="h-3 w-3" />
      {fileName}
    </a>
  );
}

export function ConversationThread({
  ticketId,
  messages,
  asAgent = false,
}: {
  ticketId: string;
  messages: Message[];
  asAgent?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();

  const isInternalDraft = useMemo(() => {
    const trimmed = body.trimStart();
    return asAgent && (trimmed.startsWith("@internal") || trimmed.startsWith("/internal"));
  }, [asAgent, body]);

  function send() {
    const trimmed = body.trim();
    if (!trimmed && files.length === 0) return;
    const isInternal = isInternalDraft;
    const content = isInternal
      ? trimmed.replace(/^@internal\s*/i, "").replace(/^\/internal\s*/i, "").trim()
      : trimmed;
    if (!content && files.length === 0) return;

    startTransition(async () => {
      try {
        const attachments = await filesToAttachmentInputs(files);
        const result = await replyToTicketAction({
          ticketId,
          body: content || (attachments.length ? `Attached ${attachments.length} file(s)` : ""),
          isInternal,
          asAgent,
          attachments,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setBody("");
        setFiles([]);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not attach files");
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
        <span>
          Viewing as{" "}
          <span className="font-semibold text-gray-800">
            {asAgent ? "Bluconn Support (agent)" : "Customer"}
          </span>
        </span>
        <span>Your messages appear on the right</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.map((m) => {
          if (m.senderType === "SYSTEM") {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                  {m.body} · {format(new Date(m.createdAt), "h:mm a")}
                </span>
              </div>
            );
          }

          if (m.senderType === "INTERNAL" || m.isInternal) {
            return (
              <div key={m.id} className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-xs text-brand-700">
                  <span className="font-semibold">
                    Internal note · {m.agent?.name ?? "Bluconn Support"}
                  </span>
                  <span>{format(new Date(m.createdAt), "h:mm a")}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.body}</p>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.attachments.map((a) => (
                      <AttachmentChip key={a.id} fileName={a.fileName} url={a.url} mimeType={a.mimeType} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isSupport = m.senderType === "SUPPORT";
          // Partner portal: agent on right. Customer portal: customer on right.
          const isMine = asAgent ? isSupport : !isSupport;
          const displayName = isSupport
            ? "Bluconn Support"
            : m.customer?.name ?? "Customer";
          const avatar = isSupport ? m.agent?.avatarUrl : m.customer?.avatarUrl;
          const subtitle = isSupport
            ? m.agent?.name
              ? `Agent · ${m.agent.name}`
              : "Support team"
            : "Customer";

          return (
            <div
              key={m.id}
              className={cn("flex gap-3", isMine ? "flex-row-reverse" : "flex-row")}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar ?? undefined} />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[75%]", isMine ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500",
                    isMine && "justify-end"
                  )}
                >
                  <span className="font-semibold text-gray-800">{displayName}</span>
                  <span className="text-gray-400">{subtitle}</span>
                  <span>{format(new Date(m.createdAt), "h:mm a")}</span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm text-gray-800 shadow-sm whitespace-pre-wrap",
                    isMine
                      ? "rounded-tr-md border border-gray-200 bg-white"
                      : "rounded-tl-md bg-gray-100"
                  )}
                >
                  {m.body}
                </div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className={cn("mt-2 flex flex-wrap gap-2", isMine && "justify-end")}>
                    {m.attachments.map((a) => (
                      <AttachmentChip key={a.id} fileName={a.fileName} url={a.url} mimeType={a.mimeType} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <div
          className={cn(
            "rounded-xl border bg-white p-3 shadow-sm transition-colors",
            isInternalDraft ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-200"
          )}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={asAgent ? "Reply as Bluconn Support…" : "Reply as customer…"}
            className="min-h-[72px] w-full resize-none border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600"
                >
                  <Paperclip className="h-3 w-3" />
                  {f.name}
                  <button
                    type="button"
                    className="ml-1 rounded p-0.5 hover:bg-gray-200"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-400">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.svg,.gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = e.target.files;
                  if (!list) return;
                  setFiles((prev) => {
                    const map = new Map(prev.map((f) => [f.name, f]));
                    Array.from(list).forEach((f) => map.set(f.name, f));
                    return Array.from(map.values());
                  });
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="rounded-md p-1.5 hover:bg-gray-100"
                aria-label="Attach"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Emoji">
                <Smile className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="icon"
              disabled={(!body.trim() && files.length === 0) || pending}
              onClick={send}
              className="h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {asAgent
            ? isInternalDraft
              ? "This message will be sent as an internal note."
              : "Tip: Start your message with @internal to create an internal note."
            : "Press Ctrl/⌘ + Enter to send. Attach screenshots with the paperclip."}
        </p>
      </div>
    </div>
  );
}
