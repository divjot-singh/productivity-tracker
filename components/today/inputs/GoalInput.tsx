"use client";

import { MetricDefinition, MetricValue } from "@/models/metric";

import { Input } from "@/components/ui/input";
import { toInputNumber, toNumericOrZero } from "@/lib/today/numeric";

import MetricCard from "../MetricCard";

interface Props {
  metric: MetricDefinition;
  value: MetricValue | "";
  onChange: (value: MetricValue | "") => void;
}

export default function GoalInput({ metric, value, onChange }: Props) {
  const numericValue = toNumericOrZero(value);
  const target = Number(metric.target);

  const progress =
    target > 0 ? Math.min((numericValue / target) * 100, 100) : 0;

  let score = target > 0 ? (numericValue / target) * metric.weight : 0;
  if (metric.scoring.maxScore !== undefined) {
    score = Math.min(score, metric.scoring.maxScore);
  }
  if (metric.scoring.bonusRate !== undefined) {
    score = Math.min(score, metric.weight + metric.scoring.bonusRate);
  }
  const bonus = Math.max(score - metric.weight, 0);

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
          value={toInputNumber(value)}
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
