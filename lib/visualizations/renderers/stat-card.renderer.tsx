import { cn } from "@/lib/utils";

import { StatCardData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { formatCompactNumber, VisualizationCard } from "./rendering-utils";

export default function StatCardRenderer({
  visualization,
}: VisualizationRendererProps<StatCardData>) {
  const { value, unit, comparison } = visualization.data;

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
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight sm:text-5xl">
          {typeof value === "number" ? formatCompactNumber(value) : value}
        </span>

        {unit ? (
          <span className="text-muted-foreground mb-1 text-sm">{unit}</span>
        ) : null}
      </div>
    </VisualizationCard>
  );
}
