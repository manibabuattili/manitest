import Link from "next/link";
import { LifeBuoy, Headphones, MessageCircle, CalendarCheck2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#ecfdf3_0%,_#f9fafb_45%,_#eef2ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-gray-900">Bluconn</p>
            <p className="text-sm text-gray-500">Support Portal MVP</p>
          </div>
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Customer, partner & WhatsApp support in one place
        </h1>
        <p className="mt-4 max-w-xl text-base text-gray-600">
          Raise tickets from the customer portal or WhatsApp, track SLA, and collaborate in a
          Freshdesk-style workspace built for Bluconn.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/attendance"
            className="group rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Attendance Report</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manager prototype: add or regularize check in, check out, and shift.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-brand-700 group-hover:underline">
              Open attendance →
            </span>
          </Link>

          <Link
            href="/support"
            className="group rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Customer Portal</h2>
            <p className="mt-1 text-sm text-gray-500">
              My Tickets, raise issues, and follow the conversation timeline.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-brand-700 group-hover:underline">
              Open customer support →
            </span>
          </Link>

          <Link
            href="/partner/support"
            className="group rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Headphones className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Partner Portal</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ticket queue, assignment, status, labels, SLA, and internal notes.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-brand-700 group-hover:underline">
              Open partner support →
            </span>
          </Link>

          <Link
            href="/whatsapp"
            className="group rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#25D366]/60 hover:shadow-md sm:col-span-2 lg:col-span-1"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#075E54]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp Support</h2>
            <p className="mt-1 text-sm text-gray-500">
              Mobile chat experience — keyword Support, in-app form, and ticket updates.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-[#075E54] group-hover:underline">
              Open WhatsApp demo →
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
