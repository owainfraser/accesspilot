"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Shield,
  FileText,
  Settings,
  Key,
  BookOpen,
  ChevronRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/requests",
    label: "Access Requests",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    href: "/grants",
    label: "Active Grants",
    icon: <Key className="h-4 w-4" />,
  },
  {
    href: "/policies",
    label: "Policies",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    href: "/audit",
    label: "Audit Log",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 border-r border-gray-700/50">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-gray-700/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
          <Lock className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          AccessPilot
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Integration section */}
        <div className="mt-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Integrations
          </p>
          <Link
            href="/settings/integrations"
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              pathname === "/settings/integrations"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            )}
          >
            <span className="text-gray-500 group-hover:text-gray-300">
              <FileText className="h-4 w-4" />
            </span>
            Microsoft 365
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <p className="text-[11px] text-gray-600 text-center">
          AccessPilot v1.0 — JIT PAM
        </p>
      </div>
    </aside>
  );
}
