"use client";

import { cn } from "@/lib/utils";

import MetricCard from "../MetricCard";

import { MetricDefinition } from "@/models/metric";

interface Props {
  metric: MetricDefinition;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}

export default function OptionsInput({ metric, value, onChange }: Props) {
  const options = metric.scoring.options ?? [];

  const selectedOption = options.find((option) => option.value === value);

  const score = selectedOption ? selectedOption.multiplier * metric.weight : 0;

  const progress =
    metric.weight > 0 ? Math.min(selectedOption?.multiplier ?? 0, 1) * 100 : 0;

  const bonus = score > metric.weight ? score - metric.weight : undefined;

  return (
    <MetricCard
      metric={metric}
      progress={progress}
      score={score}
      bonus={bonus}
      subtitle={metric.scoringExplanation}
    >
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-sm border p-2.5 text-left text-sm transition-all",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              <div className="flex flex-col gap-0.5 text-center">
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground text-xs">
                  {(option.multiplier * metric.weight).toFixed(1)} pts
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </MetricCard>
  );
}
