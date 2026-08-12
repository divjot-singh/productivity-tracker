"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import DashboardIcon from "@/SVGs/DashboardIcon";
import TodayIcon from "@/SVGs/TodayIcon";
import LogsIcon from "@/SVGs/LogsIcon";
import SettingsIcon from "@/SVGs/SettingsIcon";

export default function BottomNavigation() {
  const pathname = usePathname();
  const isChatRoute = pathname === "/chat";

  return (
    <div className="fixed right-0 bottom-0 left-0 border-t border-gray-800 bg-gray-900 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end justify-around gap-1">
        <Link
          href="/dashboard"
          className={`flex min-w-0 flex-1 flex-col items-center ${
            pathname === "/dashboard" ? "text-primary" : "text-gray-500"
          }`}
        >
          <DashboardIcon />
          <span className="mt-1 text-xs">Dashboard</span>
        </Link>

        <Link
          href="/today"
          className={`flex min-w-0 flex-1 flex-col items-center ${
            pathname === "/today" ? "text-primary" : "text-gray-500"
          }`}
        >
          <TodayIcon />
          <span className="mt-1 text-xs">Record</span>
        </Link>

        <Link
          href="/chat"
          className={`flex min-w-0 flex-1 flex-col items-center ${
            isChatRoute ? "text-primary" : "text-gray-500"
          }`}
          aria-label="Chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="mt-1 text-xs">Chat</span>
        </Link>

        <Link
          href="/logs"
          className={`flex min-w-0 flex-1 flex-col items-center ${
            pathname === "/logs" ? "text-primary" : "text-gray-500"
          }`}
        >
          <LogsIcon />
          <span className="mt-1 text-xs">Logs</span>
        </Link>

        <Link
          href="/settings"
          className={`flex min-w-0 flex-1 flex-col items-center ${
            pathname === "/settings" ? "text-primary" : "text-gray-500"
          }`}
        >
          <SettingsIcon />
          <span className="mt-1 text-xs">Settings</span>
        </Link>
      </div>
    </div>
  );
}
