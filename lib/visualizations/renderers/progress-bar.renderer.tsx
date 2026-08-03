import { ProgressBarData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { formatCompactNumber, VisualizationCard } from "./rendering-utils";

export default function ProgressBarRenderer({
  visualization,
}: VisualizationRendererProps<ProgressBarData>) {
  const { value, target, percentage, label, unit } = visualization.data;

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {label ? (
            <p className="text-muted-foreground text-sm">{label}</p>
          ) : null}

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCompactNumber(value)}
            {unit ? (
              <span className="text-muted-foreground ml-1 text-sm">{unit}</span>
            ) : null}
          </p>
        </div>

        <p className="text-muted-foreground text-sm">
          {formatCompactNumber(target)}
          {unit ? ` ${unit}` : ""}
        </p>
      </div>

      <div className="bg-muted mt-4 h-3 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-muted-foreground mt-3 text-sm">
        {percentage}% complete
      </p>
    </VisualizationCard>
  );
}
