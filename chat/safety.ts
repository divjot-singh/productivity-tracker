import { ChatApiError } from "@/models/chat/chat-error";

export const CHAT_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 20,
};

const rateLimitBuckets = new Map<string, number[]>();

const chatMetrics = {
  totalRequests: 0,
  successfulResponses: 0,
  failedRequests: 0,
  unauthorizedRequests: 0,
  validationErrors: 0,
  forbiddenRequests: 0,
  rateLimitedRequests: 0,
  clarificationResponses: 0,
  refusalResponses: 0,
  totalLatencyMs: 0,
  latencySamples: 0,
};

const unsafePromptPatterns = [
  /ignore\s+(all|previous|prior|system|developer)\s+instructions/i,
  /reveal\s+(the\s+)?(system|developer|hidden)\s+prompt/i,
  /act\s+as\s+(an?\s+)?(admin|developer|system|root)/i,
  /dump\s+(all|every|entire)\s+(data|records|entries|logs|database)/i,
  /<\s*system\s*>/i,
  /<\s*developer\s*>/i,
  /override\s+(the\s+)?(system|developer)\s+instructions/i,
  /bypass\s+(the\s+)?(rules|policy|guardrails)/i,
  /show\s+me\s+your\s+(system|internal)\s+instructions/i,
];

export function getRequestId(): string {
  return crypto.randomUUID();
}

export function enforceUserRateLimit(userId: string): void {
  const now = Date.now();
  const existing = rateLimitBuckets.get(userId) ?? [];
  const recent = existing.filter(
    (timestamp) => now - timestamp < CHAT_RATE_LIMIT.windowMs,
  );

  recent.push(now);
  rateLimitBuckets.set(userId, recent);

  if (recent.length > CHAT_RATE_LIMIT.maxRequests) {
    throw new ChatApiError(
      429,
      "rate_limited",
      "Rate limit exceeded. Please wait a moment before sending another request.",
      `User exceeded ${CHAT_RATE_LIMIT.maxRequests} requests in ${CHAT_RATE_LIMIT.windowMs}ms`,
    );
  }
}

export function detectPromptInjection(message: string): string | null {
  const trimmed = message.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > 2_000) {
    return "Message exceeds the maximum supported length.";
  }

  for (const pattern of unsafePromptPatterns) {
    if (pattern.test(trimmed)) {
      return "Request appears to attempt prompt override or data exfiltration.";
    }
  }

  return null;
}

export function logChatEvent(
  event: string,
  details: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      ...details,
    }),
  );
}

export function recordChatMetric(
  metric: keyof typeof chatMetrics,
  value: number = 1,
): void {
  if (metric === "totalLatencyMs" || metric === "latencySamples") {
    chatMetrics[metric] += value;
    return;
  }

  chatMetrics[metric] += value;
}

export function recordChatLatency(ms: number): void {
  chatMetrics.totalLatencyMs += ms;
  chatMetrics.latencySamples += 1;
}

export function getChatMetrics(): Record<string, number> {
  const snapshot = { ...chatMetrics };

  return {
    ...snapshot,
    averageLatencyMs:
      snapshot.latencySamples > 0
        ? Math.round(snapshot.totalLatencyMs / snapshot.latencySamples)
        : 0,
  };
}

export function resetChatMetrics(): void {
  Object.keys(chatMetrics).forEach((key) => {
    const metricKey = key as keyof typeof chatMetrics;
    chatMetrics[metricKey] = 0;
  });
  rateLimitBuckets.clear();
}
