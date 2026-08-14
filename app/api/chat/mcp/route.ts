import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  buildConversationContext,
  maybeUpdateConversationSummary,
} from "@/chat/conversation-context";
import { createModelProvider } from "@/chat/model-provider";
import { getServerUser } from "@/lib/server-auth";
import { ChatApiError, toChatErrorResponse } from "@/models/chat/chat-error";
import {
  McpAdapterRouteRequest,
  McpAdapterUpstreamRequest,
  McpAdapterUpstreamResponse,
} from "@/models/chat/chat-mcp-adapter";
import {
  ChatResponseDraft,
  withChatResponseBase,
} from "@/models/chat/chat-response";
import { listRecentConversationMessages } from "@/repositories/chat.server.repository";
import { NextRequest, NextResponse } from "next/server";

function isMcpAdapterRouteRequest(
  value: unknown,
): value is McpAdapterRouteRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Partial<McpAdapterRouteRequest>;

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

    const filters = body.filters;

    if (
      filters.domains !== undefined &&
      !["entries", "goals", "visualizations", "all"].includes(filters.domains)
    ) {
      return false;
    }

    const stringArrays = [
      filters.goalIds,
      filters.metricIds,
      filters.categories,
      filters.tags,
    ];

    for (const field of stringArrays) {
      if (
        field !== undefined &&
        (!Array.isArray(field) ||
          field.some((item) => typeof item !== "string"))
      ) {
        return false;
      }
    }

    if (
      filters.dateFrom !== undefined &&
      typeof filters.dateFrom !== "string"
    ) {
      return false;
    }

    if (filters.dateTo !== undefined && typeof filters.dateTo !== "string") {
      return false;
    }

    if (
      filters.minScore !== undefined &&
      typeof filters.minScore !== "number"
    ) {
      return false;
    }

    if (
      filters.maxScore !== undefined &&
      typeof filters.maxScore !== "number"
    ) {
      return false;
    }
  }

  return true;
}

function toChatResponseDraft(
  upstream: McpAdapterUpstreamResponse,
): ChatResponseDraft {
  if (upstream.kind === "answer") {
    return {
      answer: upstream.answer,
      evidence: upstream.evidence,
      confidence: upstream.confidence,
    };
  }

  if (upstream.kind === "clarification") {
    return {
      clarificationQuestion: upstream.clarificationQuestion,
      followUpRequired: upstream.followUpRequired,
    };
  }

  return {
    refusalReason: upstream.refusalReason,
  };
}

function isMcpAdapterUpstreamResponse(
  value: unknown,
): value is McpAdapterUpstreamResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<McpAdapterUpstreamResponse>;

  if (candidate.kind === "answer") {
    return (
      typeof candidate.answer === "string" &&
      Array.isArray(candidate.evidence) &&
      (candidate.confidence === "high" ||
        candidate.confidence === "medium" ||
        candidate.confidence === "low")
    );
  }

  if (candidate.kind === "clarification") {
    return (
      typeof candidate.clarificationQuestion === "string" &&
      typeof candidate.followUpRequired === "boolean"
    );
  }

  if (candidate.kind === "refusal") {
    return typeof candidate.refusalReason === "string";
  }

  return false;
}

async function callMcpOrchestrateTool(
  mcpServerUrl: string,
  payload: McpAdapterUpstreamRequest,
): Promise<McpAdapterUpstreamResponse> {
  const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl));
  const client = new Client({
    name: "productivity-tracker-mcp-adapter",
    version: "0.1.0",
  });

  try {
    await client.connect(transport);

    const toolResult = await client.callTool({
      name: "chat.orchestrate",
      arguments: payload as unknown as Record<string, unknown>,
    });

    const structured =
      "structuredContent" in toolResult
        ? toolResult.structuredContent
        : undefined;
    if (isMcpAdapterUpstreamResponse(structured)) {
      return structured;
    }

    const content = "content" in toolResult ? toolResult.content : undefined;
    const textPart = Array.isArray(content)
      ? content.find((part) => {
          if (!part || typeof part !== "object") {
            return false;
          }

          return (
            "type" in part &&
            (part as { type?: unknown }).type === "text" &&
            "text" in part
          );
        })
      : undefined;

    if (
      textPart &&
      typeof textPart === "object" &&
      "text" in textPart &&
      typeof textPart.text === "string"
    ) {
      const parsed = JSON.parse(textPart.text) as unknown;
      if (isMcpAdapterUpstreamResponse(parsed)) {
        return parsed;
      }
    }

    throw new ChatApiError(
      500,
      "internal_error",
      "MCP tool returned an invalid response shape",
    );
  } finally {
    await client.close();
  }
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

    if (!isMcpAdapterRouteRequest(body)) {
      throw new ChatApiError(400, "validation_error", "Invalid request body");
    }

    const mcpServerUrl = process.env.MCP_SERVER_URL;
    const mcpServerMcpPath = process.env.MCP_SERVER_MCP_PATH ?? "/mcp";
    if (!mcpServerUrl) {
      throw new ChatApiError(
        500,
        "internal_error",
        "MCP_SERVER_URL is not configured",
      );
    }

    const conversationId = body.conversationId || crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const traceId = crypto.randomUUID();
    const conversationContext = await buildConversationContext(
      user.uid,
      body.conversationId,
    );
    const conversationHistory = body.conversationId
      ? await listRecentConversationMessages(user.uid, body.conversationId, 10)
      : [];

    const upstreamPayload: McpAdapterUpstreamRequest = {
      message: body.message,
      authUid: user.uid,
      conversationId,
      conversationContext,
      conversationHistory: conversationHistory.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      filters: body.filters,
      traceId,
    };

    const upstreamBody = await callMcpOrchestrateTool(
      `${mcpServerUrl}${mcpServerMcpPath}`,
      upstreamPayload,
    );

    const draft = toChatResponseDraft(upstreamBody);
    const response = withChatResponseBase(
      {
        messageId,
        conversationId,
      },
      draft,
    );

    await maybeUpdateConversationSummary(
      user.uid,
      conversationId,
      createModelProvider(),
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log(error); // Log the error for debugging purposes
    const normalized = toChatErrorResponse(error);
    return NextResponse.json(normalized.body, { status: normalized.status });
  }
}
