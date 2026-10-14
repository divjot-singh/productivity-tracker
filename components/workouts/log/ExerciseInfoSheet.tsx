"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatSetLine,
  type LastSession,
  type Records,
} from "@/lib/workouts/session";
import type { ExerciseDefinition } from "@/models/workout";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface ExerciseInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition: ExerciseDefinition | undefined;
  records: Records;
  history: LastSession[];
}

// Everything secondary about an exercise, kept off the logging screen.
export default function ExerciseInfoSheet({
  open,
  onOpenChange,
  definition,
  records,
  history,
}: ExerciseInfoSheetProps) {
  const unit = definition?.weightTracking.unit ?? "kg";
  const range = definition?.progression.repRange;
  const target = definition?.targetWeight ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-popover max-h-[85dvh] overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="px-5 pt-5 pb-1">
          <SheetTitle>{definition?.name ?? "Exercise"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-5 pb-6">
          {definition?.description ? (
            <p className="text-muted-foreground text-sm">
              {definition.description}
            </p>
          ) : null}

          {definition?.notes?.length ? (
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {definition.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          <div className="divide-y rounded-xl border px-3">
            <Row
              label="Personal record"
              value={records.prWeight > 0 ? `${records.prWeight} ${unit}` : "-"}
            />
            <Row
              label="Best estimated 1RM"
              value={records.best1RM > 0 ? `${records.best1RM} ${unit}` : "-"}
            />
            <Row
              label="Highest session volume"
              value={
                records.highestVolume > 0
                  ? `${Math.round(records.highestVolume)}`
                  : "-"
              }
            />
            {target ? <Row label="Target" value={`${target} ${unit}`} /> : null}
            {range ? (
              <Row label="Target reps" value={`${range.min}-${range.max}`} />
            ) : null}
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold">Recent sessions</p>

            {history.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No earlier sessions.
              </p>
            ) : (
              <ul className="space-y-1">
                {history.map((session) => (
                  <li key={session.date} className="text-sm">
                    <span className="text-muted-foreground">
                      {session.date}:{" "}
                    </span>
                    {formatSetLine(session.sets) || "-"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
