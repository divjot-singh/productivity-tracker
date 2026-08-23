import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { getGoals } from "@/repositories/goals.server.repository";
import { getExercises } from "@/repositories/exercises.server.repository";
import { getCombinations } from "@/repositories/combinations.server.repository";
import { getVisualizationDefinitions } from "@/repositories/visualization.server.repository";
import { getEntries } from "@/repositories/entry.server.repository";
import { getWorkouts } from "@/repositories/workouts.server.repository";
import { VisualizationService } from "@/lib/services/visualization-service";

// import MOCK_ENTRIES from "@/lib/mocks/generated-entries.json";
// import { getMockEntries } from "@/lib/mocks/dashboard.mock";
// import { saveMockEntries } from "@/lib/mocks/export-mock-entries";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      goals,
      realEntries,
      visualizations,
      workouts,
      exercises,
      combinations,
    ] = await Promise.all([
      getGoals(user.uid),
      getEntries(user.uid),
      getVisualizationDefinitions(user.uid),
      getWorkouts(user.uid),
      getExercises(user.uid, { includeInactive: true }),
      getCombinations(user.uid, { includeInactive: true }),
    ]);

    /**
     * TEMPORARY MOCK DATA
     *
     * Used for testing visualization engine with sufficient historical data.
     *
     * Remove this once enough real user entries exist.
     */
    //const entries = MOCK_ENTRIES;

    // const entries = getMockEntries(goals);
    // saveMockEntries(entries);

    const service = new VisualizationService();

    const response = await service.generate(
      visualizations,
      goals,
      realEntries,
      workouts,
      exercises,
      combinations,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard",
      },
      {
        status: 500,
      },
    );
  }
}
