import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { getGoals } from "@/repositories/goals.server.repository";
import { getVisualizationDefinitions } from "@/repositories/visualization.server.repository";
import { getEntries } from "@/repositories/entry.server.repository";
import { VisualizationService } from "@/lib/services/visualization-service";

import MOCK_ENTRIES from "@/lib/mocks/generated-entries.json";
import { getMockEntries } from "@/lib/mocks/dashboard.mock";
import { saveMockEntries } from "@/lib/mocks/export-mock-entries";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [goals, realEntries, visualizations] = await Promise.all([
      getGoals(user.uid),
      getEntries(user.uid),
      getVisualizationDefinitions(user.uid),
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

    const response = await service.generate(visualizations, goals, realEntries);

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
