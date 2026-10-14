"use client";

import { Check } from "lucide-react";

import { useAppTheme } from "@/lib/hooks/useAppTheme";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export default function ThemePicker() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {THEMES.map((option) => {
          const active = option.id === theme;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-pressed={active}
              className={cn(
                "bg-card flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                active ? "border-primary" : "hover:bg-accent",
              )}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{ background: option.swatch.bg }}
              >
                <span
                  className="h-5 w-5 rounded-md"
                  style={{ background: option.swatch.surface }}
                >
                  <span
                    className="block h-full w-full scale-50 rounded-md"
                    style={{ background: option.swatch.accent }}
                  />
                </span>
              </span>

              <span className="flex-1">
                <span className="block text-sm font-medium">{option.name}</span>
                <span className="text-muted-foreground block text-xs">
                  {option.description}
                </span>
              </span>

              {active && <Check size={18} className="text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
