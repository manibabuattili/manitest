import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WhatsAppSupportDemo } from "@/features/whatsapp/components/whatsapp-support-demo";

export default function WhatsAppSupportPage() {
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
            Raise support from the field
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Site engineers contact Bluconn Support in WhatsApp. Keyword{" "}
            <span className="font-semibold text-gray-800">Support</span> opens an in-app form —
            tickets sync live to the Partner Portal.
          </p>
          <ol className="mt-6 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="font-semibold text-[#075E54]">1.</span>
              Send <strong>Support</strong>, tap Raise Support Ticket, create SUP-2027.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[#075E54]">2.</span>
              Open Partner Portal → ticket SUP-2027 → assign, label Bug, component Attendance,
              reply.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-[#075E54]">3.</span>
              Return here — View &amp; Reply opens the in-app ticket thread.
            </li>
          </ol>
          <Link
            href="/partner/support"
            className="mt-6 inline-flex rounded-lg bg-[#075E54] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#064e47]"
          >
            Open Partner Portal →
          </Link>
        </div>

        <WhatsAppSupportDemo />
      </div>
    </main>
  );
}
