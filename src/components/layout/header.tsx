"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-700/50 bg-gray-900 px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
        </Button>

        {/* Org switcher */}
        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: "flex items-center",
              organizationSwitcherTrigger:
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors",
              organizationSwitcherTriggerIcon: "text-gray-500",
            },
          }}
        />

        {/* User menu */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
              userButtonPopoverCard: "bg-gray-800 border border-gray-700",
              userButtonPopoverActionButton:
                "text-gray-300 hover:bg-gray-700 hover:text-gray-100",
            },
          }}
        />
      </div>
    </header>
  );
}
