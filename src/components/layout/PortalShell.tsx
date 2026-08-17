"use client";

import { Activity, Beaker, LayoutDashboard, Plug, Settings, Shield } from "lucide-react";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, disabled: true },
  { label: "Test Simulator", icon: Beaker, disabled: false },
  { label: "Integrations", icon: Plug, disabled: true },
  { label: "Security", icon: Shield, disabled: true },
  { label: "Settings", icon: Settings, disabled: true },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-overlay min-h-screen bg-ink-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[232px] shrink-0 border-r border-white/10 bg-ink-900/80 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              Partner Portal
            </div>
            <div className="mt-1 text-sm font-semibold text-white">Quality Lab</div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = !item.disabled;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "cursor-not-allowed text-slate-500"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </div>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4 text-[11px] text-slate-500">
            Prototype · MockExecutor
            <div className="mt-1 font-mono text-slate-600">v0.1 · sandbox</div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-white/10 bg-ink-900/70 px-5 backdrop-blur">
            <div>
              <div className="text-xs text-slate-500">Quality Assurance / Test Simulator</div>
              <h1 className="text-sm font-semibold text-white">
                AI Agent Workflow Bulk Test Simulator
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] text-accent sm:inline-flex">
                <Activity size={12} />
                Live mock engine
              </span>
              <span className="rounded-full border border-white/10 bg-ink-800 px-2.5 py-1 font-mono text-[11px] text-slate-400">
                env: sandbox
              </span>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
