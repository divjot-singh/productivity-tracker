import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/server-auth";
import { listConversationMessages } from "@/repositories/chat.server.repository";
import { ChatApiError, toChatErrorResponse } from "@/models/chat/chat-error";

interface Params {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      throw new ChatApiError(401, "unauthorized", "Unauthorized");
    }

    const { conversationId } = await context.params;

    if (!conversationId) {
      throw new ChatApiError(
        400,
        "validation_error",
        "Missing conversation id.",
      );
    }

    const messages = await listConversationMessages(user.uid, conversationId);

    return NextResponse.json(
      {
        conversationId,
        messages,
      },
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = toChatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
