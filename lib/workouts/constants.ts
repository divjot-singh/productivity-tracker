export const EXERCISE_CATEGORY_OPTIONS = [
  "push",
  "pull",
  "legs",
  "core",
  "chest",
  "back",
  "shoulders",
  "arms",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "rear_delts",
  "abs",
  "functional",
  "posterior_chain",
  "strength",
  "unilateral",
  "full_body",
  "grip",
] as const;

export const EXERCISE_MUSCLE_GROUP_OPTIONS = [
  "chest",
  "triceps",
  "front_delts",
  "upper_chest",
  "side_delts",
  "glutes",
  "hamstrings",
  "erectors",
  "traps",
  "lats",
  "grip",
  "upper_back",
  "mid_back",
  "rhomboids",
  "rear_delts",
  "external_rotators",
  "biceps",
  "quadriceps",
  "core",
  "gastrocnemius",
  "soleus",
  "obliques",
  "deep_core",
  "shoulders",
  "abdominals",
  "hip_flexors",
  "forearms",
  "legs",
] as const;

export const EXERCISE_EQUIPMENT_OPTIONS = [
  "barbell",
  "barbell_or_dumbbell",
  "bodyweight",
  "cable",
  "cable_machine",
  "cable_or_band",
  "dumbbell",
  "dumbbell_or_bodyweight",
  "dumbbell_or_cable",
  "dumbbell_or_kettlebell",
  "dumbbell_or_machine",
  "machine",
  "machine_or_bodyweight",
] as const;

export const EXERCISE_TYPE_OPTIONS = [
  "compound",
  "isolation",
  "core",
  "functional",
] as const;

export const EXERCISE_WEIGHT_UNIT_OPTIONS = ["kg"] as const;

export const EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS = [
  "total",
  "per_hand",
  "per_hand_or_stack",
  "stack",
  "machine_or_total",
  "per_hand_or_machine",
  "bodyweight",
  "per_hand_or_total",
  "machine",
] as const;

export const EXERCISE_PROGRESSION_STRATEGY_OPTIONS = [
  "ascending_weight",
  "descending_weight",
  "rep_progression",
  "load_or_distance_progression",
] as const;

export const EFFORT_OPTIONS = [1, 2, 3, 4, 5] as const;

export const DEFAULT_COMBINATION_NAMES = [
  "Push",
  "Pull",
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Functional",
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORY_OPTIONS)[number];
export type ExerciseMuscleGroup =
  (typeof EXERCISE_MUSCLE_GROUP_OPTIONS)[number];
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT_OPTIONS)[number];
export type ExerciseType = (typeof EXERCISE_TYPE_OPTIONS)[number];
export type ExerciseWeightUnit = (typeof EXERCISE_WEIGHT_UNIT_OPTIONS)[number];
export type ExerciseWeightTrackingMode =
  (typeof EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS)[number];
export type ExerciseProgressionStrategy =
  (typeof EXERCISE_PROGRESSION_STRATEGY_OPTIONS)[number];

export function titleCaseWorkoutValue(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
