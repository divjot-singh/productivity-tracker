"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepperProps {
  value: number | null;
  step: number;
  label: string;
  onChange: (value: number | null) => void;
  className?: string;
}

const round = (value: number) => Math.round(value * 100) / 100;

// Tap to step, or type a value with the numeric keypad.
export default function Stepper({
  value,
  step,
  label,
  onChange,
  className,
}: StepperProps) {
  // Raw text while typing, so "2." survives until blur.
  const [draft, setDraft] = useState<string | null>(null);

  const adjust = (direction: 1 | -1) => {
    setDraft(null);
    onChange(Math.max(0, round((value ?? 0) + direction * step)));
  };

  return (
    <div
      className={cn(
        "bg-muted/40 flex h-11 items-center overflow-hidden rounded-xl border",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => adjust(-1)}
        className="text-muted-foreground active:bg-accent flex h-full w-10 shrink-0 items-center justify-center"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        value={draft ?? value ?? ""}
        placeholder="-"
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => setDraft(null)}
        onChange={(event) => {
          const raw = event.target.value.replace(",", ".");

          if (!/^\d*\.?\d*$/.test(raw)) return;

          setDraft(raw);
          onChange(raw === "" || raw === "." ? null : Number(raw));
        }}
        className="min-w-0 flex-1 bg-transparent text-center text-base font-semibold outline-none"
      />

      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => adjust(1)}
        className="text-muted-foreground active:bg-accent flex h-full w-10 shrink-0 items-center justify-center"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
