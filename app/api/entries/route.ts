import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { calculateScore } from "@/lib/scoring/scoring-engine";

import {
  createEntry,
  getEntries,
} from "@/repositories/entry.server.repository";

import { getMetrics } from "@/repositories/config.server.repository";

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const { date, values } = body;

    if (!date || !values) {
      return NextResponse.json(
        {
          error: "Invalid payload",
        },
        {
          status: 400,
        },
      );
    }

    // Load user's metric configuration

    const config = await getMetrics(user.uid);

    if (!config?.metrics) {
      return NextResponse.json(
        {
          error: "Metric configuration missing",
        },
        {
          status: 400,
        },
      );
    }

    // Server side calculation

    const result = calculateScore(config.metrics, values);

    await createEntry(user.uid, {
      date,

      values,

      score: result.totalScore,

      xp: result.totalXP,

      breakdown: result.metrics,
    });

    return NextResponse.json({
      success: true,

      score: result.totalScore,

      xp: result.totalXP,
    });
  } catch (error) {
    console.error("Create entry failed", error);

    return NextResponse.json(
      {
        error: "Failed to save entry",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: NextRequest) {
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

    const entries = await getEntries(user.uid);

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Get entries failed", error);

    return NextResponse.json(
      {
        error: "Failed to fetch entries",
      },
      {
        status: 500,
      },
    );
  }
}
