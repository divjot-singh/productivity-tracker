import { cn } from "@/lib/utils";

import { StatCardData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { formatCompactNumber, VisualizationCard } from "./rendering-utils";

export default function StatCardRenderer({
  visualization,
}: VisualizationRendererProps<StatCardData>) {
  const { value, valueDate, unit, comparison, streak } = visualization.data;

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
      footer={
        comparison ? (
          <p
            className={cn(
              "text-sm font-medium",
              comparison.direction === "up"
                ? "text-primary"
                : comparison.direction === "down"
                  ? "text-accent"
                  : "text-muted-foreground",
            )}
          >
            {comparison.direction === "up"
              ? "▲"
              : comparison.direction === "down"
                ? "▼"
                : "→"}{" "}
            {comparison.value}% {comparison.label}
          </p>
        ) : null
      }
    >
      <div className="flex flex-col flex-wrap items-start gap-x-3 gap-y-2">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold tracking-tight sm:text-5xl">
            {typeof value === "number" ? formatCompactNumber(value) : value}
          </span>

          {unit ? (
            <span className="text-muted-foreground mb-1 text-sm">{unit}</span>
          ) : null}
        </div>

        {valueDate ? (
          <p className="text-muted-foreground text-xs">On {valueDate}</p>
        ) : null}

        {streak && typeof value === "number" && value > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                "bg-background/40 text-muted-foreground rounded-full border px-2.5 py-1 text-xs font-medium",
                streak.isCurrentBest
                  ? "border-primary/60 text-primary"
                  : "border-white/50",
              )}
            >
              Current: {streak.currentRange}
            </div>

            {streak.isCurrentBest ? (
              <div className="bg-primary/15 text-primary border-primary/30 rounded-full border px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
                Current Best
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </VisualizationCard>
  );
}
