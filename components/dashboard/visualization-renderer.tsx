import { rendererRegistry } from "@/lib/visualizations/renderers/renderer-registry";
import { cn } from "@/lib/utils";
import { VisualizationResponse } from "@/models/visualization";

interface Props {
  visualization: VisualizationResponse;
}

export default function DashboardVisualizationRenderer({
  visualization,
}: Props) {
  const Renderer = rendererRegistry[visualization.widget];
  const isWideWidget = [
    "line-chart",
    "area-chart",
    "bar-chart",
    "heatmap",
    "radar-chart",
    "leaderboard",
    "timeline",
  ].includes(visualization.widget);

  if (!Renderer) {
    return (
      <div className="bg-card/70 text-muted-foreground rounded-[28px] border border-dashed border-white/10 p-5 text-sm">
        Unsupported widget: {visualization.widget}
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", isWideWidget && "xl:col-span-2")}>
      <Renderer visualization={visualization} />
    </div>
  );
}
