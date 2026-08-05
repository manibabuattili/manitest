"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  LifeBuoy,
  Puzzle,
  Settings2,
  Building2,
  BarChart3,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const partnerNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/partner" },
  { label: "Support", icon: LifeBuoy, href: "/partner/support" },
  { label: "Feature Management", icon: Puzzle },
  { label: "Administration", icon: Settings2, expandable: true },
  {
    label: "Accounts",
    icon: Building2,
    expandable: true,
    children: [
      "Organizational Setup",
      "Workflows",
      "Reports",
      "Entity",
      "Workflow Automation",
    ],
  },
  { label: "Analytics", icon: BarChart3, expandable: true },
];

export function PartnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-900">Bluconn</span>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {partnerNav.map((item) => {
            const active = item.href ? pathname.startsWith(item.href) : false;
            const Icon = item.icon;
            const content = (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
                  active && "bg-gray-100 text-gray-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.expandable && <ChevronDown className="h-4 w-4 text-gray-400" />}
              </span>
            );
            return (
              <li key={item.label}>
                {item.href ? <Link href={item.href}>{content}</Link> : content}
                {item.children && (
                  <ul className="ml-9 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child} className="rounded-md px-2 py-1.5 text-sm text-gray-500">
                        {child}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Olivia" />
            <AvatarFallback>OR</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">Olivia Rhye</p>
            <p className="truncate text-xs text-gray-500">olivia@untitledui.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
