import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/server-auth";
import {
  deleteSubscription,
  saveSubscription,
} from "@/repositories/notifications.server.repository";

interface SubscriptionBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

function isValid(body: SubscriptionBody): body is Required<
  Pick<SubscriptionBody, "endpoint">
> & {
  keys: { p256dh: string; auth: string };
} {
  return (
    typeof body.endpoint === "string" &&
    body.endpoint.startsWith("https://") &&
    typeof body.keys?.p256dh === "string" &&
    typeof body.keys?.auth === "string"
  );
}

export async function POST(request: NextRequest) {
  const user = await getServerUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SubscriptionBody;

  if (!isValid(body)) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 },
    );
  }

  await saveSubscription(user.uid, body);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getServerUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint?: string };

  if (typeof body.endpoint !== "string") {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 },
    );
  }

  await deleteSubscription(user.uid, body.endpoint);

  return NextResponse.json({ success: true });
}
