"use client";

import { Check, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { EFFORT_GUIDE } from "@/lib/workouts/session";
import type { EditorSet, SetRecordFlags } from "@/lib/workouts/session";
import type { WorkoutSetEntry } from "@/models/workout";

import Stepper from "./Stepper";

interface SetRowProps {
  index: number;
  set: EditorSet;
  weightStep: number;
  weightLabel: string;
  unit: string;
  flags: SetRecordFlags;
  onChange: (partial: Partial<WorkoutSetEntry>) => void;
  onToggleDone: () => void;
  onRemove: () => void;
}

// Two lines so each input gets half the width on a phone; actions are always visible.
export default function SetRow({
  index,
  set,
  weightStep,
  weightLabel,
  unit,
  flags,
  onChange,
  onToggleDone,
  onRemove,
}: SetRowProps) {
  const canComplete = (set.reps ?? 0) > 0;

  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border p-3 transition-colors",
        set.done && "bg-good/10 border-good/30",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Set {index + 1}</span>

        {set.done && flags.weightPr ? (
          <span className="bg-good text-background rounded-full px-2 py-0.5 text-[10px] font-bold">
            PR
          </span>
        ) : null}

        <button
          type="button"
          aria-pressed={set.isWarmup}
          onClick={() => onChange({ isWarmup: !set.isWarmup })}
          className={cn(
            "h-7 rounded-full border px-2.5 text-xs font-medium",
            set.isWarmup
              ? "bg-warn/15 text-warn border-transparent"
              : "text-muted-foreground",
          )}
        >
          Warm-up
        </button>

        <div className="flex-1" />

        <button
          type="button"
          aria-label={`Remove set ${index + 1}`}
          onClick={onRemove}
          className="text-muted-foreground active:text-destructive flex h-9 w-9 items-center justify-center rounded-lg"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={set.done ? "Mark set as not done" : "Mark set as done"}
          aria-pressed={set.done}
          disabled={!set.done && !canComplete}
          onClick={onToggleDone}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-40",
            set.done
              ? "bg-good text-background border-transparent"
              : "active:bg-accent",
          )}
        >
          <Check className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-muted-foreground text-xs">
            {weightLabel} ({unit})
          </span>
          <Stepper
            value={set.weight}
            step={weightStep}
            label={weightLabel}
            onChange={(weight) => onChange({ weight })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-muted-foreground text-xs">Reps</span>
          <Stepper
            value={set.reps}
            step={1}
            label="Reps"
            onChange={(reps) => onChange({ reps })}
          />
        </label>
      </div>

      <div className="space-y-1">
        <span className="text-muted-foreground text-xs">
          Effort:{" "}
          {EFFORT_GUIDE.find((item) => item.effort === set.effort)?.label ??
            "not set"}
        </span>

        <div className="grid grid-cols-5 gap-1.5">
          {EFFORT_GUIDE.map((item) => (
            <button
              key={item.effort}
              type="button"
              aria-label={`Effort ${item.effort}, ${item.label}`}
              aria-pressed={item.effort === set.effort}
              onClick={() => onChange({ effort: item.effort })}
              className={cn(
                "h-8 rounded-lg border text-xs font-medium",
                item.effort === set.effort
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "text-muted-foreground active:bg-accent",
              )}
            >
              {item.effort}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
