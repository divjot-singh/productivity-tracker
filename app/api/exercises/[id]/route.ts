import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { ExerciseDefinition } from "@/models/workout";
import {
  normalizeExercisePayload,
  validateExercise,
} from "@/lib/workouts/normalize";
import {
  deleteExercise,
  getExercise,
  updateExercise,
} from "@/repositories/exercises.server.repository";
import {
  getCombinations,
  updateCombination,
} from "@/repositories/combinations.server.repository";
import { getWorkoutsReferencingExercise } from "@/repositories/workouts.server.repository";

interface ExerciseUpdateRequest extends Partial<ExerciseDefinition> {
  combinationIds?: string[];
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const exercise = await getExercise(user.uid, id);

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load exercise" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await getExercise(user.uid, id);

    if (!existing) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as ExerciseUpdateRequest;

    if ("id" in body && body.id !== id) {
      return NextResponse.json(
        { error: "Cannot update immutable field: id" },
        { status: 400 },
      );
    }

    const next = normalizeExercisePayload({
      ...existing,
      ...body,
      id,
    });

    const errors = validateExercise(next);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    await updateExercise(user.uid, next);

    if (Array.isArray(body.combinationIds)) {
      const selectedCombinationIds = new Set(body.combinationIds);
      const combinations = await getCombinations(user.uid, {
        includeInactive: true,
      });

      await Promise.all(
        combinations.map((combination) => {
          const alreadyIncludes = combination.exerciseIds.includes(id);
          const shouldInclude = selectedCombinationIds.has(combination.id);

          if (shouldInclude === alreadyIncludes) {
            return Promise.resolve(combination);
          }

          return updateCombination(user.uid, {
            ...combination,
            exerciseIds: shouldInclude
              ? [...combination.exerciseIds, id]
              : combination.exerciseIds.filter(
                  (exerciseId) => exerciseId !== id,
                ),
          });
        }),
      );
    }

    return NextResponse.json(next);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const mode = request.nextUrl.searchParams.get("mode") ?? "hard";

    const existing = await getExercise(user.uid, id);

    if (!existing) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 },
      );
    }

    const referencingWorkouts = await getWorkoutsReferencingExercise(
      user.uid,
      id,
    );

    if (referencingWorkouts.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete exercise. It is referenced by ${referencingWorkouts.length} workout${referencingWorkouts.length === 1 ? "" : "s"}.`,
        },
        { status: 409 },
      );
    }

    const combinations = await getCombinations(user.uid, {
      includeInactive: true,
    });

    await Promise.all(
      combinations.map((combination) => {
        if (!combination.exerciseIds.includes(id)) {
          return Promise.resolve(combination);
        }

        return updateCombination(user.uid, {
          ...combination,
          exerciseIds: combination.exerciseIds.filter(
            (exerciseId) => exerciseId !== id,
          ),
        });
      }),
    );

    await deleteExercise(user.uid, id);

    return NextResponse.json({ success: true, mode });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 },
    );
  }
}
