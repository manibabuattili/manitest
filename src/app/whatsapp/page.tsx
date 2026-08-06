"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { WhatsAppSupportDemo } from "@/features/whatsapp/components/whatsapp-support-demo";
import { getLatestPartnerPocTicket } from "@/features/tickets/actions";

const POC_TICKET_KEY = "bluconn-wa-poc-ticket";

type StoredPocTicket = {
  ticketNumber: string;
  customerName?: string;
  phone?: string;
  deepLink?: string;
};

function WhatsAppSupportPageInner() {
  const [scenarioBHref, setScenarioBHref] = useState("/whatsapp?role=poc&scenario=b");
  const [scenarioBLabel, setScenarioBLabel] = useState("Open Scenario B (POC updates)");
  const [scenarioBMeta, setScenarioBMeta] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      let stored: StoredPocTicket | null = null;
      try {
        const raw = localStorage.getItem(POC_TICKET_KEY);
        if (raw) stored = JSON.parse(raw) as StoredPocTicket;
      } catch {
        stored = null;
      }

      if (stored?.ticketNumber) {
        setScenarioBHref(`/whatsapp?role=poc&scenario=b&ticket=${stored.ticketNumber}`);
        setScenarioBLabel(`Open Scenario B · ${stored.ticketNumber}`);
        setScenarioBMeta(
          stored.customerName
            ? `Last internal ticket for ${stored.customerName}${stored.phone ? ` · ${stored.phone}` : ""}`
            : `Last internal ticket ${stored.ticketNumber}`
        );
        return;
      }

      const latest = await getLatestPartnerPocTicket();
      if (latest.ok && latest.ticketNumber) {
        setScenarioBHref(`/whatsapp?role=poc&scenario=b&ticket=${latest.ticketNumber}`);
        setScenarioBLabel(`Open Scenario B · ${latest.ticketNumber}`);
        setScenarioBMeta(
          `Internal ticket for ${latest.customerName}${latest.phone ? ` · ${latest.phone}` : ""}`
        );
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#dcf8c6_0%,_#e8f5e9_35%,_#f0f4f8_100%)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10 lg:px-8 lg:py-10">
        <div className="w-full max-w-md shrink-0 lg:pt-4">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portals
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#075E54]">
            WhatsApp channel
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Raise support from the field — or as a POC
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Scenario A is field-raised. Scenario B shows tickets created from the Partner Portal for
            a POC — with the same View &amp; Reply update style as support replies.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#075E54]">
                Scenario A · Field raise
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-gray-600">
                <li>1. Send <strong>Support</strong> → Raise Support Ticket → create SUP-2027.</li>
                <li>2. Partner Portal replies → View &amp; Reply here.</li>
              </ol>
              <Link
                href="/whatsapp?ticket=SUP-2027"
                className="mt-3 inline-flex rounded-lg bg-[#075E54] px-3 py-2 text-sm font-semibold text-white hover:bg-[#064e47]"
              >
                Open Scenario A →
              </Link>
            </div>

            <div className="rounded-2xl border border-[#25D366]/35 bg-[#ecfdf3]/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#065f46]">
                Scenario B · Partner / internal raise → POC WhatsApp
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-gray-600">
                <li>1. Partner Portal → Raise Ticket → select Account + POC.</li>
                <li>2. Create the ticket (internal portal).</li>
                <li>3. Click Scenario B below — WhatsApp shows that ticket + View &amp; Reply updates.</li>
              </ol>
              {scenarioBMeta && (
                <p className="mt-2 text-xs font-medium text-[#047857]">{scenarioBMeta}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={scenarioBHref}
                  className="inline-flex rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1ebe57]"
                >
                  {scenarioBLabel} →
                </Link>
                <Link
                  href="/partner/support"
                  className="inline-flex rounded-lg border border-[#075E54]/30 bg-white px-3 py-2 text-sm font-semibold text-[#065f46] hover:bg-white/80"
                >
                  Raise in Partner Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        <WhatsAppSupportDemo />
      </div>
    </main>
  );
}

export default function WhatsAppSupportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading WhatsApp…</div>}>
      <WhatsAppSupportPageInner />
    </Suspense>
  );
}
