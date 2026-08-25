"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import {
  EXERCISE_CATEGORY_OPTIONS,
  EXERCISE_EQUIPMENT_OPTIONS,
  EXERCISE_MEASUREMENT_MODE_OPTIONS,
  EXERCISE_MUSCLE_GROUP_OPTIONS,
  EXERCISE_PROGRESSION_STRATEGY_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS,
  EXERCISE_WEIGHT_UNIT_OPTIONS,
  formatExerciseEquipmentLabel,
  getPrimaryMetricLabel,
  normalizeEquipmentValue,
  titleCaseWorkoutValue,
} from "@/lib/workouts/constants";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/workouts/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-11 w-full appearance-none rounded-xl border px-3.5 pr-10 text-sm transition outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60";

interface ExerciseEditorFieldsProps {
  exercise: ExerciseDefinition;
  disabled?: boolean;
  equipmentOptions?: string[];
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>

        {description ? (
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function SelectedValue({
  children,
  onRemove,
  disabled,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <span className="bg-muted inline-flex max-w-full items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium">
      <span className="truncate">{children}</span>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground ml-0.5 shrink-0 rounded-sm transition-colors disabled:pointer-events-none disabled:opacity-50"
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function NativeSelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
    </div>
  );
}

export default function ExerciseEditorFields({
  exercise,
  disabled = false,
  equipmentOptions = [],
  combinations = [],
  selectedCombinationIds = [],
  onToggleCombination,
  onValidationChange,
  onChange,
}: ExerciseEditorFieldsProps) {
  const [repMinInput, setRepMinInput] = useState("");
  const [repMaxInput, setRepMaxInput] = useState("");

  useEffect(() => {
    setRepMinInput(exercise.progression.repRange?.min?.toString() ?? "");
    setRepMaxInput(exercise.progression.repRange?.max?.toString() ?? "");
  }, [exercise.progression.repRange?.min, exercise.progression.repRange?.max]);

  const notesText = exercise.notes.join("\n");
  const primaryMetricLabel = getPrimaryMetricLabel(exercise.measurementMode);
  const selectedEquipments = Array.from(
    new Set(
      [
        ...(exercise.equipments ?? []),
        ...(exercise.equipment ? [exercise.equipment] : []),
      ]
        .map((value) => normalizeEquipmentValue(value))
        .filter((value) => value.length > 0),
    ),
  );
  const resolvedEquipmentOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...EXERCISE_EQUIPMENT_OPTIONS,
        ...equipmentOptions,
        ...selectedEquipments,
      ]),
    ).sort();
  }, [equipmentOptions, selectedEquipments]);
  const categoryOptions = useMemo(
    () =>
      EXERCISE_CATEGORY_OPTIONS.map((category) => ({
        value: category,
        label: titleCaseWorkoutValue(category),
      })),
    [],
  );
  const muscleOptions = useMemo(
    () =>
      EXERCISE_MUSCLE_GROUP_OPTIONS.map((muscleGroup) => ({
        value: muscleGroup,
        label: titleCaseWorkoutValue(muscleGroup),
      })),
    [],
  );
  const equipmentSelectOptions = useMemo(
    () =>
      resolvedEquipmentOptions.map((equipment) => ({
        value: equipment,
        label: formatExerciseEquipmentLabel(equipment),
      })),
    [resolvedEquipmentOptions],
  );
  const combinationOptions = useMemo(
    () =>
      combinations.map((combination) => ({
        value: combination.id,
        label: combination.name,
      })),
    [combinations],
  );

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
    onChange({
      ...exercise,
      ...partial,
    });
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

  function updateEquipments(nextEquipments: string[]) {
    update({
      equipments: nextEquipments,
    });
  }

  function addCustomEquipment(value: string) {
    const normalized = normalizeEquipmentValue(value);

    if (!normalized) {
      return;
    }

    if (!selectedEquipments.includes(normalized)) {
      updateEquipments([...selectedEquipments, normalized]);
    }
  }

  return (
    <div className="space-y-10">
      {/* ─────────────────────────────────────
          BASIC INFORMATION
      ───────────────────────────────────── */}

      <Section
        title="Basic information"
        description="The name and description shown throughout your workout history."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Name</Label>

            <Input
              id="exercise-name"
              disabled={disabled}
              value={exercise.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Dumbbell Bench Press"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise-description">Description</Label>

            <Textarea
              id="exercise-description"
              disabled={disabled}
              value={exercise.description ?? ""}
              onChange={(e) =>
                update({
                  description: e.target.value,
                })
              }
              placeholder="Optional description"
              className="min-h-24 resize-none rounded-xl"
            />
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────
          CLASSIFICATION
      ───────────────────────────────────── */}

      <Section
        title="Classification"
        description="Organize this exercise so it can be found and grouped correctly."
      >
        <div className="space-y-6">
          {/* Categories */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <Label>Categories</Label>

              {exercise.categories.length > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {exercise.categories.length} selected
                </span>
              ) : null}
            </div>

            {exercise.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {exercise.categories.map((category) => (
                  <SelectedValue
                    key={category}
                    disabled={disabled}
                    onRemove={() =>
                      update({
                        categories: toggleValue(exercise.categories, category),
                      })
                    }
                  >
                    {titleCaseWorkoutValue(category)}
                  </SelectedValue>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No categories selected.
              </p>
            )}

            <SearchableSelect
              mode="multi"
              options={categoryOptions}
              value={exercise.categories as string[]}
              disabled={disabled}
              placeholder="Select categories"
              searchPlaceholder="Search categories..."
              emptyText="No categories found."
              onChange={(next) =>
                update({
                  categories: next as ExerciseDefinition["categories"],
                })
              }
            />
          </div>

          {/* Muscle groups */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <Label>Muscle groups</Label>

              {exercise.muscleGroups.length > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {exercise.muscleGroups.length} selected
                </span>
              ) : null}
            </div>

            {exercise.muscleGroups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {exercise.muscleGroups.map((muscleGroup) => (
                  <SelectedValue
                    key={muscleGroup}
                    disabled={disabled}
                    onRemove={() =>
                      update({
                        muscleGroups: toggleValue(
                          exercise.muscleGroups,
                          muscleGroup,
                        ),
                      })
                    }
                  >
                    {titleCaseWorkoutValue(muscleGroup)}
                  </SelectedValue>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No muscle groups selected.
              </p>
            )}

            <SearchableSelect
              mode="multi"
              options={muscleOptions}
              value={exercise.muscleGroups as string[]}
              disabled={disabled}
              placeholder="Select muscle groups"
              searchPlaceholder="Search muscle groups..."
              emptyText="No muscle groups found."
              onChange={(next) =>
                update({
                  muscleGroups: next as ExerciseDefinition["muscleGroups"],
                })
              }
            />
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────
          EQUIPMENT
      ───────────────────────────────────── */}

      <Section
        title="Exercise setup"
        description="Define the equipment and exercise type used for tracking."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Equipment</Label>

            {selectedEquipments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedEquipments.map((equipment) => (
                  <SelectedValue
                    key={equipment}
                    disabled={disabled}
                    onRemove={() =>
                      updateEquipments(
                        selectedEquipments.filter((item) => item !== equipment),
                      )
                    }
                  >
                    {formatExerciseEquipmentLabel(equipment)}
                  </SelectedValue>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No equipment selected.
              </p>
            )}

            <SearchableSelect
              mode="multi"
              options={equipmentSelectOptions}
              value={selectedEquipments}
              disabled={disabled}
              placeholder="Select one or more equipment"
              searchPlaceholder="Search or type equipment..."
              emptyText="No equipment found."
              allowCreateOption
              onCreateOption={addCustomEquipment}
              onChange={updateEquipments}
            />

            <p className="text-muted-foreground text-xs">
              Select multiple presets, or type any custom equipment and choose
              Add "name".
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="measurement-mode">Measurement mode</Label>

              <NativeSelectWrapper>
                <select
                  id="measurement-mode"
                  disabled={disabled}
                  className={NATIVE_SELECT_CLASS}
                  value={exercise.measurementMode ?? "external_load"}
                  onChange={(e) => {
                    const mode = e.target
                      .value as ExerciseDefinition["measurementMode"];

                    const nextUnit =
                      mode === "bodyweight_height"
                        ? ["in", "cm", "m"].includes(
                            exercise.weightTracking.unit,
                          )
                          ? exercise.weightTracking.unit
                          : "in"
                        : ["kg", "lb"].includes(exercise.weightTracking.unit)
                          ? exercise.weightTracking.unit
                          : "kg";

                    update({
                      measurementMode: mode,
                      tracking: {
                        ...exercise.tracking,
                        weight: true,
                      },
                      weightTracking: {
                        ...exercise.weightTracking,
                        mode:
                          mode === "bodyweight_height"
                            ? "bodyweight"
                            : exercise.weightTracking.mode,
                        unit: nextUnit,
                      },
                    });
                  }}
                >
                  {EXERCISE_MEASUREMENT_MODE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>
                      {titleCaseWorkoutValue(mode)}
                    </option>
                  ))}
                </select>
              </NativeSelectWrapper>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-type">Type</Label>

              <NativeSelectWrapper>
                <select
                  id="exercise-type"
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
              </NativeSelectWrapper>
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────
          TRACKING
      ───────────────────────────────────── */}

      <Section
        title="Tracking"
        description="Choose which metrics should be recorded when this exercise is performed."
      >
        <div className="divide-y rounded-2xl border">
          {[
            {
              key: "weight",
              label: primaryMetricLabel,
              description:
                primaryMetricLabel === "Height"
                  ? "Track the height used for each set."
                  : "Track the weight used for each set.",
            },
            {
              key: "reps",
              label: "Reps",
              description: "Track repetitions completed.",
            },
            {
              key: "effort",
              label: "Effort",
              description: "Track perceived effort for each set.",
            },
            {
              key: "duration",
              label: "Duration",
              description: "Track how long the exercise was performed.",
            },
            {
              key: "distance",
              label: "Distance",
              description: "Track distance where applicable.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.label}</p>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  {item.description}
                </p>
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
      </Section>

      {/* ─────────────────────────────────────
          WEIGHT TRACKING
      ───────────────────────────────────── */}

      <Section
        title="Primary metric tracking"
        description="Configure how the primary training metric should be recorded for this exercise."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weight-unit">{primaryMetricLabel} unit</Label>

            <NativeSelectWrapper>
              <select
                id="weight-unit"
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
                {EXERCISE_WEIGHT_UNIT_OPTIONS.filter((unit) =>
                  (exercise.measurementMode ?? "external_load") ===
                  "bodyweight_height"
                    ? ["in", "cm", "m"].includes(unit)
                    : ["kg", "lb"].includes(unit),
                ).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.toUpperCase()}
                  </option>
                ))}
              </select>
            </NativeSelectWrapper>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight-mode">Weight mode</Label>

            <NativeSelectWrapper>
              <select
                id="weight-mode"
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
            </NativeSelectWrapper>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="current-weight">
              Current {primaryMetricLabel.toLowerCase()}
            </Label>

            <Input
              id="current-weight"
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
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-weight">
              Target {primaryMetricLabel.toLowerCase()}
            </Label>

            <Input
              id="target-weight"
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
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────
          PROGRESSION
      ───────────────────────────────────── */}

      <Section
        title="Progression"
        description="Define how you want to progress this exercise over time."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="progression-strategy">Strategy</Label>

            <NativeSelectWrapper>
              <select
                id="progression-strategy"
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
            </NativeSelectWrapper>
          </div>

          <div className="space-y-2">
            <Label>Rep range</Label>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="rep-min"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Minimum
                </Label>

                <Input
                  id="rep-min"
                  disabled={disabled}
                  type="number"
                  min={1}
                  value={repMinInput}
                  onChange={(e) => updateRepRange(e.target.value, repMaxInput)}
                  placeholder="6"
                  className="h-11 rounded-xl"
                />
              </div>

              <span className="text-muted-foreground pb-2.5">–</span>

              <div className="space-y-1.5">
                <Label
                  htmlFor="rep-max"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Maximum
                </Label>

                <Input
                  id="rep-max"
                  disabled={disabled}
                  type="number"
                  min={1}
                  value={repMaxInput}
                  onChange={(e) => updateRepRange(repMinInput, e.target.value)}
                  placeholder="10"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {repRangeError ? (
              <p className="text-destructive text-xs">{repRangeError}</p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Leave both fields empty if this exercise doesn't use a rep
                range.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────
          COMBINATIONS
      ───────────────────────────────────── */}

      {onToggleCombination ? (
        <Section
          title="Workout combinations"
          description="Choose which workout combinations should include this exercise."
        >
          <div className="space-y-3">
            {selectedCombinationIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedCombinationIds.map((combinationId) => {
                  const combination = combinations.find(
                    (item) => item.id === combinationId,
                  );

                  if (!combination) {
                    return null;
                  }

                  return (
                    <SelectedValue
                      key={combination.id}
                      disabled={disabled}
                      onRemove={() => onToggleCombination(combination.id)}
                    >
                      {combination.name}
                    </SelectedValue>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                This exercise isn't included in any workout combination.
              </p>
            )}

            <SearchableSelect
              mode="multi"
              options={combinationOptions}
              value={selectedCombinationIds}
              disabled={disabled}
              placeholder="Select workout combinations"
              searchPlaceholder="Search combinations..."
              emptyText="No combinations found."
              onChange={(next) => {
                const selectedSet = new Set(next);
                for (const combinationId of selectedCombinationIds) {
                  if (!selectedSet.has(combinationId)) {
                    onToggleCombination(combinationId);
                  }
                }

                for (const combinationId of next) {
                  if (!selectedCombinationIds.includes(combinationId)) {
                    onToggleCombination(combinationId);
                  }
                }
              }}
            />
          </div>
        </Section>
      ) : null}

      {/* ─────────────────────────────────────
          NOTES
      ───────────────────────────────────── */}

      <Section
        title="Training notes"
        description="Add coaching cues or reminders. Use one note per line."
      >
        <Textarea
          disabled={disabled}
          value={notesText}
          onChange={(e) =>
            update({
              notes: e.target.value.split("\n"),
            })
          }
          placeholder={
            "Keep elbows tucked\nControl the eccentric\nPause at the bottom"
          }
          className="min-h-28 resize-none rounded-xl"
        />
      </Section>
    </div>
  );
}
