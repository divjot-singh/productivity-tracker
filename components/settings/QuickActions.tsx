"use client";

import Link from "next/link";
import { Plus, Settings2, ChevronRight } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="mb-8">
      <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
        Quick Actions
      </h2>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <Link
          href="/settings/add"
          className="hover:bg-accent flex items-center gap-4 border-b p-4 transition-colors"
        >
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <Plus size={20} />
          </div>

          <div className="flex-1">
            <p className="font-medium">Add Goal</p>

            <p className="text-muted-foreground text-sm">
              Create a custom productivity goal
            </p>
          </div>

          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>

        <button
          disabled
          className="flex w-full items-center gap-4 p-4 opacity-60"
        >
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
            <Settings2 size={20} />
          </div>

          <div className="flex-1 text-left">
            <p className="font-medium">Manage Goals</p>

            <p className="text-muted-foreground text-sm">Coming soon</p>
          </div>
        </button>
      </div>
    </div>
  );
}
