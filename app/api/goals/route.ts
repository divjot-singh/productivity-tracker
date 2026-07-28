import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { createGoal, getGoals } from "@/repositories/goals.server.repository";

import { MetricDefinition } from "@/models/metric";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await getGoals(user.uid);

    return NextResponse.json(goals);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load goals" },
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

    const goal = (await request.json()) as MetricDefinition;

    await createGoal(user.uid, goal);
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 },
    );
  }
}
