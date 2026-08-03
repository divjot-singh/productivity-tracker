import { cn } from "@/lib/utils";

import { TimelineData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { formatCompactNumber, VisualizationCard } from "./rendering-utils";

export default function TimelineRenderer({
  visualization,
}: VisualizationRendererProps<TimelineData>) {
  const items = visualization.data.items.slice(-8).reverse();

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.date}
            className="bg-background/30 flex items-center justify-between gap-3 rounded-2xl border border-white/8 px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  item.direction === "up"
                    ? "bg-primary"
                    : item.direction === "down"
                      ? "bg-accent"
                      : "bg-muted-foreground",
                )}
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs">
                  {item.delta > 0 ? "+" : ""}
                  {formatCompactNumber(item.delta)} change
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold">
              {formatCompactNumber(item.value)}
              {visualization.data.unit ? ` ${visualization.data.unit}` : ""}
            </p>
          </div>
        ))}
      </div>
    </VisualizationCard>
  );
}
