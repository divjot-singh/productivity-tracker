import { NextRequest, NextResponse } from "next/server";

import {
  mergeSettings,
  type NotificationSettings,
} from "@/lib/notifications/rules";
import { getServerUser } from "@/lib/server-auth";
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "@/repositories/notifications.server.repository";

export async function GET(request: NextRequest) {
  const user = await getServerUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getNotificationSettings(user.uid));
}

export async function PUT(request: NextRequest) {
  const user = await getServerUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = mergeSettings(
    (await request.json()) as Partial<NotificationSettings>,
  );

  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: settings.timezone });
  } catch {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  for (const setting of Object.values(settings.types)) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(setting.time)) {
      return NextResponse.json({ error: "Invalid time" }, { status: 400 });
    }
  }

  await saveNotificationSettings(user.uid, settings);

  return NextResponse.json(settings);
}
