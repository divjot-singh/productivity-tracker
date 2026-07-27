"use client";

import { Input } from "@/components/ui/input";
import { MetricDefinition } from "@/models/metric";

export default function TimeInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-zinc-800 p-4">
      <p className="font-medium">{metric.label}</p>

      <p className="text-primary mt-1 text-sm">Goal {metric.target}</p>

      <Input
        className="mt-4 h-12 text-lg"
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
