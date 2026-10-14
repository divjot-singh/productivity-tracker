"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface OverviewItem {
  name: string;
  done: number;
  total: number;
}

export default function ExerciseOverviewSheet({
  open,
  onOpenChange,
  items,
  activeIndex,
  onPick,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OverviewItem[];
  activeIndex: number;
  onPick: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-popover max-h-[80dvh] overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle>Exercises</SheetTitle>
        </SheetHeader>

        <div className="space-y-1 px-3 pb-3">
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onPick(index);
                onOpenChange(false);
              }}
              className={cn(
                "active:bg-accent flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left",
                index === activeIndex && "bg-accent",
              )}
            >
              <span className="text-sm font-medium">
                {index + 1}. {item.name}
              </span>
              <span
                className={cn(
                  "text-xs",
                  item.done === item.total
                    ? "text-good"
                    : "text-muted-foreground",
                )}
              >
                {item.done}/{item.total} sets
              </span>
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => {
              onOpenChange(false);
              onAdd();
            }}
          >
            <Plus className="h-4 w-4" />
            Add exercise
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
