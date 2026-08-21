import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { WorkoutEntry } from "@/models/workout";
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

    await upsertWorkout(user.uid, workout);

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
    await deleteWorkout(user.uid, date);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete workout" },
      { status: 500 },
    );
  }
}
