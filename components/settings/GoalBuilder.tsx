"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { MetricDefinition, MetricType, ScoringType } from "@/models/metric";

import GoalDetailsStep from "./steps/GoalDetailsStep";
import MetricTypeStep from "./steps/MetricTypeStep";
import ReviewStep from "./steps/ReviewStep";
import ScoringConfigStep from "./steps/ScoringConfigStep";
import ScoringTypeStep from "./steps/ScoringTypeStep";
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

const STEPS = [
  "Goal Details",
  "Metric Type",
  "Scoring Method",
  "Configuration",
  "Review",
];

export default function GoalBuilder() {
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
        return !!goal.type;

      case 2:
        return !!goal.scoring.type;

      case 3:
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
            return goal.scoring.options;

          case "boolean":
            return true;

          default:
            return false;
        }

      default:
        return true;
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

      router.push("/settings");

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

  return (
    <div className="bg-card rounded-2xl border p-6 shadow-sm">
      {/* Progress */}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-medium">
            Step {step + 1} of {STEPS.length}
          </p>

          <p className="text-muted-foreground text-sm">{STEPS[step]}</p>
        </div>

        <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Content */}

      {step === 0 && <GoalDetailsStep goal={goal} updateGoal={updateGoal} />}

      {step === 1 && (
        <MetricTypeStep
          goal={goal}
          updateMetricType={updateMetricType}
          updateGoal={updateGoal}
        />
      )}

      {step === 2 && (
        <ScoringTypeStep goal={goal} updateScoring={updateScoring} />
      )}

      {step === 3 && <ScoringConfigStep goal={goal} updateGoal={updateGoal} />}

      {step === 4 && <ReviewStep goal={goal} />}

      {/* Actions */}

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={previous}
          disabled={step === 0 || creating}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canContinue}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={creating}>
            {creating ? "Creating..." : "Create Goal"}
          </Button>
        )}
      </div>
    </div>
  );
}
