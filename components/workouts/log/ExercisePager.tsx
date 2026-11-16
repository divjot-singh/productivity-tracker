"use client";

import { ChevronLeft, ChevronRight, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type ExerciseProgress = "none" | "partial" | "done";

interface ExercisePagerProps {
  index: number;
  total: number;
  progress: ExerciseProgress[];
  onChange: (index: number) => void;
  onOverview: () => void;
}

// Position within the workout plus a dot per exercise; tap a dot to jump.
export default function ExercisePager({
  index,
  total,
  progress,
  onChange,
  onOverview,
}: ExercisePagerProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous exercise"
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
        className="active:bg-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <span className="text-xs font-medium">
          Exercise {index + 1} of {total}
        </span>

        <div className="flex max-w-full flex-wrap justify-center gap-1.5">
          {progress.map((state, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to exercise ${i + 1}`}
              aria-current={i === index}
              onClick={() => onChange(i)}
              className="flex h-4 w-4 items-center justify-center"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-5" : "w-2",
                  state === "done"
                    ? "bg-good"
                    : state === "partial"
                      ? "bg-primary/60"
                      : "bg-muted-foreground/30",
                  i === index && state === "none" && "bg-primary",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="All exercises"
        onClick={onOverview}
        className="active:bg-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
      >
        <List className="h-5 w-5" />
      </button>

      <button
        type="button"
        aria-label="Next exercise"
        disabled={index >= total - 1}
        onClick={() => onChange(index + 1)}
        className="active:bg-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
