import type { ChatRequestFilters } from "@/models/chat/chat-request";

export interface McpAdapterRouteRequest {
  message: string;
  conversationId?: string;
  filters?: ChatRequestFilters;
  devUserId?: string;
}

export interface McpAdapterConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface McpAdapterUpstreamRequest {
  message: string;
  authUid: string;
  conversationId?: string;
  conversationContext?: string;
  conversationHistory: McpAdapterConversationTurn[];
  filters?: ChatRequestFilters;
  traceId: string;
}

export interface McpAdapterEvidence {
  id: string;
  source: string;
  timestamp: string;
  snippet: string;
}

export type McpAdapterUpstreamResponse =
  | {
      kind: "answer";
      answer: string;
      evidence: McpAdapterEvidence[];
      confidence: "high" | "medium" | "low";
      metadata?: {
        traceId: string;
        toolsUsed: string[];
        latencyMs: number;
      };
    }
  | {
      kind: "clarification";
      clarificationQuestion: string;
      followUpRequired: boolean;
      metadata?: {
        traceId: string;
        toolsUsed: string[];
        latencyMs: number;
      };
    }
  | {
      kind: "refusal";
      refusalReason: string;
      metadata?: {
        traceId: string;
        toolsUsed: string[];
        latencyMs: number;
      };
    };
