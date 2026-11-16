import type { ExerciseDefinition } from "@/models/workout";

// Legacy exercises carry a single `equipment`; newer ones carry `equipments[]`.
export function mapExercise(
  raw: Record<string, unknown>,
  id?: string,
): ExerciseDefinition {
  const exercise = raw as unknown as ExerciseDefinition;

  const equipments =
    exercise.equipments && exercise.equipments.length > 0
      ? exercise.equipments
      : exercise.equipment
        ? [exercise.equipment]
        : exercise.equipments;

  return {
    ...exercise,
    id: id ?? exercise.id,
    equipments,
  };
}
