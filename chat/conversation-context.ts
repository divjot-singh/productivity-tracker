import type { ModelProvider } from "@/chat/model-provider";
import {
  getConversationMeta,
  listConversationMessages,
  listConversationMessagesSince,
  listRecentConversationMessages,
  updateConversationSummary,
} from "@/repositories/chat.server.repository";

const SUMMARY_INTERVAL_MESSAGES = 10;
const SUMMARY_HISTORY_LIMIT = 120;
const CONTEXT_RECENT_LIMIT = 10;

function formatMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): string {
  return messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

function compactSummary(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export async function maybeUpdateConversationSummary(
  uid: string,
  conversationId: string,
  modelProvider: ModelProvider,
): Promise<void> {
  const meta = await getConversationMeta(uid, conversationId);

  if (!meta) {
    return;
  }

  if (
    meta.messageCount === 0 ||
    meta.messageCount % SUMMARY_INTERVAL_MESSAGES !== 0
  ) {
    return;
  }

  const alreadySummarizedCount = meta.summaryMessageCount ?? 0;
  if (alreadySummarizedCount >= meta.messageCount) {
    return;
  }

  const messages = meta.summaryUpdatedAt
    ? await listConversationMessagesSince(
        uid,
        conversationId,
        meta.summaryUpdatedAt,
        SUMMARY_HISTORY_LIMIT,
      )
    : await listConversationMessages(
        uid,
        conversationId,
        SUMMARY_HISTORY_LIMIT,
      );

  if (messages.length === 0) {
    return;
  }

  const prompt = [
    "Summarize the conversation for future assistant context.",
    "Keep it concise and factual.",
    "Capture user goals, preferences, open questions, and important decisions.",
    "Return plain text only.",
    meta.summary ? `Existing summary:\n${meta.summary}` : "",
    "New messages:",
    formatMessages(messages),
    "Updated summary:",
  ]
    .filter(Boolean)
    .join("\n\n");

  const summary = compactSummary(await modelProvider(prompt));

  await updateConversationSummary(uid, conversationId, {
    summary,
    summaryUpdatedAt: new Date().toISOString(),
    summaryMessageCount: meta.messageCount,
  });
}

export async function buildConversationContext(
  uid: string,
  conversationId: string | undefined,
): Promise<string | undefined> {
  if (!conversationId) {
    return undefined;
  }

  const meta = await getConversationMeta(uid, conversationId);
  if (!meta) {
    return undefined;
  }

  let recentMessages = meta.summaryUpdatedAt
    ? await listConversationMessagesSince(
        uid,
        conversationId,
        meta.summaryUpdatedAt,
        CONTEXT_RECENT_LIMIT,
      )
    : [];

  if (recentMessages.length === 0) {
    recentMessages = await listRecentConversationMessages(
      uid,
      conversationId,
      CONTEXT_RECENT_LIMIT,
    );
  }

  const contextParts: string[] = [];

  if (meta.summary) {
    contextParts.push(`Conversation summary:\n${meta.summary}`);
  }

  if (recentMessages.length > 0) {
    contextParts.push(
      `Recent conversation messages:\n${formatMessages(recentMessages)}`,
    );
  }

  if (contextParts.length === 0) {
    return undefined;
  }

  return contextParts.join("\n\n");
}
