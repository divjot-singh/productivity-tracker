import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ActionBarProps {
  children: ReactNode;
  /** Pages inside the app shell sit above the bottom nav and beside the sidebar. */
  withNav?: boolean;
}

// Fixed bottom actions plus a spacer so the last content is never hidden behind them.
export default function ActionBar({
  children,
  withNav = true,
}: ActionBarProps) {
  return (
    <>
      <div aria-hidden className="h-24" />

      <div
        className={cn(
          "bg-background fixed inset-x-0 z-40 border-t px-4 pt-3",
          withNav
            ? "bottom-[var(--bottom-nav)] pb-3 lg:bottom-0 lg:left-64 lg:pb-3"
            : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto flex max-w-screen-sm gap-2">{children}</div>
      </div>
    </>
  );
}
