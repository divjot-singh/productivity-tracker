"use client";

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
  const adjust = (direction: 1 | -1) =>
    onChange(Math.max(0, round((value ?? 0) + direction * step)));

  return (
    <div
      className={cn(
        "bg-muted/40 flex h-10 items-center overflow-hidden rounded-xl border",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => adjust(-1)}
        className="text-muted-foreground active:bg-accent flex h-full w-8 shrink-0 items-center justify-center"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={value ?? ""}
        placeholder="-"
        min={0}
        step={step}
        onWheel={(event) => event.currentTarget.blur()}
        onChange={(event) => {
          const raw = event.target.value;
          const parsed = Number(raw);

          onChange(raw === "" || !Number.isFinite(parsed) ? null : parsed);
        }}
        className="min-w-0 flex-1 [appearance:textfield] bg-transparent text-center text-sm font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => adjust(1)}
        className="text-muted-foreground active:bg-accent flex h-full w-8 shrink-0 items-center justify-center"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
