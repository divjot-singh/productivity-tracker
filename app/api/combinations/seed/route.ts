import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { buildDefaultCombinations } from "@/lib/workouts/defaults";
import {
  combinationExists,
  createCombination,
  getCombination,
  updateCombination,
} from "@/repositories/combinations.server.repository";
import { getExercises } from "@/repositories/exercises.server.repository";

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exercises = await getExercises(user.uid, {
      includeInactive: true,
    });

    const combinations = buildDefaultCombinations(exercises);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const combination of combinations) {
      if (!(await combinationExists(user.uid, combination.id))) {
        await createCombination(user.uid, combination);
        created += 1;
        continue;
      }

      const existing = await getCombination(user.uid, combination.id);

      if (!existing) {
        await createCombination(user.uid, combination);
        created += 1;
        continue;
      }

      const hasChanges =
        existing.name !== combination.name ||
        (existing.description ?? "") !== (combination.description ?? "") ||
        existing.active !== combination.active ||
        !arraysEqual(existing.exerciseIds, combination.exerciseIds);

      if (!hasChanges) {
        skipped += 1;
        continue;
      }

      await updateCombination(user.uid, {
        ...existing,
        name: combination.name,
        description: combination.description,
        active: true,
        exerciseIds: combination.exerciseIds,
      });
      updated += 1;
    }

    return NextResponse.json({
      created,
      updated,
      skipped,
      requested: combinations.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create default combinations" },
      { status: 500 },
    );
  }
}
