import { NextRequest } from "next/server";
import {
  buildConversationContext,
  maybeUpdateConversationSummary,
} from "@/chat/conversation-context";
import { Orchestrator } from "@/chat/orchestrator";
import {
  createModelProvider,
  createStreamingModelProvider,
} from "@/chat/model-provider";
import { getServerUser } from "@/lib/server-auth";
import { ChatStoredMessageKind } from "@/models/chat/chat-history";
import { ChatApiError } from "@/models/chat/chat-error";
import { ChatRequest } from "@/models/chat/chat-request";
import { withChatResponseBase } from "@/models/chat/chat-response";
import { persistConversationTurn } from "@/repositories/chat.server.repository";

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

  return true;
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function activity(step: string, detail?: string) {
  return {
    step,
    ...(detail ? { detail } : {}),
    timestamp: new Date().toISOString(),
  };
}

const STREAM_ACTIVITY_MESSAGES = {
  starting: "Preparing your request....",
  context: "Loading conversation context....",
  reasoning: "Analyzing your message and evidence....",
  responding: "Response ready. Finalizing conversation....",
  persisting: "Saving conversation history....",
  summarizing: "Updating long-term conversation memory....",
  completed: "Done.",
} as const;

function jsonError(status: number, code: string, message: string) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const user = await getServerUser(request);

  if (!user) {
    return jsonError(401, "unauthorized", "Unauthorized");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "validation_error", "Invalid JSON body");
  }

  if (!isChatRequestBody(body)) {
    return jsonError(400, "validation_error", "Invalid request body");
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const enqueue = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      const close = () => {
        controller.close();
      };

      const fail = (message: string) => {
        enqueue("error", { message });
        close();
      };

      void (async () => {
        try {
          const conversationId = body.conversationId || crypto.randomUUID();
          const messageId = crypto.randomUUID();
          const devUserId =
            process.env.NODE_ENV === "production" ? undefined : body.devUserId;

          enqueue("meta", {
            conversationId,
            messageId,
          });

          enqueue(
            "activity",
            activity("starting", STREAM_ACTIVITY_MESSAGES.starting),
          );

          const orchestrator = new Orchestrator();
          let assistantStreamStarted = false;
          const streamingModelProvider = createStreamingModelProvider(
            (chunk) => {
              if (!assistantStreamStarted) {
                assistantStreamStarted = true;
                enqueue("assistant_start", { ok: true });
              }

              enqueue("assistant_delta", { text: chunk });
            },
          );
          const summaryModelProvider = createModelProvider();
          enqueue(
            "activity",
            activity("context", STREAM_ACTIVITY_MESSAGES.context),
          );
          const conversationContext = await buildConversationContext(
            user.uid,
            body.conversationId,
          );
          enqueue(
            "activity",
            activity("reasoning", STREAM_ACTIVITY_MESSAGES.reasoning),
          );
          const reasoningStartedAt = Date.now();
          const reasoningPulse = setInterval(() => {
            const elapsedSeconds = Math.floor(
              (Date.now() - reasoningStartedAt) / 1000,
            );
            enqueue(
              "activity",
              activity(
                "reasoning",
                `${STREAM_ACTIVITY_MESSAGES.reasoning} (${elapsedSeconds}s)`,
              ),
            );
          }, 5000);

          let draftResponse;
          try {
            draftResponse = await orchestrator.orchestrate({
              message: body.message,
              filters: body.filters,
              authUid: user.uid,
              devUserId,
              modelProvider: streamingModelProvider,
              conversationContext,
            });
          } finally {
            clearInterval(reasoningPulse);
          }

          const response = withChatResponseBase(
            {
              messageId,
              conversationId,
            },
            draftResponse,
          );

          const assistant = extractAssistantContentAndKind(response);

          enqueue(
            "activity",
            activity("responding", STREAM_ACTIVITY_MESSAGES.responding),
          );
          if (!assistantStreamStarted && assistant.content) {
            enqueue("assistant_start", { ok: true });
            enqueue("assistant_delta", { text: assistant.content });
          }
          enqueue("assistant_end", { ok: true });
          enqueue("assistant", response);

          const now = new Date();
          const assistantTimestamp = new Date(now.getTime() + 1).toISOString();

          enqueue(
            "activity",
            activity("persisting", STREAM_ACTIVITY_MESSAGES.persisting),
          );
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

          enqueue(
            "activity",
            activity("summarizing", STREAM_ACTIVITY_MESSAGES.summarizing),
          );
          await maybeUpdateConversationSummary(
            user.uid,
            conversationId,
            summaryModelProvider,
          );

          enqueue(
            "activity",
            activity("completed", STREAM_ACTIVITY_MESSAGES.completed),
          );
          enqueue("done", { ok: true });
          close();
        } catch (error) {
          const message =
            error instanceof ChatApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Unexpected error";

          fail(message);
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
