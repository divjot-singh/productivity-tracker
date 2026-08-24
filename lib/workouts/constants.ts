export const EXERCISE_CATEGORY_OPTIONS = [
  // Training splits
  "push",
  "pull",
  "legs",

  // Major body parts
  "chest",
  "back",
  "shoulders",
  "arms",
  "biceps",
  "hip_stability",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",

  // Specific muscle / movement areas
  "rear_delts",
  "side_delts",
  "front_delts",
  "upper_chest",
  "upper_back",
  "mid_back",
  "lats",
  "adductors",
  "abductors",
  "forearms",

  // Core
  "core",
  "abs",
  "obliques",
  "deep_core",

  // Movement / training characteristics
  "functional",
  "posterior_chain",
  "strength",
  "unilateral",
  "full_body",
  "grip",
  "power",

  // Mobility / stability
  "mobility",
  "stability",
] as const;

export const EXERCISE_MUSCLE_GROUP_OPTIONS = [
  "chest",
  "triceps",
  "front_delts",
  "adductors",
  "gluteus_medius",
  "gluteus_minimus",
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
  "brachialis",
  "brachioradialis",
] as const;

export const EXERCISE_EQUIPMENT_OPTIONS = [
  "barbell",
  "barbell_or_dumbbell",
  "barbell_or_machine",
  "back_extension_bench",
  "assisted_pullup_machine_or_band",

  "dumbbell",
  "dumbbell_or_bodyweight",
  "dumbbell_or_cable",
  "dumbbell_or_kettlebell",
  "dumbbell_or_machine",
  "cable_or_dumbbell",

  "machine_or_dumbbell",

  "cable",
  "cable_machine",
  "cable_or_band",

  "machine",
  "machine_or_bodyweight",

  "kettlebell",

  "bodyweight",

  "pull_up_bar",
  "dip_station",
  "bench",

  "resistance_band",
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
  "per_side_or_stack",
  "per_hand_or_machine",
  "bodyweight",
  "per_hand_or_total",
  "total_or_machine",
  "machine",
  "assistance",
  "stack_or_total",
  "bodyweight_or_total",
] as const;

export const EXERCISE_PROGRESSION_STRATEGY_OPTIONS = [
  "ascending_weight",
  "descending_weight",
  "rep_progression",
  "load_or_distance_progression",
  "descending_assistance",
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
