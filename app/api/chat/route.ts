/*
Route responsibilities (Phase 1/2 points 1, 2, 3):

1) POST /api/chat handler
- Parse and validate request body as ChatRequest.
- Resolve authenticated user from auth token only.
- Call orchestrator with message + filters + auth uid (+ dev override in non-production).
- Return final ChatResponse JSON.

2) Auth/user scope enforcement
- In production: always ignore devUserId and use auth uid.
- In non-production: allow devUserId override for local testing only.
- If auth missing/invalid: return 401 with standard error model.

3) Standard error handling (stable shape)
- validation errors: 400
- auth errors: 401
- forbidden policy errors: 403
- unexpected/internal errors: 500
- Response shape:
	{
		error: {
			code: string;
			message: string;
			details?: string;
		}
	}

Streaming note:
- Implement JSON response first for baseline completion.
- Add SSE only if UI requires token streaming; keep response model compatible.
*/

import { Orchestrator } from "@/chat/orchestrator";
import {
  buildConversationContext,
  maybeUpdateConversationSummary,
} from "@/chat/conversation-context";
import { createModelProvider } from "@/chat/model-provider";
import { getServerUser } from "@/lib/server-auth";
import { ChatStoredMessageKind } from "@/models/chat/chat-history";
import { ChatApiError, toChatErrorResponse } from "@/models/chat/chat-error";
import { ChatRequest } from "@/models/chat/chat-request";
import { withChatResponseBase } from "@/models/chat/chat-response";
import { persistConversationTurn } from "@/repositories/chat.server.repository";
import { NextRequest, NextResponse } from "next/server";

function buildConversationTitle(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return "New conversation";
  }

  if (trimmed.length <= 42) {
    return trimmed;
  }

  return `${trimmed.slice(0, 42).trim()}...`;
}

function extractAssistantContentAndKind(
  response: ReturnType<typeof withChatResponseBase>,
): {
  content: string;
  kind?: ChatStoredMessageKind;
} {
  if ("answer" in response) {
    return {
      content: response.answer,
      kind: "answer",
    };
  }

  if ("clarificationQuestion" in response) {
    return {
      content: response.clarificationQuestion,
      kind: "clarification",
    };
  }

  if ("refusalReason" in response) {
    return {
      content: response.refusalReason,
      kind: "refusal",
    };
  }

  return {
    content: "",
  };
}

function isChatRequestBody(value: unknown): value is ChatRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Partial<ChatRequest>;

  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    return false;
  }

  if (
    body.conversationId !== undefined &&
    typeof body.conversationId !== "string"
  ) {
    return false;
  }

  if (body.devUserId !== undefined && typeof body.devUserId !== "string") {
    return false;
  }

  if (body.filters !== undefined) {
    if (!body.filters || typeof body.filters !== "object") {
      return false;
    }

    const filters = body.filters as ChatRequest["filters"];
    if (
      filters?.domains !== undefined &&
      !["entries", "goals", "visualizations", "all"].includes(filters.domains)
    ) {
      return false;
    }

    if (
      filters?.dateFrom !== undefined &&
      typeof filters.dateFrom !== "string"
    ) {
      return false;
    }

    if (filters?.dateTo !== undefined && typeof filters.dateTo !== "string") {
      return false;
    }

    const arrayFilters: Array<string[] | undefined> = [
      filters?.goalIds,
      filters?.metricIds,
      filters?.categories,
      filters?.tags,
    ];

    for (const field of arrayFilters) {
      if (field !== undefined) {
        if (
          !Array.isArray(field) ||
          field.some((item) => typeof item !== "string")
        ) {
          return false;
        }
      }
    }

    if (
      filters?.minScore !== undefined &&
      typeof filters.minScore !== "number"
    ) {
      return false;
    }

    if (
      filters?.maxScore !== undefined &&
      typeof filters.maxScore !== "number"
    ) {
      return false;
    }
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);

    if (!user) {
      throw new ChatApiError(401, "unauthorized", "Unauthorized");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ChatApiError(400, "validation_error", "Invalid JSON body");
    }

    if (!isChatRequestBody(body)) {
      throw new ChatApiError(400, "validation_error", "Invalid request body");
    }

    const conversationId = body.conversationId || crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const devUserId =
      process.env.NODE_ENV === "production" ? undefined : body.devUserId;

    const orchestrator = new Orchestrator();
    const modelProvider = createModelProvider();
    const conversationContext = await buildConversationContext(
      user.uid,
      body.conversationId,
    );
    const draftResponse = await orchestrator.orchestrate({
      message: body.message,
      filters: body.filters,
      authUid: user.uid,
      devUserId,
      modelProvider,
      conversationContext,
    });

    const response = withChatResponseBase(
      {
        messageId,
        conversationId,
      },
      draftResponse,
    );

    const now = new Date();
    const assistantTimestamp = new Date(now.getTime() + 1).toISOString();
    const assistant = extractAssistantContentAndKind(response);

    await persistConversationTurn(user.uid, {
      conversationId,
      userMessage: {
        content: body.message,
        createdAt: now.toISOString(),
      },
      assistantMessage: {
        id: response.messageId,
        content: assistant.content,
        createdAt: assistantTimestamp,
        kind: assistant.kind,
      },
      fallbackTitle: buildConversationTitle(body.message),
      preview: assistant.content,
      updatedAt: assistantTimestamp,
    });

    await maybeUpdateConversationSummary(
      user.uid,
      conversationId,
      modelProvider,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(error);
    const { status, body } = toChatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
