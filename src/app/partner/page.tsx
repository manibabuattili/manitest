import Link from "next/link";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Headphones,
  Inbox,
  MessageCircle,
  TimerReset,
  UserRoundX,
} from "lucide-react";
import { getPartnerDashboardStats } from "@/features/tickets/actions";
import {
  ChannelBadge,
  LabelPill,
  PriorityBadge,
  StatusBadge,
} from "@/components/tickets/badges";
import { formatRelative } from "@/lib/dates";
import { Button } from "@/components/ui/button";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "danger" | "brand" | "wa";
}) {
  const tones = {
    default: "bg-white border-gray-200 text-gray-900",
    danger: "bg-red-50 border-red-100 text-red-700",
    brand: "bg-brand-50 border-brand-100 text-brand-800",
    wa: "bg-[#ecfdf3] border-[#bbf7d0] text-[#065f46]",
  } as const;
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
        </div>
        <div className="rounded-xl bg-white/70 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function PartnerDashboardPage() {
  const { totals, recent } = await getPartnerDashboardStats();

  return (
    <div className="min-h-full px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-700">Partner workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Support Dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Live snapshot of open work, SLA risk, and channel mix across portal and WhatsApp.
          </p>
        </div>
        <Button asChild>
          <Link href="/partner/support" className="gap-2">
            Open ticket queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active tickets" value={totals.active} hint="Open + in progress + waiting" icon={Inbox} tone="brand" />
        <StatCard label="SLA breached" value={totals.breached} hint="Needs immediate attention" icon={AlertTriangle} tone="danger" />
        <StatCard label="Unassigned" value={totals.unassigned} hint="Ready for Assign to Me" icon={UserRoundX} />
        <StatCard label="WhatsApp channel" value={totals.whatsapp} hint={`${totals.portal} from portal`} icon={MessageCircle} tone="wa" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open" value={totals.open} icon={Headphones} />
        <StatCard label="In progress" value={totals.inProgress} icon={TimerReset} />
        <StatCard label="Critical open" value={totals.critical} icon={AlertTriangle} tone="danger" />
        <StatCard label="High open" value={totals.high} icon={AlertTriangle} />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recently updated</h2>
            <p className="text-sm text-gray-500">Jump back into the hottest conversations.</p>
          </div>
          <Link href="/partner/support" className="text-sm font-semibold text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recent.map((t) => (
            <Link
              key={t.id}
              href={`/partner/support/${t.ticketNumber}`}
              className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-gray-50"
            >
              <div className="min-w-[88px] font-semibold text-gray-900">{t.ticketNumber}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">{t.subject}</p>
                <p className="truncate text-xs text-gray-450 text-gray-400">
                  {t.customer.name} · {t.customer.company}
                  {t.lastMessagePreview ? ` · ${t.lastMessagePreview}` : ""}
                </p>
              </div>
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              <ChannelBadge source={t.source} />
              <div className="flex flex-wrap gap-1">
                {t.labels.slice(0, 2).map((l) => (
                  <LabelPill key={l.label.id} name={l.label.name} color={l.label.color} />
                ))}
              </div>
              <span className="w-28 text-right text-xs text-gray-500">
                {formatRelative(t.updatedAt)}
              </span>
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-gray-500">No tickets yet. Seed the database to populate the dashboard.</p>
          )}
        </div>
      </div>
    </div>
  );
}
