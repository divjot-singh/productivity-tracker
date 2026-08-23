import { Trophy } from "lucide-react";

import { LeaderboardData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { formatCompactNumber, VisualizationCard } from "./rendering-utils";

const rankStyles = [
  "bg-primary/18 text-primary",
  "bg-accent/16 text-accent",
  "bg-secondary text-foreground",
];

export default function LeaderboardRenderer({
  visualization,
}: VisualizationRendererProps<LeaderboardData>) {
  const { items } = visualization.data;

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="bg-background/30 flex items-center justify-between gap-3 rounded-2xl border border-white/6 px-3 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${rankStyles[index] ?? "bg-muted text-foreground"}`}
              >
                {index < 3 ? <Trophy className="h-4 w-4" /> : index + 1}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize">
                  {item.label}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-base font-semibold">
                {formatCompactNumber(item.value)}
                {item.percentage !== undefined ? "%" : ""}
                {item.percentage === undefined && item.unit
                  ? ` ${item.unit}`
                  : ""}
              </p>

              {item.score !== undefined && item.weight !== undefined ? (
                <p className="text-muted-foreground text-xs">
                  {formatCompactNumber(item.score)} /{" "}
                  {formatCompactNumber(item.weight)}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </VisualizationCard>
  );
}
