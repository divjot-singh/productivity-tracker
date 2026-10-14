import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import {
  getAllExerciseStats,
  getExerciseStats,
} from "@/repositories/exercise-stats.server.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exerciseId = new URL(request.url).searchParams.get("exerciseId");

    if (exerciseId) {
      return NextResponse.json(await getExerciseStats(user.uid, exerciseId));
    }

    return NextResponse.json(await getAllExerciseStats(user.uid));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load exercise stats" },
      { status: 500 },
    );
  }
}
