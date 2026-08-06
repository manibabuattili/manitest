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
            Raise support from the field — or as a POC
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Site engineers can raise tickets here. When a partner agent raises a ticket and picks a
            POC, that person also gets create + reply updates on their WhatsApp number and can
            respond from this chat.
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
                className="mt-3 inline-flex text-sm font-semibold text-[#075E54] hover:underline"
              >
                Resume SUP-2027 →
              </Link>
            </div>

            <div className="rounded-2xl border border-[#25D366]/35 bg-[#ecfdf3]/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#065f46]">
                Scenario B · Partner → POC WhatsApp
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-gray-600">
                <li>1. Partner Portal → Raise Ticket → select Account + POC (see WhatsApp number).</li>
                <li>2. Create ticket — toast links to this POC WhatsApp inbox.</li>
                <li>3. Agent replies in Partner Portal → POC gets View &amp; Reply here.</li>
              </ol>
              <Link
                href="/partner/support"
                className="mt-3 inline-flex text-sm font-semibold text-[#065f46] hover:underline"
              >
                Open Partner Portal →
              </Link>
            </div>
          </div>
        </div>

        <WhatsAppSupportDemo />
      </div>
    </main>
  );
}
