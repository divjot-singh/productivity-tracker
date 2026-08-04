// app/api/goals/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { MetricDefinition } from "@/models/metric";

import { goalHasHistory } from "@/repositories/entry.server.repository";
import {
  deleteGoal,
  getGoal,
  updateGoal,
} from "@/repositories/goals.server.repository";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// -------------------------------------
// GET
// -------------------------------------

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const goal = await getGoal(user.uid, id);

    if (!goal) {
      return NextResponse.json(
        {
          error: "Goal not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load goal",
      },
      {
        status: 500,
      },
    );
  }
}

// -------------------------------------
// PATCH
// -------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const body = (await request.json()) as Partial<MetricDefinition>;

    const existingGoal = await getGoal(user.uid, id);

    if (!existingGoal) {
      return NextResponse.json(
        {
          error: "Goal not found",
        },
        {
          status: 404,
        },
      );
    }

    const immutableViolations: string[] = [];

    if ("label" in body && body.label !== existingGoal.label) {
      immutableViolations.push("label");
    }

    if (
      "description" in body &&
      body.description !== existingGoal.description
    ) {
      immutableViolations.push("description");
    }

    if ("category" in body && body.category !== existingGoal.category) {
      immutableViolations.push("category");
    }

    if (
      body.scoring &&
      "type" in body.scoring &&
      body.scoring.type !== existingGoal.scoring.type
    ) {
      immutableViolations.push("scoring.type");
    }

    if (immutableViolations.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot update immutable field(s): ${immutableViolations.join(", ")}`,
        },
        {
          status: 400,
        },
      );
    }

    const updatedGoal: MetricDefinition = {
      ...existingGoal,
      ...body,
      id,
      scoring: {
        ...existingGoal.scoring,
        ...body.scoring,
        type: existingGoal.scoring.type,
      },
    };

    await updateGoal(user.uid, updatedGoal);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to update goal",
      },
      {
        status: 500,
      },
    );
  }
}

// -------------------------------------
// DELETE
// -------------------------------------

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const existingGoal = await getGoal(user.uid, id);

    if (!existingGoal) {
      return NextResponse.json(
        {
          error: "Goal not found",
        },
        {
          status: 404,
        },
      );
    }

    if (existingGoal.isProtected) {
      return NextResponse.json(
        {
          error: "Protected seed/core goals cannot be deleted.",
        },
        {
          status: 400,
        },
      );
    }

    const hasHistory = await goalHasHistory(user.uid, id);

    if (hasHistory) {
      return NextResponse.json(
        {
          error:
            "This goal cannot be deleted because it has historical entries.",
        },
        {
          status: 400,
        },
      );
    }

    await deleteGoal(user.uid, id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to delete goal",
      },
      {
        status: 500,
      },
    );
  }
}
