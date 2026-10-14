"use client";

import { usePathname } from "next/navigation";

import QuickChatButton from "@/components/layout/QuickChatButton";
import { CHROMELESS_PREFIXES } from "@/lib/navigation";

// Desktop-only floating entry; on mobile the chat icon lives in the top bar so it never covers page actions.
export default function FloatingChatButton() {
  const pathname = usePathname();

  const hidden =
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hidden) {
    return null;
  }

  return <QuickChatButton variant="floating" />;
}
