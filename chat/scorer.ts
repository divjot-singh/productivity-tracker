/**
 * Phase 2 - Scorer
 *
 * Goal:
 * Rank normalized documents deterministically (no embeddings yet) and select top evidence.
 *
 * Baseline scoring formula (example):
 * finalScore = keywordOverlapScore + recencyBoost + domainBoost
 *
 * Suggested weights:
 * - keywordOverlapScore: 0..1 (normalized)
 * - recencyBoost: 0..0.3
 * - domainBoost: 0..0.2
 *
 * Evidence target:
 * - topK = 2 (current decision)
 */

import type { NormalizedDocument } from "./normalizers";

/**
 * Suggested types:
 */
export interface ScoredDocument {
  document: NormalizedDocument;
  score: number;
  breakdown: {
    keywordOverlapScore: number;
    recencyBoost: number;
    domainBoost: number;
  };
}

/**
 * Suggested functions:
 * - tokenizeMessage(message: string): string[]
 * - scoreDocument(messageTokens: string[], doc: NormalizedDocument, preferredDomains: string[]): ScoredDocument
 * - rankDocuments(message: string, docs: NormalizedDocument[], preferredDomains: string[]): ScoredDocument[]
 * - pickTopEvidence(scored: ScoredDocument[], topK: number): ScoredDocument[]
 *
 * Clarification thresholds (example):
 * - If top score < 0.35, treat as weak evidence -> ask clarification.
 * - If candidate count = 0, no evidence -> clarify then refuse if unresolved.
 *
 * Sample input:
 * message: "How did my fitness trend last month?"
 * docs: [normalized entry/goal/viz docs]
 * preferredDomains: ["entries", "visualizations"]
 *
 * Sample output:
 * [
 *   { document: { id: "2026-08-01", ... }, score: 0.74, breakdown: { keywordOverlapScore: 0.5, recencyBoost: 0.14, domainBoost: 0.1 } },
 *   { document: { id: "weekly-fitness-trend", ... }, score: 0.61, breakdown: { keywordOverlapScore: 0.42, recencyBoost: 0.09, domainBoost: 0.1 } }
 * ]
 */

export class Scorer {
  tokenizeMessage(message: string): string[] {
    // Simple tokenization: lowercase, split by non-word characters, filter out empty tokens
    return message
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 0);
  }

  scoreDocument(
    messageTokens: string[],
    doc: NormalizedDocument,
    preferredDomains: string[],
  ): ScoredDocument {
    const textTokens = this.tokenizeMessage(doc.text);
    const keywordTokens = this.tokenizeMessage(doc.keywords.join(" "));
    const tagsTokens = this.tokenizeMessage(doc.tags.join(" "));
    const docTokens = [...textTokens, ...keywordTokens, ...tagsTokens];
    const keywordOverlapScore = this.calculateKeywordOverlap(
      messageTokens,
      docTokens,
    );
    const recencyBoost = this.calculateRecencyBoost(doc.timestamp);
    const domainBoost = preferredDomains.includes(doc.domain) ? 0.2 : 0;

    const finalScore = keywordOverlapScore + recencyBoost + domainBoost;

    return {
      document: doc,
      score: finalScore,
      breakdown: {
        keywordOverlapScore,
        recencyBoost,
        domainBoost,
      },
    };
  }
  rankDocuments(
    message: string,
    docs: NormalizedDocument[],
    preferredDomains: string[],
  ): ScoredDocument[] {
    const messageTokens = this.tokenizeMessage(message);
    const scoredDocs = docs.map((doc) =>
      this.scoreDocument(messageTokens, doc, preferredDomains),
    );
    return scoredDocs.sort((a, b) => b.score - a.score);
  }

  pickTopEvidence(scored: ScoredDocument[], topK: number): ScoredDocument[] {
    // Separate by domain
    const entries = scored.filter((d) => d.document.domain === "entries");
    const goals = scored.filter((d) => d.document.domain === "goals");
    const others = scored.filter(
      (d) => d.document.domain !== "entries" && d.document.domain !== "goals",
    );

    // If there are entries, reserve at least 80% of slots for them
    if (entries.length > 0) {
      const entrySlots = Math.max(
        Math.ceil(topK * 0.8),
        Math.min(entries.length, topK - 1),
      );
      const remainingSlots = topK - entrySlots;

      const topEntries = entries.slice(0, entrySlots);
      const topOthers = [...goals, ...others]
        .sort((a, b) => b.score - a.score)
        .slice(0, remainingSlots);

      return [...topEntries, ...topOthers].sort((a, b) => b.score - a.score);
    }

    return scored.slice(0, topK);
  }

  private calculateKeywordOverlap(
    messageTokens: string[],
    docTokens: string[],
  ): number {
    const uniqueMessageTokens = [...new Set(messageTokens)];
    const overlapCount = uniqueMessageTokens.filter((token) =>
      docTokens.includes(token),
    ).length;
    if (uniqueMessageTokens.length === 0) return 0; // Avoid division by zero
    return overlapCount / uniqueMessageTokens.length; // Normalize by unique message token count
  }

  private calculateRecencyBoost(timestamp: string): number {
    const docDate = new Date(timestamp);
    const now = new Date();
    const daysDiff =
      (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 0) return 0; // Future dates should not get a boost
    if (daysDiff <= 7) return 0.3; // Within a week
    if (daysDiff <= 30) return 0.2; // Within a month
    if (daysDiff <= 90) return 0.1; // Within three months
    return 0; // Older than three months
  }
}
