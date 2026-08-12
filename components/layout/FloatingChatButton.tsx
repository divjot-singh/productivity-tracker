"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function FloatingChatButton() {
  const pathname = usePathname();

  if (pathname === "/chat") {
    return null;
  }

  return (
    <Link
      href="/chat"
      aria-label="Open chat"
      title="Open chat"
      className="bg-primary text-primary-foreground fixed right-6 bottom-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full shadow-lg transition hover:scale-105 hover:opacity-95 lg:flex"
    >
      <MessageCircle className="h-5 w-5" />
    </Link>
  );
}
