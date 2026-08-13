/**
 * Phase 2 - Answer generation with evidence
 *
 * Goal:
 * Compose a grounded answer from top evidence.
 * Must follow policy: no evidence -> no answer.
 *
 * Inputs:
 * - user message
 * - top scored evidence documents (topK=2)
 * - hitl decision (answer / clarify / refuse)
 *
 * Outputs:
 * - ChatResponseSuccess or ChatResponseClarification or ChatResponseRefusal
 *
 * Suggested flow:
 * 1) If hitl decision is refuse -> return refusal response immediately.
 * 2) If hitl decision is clarify -> return clarification response immediately.
 * 3) If answer path but evidence array is empty -> return refusal or clarification per policy.
 * 4) Build prompt context strictly from evidence snippets.
 * 5) Generate answer using model/provider.
 * 6) Return answer + evidence citations + confidence.
 *
 * Prompt composition guidance:
 * - System instruction: "Answer only from provided evidence. If insufficient evidence, do not infer."
 * - Include each evidence item as:
 *   [sourcePath | timestamp]
 *   snippet
 *
 * Suggested helpers:
 * - buildEvidenceCitations(topDocs)
 * - buildGroundedPrompt(message, citations)
 * - mapModelOutputToConfidence(output, topScore)
 * - generateChatResponse({...})
 *
 * Sample input:
 * {
 *   message: "Which metric dropped most in the last month?",
 *   topEvidence: [
 *     { id: "2026-08-01", sourcePath: "users/u_1/entries/2026-08-01", snippet: "..." },
 *     { id: "2026-08-02", sourcePath: "users/u_1/entries/2026-08-02", snippet: "..." }
 *   ],
 *   hitlDecision: { kind: "answer" }
 * }
 *
 * Sample output (success):
 * {
 *   messageId: "msg_abc",
 *   conversation_id: "conv_123",
 *   answer: "Your cardioMinutes trend declined the most over the last month.",
 *   evidence: [
 *     { id: "2026-08-01", source: "users/u_1/entries/2026-08-01", timestamp: "2026-08-01", snippet: "cardioMinutes: 35" },
 *     { id: "2026-08-28", source: "users/u_1/entries/2026-08-28", timestamp: "2026-08-28", snippet: "cardioMinutes: 10" }
 *   ],
 *   confidence: "medium"
 * }
 *
 * Sample output (clarification):
 * {
 *   messageId: "msg_def",
 *   conversation_id: "conv_123",
 *   clarification_question: "Do you want progress for goals, entries, or both?",
 *   follow_up_required: true
 * }
 *
 * Sample output (refusal):
 * {
 *   messageId: "msg_xyz",
 *   conversation_id: "conv_123",
 *   refusal_reason: "I can only provide read-only insights from your own data."
 * }
 */

import type {
  ChatResponseDraft,
  HitlDecision,
} from "@/models/chat/chat-response";

import { NormalizedDocument } from "./normalizers";

export class AnswerGenerator {
  buildEvidenceCitations(topDocs: NormalizedDocument[]): string {
    return topDocs
      .map((doc) => `[${doc.sourcePath} | ${doc.timestamp}]\n${doc.text}`)
      .join("\n\n");
  }
  buildGroundedPrompt(
    message: string,
    citations: string,
    conversationContext?: string,
  ): string {
    const today = new Date().toISOString().split("T")[0];
    return `You are an AI assistant that answers questions based only on the provided evidence. Do not infer or fabricate information. If the evidence is insufficient, respond with "Insufficient evidence to answer."
        Today's date is ${today}.
        Format the answer as clean Markdown:
        - Use short section headings when useful.
        - Use bullet lists for multiple items.
        - Use Markdown tables for ranked/compare outputs.
        - Bold important labels and values.
        - Never expose raw internal metric IDs when a human-readable goal label exists in evidence.
        ${
          conversationContext
            ? `
        Conversation Context:
            ${conversationContext}
        `
            : ""
        }
        
        Evidence:
            ${citations}

        User Question:
            ${message}

        Answer:`;
  }
  mapModelOutputToConfidence(
    output: string,
    topScore: number,
  ): "high" | "medium" | "low" {
    if (topScore >= 0.7) return "high";
    if (topScore >= 0.4) return "medium";
    return "low";
  }
  async generateChatResponse({
    message,
    topDocs,
    hitlDecision,
    modelProvider,
    conversationContext,
  }: {
    message: string;
    topDocs: Array<NormalizedDocument & { score?: number }>;
    hitlDecision: HitlDecision;
    modelProvider: (prompt: string) => Promise<string>;
    conversationContext?: string;
  }): Promise<ChatResponseDraft> {
    if (hitlDecision.kind === "refuse") {
      return {
        refusalReason:
          hitlDecision.payload?.refusalReason ||
          "I can only provide read-only insights from your own data.",
      };
    }
    if (hitlDecision.kind === "clarify") {
      return {
        clarificationQuestion:
          hitlDecision.payload?.clarificationQuestion ||
          "Could you please clarify your question?",
        followUpRequired: true,
      };
    }
    if (topDocs.length === 0) {
      return {
        refusalReason:
          "Insufficient evidence to answer your question. Please provide more context or clarify.",
      };
    }

    const topScore = Math.max(...topDocs.map((doc) => doc.score ?? 0));
    if (topScore < 0.25 || topDocs.length < 2) {
      return {
        refusalReason:
          "I don’t have enough relevant evidence to answer that confidently. Please provide more specific context or narrow the timeframe.",
      };
    }

    const citations = this.buildEvidenceCitations(topDocs);
    const prompt = this.buildGroundedPrompt(
      message,
      citations,
      conversationContext,
    );

    // Log all context passed to the model
    console.log("\n=== CHAT CONTEXT SENT TO MODEL ===");
    console.log("User Message:", message);
    console.log("\nConversation Context:", conversationContext || "None");
    console.log("\nTop Evidence Documents:", {
      count: topDocs.length,
      docs: topDocs.map((doc) => ({
        id: doc.id,
        sourcePath: doc.sourcePath,
        timestamp: doc.timestamp,
        score: doc.score,
        snippet: doc.text.substring(0, 200), // First 200 chars
      })),
    });
    console.log("\nFull Prompt Sent to Model:");
    console.log("---START PROMPT---");
    console.log(prompt);
    console.log("---END PROMPT---\n");

    const modelOutput = await modelProvider(prompt);

    console.log("\nModel Response:");
    console.log(modelOutput);
    console.log("=== END CHAT CONTEXT ===\n");

    const confidence = this.mapModelOutputToConfidence(modelOutput, topScore);

    return {
      answer: modelOutput,
      evidence: topDocs.map((doc) => ({
        id: doc.id,
        source: doc.sourcePath,
        timestamp: doc.timestamp,
        snippet: doc.text,
      })),
      confidence,
    };
  }
}
