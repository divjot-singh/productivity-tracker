export interface ChatResponseBase {
  messageId: string;
  conversationId: string;
}

export interface Evidence {
  id: string;
  source: string;
  timestamp: string;
  snippet: string;
}

export interface ChatResponseSuccess {
  answer: string;
  evidence: Evidence[];
  confidence: "high" | "medium" | "low";
}

export interface ChatResponseClarification {
  clarificationQuestion: string;
  followUpRequired: boolean;
}

export interface ChatResponseRefusal {
  refusalReason: string;
}

export type ChatResponseDraft =
  ChatResponseSuccess | ChatResponseClarification | ChatResponseRefusal;

export type ChatResponse = ChatResponseDraft & ChatResponseBase;

export function withChatResponseBase(
  base: ChatResponseBase,
  draft: ChatResponseDraft,
): ChatResponse {
  return {
    ...draft,
    ...base,
  };
}

export type HitlDecision =
  | { kind: "answer" }
  | { kind: "clarify"; payload: ChatResponseClarification }
  | { kind: "refuse"; payload: ChatResponseRefusal };
