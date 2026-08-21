import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getServerUser } from "@/lib/server-auth";
import { ExerciseDefinition } from "@/models/workout";
import {
  normalizeExercisePayload,
  validateExercise,
} from "@/lib/workouts/normalize";
import {
  createExercise,
  exerciseExists,
  getExercises,
} from "@/repositories/exercises.server.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    const exercises = await getExercises(user.uid, {
      includeInactive,
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load exercises" },
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

    const body = (await request.json()) as Partial<ExerciseDefinition>;
    const { id: _ignoredId, ...createBody } = body;

    const exercise = normalizeExercisePayload(createBody, randomUUID());
    const errors = validateExercise(exercise);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    if (await exerciseExists(user.uid, exercise.id)) {
      return NextResponse.json(
        { error: "Exercise id already exists." },
        { status: 409 },
      );
    }

    await createExercise(user.uid, exercise);

    return NextResponse.json(exercise);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 },
    );
  }
}
