"use client";

import {
  BarChart3,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  FlaskConical,
  Headset,
  LayoutGrid,
  Settings,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";

function FlowerLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <g fill="#43a047">
        <circle cx="16" cy="7" r="4.2" />
        <circle cx="24" cy="11.5" r="4.2" />
        <circle cx="24" cy="20.5" r="4.2" />
        <circle cx="16" cy="25" r="4.2" />
        <circle cx="8" cy="20.5" r="4.2" />
        <circle cx="8" cy="11.5" r="4.2" />
        <circle cx="16" cy="16" r="3.2" fill="#2e7d32" />
      </g>
    </svg>
  );
}

const ACCOUNT_ITEMS = [
  { label: "Organizational Setup", icon: Building2 },
  { label: "Workflows", icon: Workflow },
  { label: "Reports", icon: FileSpreadsheet },
  { label: "Entity", icon: LayoutGrid },
  { label: "Custom Screens", icon: SlidersHorizontal },
  { label: "Charts", icon: BarChart3 },
  { label: "Test Simulator", icon: FlaskConical, active: true },
];

export function BluconnShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <aside className="flex w-[250px] shrink-0 flex-col border-r border-slate-200 bg-side">
        <div className="flex items-center gap-2 px-5 py-5">
          <FlowerLogo />
          <span className="text-xl font-semibold tracking-tight text-slate-800">Bluconn</span>
        </div>
        <nav className="flex-1 px-3 text-[13px] text-slate-600">
          <NavRow icon={<Headset size={16} />} label="Support" />
          <NavRow icon={<SlidersHorizontal size={16} />} label="Feature Management" />
          <NavRow icon={<Settings size={16} />} label="Administration" chevron="down" />
          <NavRow icon={<Building2 size={16} />} label="Accounts" chevron="down" />
          <div className="ml-2 mt-1 space-y-0.5 border-l border-slate-200 pl-2">
            {ACCOUNT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${
                    item.active ? "bg-nav-active font-medium text-slate-800" : "text-slate-600"
                  }`}
                >
                  <Icon size={15} className="shrink-0 text-slate-500" />
                  {item.label}
                </div>
              );
            })}
            <NavRow icon={<BarChart3 size={15} />} label="Analytics" chevron="down" />
          </div>
        </nav>
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
              MA
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-800">Mani Babu Attil...</div>
              <div className="text-xs text-slate-500">Partner account</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function NavRow({
  icon,
  label,
  chevron,
}: {
  icon: React.ReactNode;
  label: string;
  chevron?: "down";
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2.5 py-2">
      <span className="text-slate-500">{icon}</span>
      <span className="flex-1">{label}</span>
      {chevron === "down" ? <ChevronDown size={14} className="text-slate-400" /> : null}
    </div>
  );
}
