import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import seedData from "@/exervises.json";
import {
  createExercise,
  exerciseExists,
} from "@/repositories/exercises.server.repository";
import {
  normalizeExercisePayload,
  validateExercise,
} from "@/lib/workouts/normalize";
import { ExerciseDefinition } from "@/models/workout";

interface SeedPayload {
  exercises?: Array<Partial<ExerciseDefinition>>;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request
      .json()
      .catch(() => null)) as SeedPayload | null;

    const sourceExercises =
      payload?.exercises ??
      (seedData.exercises as Array<Partial<ExerciseDefinition>>);

    if (!Array.isArray(sourceExercises) || sourceExercises.length === 0) {
      return NextResponse.json(
        { error: "No seed exercises provided." },
        { status: 400 },
      );
    }

    let created = 0;
    let skipped = 0;
    let invalid = 0;

    for (const item of sourceExercises) {
      const exercise = normalizeExercisePayload(item);
      const errors = validateExercise(exercise);

      if (errors.length > 0) {
        invalid += 1;
        continue;
      }

      if (await exerciseExists(user.uid, exercise.id)) {
        skipped += 1;
        continue;
      }

      await createExercise(user.uid, exercise);
      created += 1;
    }

    return NextResponse.json({
      created,
      skipped,
      invalid,
      requested: sourceExercises.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to import exercise seed" },
      { status: 500 },
    );
  }
}
