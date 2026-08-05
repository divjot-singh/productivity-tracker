import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { VisualizationDefinition } from "@/models/visualization";
import {
  normalizeVisualizationOptions,
  validateVisualizationDefinition,
  VISUALIZATION_COMBINATIONS,
} from "@/lib/visualizations/validation";
import { getGoals } from "@/repositories/goals.server.repository";
import {
  deleteVisualization,
  getVisualizationDefinition,
  updateVisualization,
} from "@/repositories/visualization.server.repository";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const LOCKED_FIELDS: Array<keyof VisualizationDefinition> = [
  "id",
  "scope",
  "provider",
  "executor",
  "key",
];

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const definition = await getVisualizationDefinition(user.uid, id);

    if (!definition) {
      return NextResponse.json(
        { error: "Visualization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(definition);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load visualization" },
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

    const existing = await getVisualizationDefinition(user.uid, id);

    if (!existing) {
      return NextResponse.json(
        { error: "Visualization not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<VisualizationDefinition>;

    const nextDisplayOrder =
      typeof body.displayOrder === "number" &&
      Number.isFinite(body.displayOrder) &&
      body.displayOrder > 0
        ? body.displayOrder
        : existing.displayOrder;

    const immutableViolations: string[] = [];

    for (const field of LOCKED_FIELDS) {
      if (field in body && body[field] !== existing[field]) {
        immutableViolations.push(field);
      }
    }

    if (immutableViolations.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot update immutable field(s): ${immutableViolations.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const updated: VisualizationDefinition = {
      ...existing,
      ...body,
      id,
      displayOrder: nextDisplayOrder,
    };

    const combination =
      VISUALIZATION_COMBINATIONS[updated.provider]?.[updated.executor];

    if (combination) {
      updated.options = normalizeVisualizationOptions(
        body.options ?? updated.options,
        combination.options,
      );
    }

    const goals = await getGoals(user.uid);
    const goalLabels = goals.map((goal) => goal.label);

    const errors = validateVisualizationDefinition(updated, { goalLabels });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    await updateVisualization(user.uid, updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update visualization" },
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

    const existing = await getVisualizationDefinition(user.uid, id);

    if (!existing) {
      return NextResponse.json(
        { error: "Visualization not found" },
        { status: 404 },
      );
    }

    await deleteVisualization(user.uid, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete visualization" },
      { status: 500 },
    );
  }
}
