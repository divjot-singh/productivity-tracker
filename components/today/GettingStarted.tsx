"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

const DISMISSED_KEY = "daylog-getting-started-dismissed";

interface Step {
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

// Shown on Today until the first goal, entry and workout exist, or the user dismisses it.
export default function GettingStarted({
  hasGoals,
  hasEntry,
  hasWorkout,
}: {
  hasGoals: boolean;
  hasEntry: boolean;
  hasWorkout: boolean | null;
}) {
  const [dismissed, setDismissed] = useState(readDismissed);

  const steps: Step[] = [
    {
      label: "Add your goals",
      hint: "Pick templates or create your own",
      href: "/settings/add",
      done: hasGoals,
    },
    {
      label: "Log your first day",
      hint: "Tap your habits below, it saves by itself",
      href: "/today",
      done: hasEntry,
    },
    {
      label: "Log a workout",
      hint: "Track sets and see your records",
      href: "/workouts",
      done: hasWorkout === true,
    },
  ];

  const complete = steps.every((step) => step.done);

  if (dismissed || complete || hasWorkout === null) {
    return null;
  }

  function dismiss() {
    setDismissed(true);

    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage can be blocked; the card stays hidden for this visit.
    }
  }

  return (
    <div className="bg-card relative rounded-2xl border p-4">
      <button
        type="button"
        aria-label="Dismiss getting started"
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
      >
        <X size={16} />
      </button>

      <p className="font-semibold">Getting started</p>

      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-lg py-1"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border",
                )}
              >
                {step.done ? <Check size={14} /> : null}
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.label}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {step.hint}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
