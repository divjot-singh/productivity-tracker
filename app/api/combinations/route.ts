import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { WorkoutCombination } from "@/models/workout";
import {
  normalizeCombinationPayload,
  validateCombination,
} from "@/lib/workouts/normalize";
import {
  combinationExists,
  createCombination,
  getCombinations,
} from "@/repositories/combinations.server.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    const combinations = await getCombinations(user.uid, {
      includeInactive,
    });

    return NextResponse.json(combinations);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load combinations" },
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

    const body = (await request.json()) as Partial<WorkoutCombination>;

    const combination = normalizeCombinationPayload(body);
    const errors = validateCombination(combination);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    if (await combinationExists(user.uid, combination.id)) {
      return NextResponse.json(
        { error: "Combination id already exists." },
        { status: 409 },
      );
    }

    await createCombination(user.uid, combination);

    return NextResponse.json(combination);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create combination" },
      { status: 500 },
    );
  }
}
