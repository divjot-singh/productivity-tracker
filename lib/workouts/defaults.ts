import { DEFAULT_COMBINATION_NAMES } from "@/lib/workouts/constants";
import { createWorkoutId } from "@/lib/workouts/normalize";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";

export function buildDefaultCombinations(
  exercises: ExerciseDefinition[],
): WorkoutCombination[] {
  return DEFAULT_COMBINATION_NAMES.map((name) => {
    const normalizedCategory = createWorkoutId(
      name,
    ) as ExerciseDefinition["categories"][number];

    return {
      id: normalizedCategory,
      name,
      description: `${name} default workout grouping.`,
      exerciseIds: exercises
        .filter((exercise) => exercise.categories.includes(normalizedCategory))
        .map((exercise) => exercise.id),
      active: true,
    };
  });
}
