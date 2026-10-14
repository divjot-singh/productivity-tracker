"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const WEIGHT_PRESETS = [
  { label: "Low", value: 3 },
  { label: "Normal", value: 5 },
  { label: "High", value: 8 },
  { label: "Critical", value: 10 },
];

export function YesNo({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
      {[false, true].map((option) => (
        <button
          key={String(option)}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-11 rounded-xl border text-sm font-medium",
            value === option
              ? "bg-primary text-primary-foreground border-transparent"
              : "active:bg-accent",
          )}
        >
          {option ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

export function WeightPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const presetActive = WEIGHT_PRESETS.some((preset) => preset.value === value);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {WEIGHT_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={value === preset.value}
            onClick={() => onChange(preset.value)}
            className={cn(
              "h-11 rounded-xl border text-sm font-medium",
              value === preset.value
                ? "bg-primary text-primary-foreground border-transparent"
                : "active:bg-accent",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="goal-weight" className="text-muted-foreground text-xs">
          {presetActive ? "Points per day" : "Custom points per day"}
        </label>

        <Input
          id="goal-weight"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          className="h-9 w-20"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
