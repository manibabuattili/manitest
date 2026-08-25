"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Paperclip, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { replyToTicketAction } from "@/features/tickets/actions";

type Message = {
  id: string;
  body: string;
  senderType: "CUSTOMER" | "SUPPORT" | "SYSTEM" | "INTERNAL";
  isInternal: boolean;
  createdAt: Date | string;
  customer?: { name: string; avatarUrl: string | null } | null;
  agent?: { name: string; avatarUrl: string | null } | null;
  attachments?: { id: string; fileName: string; fileSize: number }[];
};

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
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const isInternalDraft = useMemo(() => {
    const trimmed = body.trimStart();
    return asAgent && (trimmed.startsWith("@internal") || trimmed.startsWith("/internal"));
  }, [asAgent, body]);

  function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    const isInternal = isInternalDraft;
    const content = isInternal
      ? trimmed.replace(/^@internal\s*/i, "").replace(/^\/internal\s*/i, "").trim()
      : trimmed;
    if (!content) return;

    startTransition(async () => {
      const result = await replyToTicketAction({
        ticketId,
        body: content,
        isInternal,
        asAgent,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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
                  <span className="font-semibold">Internal note · {m.agent?.name ?? "Support"}</span>
                  <span>{format(new Date(m.createdAt), "h:mm a")}</span>
                </div>
                <p className="text-sm text-gray-800">{m.body}</p>
              </div>
            );
          }

          const isSupport = m.senderType === "SUPPORT";
          const name = isSupport ? m.agent?.name ?? "Bluconn Support" : m.customer?.name ?? "Customer";
          const avatar = isSupport ? m.agent?.avatarUrl : m.customer?.avatarUrl;

          return (
            <div
              key={m.id}
              className={cn("flex gap-3", isSupport ? "flex-row-reverse" : "flex-row")}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar ?? undefined} />
                <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[75%]", isSupport ? "items-end" : "items-start")}>
                <div className={cn("mb-1 flex items-center gap-2 text-xs text-gray-500", isSupport && "justify-end")}>
                  <span className="font-medium text-gray-700">{isSupport ? "Bluconn Support" : name}</span>
                  <span>{format(new Date(m.createdAt), "h:mm a")}</span>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm text-gray-800 shadow-sm",
                    isSupport
                      ? "rounded-tr-md border border-gray-200 bg-white"
                      : "rounded-tl-md bg-gray-100"
                  )}
                >
                  {m.body}
                </div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.attachments.map((a) => (
                      <div key={a.id} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                        <Paperclip className="h-3 w-3" />
                        {a.fileName}
                      </div>
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
            placeholder="Message"
            className="min-h-[72px] w-full resize-none border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-400">
              <button type="button" className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Attach">
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Emoji">
                <Smile className="h-4 w-4" />
              </button>
            </div>
            <Button size="icon" disabled={!body.trim() || pending} onClick={send} className="h-9 w-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {asAgent
            ? isInternalDraft
              ? "This message will be sent as an internal note."
              : "Tip: Start your message with @internal to create an internal note."
            : "Press Ctrl/⌘ + Enter to send."}
        </p>
      </div>
    </div>
  );
}
