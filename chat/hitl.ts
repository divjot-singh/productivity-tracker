/**
 * Phase 2 - HITL (Human-in-the-loop) and policy gating
 *
 * Goal:
 * Decide whether to answer, ask clarification, or refuse.
 *
 * Policy requirements:
 * - Read-only assistant (no create/update/delete actions).
 * - No cross-user access.
 * - No evidence -> no answer.
 * - Ambiguous/low-confidence query -> ask follow-up clarification first.
 *
 * Suggested types:
 *
 * interface ClarificationResult {
 *   clarificationQuestion: string;
 *   followUpRequired: true;
 * }
 *
 * interface RefusalResult {
 *   refusalReason: string;
 * }
 *
 * type HitlDecision =
 *   | { kind: "answer" }
 *   | { kind: "clarify"; payload: ClarificationResult }
 *   | { kind: "refuse"; payload: RefusalResult };
 *
 * Suggested functions:
 * - detectActionIntent(message: string): boolean
 * - detectCrossUserIntent(message: string): boolean
 * - detectAmbiguousIntent(message: string): boolean
 * - shouldClarify(candidateCount: number, topScore: number): boolean
 * - decideHitl(message: string, candidateCount: number, topScore: number): HitlDecision
 *
 * Example decisions:
 * 1) "Delete yesterday entry" -> refuse
 * 2) "Show another user's logs" -> refuse
 * 3) "How am I doing?" with weak evidence -> clarify
 * 4) Specific question + good evidence -> answer
 */

import type { HitlDecision } from "@/models/chat/chat-response";

export class Hitl {
  private isHistoricalReadOnlyQuery(message: string): boolean {
    const text = message.toLowerCase();

    return (
      /\b(did i|have i|what did i|which .* did i)\b/.test(text) &&
      /\b(create|created|add|added|submit|submitted|update|updated|remove|removed|delete|deleted)\b/.test(
        text,
      )
    );
  }

  detectActionIntent(message: string): boolean {
    const text = message.toLowerCase();

    if (this.isHistoricalReadOnlyQuery(text)) {
      return false;
    }

    const mutationCommandPatterns = [
      /\b(delete|remove)\b.*\b(entry|goal|log|record)\b/,
      /\b(update|edit|change)\b.*\b(entry|goal|log|record|score|xp)\b/,
      /\b(create|add)\b.*\b(entry|goal|log|record)\b/,
      /\b(mark|set)\b.*\b(done|complete|completed)\b/,
      /\b(add|create|log|save)\b.*\b(workout|exercise|set|combination)\b/,
      /\b(update|edit|change|remove|delete)\b.*\b(workout|exercise|set|combination)\b/,
    ];

    return mutationCommandPatterns.some((pattern) => pattern.test(text));
  }

  detectCrossUserIntent(message: string): boolean {
    const text = message.toLowerCase();

    const crossUserPatterns = [
      /another\s+user['’]s?\s+(logs?|entries?|history|data)/i,
      /someone\s+else['’]s?\s+(logs?|entries?|history|data)/i,
      /other\s+user['’]s?\s+(logs?|entries?|history|data)/i,
      /show\s+([a-z0-9_-]+)['’]s?\s+(logs?|entries?|history|data)/i,
      /give\s+me\s+([a-z0-9_-]+)['’]s?\s+(logs?|entries?|history|data)/i,
      /view\s+([a-z0-9_-]+)['’]s?\s+(logs?|entries?|history|data)/i,
      /what\s+did\s+([a-z0-9_-]+)\s+do/i,
      /user\s+id\s*[:=]/i,
      /malvika['’]s\s+(logs?|entries?|history|data)/i,
    ];

    return crossUserPatterns.some((pattern) => pattern.test(text));
  }

  detectPromptInjectionIntent(message: string): boolean {
    const text = message.toLowerCase();

    const injectionPatterns = [
      /ignore\s+(all|previous|prior|system|developer)\s+instructions/i,
      /reveal\s+(the\s+)?(system|developer|hidden)\s+prompt/i,
      /act\s+as\s+(an?\s+)?(admin|developer|system|root)/i,
      /dump\s+(all|every|entire)\s+(data|records|entries|logs|database)/i,
      /override\s+(the\s+)?(system|developer)\s+instructions/i,
      /bypass\s+(the\s+)?(rules|policy|guardrails)/i,
      /show\s+me\s+your\s+(system|internal)\s+instructions/i,
      /<\s*(system|developer)\s*>/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(text));
  }

  detectAmbiguousIntent(message: string): boolean {
    // Simple heuristic: check for vague terms like "how am I doing" or "what's up"
    const ambiguousKeywords = ["how am I doing", "what's up", "tell me about"];
    return ambiguousKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    );
  }

  shouldClarify(candidateCount: number, topScore: number): boolean {
    // Clarify if no candidates or top score is below threshold
    return candidateCount === 0 || topScore < 0.35;
  }

  decideHitl(
    message: string,
    candidateCount: number,
    topScore: number,
  ): HitlDecision {
    if (this.detectActionIntent(message)) {
      return {
        kind: "refuse",
        payload: { refusalReason: "Action requests are not allowed." },
      };
    }
    if (this.detectPromptInjectionIntent(message)) {
      return {
        kind: "refuse",
        payload: {
          refusalReason:
            "Request appears to attempt prompt override or data exfiltration.",
        },
      };
    }
    if (this.detectCrossUserIntent(message)) {
      return {
        kind: "refuse",
        payload: { refusalReason: "Cross-user access is not permitted." },
      };
    }
    if (candidateCount === 0) {
      return {
        kind: "refuse",
        payload: {
          refusalReason: "No evidence found to answer your question.",
        },
      };
    }
    if (this.shouldClarify(candidateCount, topScore)) {
      return {
        kind: "clarify",
        payload: {
          clarificationQuestion:
            "Could you please clarify your request? I need  more specific information to provide an accurate answer.",
          followUpRequired: true,
        },
      };
    }
    return { kind: "answer" };
  }
}
