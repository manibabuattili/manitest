"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Phone,
  Send,
  Smile,
  Video,
  X,
  Camera,
  Mic,
  Lock,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTicketAction,
  getLatestPartnerPocTicket,
  getWhatsAppTicketSnapshot,
  replyToTicketAction,
} from "@/features/tickets/actions";
import { WHATSAPP_DEMO_TICKET } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ChatKind = "text" | "cta" | "system";

type ChatMessage = {
  id: string;
  from: "user" | "bot" | "system";
  kind: ChatKind;
  text: string;
  time: Date;
  ctaLabel?: string;
  ctaAction?: "raise" | "view";
  status?: "sent" | "delivered" | "read";
};

type BrowserMode = null | "raise" | "view" | "success-create" | "success-reply";

type TicketSnap = NonNullable<
  Awaited<ReturnType<typeof getWhatsAppTicketSnapshot>>["ticket"]
>;

const RAISE_SUBJECT =
  "Multiple Employees Showing Absent Despite Successful Check-in";
const RAISE_DESCRIPTION =
  "Around 18 workers checked in through WhatsApp today between 8:00 AM and 8:30 AM, but they are still marked as Absent in the portal. This is affecting today's payroll. Please investigate.";
const REPLY_BODY = `The issue occurred at Metro Line-4 Construction Site.
The affected Employee IDs are EMP1023, EMP1088, and EMP1115.
Please find the attendance report screenshot attached.`;

const STORAGE_KEY = "bluconn-wa-support-demo";

type PersistedDemo = {
  role: "field" | "poc";
  ticketNumber: string;
  ticketId: string;
  seenSupportIds: string[];
  repliedToSupportIds: string[];
};

function loadPersisted(): PersistedDemo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDemo;
  } catch {
    return null;
  }
}

function savePersisted(data: PersistedDemo) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nowTime() {
  return format(new Date(), "h:mm a");
}

function Tick({ status }: { status?: ChatMessage["status"] }) {
  if (!status) return null;
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />;
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />;
  return <Check className="h-3.5 w-3.5 text-[#8696a0]" />;
}

export function WhatsAppSupportDemo() {
  const searchParams = useSearchParams();
  const scenarioKey = `${searchParams.get("role") ?? ""}:${searchParams.get("scenario") ?? ""}:${searchParams.get("ticket") ?? ""}`;
  const [input, setInput] = useState("");
  const [role, setRole] = useState<"field" | "poc">("field");
  const [pocLabel, setPocLabel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "bot",
      kind: "text",
      text: "Hi! You're chatting with Bluconn Support. Type Support if you need help with attendance, payroll, or any Bluconn product issue.",
      time: new Date(),
    },
  ]);
  const [browser, setBrowser] = useState<BrowserMode>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketSnap, setTicketSnap] = useState<TicketSnap | null>(null);
  const [pending, startTransition] = useTransition();
  const [raiseSubject, setRaiseSubject] = useState("");
  const [raiseDescription, setRaiseDescription] = useState("");
  const [raiseFile, setRaiseFile] = useState<{ name: string; size: number } | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyFile, setReplyFile] = useState<{ name: string; size: number } | null>(null);
  const [successText, setSuccessText] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef(false);
  const seenSupportRef = useRef<Set<string>>(new Set());
  const repliedSupportRef = useRef<Set<string>>(new Set());
  const restoredKeyRef = useRef<string | null>(null);
  const roleRef = useRef<"field" | "poc">("field");

  const pushMessage = useCallback((msg: Omit<ChatMessage, "id" | "time"> & { id?: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        ...msg,
        id: msg.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: new Date(),
      },
    ]);
  }, []);

  const persist = useCallback((ticketNumberValue: string, ticketIdValue: string, roleValue?: "field" | "poc") => {
    const nextRole = roleValue ?? roleRef.current;
    roleRef.current = nextRole;
    savePersisted({
      role: nextRole,
      ticketNumber: ticketNumberValue,
      ticketId: ticketIdValue,
      seenSupportIds: Array.from(seenSupportRef.current),
      repliedToSupportIds: Array.from(repliedSupportRef.current),
    });
  }, []);

  // Restore session / Scenario A|B from URL
  useEffect(() => {
    if (restoredKeyRef.current === scenarioKey) return;
    restoredKeyRef.current = scenarioKey;
    seenSupportRef.current = new Set();
    repliedSupportRef.current = new Set();

    async function restore() {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("ticket");
      const roleParam = params.get("role") === "poc" ? "poc" : null;
      const scenarioA = params.get("scenario") === "a";
      const scenarioB = params.get("scenario") === "b";

      // Scenario A: fresh field raise — keyword "Support" to open the form
      if (scenarioA) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
          // keep bluconn-wa-poc-ticket for Scenario B
        } catch {
          /* ignore */
        }
        setRole("field");
        roleRef.current = "field";
        setTicketNumber(null);
        setTicketId(null);
        setTicketSnap(null);
        setPocLabel(null);
        setBrowser(null);
        setMessages([
          {
            id: "welcome",
            from: "bot",
            kind: "text",
            text: "Hi! You're chatting with Bluconn Support. Type Support if you need help with attendance, payroll, or any Bluconn product issue.",
            time: new Date(),
          },
        ]);
        return;
      }

      const saved = loadPersisted();

      let number = fromQuery || (scenarioB ? null : null) || null;
      // Don't auto-restore field tickets when opening plain /whatsapp — only with ticket= or scenario=b
      if (!number && !scenarioB && saved?.role === "field" && fromQuery) {
        number = saved.ticketNumber;
      }
      if (scenarioB && !number) {
        try {
          const raw = localStorage.getItem("bluconn-wa-poc-ticket");
          if (raw) {
            const parsed = JSON.parse(raw) as { ticketNumber?: string };
            number = parsed.ticketNumber || null;
          }
        } catch {
          /* ignore */
        }
      }
      if (scenarioB && !number) {
        const latest = await getLatestPartnerPocTicket();
        if (latest.ok && latest.ticketNumber) number = latest.ticketNumber;
      }

      const nextRole: "field" | "poc" =
        roleParam || (scenarioB ? "poc" : null) || (fromQuery && saved?.role) || "field";

      if (scenarioB && !number) {
        setRole("poc");
        roleRef.current = "poc";
        setMessages([
          {
            id: "poc-empty",
            from: "bot",
            kind: "text",
            text: "No partner-raised ticket yet. Ask a support agent to Raise Ticket in the Partner Portal for a POC, then open Scenario B again.",
            time: new Date(),
          },
        ]);
        return;
      }

      if (!number) return;

      const result = await getWhatsAppTicketSnapshot(number);
      if (!result.ok || !result.ticket) {
        if (scenarioB) {
          setMessages([
            {
              id: "poc-missing",
              from: "bot",
              kind: "text",
              text: `Could not find ticket ${number}. Raise a ticket from Partner Portal, then reopen Scenario B.`,
              time: new Date(),
            },
          ]);
        }
        return;
      }

      // Fresh deep-link / Scenario B wins over stale session seen-ids
      if (saved?.seenSupportIds && !roleParam && !fromQuery && !scenarioB) {
        seenSupportRef.current = new Set(saved.seenSupportIds);
      }
      if (saved?.repliedToSupportIds && !roleParam && !fromQuery && !scenarioB) {
        repliedSupportRef.current = new Set(saved.repliedToSupportIds);
      }

      setRole(nextRole);
      roleRef.current = nextRole;
      setTicketNumber(result.ticket.ticketNumber);
      setTicketId(result.ticket.id);
      setTicketSnap(result.ticket);
      const pocName = result.ticket.customer.name;
      const pocPhone = result.ticket.customer.phone;
      setPocLabel(pocPhone ? `${pocName} · ${pocPhone}` : pocName);

      if (nextRole === "poc" || scenarioB) {
        try {
          localStorage.setItem(
            "bluconn-wa-poc-ticket",
            JSON.stringify({
              ticketNumber: result.ticket.ticketNumber,
              customerName: pocName,
              phone: pocPhone,
              deepLink: `/whatsapp?role=poc&scenario=b&ticket=${result.ticket.ticketNumber}`,
            })
          );
        } catch {
          /* ignore */
        }

        const supportMessages = result.ticket.messages.filter((m) => m.senderType === "SUPPORT");
        const firstSupport = supportMessages[0] ?? null;
        const latest = result.ticket.latestSupportReply;

        const restoredMessages: ChatMessage[] = [
          {
            id: "welcome-poc",
            from: "bot",
            kind: "text",
            text: `Hi ${pocName}! Bluconn Support messages you here when a partner agent raises a ticket with you as the POC.`,
            time: new Date(result.ticket.createdAt),
          },
          {
            id: "poc-raised",
            from: "bot",
            kind: "cta",
            text:
              firstSupport?.body ??
              `Your support ticket ${result.ticket.ticketNumber} has been created successfully by Bluconn Support.\n\nSubject: ${result.ticket.subject}\n\nWe'll update you here whenever there is progress.`,
            time: new Date(firstSupport?.createdAt ?? result.ticket.createdAt),
            ctaLabel: "View & Reply",
            ctaAction: "view",
          },
        ];

        if (firstSupport) seenSupportRef.current.add(firstSupport.id);

        if (latest && latest.id !== firstSupport?.id) {
          seenSupportRef.current.add(latest.id);
          restoredMessages.push({
            id: `update-${latest.id}`,
            from: "bot",
            kind: "cta",
            text: `You have received a new update on your support ticket ${result.ticket.ticketNumber}.`,
            time: new Date(latest.createdAt),
            ctaLabel: "View & Reply",
            ctaAction: "view",
          });
          if (repliedSupportRef.current.has(latest.id)) {
            restoredMessages.push({
              id: "thanks",
              from: "bot",
              kind: "text",
              text: "Thanks! We have received your additional information. Our support team is investigating the issue and will update you soon.",
              time: new Date(),
            });
          }
        }

        setMessages(restoredMessages);
        persist(result.ticket.ticketNumber, result.ticket.id, "poc");
        return;
      }

      // Field ticket deep-link (e.g. ?ticket=SUP-2027) — restore progress after raise
      persist(result.ticket.ticketNumber, result.ticket.id, "field");

      const restoredMessages: ChatMessage[] = [
        {
          id: "welcome",
          from: "bot",
          kind: "text",
          text: "Hi! You're chatting with Bluconn Support. Type Support if you need help with attendance, payroll, or any Bluconn product issue.",
          time: new Date(result.ticket.createdAt),
        },
        {
          id: "user-support",
          from: "user",
          kind: "text",
          text: "Support",
          time: new Date(result.ticket.createdAt),
          status: "read",
        },
        {
          id: "raise-cta",
          from: "bot",
          kind: "cta",
          text: "Need help? Please click the button below to provide more details so our support team can investigate your issue.",
          time: new Date(result.ticket.createdAt),
          ctaLabel: "Raise Support Ticket",
          ctaAction: "raise",
        },
        {
          id: "created",
          from: "bot",
          kind: "text",
          text: `Your ticket ${result.ticket.ticketNumber} has been created successfully. We'll update you here whenever there is progress.`,
          time: new Date(result.ticket.createdAt),
        },
      ];

      const latest = result.ticket.latestSupportReply;
      if (latest) {
        const alreadyReplied = repliedSupportRef.current.has(latest.id);
        seenSupportRef.current.add(latest.id);
        restoredMessages.push({
          id: `update-${latest.id}`,
          from: "bot",
          kind: "cta",
          text: `You have received a new update on your support ticket ${result.ticket.ticketNumber}.`,
          time: new Date(latest.createdAt),
          ctaLabel: "View & Reply",
          ctaAction: "view",
        });
        if (alreadyReplied) {
          restoredMessages.push({
            id: "thanks",
            from: "bot",
            kind: "text",
            text: "Thanks! We have received your additional information. Our support team is investigating the issue and will update you soon.",
            time: new Date(),
          });
        }
      }

      setMessages(restoredMessages);
      persist(result.ticket.ticketNumber, result.ticket.id, "field");
    }

    void restore();
  }, [persist, scenarioKey]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, browser]);

  // Poll partner replies after ticket is created
  useEffect(() => {
    if (!ticketNumber || browser) return;
    let cancelled = false;

    async function poll() {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const result = await getWhatsAppTicketSnapshot(ticketNumber!);
        if (cancelled || !result.ok || !result.ticket) return;
        setTicketSnap(result.ticket);
        setTicketId(result.ticket.id);

        const latest = result.ticket.latestSupportReply;
        if (latest && !seenSupportRef.current.has(latest.id)) {
          seenSupportRef.current.add(latest.id);
          persist(result.ticket.ticketNumber, result.ticket.id);
          pushMessage({
            from: "bot",
            kind: "cta",
            text: `You have received a new update on your support ticket ${result.ticket.ticketNumber}.`,
            ctaLabel: "View & Reply",
            ctaAction: "view",
          });
        }
      } finally {
        pollingRef.current = false;
      }
    }

    poll();
    const id = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ticketNumber, browser, pushMessage, persist]);

  function sendUserText(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    pushMessage({ from: "user", kind: "text", text, status: "read" });

    if (role === "poc") {
      setTimeout(() => {
        pushMessage({
          from: "bot",
          kind: "text",
          text: ticketNumber
            ? `You're the POC for ${ticketNumber}. When support replies, you'll get a View & Reply button here.`
            : "You're in POC inbox mode. Open a partner-raised ticket link to follow updates.",
        });
      }, 400);
      return;
    }

    if (/^support$/i.test(text)) {
      setTimeout(() => {
        pushMessage({
          from: "bot",
          kind: "cta",
          text: "Need help? Please click the button below to provide more details so our support team can investigate your issue.",
          ctaLabel: "Raise Support Ticket",
          ctaAction: "raise",
        });
      }, 450);
    }
  }

  function openRaise() {
    setRaiseSubject("");
    setRaiseDescription("");
    setRaiseFile(null);
    setBrowser("raise");
  }

  async function openView() {
    const result = await getWhatsAppTicketSnapshot(ticketNumber ?? WHATSAPP_DEMO_TICKET);
    if (!result.ok || !result.ticket) {
      toast.error("Ticket not found yet");
      return;
    }
    setTicketSnap(result.ticket);
    setTicketId(result.ticket.id);
    setTicketNumber(result.ticket.ticketNumber);
    setReplyBody("");
    setReplyFile(null);
    setBrowser("view");
  }

  function fillRaiseDemo() {
    setRaiseSubject(RAISE_SUBJECT);
    setRaiseDescription(RAISE_DESCRIPTION);
    setRaiseFile({ name: "attendance_dashboard_error.png", size: 8700 });
  }

  function fillReplyDemo() {
    setReplyBody(REPLY_BODY);
    setReplyFile({ name: "attendance_report.png", size: 8620 });
  }

  function createTicket() {
    if (raiseSubject.trim().length < 3 || raiseDescription.trim().length < 10) {
      toast.error("Subject and description are required");
      return;
    }
    startTransition(async () => {
      const result = await createTicketAction({
        subject: raiseSubject.trim(),
        description: raiseDescription.trim(),
        priority: "HIGH",
        source: "WHATSAPP",
        preferredTicketNumber: WHATSAPP_DEMO_TICKET,
        skipAutoReply: true,
        attachments: raiseFile
          ? [
              {
                fileName: raiseFile.name,
                fileSize: raiseFile.size,
                mimeType: "image/png",
                url: `/demo/${raiseFile.name}`,
              },
            ]
          : [],
      });
      if (!result.ok) {
        toast.error("Could not create ticket");
        return;
      }
      const number = result.ticket.ticketNumber;
      setTicketNumber(number);
      setTicketId(result.ticket.id);
      seenSupportRef.current = new Set();
      repliedSupportRef.current = new Set();
      persist(number, result.ticket.id, "field");
      setRole("field");
      roleRef.current = "field";
      setSuccessText(
        `Your support ticket has been created successfully. Ticket ID: ${number}.`
      );
      setBrowser("success-create");
      setTimeout(() => {
        setBrowser(null);
        pushMessage({
          from: "bot",
          kind: "text",
          text: `Your ticket ${number} has been created successfully. We'll update you here whenever there is progress.`,
        });
      }, 1800);
    });
  }

  function sendCustomerReply() {
    if (!ticketId || !replyBody.trim()) {
      toast.error("Enter a reply message");
      return;
    }
    startTransition(async () => {
      const result = await replyToTicketAction({
        ticketId,
        body: replyBody.trim(),
        asAgent: false,
        isInternal: false,
        attachments: replyFile
          ? [
              {
                fileName: replyFile.name,
                fileSize: replyFile.size,
                mimeType: "image/png",
                url: `/demo/${replyFile.name}`,
              },
            ]
          : [],
      });
      if (!result.ok) {
        toast.error(typeof result.error === "string" ? result.error : "Reply failed");
        return;
      }
      if (ticketSnap?.latestSupportReply?.id) {
        repliedSupportRef.current.add(ticketSnap.latestSupportReply.id);
      }
      if (ticketNumber && ticketId) {
        persist(ticketNumber, ticketId);
      }
      setSuccessText("Your response has been sent successfully.");
      setBrowser("success-reply");
      setTimeout(() => {
        setBrowser(null);
        pushMessage({
          from: "bot",
          kind: "text",
          text: "Thanks! We have received your additional information. Our support team is investigating the issue and will update you soon.",
        });
      }, 1800);
    });
  }

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="overflow-hidden rounded-[2rem] border-[8px] border-[#1f2c34] bg-[#0b141a] shadow-2xl shadow-black/30">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-[#1f2c34] px-5 pb-1 pt-2 text-[11px] font-medium text-white">
          <span>{nowTime()}</span>
          <div className="flex items-center gap-1.5 opacity-80">
            <span className="tracking-wider">▌▌▌</span>
            <span>Wi‑Fi</span>
            <span className="rounded-[2px] border border-white/80 px-0.5 text-[9px]">100</span>
          </div>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-3 bg-[#1f2c34] px-3 py-2.5 text-white">
          <ArrowLeft className="h-5 w-5 shrink-0 opacity-90" />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-sm font-bold">
            B
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-medium leading-tight">Bluconn Support</p>
            <p className="truncate text-[12px] text-[#8696a0]">
              {role === "poc" && pocLabel ? `POC inbox · ${pocLabel}` : "online"}
            </p>
          </div>
          <Video className="h-5 w-5 opacity-90" />
          <Phone className="h-5 w-5 opacity-90" />
          <MoreVertical className="h-5 w-5 opacity-90" />
        </div>

        {/* Chat body */}
        <div className="relative h-[640px] bg-[#0b141a]">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />

          <div ref={scrollerRef} className="absolute inset-0 overflow-y-auto px-3 pb-24 pt-3">
            <div className="mb-3 flex justify-center">
              <span className="rounded-lg bg-[#182229] px-3 py-1 text-[11px] text-[#8696a0] shadow">
                Today
              </span>
            </div>
            <div className="mb-3 flex justify-center">
              <span className="inline-flex max-w-[85%] items-center gap-1 rounded-lg bg-[#182229] px-3 py-1.5 text-center text-[11px] leading-snug text-[#8696a0] shadow">
                <Lock className="h-3 w-3 shrink-0" />
                {role === "poc"
                  ? "POC mode — partner-raised ticket updates arrive on this WhatsApp number."
                  : "Messages are end-to-end encrypted. Only people in this chat can read them."}
              </span>
            </div>

            <div className="space-y-2">
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  message={m}
                  onCta={(action) => {
                    if (action === "raise") openRaise();
                    if (action === "view") void openView();
                  }}
                />
              ))}
            </div>
          </div>

          {/* Composer */}
          {!browser && (
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 bg-gradient-to-t from-[#0b141a] via-[#0b141a] to-transparent px-2 pb-3 pt-6">
              <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-full bg-[#1f2c34] px-3 py-2 text-white">
                <Smile className="h-5 w-5 shrink-0 text-[#8696a0]" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendUserText(input);
                    }
                  }}
                  placeholder="Message"
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#8696a0]"
                />
                {role !== "poc" && (
                  <button
                    type="button"
                    className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-[#00a884] hover:bg-white/5"
                    onClick={() => sendUserText("Support")}
                  >
                    Support
                  </button>
                )} <Paperclip className="h-5 w-5 shrink-0 text-[#8696a0]" />
                <Camera className="h-5 w-5 shrink-0 text-[#8696a0]" />
              </div>
              <button
                type="button"
                onClick={() => (input.trim() ? sendUserText(input) : undefined)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-lg"
                aria-label="Send"
              >
                {input.trim() ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* In-app browser */}
          {browser && (
            <InAppBrowser
              title={
                browser === "raise" || browser === "success-create"
                  ? "support.bluconn.com/raise"
                  : `support.bluconn.com/tickets/${ticketNumber ?? WHATSAPP_DEMO_TICKET}`
              }
              onClose={() => setBrowser(null)}
            >
              {(browser === "success-create" || browser === "success-reply") && (
                <SuccessPanel text={successText} />
              )}

              {browser === "raise" && (
                <RaiseTicketForm
                  subject={raiseSubject}
                  description={raiseDescription}
                  file={raiseFile}
                  pending={pending}
                  onSubject={setRaiseSubject}
                  onDescription={setRaiseDescription}
                  onFile={setRaiseFile}
                  onFillDemo={fillRaiseDemo}
                  onCancel={() => setBrowser(null)}
                  onSubmit={createTicket}
                />
              )}

              {browser === "view" && ticketSnap && (
                <TicketReplyView
                  ticket={ticketSnap}
                  replyBody={replyBody}
                  replyFile={replyFile}
                  pending={pending}
                  onReplyBody={setReplyBody}
                  onReplyFile={setReplyFile}
                  onFillDemo={fillReplyDemo}
                  onSend={sendCustomerReply}
                />
              )}
            </InAppBrowser>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-gray-500">
        Mobile WhatsApp experience · In-app browser (not external)
      </p>
    </div>
  );
}

function ChatBubble({
  message,
  onCta,
}: {
  message: ChatMessage;
  onCta: (action: "raise" | "view") => void;
}) {
  const isUser = message.from === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-2.5 pb-1.5 pt-1.5 text-[14.5px] leading-snug shadow-sm",
          isUser
            ? "rounded-tr-none bg-[#005c4b] text-[#e9edef]"
            : "rounded-tl-none bg-[#202c33] text-[#e9edef]"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.kind === "cta" && message.ctaLabel && message.ctaAction && (
          <button
            type="button"
            onClick={() => onCta(message.ctaAction!)}
            className="mt-2 w-full rounded-md border border-[#00a884]/40 bg-[#00a884]/10 py-2 text-center text-sm font-semibold text-[#00a884] transition hover:bg-[#00a884]/20"
          >
            {message.ctaLabel}
          </button>
        )}
        <div
          className={cn(
            "mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#8696a0]",
            isUser && "text-[#99beb5]"
          )}
        >
          <span>{format(message.time, "h:mm a")}</span>
          {isUser && <Tick status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function InAppBrowser({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#111b21]" style={{ animation: "waSlideUp .28s ease-out" }}>
      <div className="flex items-center gap-2 bg-[#1f2c34] px-2 py-2 text-white">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/10"
          aria-label="Close in-app browser"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 rounded-full bg-[#0b141a] px-3 py-1.5">
            <Lock className="h-3 w-3 text-[#00a884]" />
            <p className="truncate text-[12px] text-[#e9edef]">{title}</p>
          </div>
        </div>
        <button type="button" className="rounded-full p-1.5 hover:bg-white/10" aria-label="Refresh">
          <RotateCw className="h-4 w-4 text-[#8696a0]" />
        </button>
        <MoreVertical className="h-5 w-5 text-[#8696a0]" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6f8]">{children}</div>
      <div className="border-t border-black/10 bg-[#1f2c34] px-3 py-2 text-center text-[10px] text-[#8696a0]">
        WhatsApp In-App Browser · stays inside WhatsApp
      </div>
    </div>
  );
}

function SuccessPanel({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d1fadf] text-[#039855] shadow-sm">
        <Check className="h-8 w-8" strokeWidth={2.5} />
      </div>
      <p className="text-base font-semibold leading-relaxed text-gray-900">{text}</p>
      <p className="text-xs text-gray-500">Returning to WhatsApp…</p>
    </div>
  );
}

function RaiseTicketForm({
  subject,
  description,
  file,
  pending,
  onSubject,
  onDescription,
  onFile,
  onFillDemo,
  onCancel,
  onSubmit,
}: {
  subject: string;
  description: string;
  file: { name: string; size: number } | null;
  pending: boolean;
  onSubject: (v: string) => void;
  onDescription: (v: string) => void;
  onFile: (f: { name: string; size: number } | null) => void;
  onFillDemo: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10 && !pending;

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#039855] text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Bluconn Support</p>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Raise Support Ticket</h2>
        <p className="mt-1 text-sm text-gray-500">Provide the issue details below.</p>
      </div>

      <div className="flex-1 space-y-4 px-4 py-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            value={subject}
            onChange={(e) => onSubject(e.target.value)}
            placeholder="Enter your Subject"
            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none ring-brand-500/30 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            placeholder="Describe your Issue"
            className="min-h-[140px] w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-brand-500/30 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Attachments</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center hover:border-brand-400 hover:bg-brand-50/40">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
              <Paperclip className="h-4 w-4 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG or GIF</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile({ name: f.name, size: f.size });
              }}
            />
          </label>
          {file && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700">
                PNG
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-full rounded-full bg-brand-500" />
                </div>
              </div>
            </div>
          )}
          {!file && (
            <button
              type="button"
              onClick={() => onFile({ name: "attendance_dashboard_error.png", size: 8700 })}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Use demo screenshot: attendance_dashboard_error.png
            </button>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 space-y-2 border-t border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onFillDemo}
          className="w-full rounded-lg border border-dashed border-brand-300 bg-brand-50/60 py-2 text-xs font-semibold text-brand-700"
        >
          Prefill demo scenario values
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="h-11 flex-1 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketReplyView({
  ticket,
  replyBody,
  replyFile,
  pending,
  onReplyBody,
  onReplyFile,
  onFillDemo,
  onSend,
}: {
  ticket: TicketSnap;
  replyBody: string;
  replyFile: { name: string; size: number } | null;
  pending: boolean;
  onReplyBody: (v: string) => void;
  onReplyFile: (f: { name: string; size: number } | null) => void;
  onFillDemo: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {ticket.ticketNumber}
        </p>
        <h2 className="mt-0.5 text-base font-semibold leading-snug text-gray-900">{ticket.subject}</h2>
        <p className="mt-1 text-xs text-gray-500">
          Status · {ticket.status.replace(/_/g, " ")}
          {ticket.assignee ? ` · ${ticket.assignee.name}` : ""}
        </p>
      </div>

      <div className="flex-1 space-y-3 px-3 py-4">
        {ticket.messages.map((m) => {
          const isSupport = m.senderType === "SUPPORT";
          const name = isSupport
            ? m.agent?.name ?? "Bluconn Support"
            : m.customer?.name ?? "You";
          return (
            <div
              key={m.id}
              className={cn("flex", isSupport ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                  isSupport
                    ? "rounded-tl-md border border-gray-200 bg-white"
                    : "rounded-tr-md bg-[#ecfdf3]"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">{name}</span>
                  <span>{format(new Date(m.createdAt), "h:mm a")}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{m.body}</p>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {m.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="truncate font-medium">{a.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {ticket.attachments.length > 0 &&
          ticket.messages.every((m) => !m.attachments?.length) && (
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">Ticket attachments</p>
              {ticket.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-1 flex items-center gap-2 text-xs text-gray-700"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {a.fileName}
                </a>
              ))}
            </div>
          )}
      </div>

      <div className="sticky bottom-0 space-y-2 border-t border-gray-200 bg-white px-3 py-3">
        <textarea
          value={replyBody}
          onChange={(e) => onReplyBody(e.target.value)}
          placeholder="Write your reply…"
          className="min-h-[88px] w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Paperclip className="h-3.5 w-3.5" />
            Attach
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onReplyFile({ name: f.name, size: f.size });
              }}
            />
          </label>
          {replyFile ? (
            <span className="truncate text-xs text-gray-600">{replyFile.name}</span>
          ) : (
            <button
              type="button"
              onClick={() => onReplyFile({ name: "attendance_report.png", size: 8620 })}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Use attendance_report.png
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onFillDemo}
          className="w-full rounded-lg border border-dashed border-brand-300 bg-brand-50/60 py-2 text-xs font-semibold text-brand-700"
        >
          Prefill demo reply
        </button>
        <button
          type="button"
          disabled={!replyBody.trim() || pending}
          onClick={onSend}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {pending ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </div>
  );
}
