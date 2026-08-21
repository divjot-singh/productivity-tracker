import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import {
  getWorkouts,
  getWorkoutsReferencingCombination,
  getWorkoutsReferencingExercise,
} from "@/repositories/workouts.server.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const exerciseId = request.nextUrl.searchParams.get("exerciseId");
    const combinationId = request.nextUrl.searchParams.get("combinationId");
    const limit = limitParam ? Number(limitParam) : undefined;

    const workouts = exerciseId
      ? await getWorkoutsReferencingExercise(user.uid, exerciseId)
      : combinationId
        ? await getWorkoutsReferencingCombination(user.uid, combinationId)
        : await getWorkouts(user.uid, {
            limit: Number.isFinite(limit) ? limit : undefined,
          });

    return NextResponse.json(
      Number.isFinite(limit) && limit !== undefined
        ? workouts.slice(0, limit)
        : workouts,
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load workouts" },
      { status: 500 },
    );
  }
}
