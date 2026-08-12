import { adminDb } from "@/lib/firebase-admin";
import {
  ChatConversationSummary,
  ChatStoredMessage,
  ChatStoredMessageKind,
  ChatStoredMessageRole,
} from "@/models/chat/chat-history";

type FirestoreTimestampLike = {
  toDate?: () => Date;
  seconds?: number;
};

interface PersistConversationTurnInput {
  conversationId: string;
  userMessage: {
    content: string;
    createdAt: string;
  };
  assistantMessage: {
    id: string;
    content: string;
    createdAt: string;
    kind?: ChatStoredMessageKind;
  };
  fallbackTitle: string;
  preview: string;
  updatedAt: string;
}

export interface ChatConversationMeta {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  summary?: string;
  summaryUpdatedAt?: string;
  summaryMessageCount?: number;
}

export interface PersistConversationTurnResult {
  messageCount: number;
  summaryMessageCount: number;
}

function getConversationsRef(uid: string) {
  return adminDb.collection("users").doc(uid).collection("conversations");
}

function getMessagesRef(uid: string, conversationId: string) {
  return getConversationsRef(uid).doc(conversationId).collection("messages");
}

function toIso(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  const timestampValue = value as FirestoreTimestampLike;

  if (typeof timestampValue?.toDate === "function") {
    return timestampValue.toDate().toISOString();
  }

  if (typeof timestampValue?.seconds === "number") {
    return new Date(timestampValue.seconds * 1000).toISOString();
  }

  return new Date().toISOString();
}

function sanitizeTitle(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "New conversation";
  }

  if (trimmed.length <= 42) {
    return trimmed;
  }

  return `${trimmed.slice(0, 42).trim()}...`;
}

export async function persistConversationTurn(
  uid: string,
  input: PersistConversationTurnInput,
): Promise<PersistConversationTurnResult> {
  const conversationRef = getConversationsRef(uid).doc(input.conversationId);
  const conversationSnapshot = await conversationRef.get();

  const existingData = conversationSnapshot.data() as
    | {
        title?: string;
        createdAt?: unknown;
        messageCount?: unknown;
        summaryMessageCount?: unknown;
      }
    | undefined;

  const existingMessageCount =
    typeof existingData?.messageCount === "number"
      ? existingData.messageCount
      : 0;
  const existingSummaryMessageCount =
    typeof existingData?.summaryMessageCount === "number"
      ? existingData.summaryMessageCount
      : 0;

  const nextMessageCount = existingMessageCount + 2;

  const createdAt = conversationSnapshot.exists
    ? toIso(existingData?.createdAt)
    : input.userMessage.createdAt;

  const title = conversationSnapshot.exists
    ? sanitizeTitle(existingData?.title ?? input.fallbackTitle)
    : sanitizeTitle(input.fallbackTitle);

  await conversationRef.set(
    {
      id: input.conversationId,
      title,
      preview: input.preview,
      createdAt: new Date(createdAt),
      updatedAt: new Date(input.updatedAt),
      messageCount: nextMessageCount,
      summaryMessageCount: existingSummaryMessageCount,
    },
    { merge: true },
  );

  const userMessageRef = getMessagesRef(uid, input.conversationId).doc();
  const assistantMessageRef = getMessagesRef(uid, input.conversationId).doc(
    input.assistantMessage.id,
  );

  await Promise.all([
    userMessageRef.set({
      id: userMessageRef.id,
      role: "user" as ChatStoredMessageRole,
      content: input.userMessage.content,
      createdAt: new Date(input.userMessage.createdAt),
    }),
    assistantMessageRef.set({
      id: input.assistantMessage.id,
      role: "assistant" as ChatStoredMessageRole,
      content: input.assistantMessage.content,
      createdAt: new Date(input.assistantMessage.createdAt),
      kind: input.assistantMessage.kind,
    }),
  ]);

  return {
    messageCount: nextMessageCount,
    summaryMessageCount: existingSummaryMessageCount,
  };
}

export async function getConversationMeta(
  uid: string,
  conversationId: string,
): Promise<ChatConversationMeta | null> {
  const snapshot = await getConversationsRef(uid).doc(conversationId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;

  return {
    id: snapshot.id,
    title: sanitizeTitle(String(data.title ?? "New conversation")),
    preview: String(data.preview ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    messageCount: typeof data.messageCount === "number" ? data.messageCount : 0,
    summary: typeof data.summary === "string" ? data.summary : undefined,
    summaryUpdatedAt:
      data.summaryUpdatedAt !== undefined
        ? toIso(data.summaryUpdatedAt)
        : undefined,
    summaryMessageCount:
      typeof data.summaryMessageCount === "number"
        ? data.summaryMessageCount
        : undefined,
  };
}

export async function updateConversationSummary(
  uid: string,
  conversationId: string,
  payload: {
    summary: string;
    summaryUpdatedAt: string;
    summaryMessageCount: number;
  },
): Promise<void> {
  await getConversationsRef(uid)
    .doc(conversationId)
    .set(
      {
        summary: payload.summary,
        summaryUpdatedAt: new Date(payload.summaryUpdatedAt),
        summaryMessageCount: payload.summaryMessageCount,
      },
      { merge: true },
    );
}

export async function listConversations(
  uid: string,
  limit = 50,
): Promise<ChatConversationSummary[]> {
  const snapshot = await getConversationsRef(uid)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;

    return {
      id: doc.id,
      title: sanitizeTitle(String(data.title ?? "New conversation")),
      preview: String(data.preview ?? ""),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  });
}

export async function listConversationMessages(
  uid: string,
  conversationId: string,
  limit = 200,
): Promise<ChatStoredMessage[]> {
  const snapshot = await getMessagesRef(uid, conversationId)
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;

    return {
      id: String(data.id ?? doc.id),
      role: data.role === "assistant" ? "assistant" : "user",
      content: String(data.content ?? ""),
      createdAt: toIso(data.createdAt),
      kind:
        data.kind === "answer" ||
        data.kind === "clarification" ||
        data.kind === "refusal" ||
        data.kind === "error"
          ? data.kind
          : undefined,
    };
  });
}

export async function listRecentConversationMessages(
  uid: string,
  conversationId: string,
  limit = 10,
): Promise<ChatStoredMessage[]> {
  const snapshot = await getMessagesRef(uid, conversationId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const messages = snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;

    return {
      id: String(data.id ?? doc.id),
      role: data.role === "assistant" ? "assistant" : "user",
      content: String(data.content ?? ""),
      createdAt: toIso(data.createdAt),
      kind:
        data.kind === "answer" ||
        data.kind === "clarification" ||
        data.kind === "refusal" ||
        data.kind === "error"
          ? data.kind
          : undefined,
    } as ChatStoredMessage;
  });

  return messages.reverse();
}

export async function listConversationMessagesSince(
  uid: string,
  conversationId: string,
  sinceIso: string,
  limit = 100,
): Promise<ChatStoredMessage[]> {
  const snapshot = await getMessagesRef(uid, conversationId)
    .where("createdAt", ">", new Date(sinceIso))
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;

    return {
      id: String(data.id ?? doc.id),
      role: data.role === "assistant" ? "assistant" : "user",
      content: String(data.content ?? ""),
      createdAt: toIso(data.createdAt),
      kind:
        data.kind === "answer" ||
        data.kind === "clarification" ||
        data.kind === "refusal" ||
        data.kind === "error"
          ? data.kind
          : undefined,
    };
  });
}
