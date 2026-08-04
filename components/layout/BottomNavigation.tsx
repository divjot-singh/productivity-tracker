"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import DashboardIcon from "@/SVGs/DashboardIcon";
import TodayIcon from "@/SVGs/TodayIcon";
import LogsIcon from "@/SVGs/LogsIcon";
import SettingsIcon from "@/SVGs/SettingsIcon";

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed right-0 bottom-0 left-0 flex justify-around border-t border-gray-800 bg-gray-900 p-2">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center ${
          pathname === "/dashboard" ? "text-blue-500" : "text-gray-500"
        }`}
      >
        <DashboardIcon />
        <span className="mt-1 text-xs">Dashboard</span>
      </Link>

      <Link
        href="/today"
        className={`flex flex-col items-center ${
          pathname === "/today" ? "text-blue-500" : "text-gray-500"
        }`}
      >
        <TodayIcon />
        <span className="mt-1 text-xs">Record</span>
      </Link>

      <Link
        href="/logs"
        className={`flex flex-col items-center ${
          pathname === "/logs" ? "text-blue-500" : "text-gray-500"
        }`}
      >
        <LogsIcon />
        <span className="mt-1 text-xs">Logs</span>
      </Link>

      <Link
        href="/settings"
        className={`flex flex-col items-center ${
          pathname === "/settings" ? "text-blue-500" : "text-gray-500"
        }`}
      >
        <SettingsIcon />
        <span className="mt-1 text-xs">Settings</span>
      </Link>
    </div>
  );
}
