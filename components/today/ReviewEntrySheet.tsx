"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MetricDefinition, MetricValue } from "@/models/metric";
import { cn, formatValue } from "@/lib/utils";
import { ScoreResult } from "@/lib/scoring/scoring-types";

interface ReviewEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  metrics: MetricDefinition[];
  values: Record<string, MetricValue | "">;
  scoreResult: ScoreResult;
  saving: boolean;
  onSave: () => void;
}

export default function ReviewEntrySheet({
  open,
  onOpenChange,
  selectedDate,
  metrics,
  values,
  scoreResult,
  saving,
  onSave,
}: ReviewEntrySheetProps) {
  const groupedMetrics = metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }

      acc[metric.category].push(metric);

      return acc;
    },
    {} as Record<string, MetricDefinition[]>,
  );

  const percentage =
    scoreResult.totalWeights > 0
      ? (scoreResult.totalScore / scoreResult.totalWeights) * 100
      : 0;

  const visualPercentage = Math.min(percentage, 100);

  const progressClass =
    percentage >= 100
      ? "bg-gradient-to-r from-emerald-400 to-green-500"
      : percentage >= 80
        ? "bg-gradient-to-r from-sky-400 to-blue-500"
        : percentage >= 60
          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
          : "bg-gradient-to-r from-red-400 to-red-500";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-popover ring-foreground/10 max-h-[85vh] rounded-t-2xl p-0 shadow-2xl ring-1"
      >
        <div className="bg-muted mx-auto mt-3 h-1 w-10 rounded-full" />

        <SheetHeader className="px-5 pt-4 pb-2">
          <SheetTitle>Review today&apos;s entry</SheetTitle>

          <p className="text-muted-foreground text-sm">
            {formatDate(selectedDate)}
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-5 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Life Score</span>
            <span>
              {scoreResult.totalScore} / {scoreResult.totalWeights}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">XP</span>
            <span>{scoreResult.totalXP}</span>
          </div>

          <div className="mt-1">
            <div className="bg-muted h-2.5 overflow-hidden rounded-full">
              <div
                className={cn("h-full rounded-full", progressClass)}
                style={{ width: `${visualPercentage}%` }}
              />
            </div>

            <p className="text-muted-foreground mt-1 text-right text-xs">
              {Math.round(percentage)}%
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {Object.entries(groupedMetrics).map(([category, list]) => (
            <section key={category} className="mb-5">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {category}
              </h3>

              <div className="space-y-2">
                {list
                  .toSorted((a, b) => a.displayOrder - b.displayOrder)
                  .map((metric) => {
                    const result = scoreResult.metrics.find(
                      (m) => m.metricId === metric.id,
                    );

                    const value = values[metric.id];
                    const displayValue =
                      value === ""
                        ? formatValue(metric.defaultValue)
                        : formatValue(value);

                    return (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between rounded-xl border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{metric.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {displayValue}
                            {metric.unit && ` ${metric.unit}`}
                          </p>
                        </div>

                        <p className="text-sm font-semibold">
                          {result?.score.toFixed(1)}
                          <span className="text-muted-foreground text-xs font-normal">
                            {" "}
                            / {result?.weight}
                          </span>
                        </p>
                      </div>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>

        <SheetFooter className="flex-col gap-2 border-t px-5 py-4 pt-3">
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Edit / Back
          </Button>

          <Button className="h-12 w-full" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
