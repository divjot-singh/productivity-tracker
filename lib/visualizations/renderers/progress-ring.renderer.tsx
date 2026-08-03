import { ProgressRingData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { formatCompactNumber, VisualizationCard } from "./rendering-utils";

export default function ProgressRingRenderer({
  visualization,
}: VisualizationRendererProps<ProgressRingData>) {
  const { percentage, value, target, label, unit } = visualization.data;

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div
          className="relative flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${percentage}%, color-mix(in srgb, var(--muted) 90%, transparent) ${percentage}%)`,
          }}
        >
          <div className="bg-background flex h-24 w-24 items-center justify-center rounded-full border border-white/6">
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight">
                {formatCompactNumber(value)}
              </div>
              {unit ? (
                <div className="text-muted-foreground text-[11px]">{unit}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="w-full flex-1 text-center sm:text-left">
          {label ? (
            <p className="text-muted-foreground text-sm">{label}</p>
          ) : null}
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {percentage}%
          </p>
          {target ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Target {formatCompactNumber(target)}
              {unit ? ` ${unit}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </VisualizationCard>
  );
}
