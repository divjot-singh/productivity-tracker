"use client";

import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/common/BrandLogo";

import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";

export default function TopBar() {
  const router = useRouter();

  const { user } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const initials =
    user?.displayName
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <header className="bg-background fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 px-8">
      <BrandLogo size={30} textClassName="text-base font-semibold" />

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="border-border cursor-pointer border">
            <AvatarImage src={user?.photoURL ?? ""} />

            <AvatarFallback className="bg-emerald-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-2">
            <p className="font-medium">{user?.displayName}</p>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
