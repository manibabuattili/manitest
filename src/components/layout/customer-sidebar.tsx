"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Building2,
  CalendarCheck2,
  MessageCircle,
  Clock3,
  Palmtree,
  MapPinned,
  Timer,
  FolderKanban,
  Boxes,
  Truck,
  LifeBuoy,
  Wallet,
  BookOpen,
  Users,
  Shield,
  ChevronDown,
  FileBarChart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const attendanceChildren = [{ label: "Attendance Report", href: "/attendance", icon: FileBarChart }];

const customerNav = [
  { label: "Organization", icon: Building2 },
  { label: "Attendance", icon: CalendarCheck2, expandable: true, children: attendanceChildren },
  { label: "WhatsApp", icon: MessageCircle, expandable: true },
  { label: "Shift", icon: Clock3 },
  { label: "Holiday", icon: Palmtree },
  { label: "Leave", icon: CalendarCheck2 },
  { label: "Geofence", icon: MapPinned },
  { label: "Overtime", icon: Timer },
  { label: "Project Management", icon: FolderKanban },
  { label: "Asset Management", icon: Boxes },
  { label: "Logistics", icon: Truck, expandable: true },
  { label: "Support", icon: LifeBuoy, href: "/support" },
  { label: "Expense", icon: Wallet },
  { label: "Knowledge Base", icon: BookOpen },
  { label: "Groups", icon: Users },
  { label: "Role Management", icon: Shield },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const attendanceActive = pathname.startsWith("/attendance");
  const [attendanceOpen, setAttendanceOpen] = useState(attendanceActive);

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
          {customerNav.map((item) => {
            const active = item.href ? pathname.startsWith(item.href) : false;
            const Icon = item.icon;
            const expanded = item.label === "Attendance" && attendanceOpen;
            const content = (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
                  active && "bg-gray-100 text-gray-900",
                  item.label === "Attendance" && attendanceActive && "text-gray-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.expandable && (
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition", expanded && "rotate-180")} />
                )}
              </span>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href}>{content}</Link>
                ) : item.children ? (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setAttendanceOpen((open) => !open)}
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
                {item.children && expanded ? (
                  <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-gray-100 pl-2">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50",
                              childActive && "bg-sky-50 font-medium text-sky-800"
                            )}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
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
