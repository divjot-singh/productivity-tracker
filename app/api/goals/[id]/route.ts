// app/api/goals/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { MetricDefinition } from "@/models/metric";

import { LIFECYCLE_FIELDS } from "@/lib/mappers/goal.mapper";
import { goalHasHistory } from "@/repositories/entry.server.repository";
import {
  archiveGoal,
  deleteGoal,
  getGoal,
  reactivateGoal,
  updateGoal,
} from "@/repositories/goals.server.repository";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function yesterdayUtc(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

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

    const body = (await request.json()) as Partial<MetricDefinition> & {
      action?: "archive" | "reactivate";
      lastActiveDate?: string;
    };

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

    if (body.action === "archive") {
      if (existingGoal.status === "archived") {
        return NextResponse.json(
          { error: "Goal is already archived" },
          { status: 400 },
        );
      }

      if (body.lastActiveDate && !DATE_PATTERN.test(body.lastActiveDate)) {
        return NextResponse.json(
          { error: "lastActiveDate must be YYYY-MM-DD" },
          { status: 400 },
        );
      }

      await archiveGoal(
        user.uid,
        existingGoal,
        body.lastActiveDate ?? yesterdayUtc(),
      );

      return NextResponse.json({ success: true });
    }

    if (body.action === "reactivate") {
      if (existingGoal.status !== "archived") {
        return NextResponse.json(
          { error: "Goal is not archived" },
          { status: 400 },
        );
      }

      if (
        typeof body.weight !== "number" ||
        !Number.isFinite(body.weight) ||
        body.weight < 0
      ) {
        return NextResponse.json(
          { error: "A weight is required to reactivate a goal" },
          { status: 400 },
        );
      }

      await reactivateGoal(user.uid, id, body.weight);

      return NextResponse.json({ success: true });
    }

    if (existingGoal.status === "archived") {
      return NextResponse.json(
        { error: "Reactivate this goal before editing it" },
        { status: 400 },
      );
    }

    for (const field of LIFECYCLE_FIELDS) {
      delete (body as Record<string, unknown>)[field];
    }

    const immutableViolations: string[] = [];

    if ("label" in body && body.label !== existingGoal.label) {
      immutableViolations.push("label");
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

    if (existingGoal.status !== "archived") {
      return NextResponse.json(
        {
          error: "Archive this goal before deleting it.",
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
            "This goal has historical entries, so it can only be archived.",
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
