"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { MetricDefinition, MetricType, ScoringType } from "@/models/metric";

import GoalPreview from "./GoalPreview";
import BasicsStep from "./steps/BasicsStep";
import ScoringStep from "./steps/ScoringStep";
import TrackingStep from "./steps/TrackingStep";
import { apiRequest } from "@/lib/api/client";

function createEmptyGoal(): MetricDefinition {
  return {
    id: crypto.randomUUID(),

    label: "",

    icon: "goal",

    description: "",

    category: "health",

    displayOrder: 999,

    type: "number",

    unit: "",

    defaultValue: 0,

    target: 0,
    weight: 5,

    scoring: {
      type: "goal",
    },
  };
}

const STEPS = ["Basics", "Tracking", "Scoring"];

interface GoalBuilderProps {
  redirectPath?: string;
  onSuccess?: () => void;
}

export default function GoalBuilder({
  redirectPath = "/settings",
  onSuccess,
}: GoalBuilderProps) {
  const { user } = useAuth();

  const router = useRouter();

  const [step, setStep] = useState(0);

  const [goal, setGoal] = useState<MetricDefinition>(createEmptyGoal);

  const [creating, setCreating] = useState(false);

  function updateGoal(partial: Partial<MetricDefinition>) {
    setGoal((previous) => ({
      ...previous,
      ...partial,
    }));
  }

  function updateMetricType(type: MetricType) {
    let scoring: ScoringType = "goal";

    if (type === "boolean") {
      scoring = "boolean";
    }

    if (type === "time") {
      scoring = "time-range";
    }

    setGoal((previous) => ({
      ...previous,

      type,

      scoring: {
        type: scoring,
      },
    }));
  }

  function updateScoring(type: ScoringType) {
    setGoal((previous) => ({
      ...previous,

      scoring: {
        ...previous.scoring,

        type,
      },
    }));
  }

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return goal.label.trim().length > 0;

      case 1:
        return goal.weight >= 0;

      default:
        switch (goal.scoring.type) {
          case "goal":
            return goal.target !== "" && (goal.scoring.bonusRate ?? 0) >= 0;

          case "multiplier":
            return (goal.scoring.multiplier ?? 0) > 0;

          case "range":
            return (goal.scoring.ranges?.length ?? 0) > 0;

          case "time-range":
            return (goal.scoring.time?.length ?? 0) > 0;

          case "options":
            return Boolean(goal.scoring.options?.length);

          case "boolean":
            return true;

          default:
            return false;
        }
    }
  }, [goal, step]);

  function next() {
    if (step < STEPS.length - 1) {
      setStep((previous) => previous + 1);
    }
  }

  function previous() {
    if (step > 0) {
      setStep((previous) => previous - 1);
    }
  }

  async function handleSubmit() {
    if (!user) {
      return;
    }

    try {
      setCreating(true);

      await apiRequest(user, "/api/goals", {
        method: "POST",
        body: goal,
      });

      onSuccess?.();

      router.push(redirectPath);

      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to create goal",
      );
    } finally {
      setCreating(false);
    }
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <p className="text-muted-foreground text-xs">
          Step {step + 1} of {STEPS.length} - {STEPS[step]}
        </p>
      </div>

      {step > 0 ? <GoalPreview goal={goal} /> : null}

      {step === 0 && <BasicsStep goal={goal} updateGoal={updateGoal} />}

      {step === 1 && (
        <TrackingStep
          goal={goal}
          updateMetricType={updateMetricType}
          updateGoal={updateGoal}
        />
      )}

      {step === 2 && (
        <ScoringStep
          goal={goal}
          updateGoal={updateGoal}
          updateScoring={updateScoring}
        />
      )}

      <div className="bg-background sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 -mx-4 flex gap-2 border-t px-4 py-3 lg:bottom-0">
        <Button
          variant="outline"
          className="h-12 flex-1"
          onClick={previous}
          disabled={step === 0 || creating}
        >
          Back
        </Button>

        {last ? (
          <Button
            className="h-12 flex-[2]"
            onClick={handleSubmit}
            disabled={creating || !canContinue}
          >
            {creating ? "Creating..." : "Create goal"}
          </Button>
        ) : (
          <Button
            className="h-12 flex-[2]"
            onClick={next}
            disabled={!canContinue}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
