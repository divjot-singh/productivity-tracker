"use client";

import { useState } from "react";
import { ChevronDown, MoreVertical, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getPrimaryMetricLabel } from "@/lib/workouts/constants";
import {
  EFFORT_GUIDE,
  detectSetRecords,
  formatSetLine,
  weightStep,
  type EditorExercise,
  type Effort,
  type LastSession,
  type Records,
} from "@/lib/workouts/session";
import type { ExerciseDefinition, WorkoutSetEntry } from "@/models/workout";

import SetRow from "./SetRow";

interface ExerciseCardProps {
  entry: EditorExercise;
  definition: ExerciseDefinition | undefined;
  last: LastSession | null;
  records: Records;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSetChange: (setIndex: number, partial: Partial<WorkoutSetEntry>) => void;
  onToggleDone: (setIndex: number) => void;
  onRemoveSet: (setIndex: number) => void;
  onAddSet: () => void;
  onEffort: (effort: Effort) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

export default function ExerciseCard({
  entry,
  definition,
  last,
  records,
  canMoveUp,
  canMoveDown,
  onSetChange,
  onToggleDone,
  onRemoveSet,
  onAddSet,
  onEffort,
  onMove,
  onRemove,
}: ExerciseCardProps) {
  const [effortOpen, setEffortOpen] = useState(false);

  const unit = definition?.weightTracking.unit ?? "kg";
  const weightLabel = getPrimaryMetricLabel(definition?.measurementMode);
  const step = weightStep(unit);
  const doneCount = entry.sets.filter((set) => set.done).length;
  const effort = entry.sets.find((set) => set.effort)?.effort ?? 3;
  const effortLabel = EFFORT_GUIDE.find((item) => item.effort === effort);
  const target = definition?.targetWeight ?? null;
  const notes = definition?.notes?.join(" - ");

  return (
    <article className="bg-card rounded-2xl border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {definition?.name ?? entry.exerciseId}
          </h3>

          <p className="text-muted-foreground mt-0.5 text-xs">
            {doneCount}/{entry.sets.length} sets
            {records.prWeight > 0 ? ` - PR ${records.prWeight} ${unit}` : ""}
            {records.best1RM > 0 ? ` - est. 1RM ${records.best1RM}` : ""}
            {target ? ` - target ${target} ${unit}` : ""}
          </p>

          {last ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              Last ({last.date.slice(5)}): {formatSetLine(last.sets) || "-"}
            </p>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Exercise options"
                className="text-muted-foreground active:bg-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              />
            }
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={!canMoveUp} onClick={() => onMove(-1)}>
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown} onClick={() => onMove(1)}>
              Move down
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              Remove exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {notes ? (
        <p className="text-muted-foreground mt-1 text-xs italic">{notes}</p>
      ) : null}

      <div className="mt-2 space-y-1">
        <div className="text-muted-foreground grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-1.5 px-1 text-[10px] font-medium uppercase">
          <span className="text-center">Set</span>
          <span className="text-center">
            {weightLabel} ({unit})
          </span>
          <span className="text-center">Reps</span>
          <span />
        </div>

        {entry.sets.map((set, index) => (
          <SetRow
            key={set.key}
            index={index}
            set={set}
            weightStep={step}
            weightLabel={weightLabel}
            flags={detectSetRecords(
              set,
              records,
              entry.sets.slice(0, index).filter((s) => s.done),
            )}
            onChange={(partial) => onSetChange(index, partial)}
            onToggleDone={() => onToggleDone(index)}
            onRemove={() => onRemoveSet(index)}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onAddSet}
          className="text-primary active:bg-accent flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Add set
        </button>

        <button
          type="button"
          aria-expanded={effortOpen}
          onClick={() => setEffortOpen((open) => !open)}
          className="text-muted-foreground flex h-9 items-center gap-1 rounded-lg px-2 text-xs"
        >
          Effort: {effortLabel?.label}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              effortOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {effortOpen ? (
        <div className="mt-1 space-y-1.5">
          <div className="grid grid-cols-5 gap-1.5">
            {EFFORT_GUIDE.map((item) => (
              <button
                key={item.effort}
                type="button"
                onClick={() => onEffort(item.effort)}
                aria-pressed={item.effort === effort}
                className={cn(
                  "h-9 rounded-lg border text-sm font-medium",
                  item.effort === effort
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "active:bg-accent",
                )}
              >
                {item.effort}
              </button>
            ))}
          </div>

          <p className="text-muted-foreground text-xs">
            {effortLabel?.label} - {effortLabel?.hint}. Applies to every set.
          </p>
        </div>
      ) : null}
    </article>
  );
}
