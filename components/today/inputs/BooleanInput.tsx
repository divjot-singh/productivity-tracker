"use client";

import MetricCard from "../MetricCard";

import { cn } from "@/lib/utils";
import { MetricDefinition } from "@/models/metric";

interface Props {
  metric: MetricDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function BooleanInput({ metric, value, onChange }: Props) {
  const progress = value == metric.target ? 100 : 0;
  const score = value == metric.target ? metric.weight : 0;
  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={progress}
      subtitle={metric.scoringExplanation}
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded-sm border p-3 text-sm font-medium transition-all",
            value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-accent",
          )}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded-xl border p-3 text-sm font-medium transition-all",
            !value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-accent",
          )}
        >
          No
        </button>
      </div>
    </MetricCard>
  );
}
