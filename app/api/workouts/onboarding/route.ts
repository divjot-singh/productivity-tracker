import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { DEFAULT_COMBINATIONS, DEFAULT_EXERCISES } from "@/lib/defaults";
import { getServerUser } from "@/lib/server-auth";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutOnboardingSeedResult,
  WorkoutOnboardingStatus,
} from "@/models/workout";
import {
  createCombination,
  hasAnyCombinations,
} from "@/repositories/combinations.server.repository";
import {
  createExercise,
  hasAnyExercises,
} from "@/repositories/exercises.server.repository";

function createStatus(
  hasExercises: boolean,
  hasCombinations: boolean,
): WorkoutOnboardingStatus {
  return {
    hasExercises,
    hasCombinations,
    requiresOnboarding: !hasExercises && !hasCombinations,
  };
}

function buildSeededExercises(): {
  exercises: ExerciseDefinition[];
  exerciseIdMap: Map<string, string>;
} {
  const exerciseIdMap = new Map<string, string>();

  const exercises = DEFAULT_EXERCISES.map((exercise) => {
    const id = randomUUID();
    exerciseIdMap.set(exercise.id, id);

    return {
      ...exercise,
      id,
      targetWeight: undefined,
    };
  });

  return {
    exercises,
    exerciseIdMap,
  };
}

function mapExerciseIds(ids: string[], exerciseIdMap: Map<string, string>) {
  return ids.flatMap((id) => {
    const mappedId = exerciseIdMap.get(id);
    return mappedId ? [mappedId] : [];
  });
}

function buildSeededCombinations(
  exerciseIdMap: Map<string, string>,
): WorkoutCombination[] {
  return DEFAULT_COMBINATIONS.map((combination) => ({
    ...combination,
    id: randomUUID(),
    exerciseIds: mapExerciseIds(combination.exerciseIds, exerciseIdMap),
    optionalExercises: combination.optionalExercises
      ? mapExerciseIds(combination.optionalExercises, exerciseIdMap)
      : undefined,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [hasExercises, hasCombinations] = await Promise.all([
      hasAnyExercises(user.uid),
      hasAnyCombinations(user.uid),
    ]);

    return NextResponse.json(createStatus(hasExercises, hasCombinations));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load workout onboarding status" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [hasExercises, hasCombinations] = await Promise.all([
      hasAnyExercises(user.uid),
      hasAnyCombinations(user.uid),
    ]);

    const status = createStatus(hasExercises, hasCombinations);

    if (!status.requiresOnboarding) {
      const response: WorkoutOnboardingSeedResult = {
        ...status,
        skipped: true,
        seeded: false,
        exercisesCreated: 0,
        combinationsCreated: 0,
      };

      return NextResponse.json(response);
    }

    const { exercises, exerciseIdMap } = buildSeededExercises();
    const combinations = buildSeededCombinations(exerciseIdMap);

    await Promise.all(
      exercises.map((exercise) => createExercise(user.uid, exercise)),
    );
    await Promise.all(
      combinations.map((combination) =>
        createCombination(user.uid, combination),
      ),
    );

    const response: WorkoutOnboardingSeedResult = {
      hasExercises: true,
      hasCombinations: true,
      requiresOnboarding: false,
      skipped: false,
      seeded: true,
      exercisesCreated: exercises.length,
      combinationsCreated: combinations.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to set up workouts" },
      { status: 500 },
    );
  }
}
