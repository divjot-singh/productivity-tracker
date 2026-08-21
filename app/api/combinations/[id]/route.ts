import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { WorkoutCombination } from "@/models/workout";
import {
  normalizeCombinationPayload,
  validateCombination,
} from "@/lib/workouts/normalize";
import {
  deleteCombination,
  getCombination,
  updateCombination,
} from "@/repositories/combinations.server.repository";
import { getWorkoutsReferencingCombination } from "@/repositories/workouts.server.repository";

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

    const combination = await getCombination(user.uid, id);

    if (!combination) {
      return NextResponse.json(
        { error: "Combination not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(combination);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load combination" },
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

    const existing = await getCombination(user.uid, id);

    if (!existing) {
      return NextResponse.json(
        { error: "Combination not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<WorkoutCombination>;

    if ("id" in body && body.id !== id) {
      return NextResponse.json(
        { error: "Cannot update immutable field: id" },
        { status: 400 },
      );
    }

    const next = normalizeCombinationPayload({
      ...existing,
      ...body,
      id,
    });

    const errors = validateCombination(next);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    await updateCombination(user.uid, next);

    return NextResponse.json(next);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update combination" },
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

    const existing = await getCombination(user.uid, id);

    if (!existing) {
      return NextResponse.json(
        { error: "Combination not found" },
        { status: 404 },
      );
    }

    const referencingWorkouts = await getWorkoutsReferencingCombination(
      user.uid,
      id,
    );

    if (referencingWorkouts.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete combination. It is referenced by ${referencingWorkouts.length} workout${referencingWorkouts.length === 1 ? "" : "s"}.`,
        },
        { status: 409 },
      );
    }

    await deleteCombination(user.uid, id);

    return NextResponse.json({ success: true, mode });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete combination" },
      { status: 500 },
    );
  }
}
