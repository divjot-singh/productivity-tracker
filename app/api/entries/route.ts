import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";

import { calculateScore } from "@/lib/scoring/scoring-engine";
import { computeScorePercent } from "@/lib/mappers/entry.mapper";
import { resolveGoalsForDate } from "@/lib/mappers/goal.mapper";

import {
  createEntry,
  deleteEntry,
  getEntries,
  getEntry,
} from "@/repositories/entry.server.repository";

import { getGoals } from "@/repositories/goals.server.repository";

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

    const config = await getGoals(user.uid);

    const metrics = resolveGoalsForDate(config, date);

    if (!metrics?.length) {
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

    const result = calculateScore(metrics, values);

    await createEntry(user.uid, {
      date,

      values,

      score: result.totalScore,

      xp: result.totalXP,

      breakdown: result.metrics,

      maxScore: result.totalWeights,

      scorePercent: computeScorePercent(result.totalScore, result.totalWeights),
    });

    return NextResponse.json({
      success: true,

      score: result.totalScore,

      xp: result.totalXP,

      maxScore: result.totalWeights,

      scorePercent: computeScorePercent(result.totalScore, result.totalWeights),
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const date = new URL(request.url).searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    await deleteEntry(user.uid, date);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete entry failed", error);

    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 },
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (date) {
      const entry = await getEntry(user.uid, date);

      return NextResponse.json(entry);
    }

    if (from && to) {
      const entries = await getEntries(user.uid);
      const dates = entries
        .filter((entry) => entry.date >= from && entry.date <= to)
        .map((entry) => entry.date);

      return NextResponse.json({ dates });
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
