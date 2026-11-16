import type { DailyEntry, MetricScoreBreakdown } from "@/models/entry";

const round1 = (n: number) => Math.round(n * 10) / 10;

export function deriveMaxScore(
  breakdown: MetricScoreBreakdown[] | undefined,
): number | undefined {
  if (!Array.isArray(breakdown) || breakdown.length === 0) return undefined;

  return breakdown.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
}

export function computeScorePercent(
  score: number | undefined,
  maxScore: number | undefined,
): number | undefined {
  if (score === undefined || !maxScore) return undefined;

  return round1((score / maxScore) * 100);
}

// Legacy entries lack maxScore/scorePercent; the stored breakdown holds each day's own weights.
export function mapEntry(raw: Record<string, unknown>, id?: string): DailyEntry {
  const entry = raw as unknown as DailyEntry;

  const maxScore =
    typeof entry.maxScore === "number"
      ? entry.maxScore
      : deriveMaxScore(entry.breakdown);

  const scorePercent =
    typeof entry.scorePercent === "number"
      ? entry.scorePercent
      : computeScorePercent(entry.score, maxScore);

  return {
    ...entry,
    id: id ?? entry.id,
    values: entry.values ?? {},
    maxScore,
    scorePercent,
  };
}
