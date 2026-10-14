import { NextRequest, NextResponse } from "next/server";

import { loadUserFacts } from "@/lib/notifications/facts.server";
import {
  isPushConfigured,
  sendToSubscriptions,
} from "@/lib/notifications/push.server";
import {
  buildMessage,
  dueByTime,
  localMoment,
} from "@/lib/notifications/rules";
import {
  getAllSubscribers,
  getNotificationSettings,
  getSentLog,
  markSent,
} from "@/repositories/notifications.server.repository";

export const dynamic = "force-dynamic";

// Called every few minutes by an external scheduler with `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 500 });
  }

  const now = new Date();
  const subscribers = await getAllSubscribers();
  let sent = 0;

  for (const [uid, subscriptions] of subscribers) {
    try {
      const settings = await getNotificationSettings(uid);
      const moment = localMoment(now, settings.timezone);
      const log = await getSentLog(uid);
      const due = dueByTime(moment, settings, log);

      if (due.length === 0) continue;

      const facts = await loadUserFacts(uid, moment.date);

      for (const type of due) {
        const message = buildMessage(type, facts);

        // Skipped types are still marked so a satisfied condition is not re-checked all window.
        if (message) {
          const delivered = await sendToSubscriptions(
            uid,
            subscriptions,
            message,
          );

          if (delivered === 0) continue;

          sent += 1;
        } else if (type === "missedDays") {
          continue;
        }

        await markSent(uid, type, moment.date);
      }
    } catch (error) {
      console.error("Notify failed for user", uid, error);
    }
  }

  return NextResponse.json({ users: subscribers.size, sent });
}
