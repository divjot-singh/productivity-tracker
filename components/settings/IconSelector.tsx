"use client";

import { ICONS, ICON_LABELS } from "@/lib/metric-icons";
import { cn } from "@/lib/utils";

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconSelector({ value, onChange }: IconSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {Object.entries(ICONS).map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border p-2 transition-all",
            value === key
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-accent",
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[0.65rem] leading-tight">
            {ICON_LABELS[key] ?? key}
          </span>
        </button>
      ))}
    </div>
  );
}
