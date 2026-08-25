import {
  formatExerciseEquipmentList,
  normalizeEquipmentValue,
} from "@/lib/workouts/constants";
import { ExerciseDefinition } from "@/models/workout";

export function getExerciseEquipments(
  exercise: Pick<ExerciseDefinition, "equipment" | "equipments">,
): string[] {
  const values = [
    ...(exercise.equipments ?? []),
    ...(exercise.equipment ? [exercise.equipment] : []),
  ]
    .map((value) => normalizeEquipmentValue(value))
    .filter((value) => value.length > 0);

  return Array.from(new Set(values));
}

export function getExerciseEquipmentLabel(
  exercise: Pick<ExerciseDefinition, "equipment" | "equipments">,
): string {
  return formatExerciseEquipmentList(getExerciseEquipments(exercise));
}

export interface ExerciseFilterState {
  query: string;
  category: string;
  muscleGroup: string;
  equipment: string;
}

export function getExerciseFilterOptions(exercises: ExerciseDefinition[]) {
  const categories = new Set<string>();
  const muscleGroups = new Set<string>();
  const equipments = new Set<string>();

  for (const exercise of exercises) {
    for (const category of exercise.categories ?? []) {
      categories.add(category);
    }

    for (const muscleGroup of exercise.muscleGroups ?? []) {
      muscleGroups.add(muscleGroup);
    }

    for (const equipment of getExerciseEquipments(exercise)) {
      equipments.add(equipment);
    }
  }

  return {
    categories: Array.from(categories).sort(),
    muscleGroups: Array.from(muscleGroups).sort(),
    equipments: Array.from(equipments).sort(),
  };
}

export function filterExercises(
  exercises: ExerciseDefinition[],
  filters: ExerciseFilterState,
): ExerciseDefinition[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return exercises.filter((exercise) => {
    if (
      filters.category &&
      !(exercise.categories as string[]).includes(filters.category)
    ) {
      return false;
    }

    if (
      filters.muscleGroup &&
      !(exercise.muscleGroups as string[]).includes(filters.muscleGroup)
    ) {
      return false;
    }

    const equipmentValues = getExerciseEquipments(exercise);

    if (filters.equipment && !equipmentValues.includes(filters.equipment)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      exercise.name,
      exercise.description,
      ...exercise.categories,
      ...exercise.muscleGroups,
      ...equipmentValues,
      ...(exercise.notes ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
