"use client";

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

  const score = selectedOption?.score ?? 0;

  const progress =
    metric.weight > 0 ? Math.min((score / metric.weight) * 100, 100) : 0;

  return (
    <MetricCard
      metric={metric}
      progress={progress}
      score={score}
      subtitle={`${options.length} available option${options.length === 1 ? "" : "s"}`}
    >
      <div className="space-y-3">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{option.label}</p>

                  <p className="text-muted-foreground mt-1 text-sm">
                    Value: {String(option.value)}
                  </p>
                </div>

                <div
                  className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {option.score} pts
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </MetricCard>
  );
}
