"use client";

import { Input } from "@/components/ui/input";
import { MetricDefinition } from "@/models/metric";

export default function NumberInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDefinition;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-zinc-800 p-4">
      <p className="font-medium">{metric.label}</p>

      <p className="text-primary mt-1 text-sm">
        Goal {metric.target} {metric.unit}
      </p>

      <Input
        className="mt-4 h-12 text-lg"
        type="number"
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
