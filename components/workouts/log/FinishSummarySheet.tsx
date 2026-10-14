"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/workouts/session";

export interface FinishSummary {
  durationMs: number | null;
  volume: number;
  sets: number;
  exercises: number;
  records: { name: string; label: string }[];
  comboName: string | null;
  previousVolume: number | null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl border px-3 py-2">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

export default function FinishSummarySheet({
  open,
  onOpenChange,
  summary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: FinishSummary | null;
}) {
  if (!summary) return null;

  const change =
    summary.previousVolume && summary.previousVolume > 0
      ? Math.round(
          ((summary.volume - summary.previousVolume) / summary.previousVolume) *
            100,
        )
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-popover max-h-[85dvh] overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle>Workout complete</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-5 pb-5">
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Duration"
              value={
                summary.durationMs === null
                  ? "-"
                  : formatDuration(summary.durationMs)
              }
            />
            <Stat label="Volume" value={`${Math.round(summary.volume)}`} />
            <Stat label="Working sets" value={`${summary.sets}`} />
            <Stat label="Exercises" value={`${summary.exercises}`} />
          </div>

          {change !== null ? (
            <p className="text-sm">
              Volume is{" "}
              <span
                className={
                  change >= 0
                    ? "text-good font-semibold"
                    : "text-warn font-semibold"
                }
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>{" "}
              vs your last {summary.comboName ?? "session"}.
            </p>
          ) : null}

          {summary.records.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-semibold">New records</p>
              <ul className="space-y-1">
                {summary.records.map((record) => (
                  <li
                    key={`${record.name}-${record.label}`}
                    className="bg-good/10 text-good rounded-lg px-3 py-1.5 text-sm"
                  >
                    {record.name}: {record.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No new records this time. Keep going.
            </p>
          )}

          <Button className="h-11 w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
