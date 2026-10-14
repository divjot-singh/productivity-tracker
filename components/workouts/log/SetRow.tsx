"use client";

import { Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { EditorSet, SetRecordFlags } from "@/lib/workouts/session";
import type { WorkoutSetEntry } from "@/models/workout";

import Stepper from "./Stepper";

interface SetRowProps {
  index: number;
  set: EditorSet;
  weightStep: number;
  weightLabel: string;
  flags: SetRecordFlags;
  onChange: (partial: Partial<WorkoutSetEntry>) => void;
  onToggleDone: () => void;
  onRemove: () => void;
}

export default function SetRow({
  index,
  set,
  weightStep,
  weightLabel,
  flags,
  onChange,
  onToggleDone,
  onRemove,
}: SetRowProps) {
  const canComplete = (set.reps ?? 0) > 0;

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-1.5 rounded-xl px-1 py-0.5 transition-colors",
        set.done && "bg-good/10",
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Set ${index + 1} options`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold",
                set.isWarmup ? "bg-warn/15 text-warn" : "text-muted-foreground",
              )}
            />
          }
        >
          {set.isWarmup ? "W" : index + 1}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem
            onClick={() => onChange({ isWarmup: !set.isWarmup })}
          >
            {set.isWarmup ? "Mark as working set" : "Mark as warm-up"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            Remove set
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative">
        <Stepper
          value={set.weight}
          step={weightStep}
          label={weightLabel}
          onChange={(weight) => onChange({ weight })}
        />
        {set.done && flags.weightPr ? (
          <span className="bg-good text-background absolute -top-1.5 right-1 rounded-full px-1.5 text-[9px] font-bold">
            PR
          </span>
        ) : null}
      </div>

      <Stepper
        value={set.reps}
        step={1}
        label="Reps"
        onChange={(reps) => onChange({ reps })}
      />

      <button
        type="button"
        aria-label={set.done ? "Mark set as not done" : "Mark set as done"}
        aria-pressed={set.done}
        disabled={!set.done && !canComplete}
        onClick={onToggleDone}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition-colors disabled:opacity-40",
          set.done
            ? "bg-good text-background border-transparent"
            : "text-muted-foreground active:bg-accent",
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
