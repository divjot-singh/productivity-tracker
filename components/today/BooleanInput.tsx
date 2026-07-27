"use client";

import { Switch } from "@/components/ui/switch";
import { MetricDefinition } from "@/models/metric";

export default function BooleanInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDefinition;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="bg-card flex items-center justify-between rounded-xl border border-zinc-800 p-4">
      <div>
        <p className="font-medium">{metric.label}</p>

        <p className="text-primary text-sm">Target: Yes</p>
      </div>

      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
