'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import DashboardIcon from '@/SVGs/DashboardIcon';
import TodayIcon from '@/SVGs/TodayIcon';
import LogsIcon from '@/SVGs/LogsIcon';
import SettingsIcon from '@/SVGs/SettingsIcon';

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-2">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center ${
          pathname === '/dashboard' ? 'text-blue-500' : 'text-gray-500'
        }`}
      >
        <DashboardIcon />
        <span className="text-xs mt-1">Dashboard</span>
      </Link>

      <Link
        href="/today"
        className={`flex flex-col items-center ${
          pathname === '/today' ? 'text-blue-500' : 'text-gray-500'
        }`}
      >
        <TodayIcon />
        <span className="text-xs mt-1">Today</span>
      </Link>

      <Link
        href="/logs"
        className={`flex flex-col items-center ${
          pathname === '/logs' ? 'text-blue-500' : 'text-gray-500'
        }`}
      >
        <LogsIcon />
        <span className="text-xs mt-1">Logs</span>
      </Link>

      <Link
        href="/settings"
        className={`flex flex-col items-center ${
          pathname === '/settings' ? 'text-blue-500' : 'text-gray-500'
        }`}
      >
        <SettingsIcon />
        <span className="text-xs mt-1">Settings</span>
      </Link>
    </div>
  );
}