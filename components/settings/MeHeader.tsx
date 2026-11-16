"use client";

import Link from "next/link";
import { Bell, ChevronRight, LogOut, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";

export default function MeHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const initials =
    user?.displayName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="bg-card flex items-center gap-4 rounded-2xl border p-4">
        <Avatar className="border-border h-12 w-12 border">
          <AvatarImage src={user?.photoURL ?? ""} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{user?.displayName ?? "You"}</p>
          <p className="text-muted-foreground truncate text-sm">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="bg-card divide-y overflow-hidden rounded-2xl border">
        <Link
          href="/themes"
          className="hover:bg-accent flex items-center gap-3 p-4 transition-colors"
        >
          <Palette size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">Themes</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>

        <Link
          href="/notifications"
          className="hover:bg-accent flex items-center gap-3 p-4 transition-colors"
        >
          <Bell size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">Notifications</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="hover:bg-accent text-destructive flex w-full items-center gap-3 p-4 text-left transition-colors"
        >
          <LogOut size={18} />
          <span className="flex-1 text-sm font-medium">Sign out</span>
        </button>
      </div>
    </div>
  );
}
