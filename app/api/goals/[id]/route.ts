// app/api/goals/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { MetricDefinition } from "@/models/metric";

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

    const body = (await request.json()) as MetricDefinition;

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

    const updatedGoal: MetricDefinition = {
      ...body,
      id,
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
