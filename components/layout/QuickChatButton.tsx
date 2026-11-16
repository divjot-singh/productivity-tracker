"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Send } from "lucide-react";

import { Input } from "@/components/ui/input";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How did I do this week?",
  "Which goals am I missing most?",
  "What are my workout personal records?",
  "How has my sleep been lately?",
];

// Quick access to the assistant from any screen; full conversations live on /chat.
export default function QuickChatButton({
  variant,
}: {
  variant: "icon" | "floating";
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  function ask(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    setOpen(false);
    setQuestion("");

    // The chat page is already mounted there, so hand the question over directly.
    if (pathname.startsWith("/chat")) {
      window.dispatchEvent(new CustomEvent("daylog:ask", { detail: trimmed }));
      return;
    }

    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Ask Daylog"
        title="Ask Daylog"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "floating"
            ? "bg-primary text-primary-foreground fixed right-6 bottom-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full shadow-lg transition hover:scale-105 hover:opacity-95 lg:flex"
            : "text-muted-foreground hover:text-foreground hover:bg-accent flex h-9 w-9 items-center justify-center rounded-full transition-colors lg:hidden",
        )}
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="bg-popover ring-foreground/10 rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)] shadow-2xl ring-1"
        >
          <div className="bg-muted mx-auto mt-3 h-1 w-10 rounded-full" />

          <SheetHeader className="px-5 pt-4 pb-1">
            <SheetTitle>Ask Daylog</SheetTitle>

            <p className="text-muted-foreground text-sm">
              Answers come from your own data.
            </p>
          </SheetHeader>

          <div className="space-y-2 px-5 pb-3">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="bg-card hover:bg-accent flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors"
              >
                {suggestion}
                <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2 px-5 pb-3"
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask something else..."
              className="h-11"
            />

            <button
              type="submit"
              aria-label="Send question"
              disabled={!question.trim()}
              className="bg-primary text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="px-5 pb-5">
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="text-primary text-sm font-medium hover:underline"
            >
              Open full chat
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
