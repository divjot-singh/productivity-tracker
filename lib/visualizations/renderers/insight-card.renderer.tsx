import { cn } from "@/lib/utils";

import { InsightCardData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { VisualizationCard } from "./rendering-utils";

export default function InsightCardRenderer({
  visualization,
}: VisualizationRendererProps<InsightCardData>) {
  const { headline, message, stats, tone } = visualization.data;

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div
        className={cn(
          "rounded-2xl border p-4",
          tone === "positive"
            ? "border-primary/40 bg-primary/10"
            : tone === "negative"
              ? "border-accent/40 bg-accent/10"
              : "bg-background/30 border-white/10",
        )}
      >
        <p className="text-sm font-semibold tracking-tight">{headline}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          {message}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background/30 rounded-xl border border-white/8 px-3 py-2"
          >
            <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
              {stat.label}
            </p>
            <p className="mt-1 text-sm font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </VisualizationCard>
  );
}
