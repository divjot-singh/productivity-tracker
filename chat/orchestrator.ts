/*
Orchestrator contract:

Input:
- message: string
- filters?: ChatRequestFilters
- authUid: string
- devUserId?: string (non-production only)
- modelProvider(prompt) => Promise<string>

Output:
- final ChatResponse (draft + messageId + conversationId attached)

Pipeline sequence:
1) Resolve effective user id via Fetcher.resolveEffectiveUserId(authUid, devUserId).
2) Build fetch plan via Fetcher.buildFetchPlan(message, filters, effectiveUserId).
3) Fetch raw docs via Fetcher.fetchRawDocuments(plan).
4) Normalize all docs via Normalizer.normalizeAll(effectiveUserId, raw).
5) Score and rank via Scorer.rankDocuments(message, normalizedDocs, preferredDomains).
6) Pick top evidence via Scorer.pickTopEvidence(..., topK).
7) Decide policy via Hitl.decideHitl(message, candidateCount, topScore).
8) Generate draft via AnswerGenerator.generateChatResponse(...).
9) Attach messageId/conversationId via withChatResponseBase(...).
10) Return final ChatResponse.

Error behavior:
- Throw typed errors for validation/auth/policy/internal so route can map to standard HTTP codes.
*/

import type { ChatRequestFilters } from "@/models/chat/chat-request";
import type { ChatResponseDraft } from "@/models/chat/chat-response";
import type { DailyEntry } from "@/models/entry";
import type { MetricDefinition } from "@/models/metric";
import { Fetcher } from "./fetchers";
import { AnswerGenerator } from "./answer-generator";
import { Normalizer } from "./normalizers";
import { Scorer } from "./scorer";
import { Hitl } from "./hitl";
import { parseDeterministicIntent } from "./intents/parser";
import { createResolverHelpers } from "./resolvers/helpers";
import { createDeterministicResolverRegistry } from "./resolvers/registry";
import type { ResolverRegistry } from "./resolvers/types";

const TOP_K_EVIDENCE = 20; // number of top evidence docs to consider for answer generation

export class Orchestrator {
  private readonly resolverRegistry: ResolverRegistry;

  constructor() {
    this.resolverRegistry = createDeterministicResolverRegistry(
      createResolverHelpers(),
    );
  }

  private defaultModelProvider = async (): Promise<string> => {
    return "I found relevant evidence. Please review the cited snippets below.";
  };

  private resolveDeterministicByIntent(
    userId: string,
    message: string,
    dateFrom: string,
    dateTo: string,
    entries: DailyEntry[],
    goals: MetricDefinition[],
  ): ChatResponseDraft | null {
    const intent = parseDeterministicIntent(message);
    const resolver = this.resolverRegistry[intent];
    if (!resolver) {
      return null;
    }

    return resolver({
      userId,
      now: new Date(),
      message,
      dateFrom,
      dateTo,
      entries,
      goals,
    });
  }

  async orchestrate({
    message,
    filters,
    authUid,
    devUserId,
    modelProvider,
    conversationContext,
  }: {
    message: string;
    filters?: ChatRequestFilters;
    authUid: string;
    devUserId?: string;
    modelProvider?: (prompt: string) => Promise<string>;
    conversationContext?: string;
  }): Promise<ChatResponseDraft> {
    if (!message) {
      throw new Error("Message is required");
    }
    const fetcher = new Fetcher();
    const normalizer = new Normalizer();
    const scorer = new Scorer();
    const hitl = new Hitl();
    const answerGenerator = new AnswerGenerator();
    const userId = fetcher.resolveEffectiveUserId(authUid, devUserId);
    const fetchPlan = fetcher.buildFetchPlan(message, filters, userId);
    const rawDocs = await fetcher.fetchRawDocuments(fetchPlan);
    const goalsForDeterministic =
      rawDocs.goals.length > 0
        ? rawDocs.goals
        : await fetcher.fetchGoals(fetchPlan);

    const intentRoutedDeterministicResponse = this.resolveDeterministicByIntent(
      userId,
      message,
      fetchPlan.dateFrom,
      fetchPlan.dateTo,
      rawDocs.entries,
      goalsForDeterministic,
    );
    if (intentRoutedDeterministicResponse) {
      return intentRoutedDeterministicResponse;
    }

    const normalizedDocs = await normalizer.normalizeAll(userId, rawDocs);
    const rankedDocs = scorer.rankDocuments(
      message,
      normalizedDocs,
      fetchPlan.domains,
    );

    const topEvidence = scorer.pickTopEvidence(rankedDocs, TOP_K_EVIDENCE);
    const topDocs = topEvidence.map((item) => ({
      ...item.document,
      score: item.score,
    }));
    const candidateCount = topEvidence.length;
    const topScore = topEvidence[0]?.score || 0;
    const hitlDecision = hitl.decideHitl(message, candidateCount, topScore);

    // Log fetch/normalize/rank pipeline
    console.log("\n=== ORCHESTRATOR PIPELINE ===");
    console.log("User Message:", message);
    console.log("Fetch Plan:", {
      domains: fetchPlan.domains,
      dateFrom: fetchPlan.dateFrom,
      dateTo: fetchPlan.dateTo,
    });
    console.log("Raw Documents Fetched:", {
      entries: rawDocs.entries.length,
      goals: rawDocs.goals.length,
    });
    console.log("Normalized Documents:", normalizedDocs.length);
    console.log("Ranked Documents:", rankedDocs.length);
    console.log("Top Evidence Selected:", {
      count: topDocs.length,
      topScore: topScore.toFixed(4),
      hitlDecision: hitlDecision.kind,
    });
    console.log("=== END ORCHESTRATOR PIPELINE ===\n");

    const provider = modelProvider ?? this.defaultModelProvider;
    const draftResponse = await answerGenerator.generateChatResponse({
      message,
      topDocs,
      hitlDecision,
      modelProvider: provider,
      conversationContext,
    });
    return {
      ...draftResponse,
    };
  }
}
