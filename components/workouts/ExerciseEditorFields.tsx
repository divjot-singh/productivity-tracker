"use client";

import { useEffect, useMemo, useState } from "react";

import {
  EXERCISE_CATEGORY_OPTIONS,
  EXERCISE_EQUIPMENT_OPTIONS,
  EXERCISE_MUSCLE_GROUP_OPTIONS,
  EXERCISE_PROGRESSION_STRATEGY_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS,
  EXERCISE_WEIGHT_UNIT_OPTIONS,
  titleCaseWorkoutValue,
} from "@/lib/workouts/constants";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-12 w-full appearance-none rounded-[10px] border px-4 pr-12 text-base transition outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60";

interface ExerciseEditorFieldsProps {
  exercise: ExerciseDefinition;
  disabled?: boolean;
  combinations?: WorkoutCombination[];
  selectedCombinationIds?: string[];
  onToggleCombination?: (combinationId: string) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  onChange: (next: ExerciseDefinition) => void;
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export default function ExerciseEditorFields({
  exercise,
  disabled = false,
  combinations = [],
  selectedCombinationIds = [],
  onToggleCombination,
  onValidationChange,
  onChange,
}: ExerciseEditorFieldsProps) {
  const [categoryQuery, setCategoryQuery] = useState("");
  const [muscleQuery, setMuscleQuery] = useState("");
  const [repMinInput, setRepMinInput] = useState("");
  const [repMaxInput, setRepMaxInput] = useState("");

  useEffect(() => {
    setRepMinInput(exercise.progression.repRange?.min?.toString() ?? "");
    setRepMaxInput(exercise.progression.repRange?.max?.toString() ?? "");
  }, [exercise.progression.repRange?.min, exercise.progression.repRange?.max]);

  const notesText = exercise.notes.join("\n");

  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return EXERCISE_CATEGORY_OPTIONS;
    }

    return EXERCISE_CATEGORY_OPTIONS.filter((category) =>
      titleCaseWorkoutValue(category).toLowerCase().includes(normalizedQuery),
    );
  }, [categoryQuery]);

  const filteredMuscleGroups = useMemo(() => {
    const normalizedQuery = muscleQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return EXERCISE_MUSCLE_GROUP_OPTIONS;
    }

    return EXERCISE_MUSCLE_GROUP_OPTIONS.filter((muscleGroup) =>
      titleCaseWorkoutValue(muscleGroup)
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [muscleQuery]);

  const repRangeError = useMemo(() => {
    if (repMinInput === "" && repMaxInput === "") {
      return null;
    }

    if (repMinInput === "" || repMaxInput === "") {
      return "Enter both rep min and rep max.";
    }

    const min = Number(repMinInput);
    const max = Number(repMaxInput);

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min <= 0 ||
      max <= 0
    ) {
      return "Rep range values must be positive numbers.";
    }

    if (max < min) {
      return "Rep max must be greater than or equal to rep min.";
    }

    return null;
  }, [repMaxInput, repMinInput]);

  useEffect(() => {
    onValidationChange?.(Boolean(repRangeError));
  }, [onValidationChange, repRangeError]);

  function update(partial: Partial<ExerciseDefinition>) {
    onChange({ ...exercise, ...partial });
  }

  function updateRepRange(nextMinInput: string, nextMaxInput: string) {
    setRepMinInput(nextMinInput);
    setRepMaxInput(nextMaxInput);

    if (nextMinInput === "" && nextMaxInput === "") {
      update({
        progression: {
          ...exercise.progression,
          repRange: null,
        },
      });
      return;
    }

    if (nextMinInput === "" || nextMaxInput === "") {
      return;
    }

    const min = Number(nextMinInput);
    const max = Number(nextMaxInput);

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min <= 0 ||
      max <= 0 ||
      max < min
    ) {
      return;
    }

    update({
      progression: {
        ...exercise.progression,
        repRange: {
          min,
          max,
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          disabled={disabled}
          value={exercise.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Dumbbell Bench Press"
        />
      </div>

      <div className="space-y-3">
        <Label>Categories</Label>
        <Input
          disabled={disabled}
          value={categoryQuery}
          onChange={(e) => setCategoryQuery(e.target.value)}
          placeholder="Filter categories"
        />
        <div className="flex flex-wrap gap-2">
          {exercise.categories.map((category) => (
            <span
              key={category}
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
            >
              {titleCaseWorkoutValue(category)}
            </span>
          ))}
        </div>
        <div className="grid max-h-52 gap-2 overflow-auto sm:grid-cols-2">
          {filteredCategories.map((category) => {
            const checked = exercise.categories.includes(category);

            return (
              <label
                key={category}
                className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={checked}
                  onChange={() =>
                    update({
                      categories: toggleValue(exercise.categories, category),
                    })
                  }
                />
                <span>{titleCaseWorkoutValue(category)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Muscle Groups</Label>
        <Input
          disabled={disabled}
          value={muscleQuery}
          onChange={(e) => setMuscleQuery(e.target.value)}
          placeholder="Filter muscle groups"
        />
        <div className="flex flex-wrap gap-2">
          {exercise.muscleGroups.map((muscleGroup) => (
            <span
              key={muscleGroup}
              className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
            >
              {titleCaseWorkoutValue(muscleGroup)}
            </span>
          ))}
        </div>
        <div className="grid max-h-52 gap-2 overflow-auto sm:grid-cols-2">
          {filteredMuscleGroups.map((muscleGroup) => {
            const checked = exercise.muscleGroups.includes(muscleGroup);

            return (
              <label
                key={muscleGroup}
                className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={checked}
                  onChange={() =>
                    update({
                      muscleGroups: toggleValue(
                        exercise.muscleGroups,
                        muscleGroup,
                      ),
                    })
                  }
                />
                <span>{titleCaseWorkoutValue(muscleGroup)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Equipment</Label>
          <select
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
            value={exercise.equipment ?? ""}
            onChange={(e) =>
              update({
                equipment:
                  e.target.value === ""
                    ? undefined
                    : (e.target.value as ExerciseDefinition["equipment"]),
              })
            }
          >
            <option value="">Select equipment</option>
            {EXERCISE_EQUIPMENT_OPTIONS.map((equipment) => (
              <option key={equipment} value={equipment}>
                {titleCaseWorkoutValue(equipment)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <select
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
            value={exercise.type ?? ""}
            onChange={(e) =>
              update({
                type:
                  e.target.value === ""
                    ? undefined
                    : (e.target.value as ExerciseDefinition["type"]),
              })
            }
          >
            <option value="">Select type</option>
            {EXERCISE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {titleCaseWorkoutValue(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          disabled={disabled}
          value={exercise.description ?? ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          disabled={disabled}
          value={notesText}
          onChange={(e) =>
            update({
              notes: e.target.value.split("\n"),
            })
          }
          placeholder="One note per line"
        />
      </div>

      <div className="space-y-3">
        <Label>Tracking</Label>
        <div className="space-y-3 rounded-2xl border p-4">
          {[
            { key: "weight", label: "Track Weight" },
            { key: "reps", label: "Track Reps" },
            { key: "effort", label: "Track Effort" },
            { key: "duration", label: "Track Duration" },
            { key: "distance", label: "Track Distance" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
              </div>
              <Switch
                checked={Boolean(
                  exercise.tracking[item.key as keyof typeof exercise.tracking],
                )}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  update({
                    tracking: {
                      ...exercise.tracking,
                      [item.key]: checked,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Weight Unit</Label>
          <select
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
            value={exercise.weightTracking.unit}
            onChange={(e) =>
              update({
                weightTracking: {
                  ...exercise.weightTracking,
                  unit: e.target
                    .value as ExerciseDefinition["weightTracking"]["unit"],
                },
              })
            }
          >
            {EXERCISE_WEIGHT_UNIT_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Weight Mode</Label>
          <select
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
            value={exercise.weightTracking.mode}
            onChange={(e) =>
              update({
                weightTracking: {
                  ...exercise.weightTracking,
                  mode: e.target
                    .value as ExerciseDefinition["weightTracking"]["mode"],
                },
              })
            }
          >
            {EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {titleCaseWorkoutValue(mode)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Progression Strategy</Label>
          <select
            disabled={disabled}
            className={NATIVE_SELECT_CLASS}
            value={exercise.progression.strategy}
            onChange={(e) =>
              update({
                progression: {
                  ...exercise.progression,
                  strategy: e.target
                    .value as ExerciseDefinition["progression"]["strategy"],
                },
              })
            }
          >
            {EXERCISE_PROGRESSION_STRATEGY_OPTIONS.map((strategy) => (
              <option key={strategy} value={strategy}>
                {titleCaseWorkoutValue(strategy)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Rep Min</Label>
            <Input
              disabled={disabled}
              type="number"
              min={1}
              value={repMinInput}
              onChange={(e) => updateRepRange(e.target.value, repMaxInput)}
            />
          </div>

          <div className="space-y-2">
            <Label>Rep Max</Label>
            <Input
              disabled={disabled}
              type="number"
              min={1}
              value={repMaxInput}
              onChange={(e) => updateRepRange(repMinInput, e.target.value)}
            />
          </div>
        </div>
        {repRangeError ? (
          <p className="text-destructive text-xs">{repRangeError}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Current Weight</Label>
          <Input
            disabled={disabled}
            type="number"
            min={0}
            value={exercise.currentWeight ?? ""}
            onChange={(e) =>
              update({
                currentWeight:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Target Weight</Label>
          <Input
            disabled={disabled}
            type="number"
            min={0}
            value={exercise.targetWeight ?? ""}
            onChange={(e) =>
              update({
                targetWeight:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {onToggleCombination ? (
        <div className="space-y-3">
          <Label>Combinations</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {combinations.map((combination) => {
              const checked = selectedCombinationIds.includes(combination.id);

              return (
                <label
                  key={combination.id}
                  className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={checked}
                    onChange={() => onToggleCombination(combination.id)}
                  />
                  <span>{combination.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
