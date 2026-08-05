"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MetricDefinition, MetricType } from "@/models/metric";
import { StreakRule, StreakRuleCondition } from "@/models/visualization";

interface StreakRuleEditorProps {
  goals: MetricDefinition[];
  value?: StreakRule;
  onChange: (value?: StreakRule) => void;
}

const BOOLEAN_VALUES = [true, false] as const;

export default function StreakRuleEditor({
  goals,
  value,
  onChange,
}: StreakRuleEditorProps) {
  const enabled = Boolean(value);

  function createDefaultCondition(): StreakRuleCondition {
    const goal = goals[0];

    if (!goal) {
      return {
        goalLabel: "",
        comparator: "gte",
        value: 1,
      };
    }

    return createConditionForGoal(goal);
  }

  function handleEnabledChange(checked: boolean) {
    if (!checked) {
      onChange(undefined);
      return;
    }

    onChange({
      operator: "or",
      conditions: value?.conditions.length
        ? value.conditions
        : [createDefaultCondition()],
    });
  }

  function updateCondition(index: number, condition: StreakRuleCondition) {
    if (!value) return;

    const next = [...value.conditions];
    next[index] = condition;
    onChange({ ...value, conditions: next });
  }

  function addCondition() {
    if (!value) return;

    onChange({
      ...value,
      conditions: [...value.conditions, createDefaultCondition()],
    });
  }

  function removeCondition(index: number) {
    if (!value) return;

    const next = value.conditions.filter((_, itemIndex) => itemIndex !== index);

    if (next.length === 0) {
      return;
    }

    onChange({ ...value, conditions: next });
  }

  if (!goals.length) {
    return (
      <div className="space-y-2">
        <Label>Streak Rule</Label>
        <p className="text-muted-foreground text-sm">
          Load goals first to configure a composite streak rule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="use-streak-rule">Composite streak rule</Label>
          <p className="text-muted-foreground text-sm">
            Combine multiple goals with AND or OR.
          </p>
        </div>

        <Switch
          id="use-streak-rule"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {enabled && value && (
        <>
          <div className="space-y-2">
            <Label htmlFor="streak-operator">Operator</Label>
            <Select
              value={value.operator}
              onValueChange={(operator) =>
                onChange({
                  ...value,
                  operator: operator as StreakRule["operator"],
                })
              }
            >
              <SelectTrigger id="streak-operator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="or">Any condition matches</SelectItem>
                <SelectItem value="and">All conditions match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {value.conditions.map((condition, index) => (
              <ConditionRow
                key={`${condition.goalLabel}-${index}`}
                condition={condition}
                goals={goals}
                onChange={(nextCondition) =>
                  updateCondition(index, nextCondition)
                }
                onRemove={() => removeCondition(index)}
                canRemove={value.conditions.length > 1}
              />
            ))}

            <Button type="button" variant="outline" onClick={addCondition}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add condition
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ConditionRow({
  condition,
  goals,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: StreakRuleCondition;
  goals: MetricDefinition[];
  onChange: (condition: StreakRuleCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const selectedGoal = goals.find((goal) => goal.label === condition.goalLabel);
  const goalType = selectedGoal?.type ?? "number";
  const comparatorOptions = getComparatorOptions(goalType);

  function handleGoalChange(goalLabel: string) {
    const goal = goals.find((item) => item.label === goalLabel);

    if (!goal) {
      onChange({
        ...condition,
        goalLabel,
      });
      return;
    }

    onChange(createConditionForGoal(goal));
  }

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2 md:col-span-1">
          <Label>Goal</Label>
          <Select
            value={condition.goalLabel}
            onValueChange={(value) => handleGoalChange(value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.label}>
                  {goal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>Comparator</Label>
          <Select
            value={condition.comparator}
            onValueChange={(comparator) =>
              onChange({
                ...condition,
                comparator: comparator as StreakRuleCondition["comparator"],
                value:
                  comparator === "eq" && goalType === "boolean"
                    ? Boolean(condition.value)
                    : condition.value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {comparatorOptions.map((comparator) => (
                <SelectItem key={comparator.value} value={comparator.value}>
                  {comparator.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>Value</Label>
          {goalType === "boolean" ? (
            <Select
              value={String(Boolean(condition.value))}
              onValueChange={(value) =>
                onChange({
                  ...condition,
                  value: value === "true",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOLEAN_VALUES.map((boolValue) => (
                  <SelectItem key={String(boolValue)} value={String(boolValue)}>
                    {String(boolValue)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : goalType === "time" ? (
            <Input
              value={typeof condition.value === "string" ? condition.value : ""}
              onChange={(event) =>
                onChange({
                  ...condition,
                  value: event.target.value,
                })
              }
            />
          ) : (
            <Input
              type="number"
              value={typeof condition.value === "number" ? condition.value : ""}
              onChange={(event) =>
                onChange({
                  ...condition,
                  value:
                    event.target.value === "" ? 0 : Number(event.target.value),
                })
              }
            />
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

function createConditionForGoal(goal: MetricDefinition): StreakRuleCondition {
  if (goal.type === "boolean") {
    return {
      goalLabel: goal.label,
      comparator: "eq",
      value: true,
    };
  }

  if (goal.type === "time") {
    return {
      goalLabel: goal.label,
      comparator: "eq",
      value: String(goal.target),
    };
  }

  return {
    goalLabel: goal.label,
    comparator: "gte",
    value: 1,
  };
}

function getComparatorOptions(goalType: MetricType) {
  if (goalType === "boolean") {
    return [{ value: "eq", label: "is equal to" }];
  }

  if (goalType === "time") {
    return [{ value: "eq", label: "is equal to" }];
  }

  return [
    { value: "eq", label: "is equal to" },
    { value: "gt", label: "is greater than" },
    { value: "gte", label: "is greater than or equal to" },
    { value: "lt", label: "is less than" },
    { value: "lte", label: "is less than or equal to" },
  ];
}
