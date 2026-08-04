"use client";

import { MetricDefinition, MetricValue } from "@/models/metric";

import { Input } from "@/components/ui/input";

import MetricCard from "../MetricCard";

interface Props {
  metric: MetricDefinition;
  value: MetricValue | "";
  onChange: (value: MetricValue | "") => void;
}

export default function GoalInput({ metric, value, onChange }: Props) {
  const numericValue = value === "" ? 0 : Number(value);
  const target = Number(metric.target);

  const progress =
    target > 0 ? Math.min((numericValue / target) * 100, 100) : 0;

  const baseScore =
    target > 0 ? Math.min(numericValue / target, 1) * metric.weight : 0;

  const exceeded = Math.max(numericValue - target, 0);

  const bonus = exceeded > 0 ? (metric.scoring.bonusRate ?? 0) : 0;

  const score = baseScore + bonus;

  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={progress}
      bonus={bonus}
      subtitle={metric.scoringExplanation}
    >
      <div className="space-y-2">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={value === "" ? "" : Number(value)}
          min={0}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />

        <p className="text-muted-foreground text-xs">
          Target: {target}
          {metric.unit ? ` ${metric.unit}` : ""}
        </p>
      </div>
    </MetricCard>
  );
}
