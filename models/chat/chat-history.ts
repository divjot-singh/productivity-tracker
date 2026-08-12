export type ChatStoredMessageRole = "user" | "assistant";

export type ChatStoredMessageKind =
  "answer" | "clarification" | "refusal" | "error";

export interface ChatConversationSummary {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  summary?: string;
  summaryUpdatedAt?: string;
  summaryMessageCount?: number;
}

export interface ChatStoredMessage {
  id: string;
  role: ChatStoredMessageRole;
  content: string;
  createdAt: string;
  kind?: ChatStoredMessageKind;
}

export interface ChatConversationsListResponse {
  conversations: ChatConversationSummary[];
}

export interface ChatConversationMessagesResponse {
  conversationId: string;
  messages: ChatStoredMessage[];
}
