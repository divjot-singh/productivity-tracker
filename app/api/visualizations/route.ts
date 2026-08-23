import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { VisualizationDefinition } from "@/models/visualization";
import {
  VISUALIZATION_COMBINATIONS,
  normalizeVisualizationOptions,
  validateVisualizationDefinition,
} from "@/lib/visualizations/validation";
import { getExercises } from "@/repositories/exercises.server.repository";
import { getGoals } from "@/repositories/goals.server.repository";
import {
  createVisualization,
  getNextDisplayOrder,
  getVisualizationDefinitions,
} from "@/repositories/visualization.server.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const definitions = await getVisualizationDefinitions(user.uid);

    return NextResponse.json(definitions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load visualizations" },
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

    const body = (await request.json()) as Partial<VisualizationDefinition>;

    const [goals, exercises] = await Promise.all([
      getGoals(user.uid),
      getExercises(user.uid, { includeInactive: true }),
    ]);
    const goalLabels = goals.map((goal) => goal.label);
    const exerciseIds = exercises.map((exercise) => exercise.id);

    const scope = body.scope!;

    const displayOrder =
      typeof body.displayOrder === "number" &&
      Number.isFinite(body.displayOrder) &&
      body.displayOrder > 0
        ? body.displayOrder
        : await getNextDisplayOrder(user.uid, scope);

    const definition: VisualizationDefinition = {
      id: body.id?.trim() || crypto.randomUUID(),
      title: body.title?.trim() || "",
      description: body.description?.trim(),
      widget: body.widget!,
      scope,
      provider: body.provider!,
      executor: body.executor!,
      key: body.key?.trim() || "",
      period: body.period ?? { type: "days", value: 30 },
      aggregation: body.aggregation!,
      displayOrder,
      visible: body.visible ?? true,
      options: undefined,
    };

    const combination =
      VISUALIZATION_COMBINATIONS[definition.provider]?.[definition.executor];

    if (combination) {
      definition.options = normalizeVisualizationOptions(
        body.options,
        combination.options,
      );
    } else {
      definition.options = body.options;
    }

    const errors = validateVisualizationDefinition(definition, {
      goalLabels,
      exerciseIds,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    await createVisualization(user.uid, definition);

    return NextResponse.json(definition);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create visualization" },
      { status: 500 },
    );
  }
}
