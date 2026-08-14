"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageSquareText,
  PanelLeft,
  Plus,
  Send,
  X,
  Copy,
  RotateCcw,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  ChatConversationMessagesResponse,
  ChatConversationSummary,
  ChatConversationsListResponse,
  ChatStoredMessage,
} from "@/models/chat/chat-history";
import { ChatResponse } from "@/models/chat/chat-response";

type ChatMessageKind = "answer" | "clarification" | "refusal" | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  kind?: ChatMessageKind;
  pending?: boolean;
}

function sortConversations(conversations: ChatConversationSummary[]) {
  return [...conversations].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

function buildConversationTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage) {
    return "New conversation";
  }

  const trimmed = firstUserMessage.content.trim();
  if (trimmed.length <= 42) {
    return trimmed;
  }

  return `${trimmed.slice(0, 42).trim()}...`;
}

function toAssistantMessage(response: ChatResponse): {
  content: string;
  kind: ChatMessageKind;
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

  return {
    content: response.refusalReason,
    kind: "refusal",
  };
}

function replacePendingMessage(
  messages: ChatMessage[],
  nextMessage: ChatMessage,
) {
  const nextMessages = [...messages];

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (
      nextMessages[index]?.role === "assistant" &&
      nextMessages[index]?.pending
    ) {
      nextMessages[index] = nextMessage;
      return nextMessages;
    }
  }

  return [...nextMessages, nextMessage];
}

function updatePendingMessage(
  messages: ChatMessage[],
  updater: (message: ChatMessage) => ChatMessage,
): ChatMessage[] {
  const nextMessages = [...messages];

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (
      nextMessages[index]?.role === "assistant" &&
      nextMessages[index]?.pending
    ) {
      nextMessages[index] = updater(nextMessages[index]);
      return nextMessages;
    }
  }

  return nextMessages;
}

function renderAssistantContent(content: string) {
  const renderInlineMarkdown = (value: string) => {
    const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, partIndex) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={`b-${partIndex}`}
            className="text-foreground font-semibold"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={`c-${partIndex}`}
            className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.82em]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return (
        <span key={`t-${partIndex}`} className="font-normal">
          {part}
        </span>
      );
    });
  };

  const rawLines = content.replace(/\r\n/g, "\n").split("\n");

  type Block =
    | { kind: "table"; lines: string[] }
    | { kind: "h1" | "h2" | "h3" | "h4"; text: string }
    | { kind: "ul"; items: string[] }
    | { kind: "ol"; items: string[] }
    | { kind: "p"; text: string };

  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i] ?? "";

    // skip blank lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // table detection
    const nextLine = rawLines[i + 1] ?? "";
    if (
      /\|/.test(line) &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(nextLine)
    ) {
      const tableLines = [line, nextLine];
      i += 2;
      while (i < rawLines.length && /\|/.test(rawLines[i] ?? "")) {
        tableLines.push(rawLines[i]);
        i++;
      }
      blocks.push({ kind: "table", lines: tableLines });
      continue;
    }

    // headings
    const h1 = /^#\s+(.+)$/.exec(line);
    const h2 = /^##\s+(.+)$/.exec(line);
    const h3 = /^###\s+(.+)$/.exec(line);
    const h4 = /^####\s+(.+)$/.exec(line);
    if (h4) {
      blocks.push({ kind: "h4", text: h4[1] });
      i++;
      continue;
    }
    if (h3) {
      blocks.push({ kind: "h3", text: h3[1] });
      i++;
      continue;
    }
    if (h2) {
      blocks.push({ kind: "h2", text: h2[1] });
      i++;
      continue;
    }
    if (h1) {
      blocks.push({ kind: "h1", text: h1[1] });
      i++;
      continue;
    }

    // unordered list — collect consecutive list items
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\s*[-*]\s+/.test(rawLines[i] ?? "")) {
        items.push((rawLines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // ordered list — collect consecutive items
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i] ?? "")) {
        items.push((rawLines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // paragraph — collect consecutive non-structural lines
    const paragraphLines: string[] = [];
    while (
      i < rawLines.length &&
      (rawLines[i] ?? "").trim() !== "" &&
      !/^\s*[-*]\s+/.test(rawLines[i] ?? "") &&
      !/^\s*\d+\.\s+/.test(rawLines[i] ?? "") &&
      !/^#{1,4}\s+/.test(rawLines[i] ?? "") &&
      !/\|/.test(rawLines[i] ?? "")
    ) {
      paragraphLines.push(rawLines[i] ?? "");
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ kind: "p", text: paragraphLines.join("\n") });
    }
  }

  return blocks.map((block, blockIndex) => {
    if (block.kind === "table") {
      const headerCells = block.lines[0]
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      const bodyLines = block.lines.slice(2);

      return (
        <div key={`table-${blockIndex}`} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {headerCells.map((cell, cellIndex) => (
                  <th
                    key={`th-${cellIndex}`}
                    className="px-2 py-1.5 font-medium"
                  >
                    {renderInlineMarkdown(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyLines.map((row, rowIndex) => {
                const cells = row
                  .split("|")
                  .map((cell) => cell.trim())
                  .filter(Boolean);

                return (
                  <tr
                    key={`tr-${rowIndex}`}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    {cells.map((cell, cellIndex) => (
                      <td
                        key={`td-${rowIndex}-${cellIndex}`}
                        className="px-2 py-1.5 align-top"
                      >
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (block.kind === "ul") {
      return (
        <ul key={`ul-${blockIndex}`} className="list-disc space-y-1 pl-5">
          {block.items.map((item, itemIndex) => (
            <li key={`ul-${blockIndex}-${itemIndex}`} className="leading-6">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (block.kind === "ol") {
      return (
        <ol key={`ol-${blockIndex}`} className="list-decimal space-y-1 pl-5">
          {block.items.map((item, itemIndex) => (
            <li key={`ol-${blockIndex}-${itemIndex}`} className="leading-6">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
    }

    if (block.kind === "h1") {
      return (
        <h2 key={`h1-${blockIndex}`} className="text-base leading-6 font-bold">
          {renderInlineMarkdown(block.text)}
        </h2>
      );
    }

    if (block.kind === "h2") {
      return (
        <h3 key={`h2-${blockIndex}`} className="text-sm leading-6 font-bold">
          {renderInlineMarkdown(block.text)}
        </h3>
      );
    }

    if (block.kind === "h3") {
      return (
        <h4
          key={`h3-${blockIndex}`}
          className="text-sm leading-6 font-semibold"
        >
          {renderInlineMarkdown(block.text)}
        </h4>
      );
    }

    if (block.kind === "h4") {
      return (
        <h5
          key={`h4-${blockIndex}`}
          className="text-muted-foreground text-sm leading-6 font-medium"
        >
          {renderInlineMarkdown(block.text)}
        </h5>
      );
    }

    return (
      <p key={`p-${blockIndex}`} className="leading-6 whitespace-pre-wrap">
        {renderInlineMarkdown(block.text)}
      </p>
    );
  });
}
function mapStoredMessageToView(message: ChatStoredMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    kind: message.kind,
  };
}

function upsertConversationSummary(
  conversations: ChatConversationSummary[],
  summary: ChatConversationSummary,
) {
  return sortConversations(
    conversations
      .filter((conversation) => conversation.id !== summary.id)
      .concat(summary),
  );
}

function formatConversationTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface StreamMetaPayload {
  conversationId: string;
  messageId: string;
}

interface StreamActivityPayload {
  step: string;
  detail?: string;
  timestamp: string;
}

type AssistantStreamEvent =
  | { type: "activity"; payload: StreamActivityPayload }
  | { type: "delta"; payload: { text: string } }
  | { type: "start" }
  | { type: "end" };

interface ChatStreamResult {
  meta: StreamMetaPayload;
  response: ChatResponse;
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n").filter((line) => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLines = lines.filter((line) => line.startsWith("data:"));

  if (!eventLine || dataLines.length === 0) {
    return null;
  }

  const event = eventLine.slice("event:".length).trim();
  const data = dataLines
    .map((line) =>
      line.startsWith("data: ")
        ? line.slice("data: ".length)
        : line.slice("data:".length),
    )
    .join("\n");

  return {
    event,
    data,
  };
}

async function sendChatStream(
  user: User,
  payload: {
    message: string;
    conversationId?: string;
  },
  onStreamEvent?: (event: AssistantStreamEvent) => void,
): Promise<ChatStreamResult> {
  const token = await user.getIdToken();
  const response = await fetch("/api/chat/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Unable to send your message.";

    try {
      const payload = (await response.json()) as {
        error?: { message?: string };
      };

      if (payload.error?.message) {
        message = payload.error.message;
      }
    } catch {}

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Chat stream did not return a readable response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  let meta: StreamMetaPayload | null = null;
  let assistantResponse: ChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      if (buffer.trim().length > 0) {
        const parsed = parseSseBlock(buffer);
        if (parsed) {
          const payload = JSON.parse(parsed.data) as unknown;

          if (parsed.event === "meta") {
            meta = payload as StreamMetaPayload;
          }

          if (parsed.event === "assistant") {
            assistantResponse = payload as ChatResponse;
          }

          if (parsed.event === "activity") {
            onStreamEvent?.({
              type: "activity",
              payload: payload as StreamActivityPayload,
            });
          }

          if (parsed.event === "assistant_start") {
            onStreamEvent?.({ type: "start" });
          }

          if (parsed.event === "assistant_delta") {
            onStreamEvent?.({
              type: "delta",
              payload: payload as { text: string },
            });
          }

          if (parsed.event === "assistant_end") {
            onStreamEvent?.({ type: "end" });
          }

          if (parsed.event === "error") {
            const errorPayload = payload as { message?: string };
            throw new Error(errorPayload.message ?? "Unexpected stream error.");
          }
        }
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const parsed = parseSseBlock(chunk);
      if (!parsed) {
        continue;
      }

      const payload = JSON.parse(parsed.data) as unknown;

      if (parsed.event === "meta") {
        meta = payload as StreamMetaPayload;
      }

      if (parsed.event === "assistant") {
        assistantResponse = payload as ChatResponse;
      }

      if (parsed.event === "activity") {
        onStreamEvent?.({
          type: "activity",
          payload: payload as StreamActivityPayload,
        });
      }

      if (parsed.event === "assistant_start") {
        onStreamEvent?.({ type: "start" });
      }

      if (parsed.event === "assistant_delta") {
        onStreamEvent?.({
          type: "delta",
          payload: payload as { text: string },
        });
      }

      if (parsed.event === "assistant_end") {
        onStreamEvent?.({ type: "end" });
      }

      if (parsed.event === "error") {
        const errorPayload = payload as { message?: string };
        throw new Error(errorPayload.message ?? "Unexpected stream error.");
      }
    }
  }

  if (!meta || !assistantResponse) {
    throw new Error(
      "Chat stream finished without a complete assistant response.",
    );
  }

  return {
    meta,
    response: assistantResponse,
  };
}

export default function ChatPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Extract conversation ID from URL: /chat/[conversationId] or /chat
  const urlConversationId = pathname.startsWith("/chat/")
    ? pathname.slice("/chat/".length)
    : null;

  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(urlConversationId);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>(
    [],
  );

  const activeConversation = activeConversationId
    ? (conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null)
    : null;

  const visibleMessages = activeConversationId ? activeMessages : draftMessages;

  function handleClose() {
    router.replace("/dashboard");
  }

  function handleNewConversation() {
    setActiveConversationId(null);
    setDraft("");
    setDraftMessages([]);
    setActiveMessages([]);
    setHistoryOpen(false);
    router.push("/chat");
  }

  function handleOpenConversationHistory() {
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur();
    setHistoryOpen(true);
  }

  async function loadConversations() {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const response = await apiRequest<ChatConversationsListResponse>(
        user,
        "/api/chat/conversations",
        {
          method: "GET",
        },
      );

      setConversations(sortConversations(response.conversations ?? []));
    } catch {
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }

  async function loadConversationMessages(conversationId: string) {
    if (!user) return;

    setIsLoadingMessages(true);
    try {
      const response = await apiRequest<ChatConversationMessagesResponse>(
        user,
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "GET",
        },
      );

      setActiveMessages((response.messages ?? []).map(mapStoredMessageToView));
    } catch {
      setActiveMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  useEffect(() => {
    void loadConversations();
  }, [user]);

  // Sync URL conversation ID with state
  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeConversationId) {
      setActiveConversationId(urlConversationId);
    } else if (!urlConversationId && activeConversationId) {
      setActiveConversationId(null);
      setDraftMessages([]);
      setActiveMessages([]);
    }
  }, [pathname]);

  useEffect(() => {
    if (!activeConversationId) {
      setActiveMessages([]);
      return;
    }

    void loadConversationMessages(activeConversationId);
  }, [activeConversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || isSending) {
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: now,
    };
    const pendingAssistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thinking...",
      createdAt: now,
      pending: true,
    };

    const optimisticMessages = [
      ...(activeConversationId ? activeMessages : draftMessages),
      userMessage,
      pendingAssistantMessage,
    ];

    const shouldUpdateActiveMessages = Boolean(activeConversationId);
    const setMessageThread = (
      updater: (messages: ChatMessage[]) => ChatMessage[],
    ) => {
      if (shouldUpdateActiveMessages) {
        setActiveMessages((current) => updater(current));
        return;
      }

      setDraftMessages((current) => updater(current));
    };

    setDraft("");
    setIsSending(true);

    if (activeConversationId) {
      setActiveMessages(optimisticMessages);

      if (activeConversation) {
        setConversations((current) =>
          upsertConversationSummary(current, {
            ...activeConversation,
            preview: trimmed,
            updatedAt: now,
          }),
        );
      }
    } else {
      setDraftMessages(optimisticMessages);
    }

    try {
      let hasAssistantStarted = false;
      const streamed = await sendChatStream(
        user,
        {
          message: trimmed,
          ...(activeConversationId
            ? { conversationId: activeConversationId }
            : {}),
        },
        (event) => {
          if (event.type === "start") {
            hasAssistantStarted = true;
            setMessageThread((current) =>
              updatePendingMessage(current, (pending) => ({
                ...pending,
                content: "",
              })),
            );
            return;
          }

          if (event.type === "delta") {
            hasAssistantStarted = true;
            setMessageThread((current) =>
              updatePendingMessage(current, (pending) => ({
                ...pending,
                content: `${pending.content}${event.payload.text}`,
              })),
            );
            return;
          }

          if (event.type === "activity") {
            if (hasAssistantStarted) {
              return;
            }

            const detail = event.payload.detail ?? event.payload.step;
            setMessageThread((current) =>
              updatePendingMessage(current, (pending) => ({
                ...pending,
                content: detail,
              })),
            );
          }
        },
      );
      const response = streamed.response;

      const assistant = toAssistantMessage(response);
      const assistantMessage: ChatMessage = {
        id: streamed.meta.messageId,
        role: "assistant",
        content: assistant.content,
        createdAt: now,
        kind: assistant.kind,
      };
      const resolvedMessages = replacePendingMessage(
        optimisticMessages,
        assistantMessage,
      );

      setConversations((current) =>
        upsertConversationSummary(current, {
          id: response.conversationId,
          title:
            activeConversation?.title ??
            buildConversationTitle(resolvedMessages),
          preview: assistant.content,
          createdAt: activeConversation?.createdAt ?? now,
          updatedAt: now,
        }),
      );
      setActiveConversationId(response.conversationId);
      setActiveMessages(resolvedMessages);
      setDraftMessages([]);
      router.push(`/chat/${response.conversationId}`);

      void loadConversations();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to send your message.";

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: message,
        createdAt: new Date().toISOString(),
        kind: "error",
      };

      if (activeConversationId) {
        const fallbackMessages = replacePendingMessage(
          optimisticMessages,
          errorMessage,
        );

        setActiveMessages(fallbackMessages);

        if (activeConversation) {
          setConversations((current) =>
            upsertConversationSummary(current, {
              ...activeConversation,
              preview: message,
              updatedAt: new Date().toISOString(),
            }),
          );
        }
      } else {
        setDraftMessages(
          replacePendingMessage(optimisticMessages, errorMessage),
        );
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleCopyMessage(content: string) {
    navigator.clipboard.writeText(content);
  }

  async function handleRetryMessage(message: ChatMessage) {
    if (message.role !== "user") {
      return;
    }

    // Remove the user message and any pending/error response after it
    const setMessageThread = (
      updater: (messages: ChatMessage[]) => ChatMessage[],
    ) => {
      if (activeConversationId) {
        setActiveMessages((current) => updater(current));
        return;
      }

      setDraftMessages((current) => updater(current));
    };

    setMessageThread((current) => {
      const messageIndex = current.findIndex((m) => m.id === message.id);
      if (messageIndex === -1) {
        return current;
      }

      // Keep everything up to and including the user message
      // Remove any assistant message that follows
      const nextMessages = current.slice(0, messageIndex + 1);
      if (
        current[messageIndex + 1]?.role === "assistant" &&
        current[messageIndex + 1]?.pending
      ) {
        return nextMessages;
      }
      return current;
    });

    // Resend the message
    setDraft(message.content);
  }

  if (loading || !user) {
    return (
      <main className="bg-background fixed inset-0 z-[70] flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading chat...</p>
      </main>
    );
  }

  return (
    <main className="bg-background fixed inset-0 z-[70] flex min-h-dvh flex-col overflow-hidden">
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[86%] sm:max-w-sm"
        >
          <SheetHeader className="border-b border-white/8 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle>Conversations</SheetTitle>
                <SheetDescription>
                  Select a prior conversation or start a new chat.
                </SheetDescription>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleNewConversation}
              >
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingConversations ? (
              <div className="text-muted-foreground rounded-2xl border border-dashed border-white/10 p-4 text-sm">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-muted-foreground rounded-2xl border border-dashed border-white/10 p-4 text-sm">
                No conversation history yet.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        router.push(`/chat/${conversation.id}`);
                        setHistoryOpen(false);
                      }}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        isActive
                          ? "border-primary bg-primary/10"
                          : "bg-card hover:bg-card/80 border-white/8"
                      }`}
                    >
                      <p className="truncate text-sm font-medium">
                        {conversation.title}
                      </p>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {conversation.preview}
                      </p>
                      <p className="text-muted-foreground mt-2 text-[11px]">
                        {formatConversationTime(conversation.updatedAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>

        <header className="bg-background/95 supports-backdrop-filter:bg-background/80 flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-4 backdrop-blur sm:px-6">
          <Button
            size="icon"
            variant="outline"
            aria-label="Open conversation history"
            onClick={handleOpenConversationHistory}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium">Chat</p>
            <p className="text-muted-foreground text-xs">
              {activeConversation
                ? activeConversation.title
                : "New conversation"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="Start a new conversation"
              onClick={handleNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Close chat"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-screen-md flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {visibleMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-2xl">
                  <MessageSquareText className="h-7 w-7" />
                </div>
                <h1 className="mt-5 text-2xl font-semibold">
                  Start a conversation
                </h1>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                  Ask about your recent progress, goals, scores, or trends.
                </p>

                {isLoadingMessages ? (
                  <p className="text-muted-foreground mt-3 text-xs">
                    Loading messages...
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex min-w-0 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex max-w-[85%] min-w-0 flex-col gap-1">
                      <div
                        className={`min-w-0 overflow-hidden rounded-3xl px-4 py-3 text-sm shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-white/8"
                        }`}
                      >
                        {message.role === "assistant" &&
                        (message.kind || message.pending) ? (
                          <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-[0.16em] uppercase">
                            {message.pending ? "thinking" : message.kind}
                          </p>
                        ) : null}
                        {message.role === "assistant" ? (
                          <div className="min-w-0 space-y-3 overflow-x-auto">
                            {renderAssistantContent(message.content)}
                          </div>
                        ) : (
                          <p className="leading-6 whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>

                      <div
                        className={`flex gap-2 px-1 ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyMessage(message.content)}
                          className="h-6 w-6 p-0"
                          title="Copy message"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        {message.role === "user" && !message.pending && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetryMessage(message)}
                            className="h-6 w-6 p-0"
                            title="Retry message"
                            disabled={isSending}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-background/95 supports-backdrop-filter:bg-background/80 shrink-0 border-t border-white/8 px-4 py-4 backdrop-blur sm:px-6"
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask anything about your productivity data..."
              className="max-h-36 min-h-24 resize-none rounded-3xl"
              disabled={isSending}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                Press Enter to send, Shift+Enter for a new line.
              </p>

              <Button
                type="submit"
                disabled={isSending || draft.trim().length === 0}
              >
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </div>
      </Sheet>
    </main>
  );
}
