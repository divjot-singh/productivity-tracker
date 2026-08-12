import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/server-auth";
import { listConversations } from "@/repositories/chat.server.repository";
import { ChatApiError, toChatErrorResponse } from "@/models/chat/chat-error";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      throw new ChatApiError(401, "unauthorized", "Unauthorized");
    }

    const conversations = await listConversations(user.uid);

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    const { status, body } = toChatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
