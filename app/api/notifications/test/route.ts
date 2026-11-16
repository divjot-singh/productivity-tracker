import { NextRequest, NextResponse } from "next/server";

import { isPushConfigured, sendToUser } from "@/lib/notifications/push.server";
import { getServerUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const user = await getServerUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push is not configured" },
      { status: 500 },
    );
  }

  const delivered = await sendToUser(user.uid, {
    type: "dailyReminder",
    title: "Daylog notifications are on",
    body: "This is a test notification.",
    url: "/today",
  });

  if (delivered === 0) {
    return NextResponse.json(
      { error: "No device received it" },
      { status: 502 },
    );
  }

  return NextResponse.json({ delivered });
}
