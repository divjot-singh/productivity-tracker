import { ChevronRight } from "lucide-react";

import { MetricDefinition } from "@/models/metric";
import { ICONS } from "@/lib/metric-icons";
import Link from "next/link";

export default function MetricRow({ metric }: { metric: MetricDefinition }) {
  const Icon = ICONS[metric.icon ?? "goal"];

  return (
    <Link
      href={`/settings/goal/${metric.id}`}
      className="hover:bg-accent/40 flex items-start gap-4 border-b px-4 py-5 transition-colors last:border-b-0"
    >
      <div className="bg-secondary rounded-xl p-3">
        <Icon size={20} className="text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{metric.label}</h3>

            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {metric.description}
            </p>
          </div>

          <ChevronRight
            size={18}
            className="text-muted-foreground mt-1 shrink-0"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <SummaryItem label="Target" value={formatTarget(metric)} />

          <SummaryItem label="Weight" value={`${metric.weight} pts`} />

          <SummaryItem label="Scoring" value={formatScoring(metric)} />
        </div>
      </div>
    </Link>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </p>

      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function formatTarget(metric: MetricDefinition) {
  if (typeof metric.target === "boolean") {
    return metric.target ? "Yes" : "No";
  }

  return `${metric.target}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function formatScoring(metric: MetricDefinition) {
  switch (metric.scoring.type) {
    case "boolean":
      return "Boolean";

    case "goal":
      return "Goal";

    case "multiplier":
      return "Multiplier";

    case "range":
      return "Range";

    case "time-range":
      return "Time";

    case "options":
      return `${metric.scoring.options?.length ?? 0} options`;

    default:
      return "-";
  }
}
