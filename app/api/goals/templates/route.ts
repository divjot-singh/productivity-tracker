import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import { DEFAULT_METRICS } from "@/lib/defaults";
import { createGoalFromTemplate, toGoalTemplate } from "@/lib/goals/templates";
import { createGoal, getGoals } from "@/repositories/goals.server.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = DEFAULT_METRICS.map((metric) => toGoalTemplate(metric));

    return NextResponse.json(templates);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load goal templates" },
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

    const body = (await request.json()) as {
      templateIds?: string[];
    };

    const requestedIds = Array.from(new Set(body.templateIds ?? [])).filter(
      (value) => value.trim().length > 0,
    );

    if (requestedIds.length === 0) {
      return NextResponse.json(
        { error: "At least one template must be selected." },
        { status: 400 },
      );
    }

    const templatesById = new Map(
      DEFAULT_METRICS.map((metric) => {
        const template = toGoalTemplate(metric);
        return [template.templateId, template] as const;
      }),
    );

    const existingGoals = await getGoals(user.uid);
    const existingLabels = new Set(
      existingGoals.map((goal) => goal.label.trim().toLowerCase()),
    );

    let nextDisplayOrder = existingGoals.reduce(
      (max, goal) => Math.max(max, goal.displayOrder),
      0,
    );

    let created = 0;
    let skipped = 0;

    for (const templateId of requestedIds) {
      const template = templatesById.get(templateId);

      if (!template) {
        skipped += 1;
        continue;
      }

      const normalizedLabel = template.label.trim().toLowerCase();

      if (existingLabels.has(normalizedLabel)) {
        skipped += 1;
        continue;
      }

      nextDisplayOrder += 1;

      const goal = createGoalFromTemplate(template, nextDisplayOrder);

      await createGoal(user.uid, goal);

      existingLabels.add(normalizedLabel);
      created += 1;
    }

    return NextResponse.json({
      created,
      skipped,
      requested: requestedIds.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create goals from templates" },
      { status: 500 },
    );
  }
}
