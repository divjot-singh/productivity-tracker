import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { WorkoutEntry } from "@/models/workout";
import { syncExerciseStats } from "@/lib/workouts/exercise-stats.service";
import {
  normalizeWorkoutPayload,
  validateWorkout,
} from "@/lib/workouts/normalize";
import {
  deleteWorkout,
  getWorkout,
  upsertWorkout,
} from "@/repositories/workouts.server.repository";

interface RouteContext {
  params: Promise<{
    date: string;
  }>;
}

// A stats failure must not fail the save; scripts/rebuild-exercise-stats.mjs repairs stale stats.
async function syncStatsSafely(
  uid: string,
  date: string,
  previous: WorkoutEntry | null,
  next: WorkoutEntry | null,
) {
  try {
    await syncExerciseStats(uid, date, previous, next);
  } catch (error) {
    console.error("Exercise stats sync failed", error);
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    const workout = await getWorkout(user.uid, date);

    if (!workout) {
      return NextResponse.json(null);
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load workout" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    const body = (await request.json()) as Partial<WorkoutEntry>;

    const workout = normalizeWorkoutPayload(body, date);
    const errors = validateWorkout(workout);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const previous = await getWorkout(user.uid, date);

    await upsertWorkout(user.uid, workout);

    await syncStatsSafely(user.uid, date, previous, workout);

    return NextResponse.json(workout);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to save workout" },
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

    const { date } = await params;
    const previous = await getWorkout(user.uid, date);
    await deleteWorkout(user.uid, date);

    await syncStatsSafely(user.uid, date, previous, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete workout" },
      { status: 500 },
    );
  }
}
