import type { ChatResponseDraft } from "@/models/chat/chat-response";
import type { DailyEntry } from "@/models/entry";
import type { MetricDefinition } from "@/models/metric";
import type { DeterministicIntent } from "../intents/types";

export interface DateRange {
  from: string;
  to: string;
  entries: DailyEntry[];
}

export interface ResolverContext {
  userId: string;
  now: Date;
  message: string;
  dateFrom: string;
  dateTo: string;
  entries: DailyEntry[];
  goals: MetricDefinition[];
}

export type DeterministicResolver = (
  context: ResolverContext,
) => ChatResponseDraft | null;

export interface ResolverHelpers {
  computeEntryGoalCompletion: (
    entry: DailyEntry,
    goal: MetricDefinition,
  ) => number | null;
  getLastNDaysEntries: (entries: DailyEntry[], days: number) => DateRange;
  parseDate: (value: string) => Date;
  subtractDays: (date: Date, days: number) => Date;
  formatYyyyMmDd: (date: Date) => string;
  filterEntriesByDateRange: (
    entries: DailyEntry[],
    from: string,
    to: string,
  ) => DailyEntry[];
  average: (values: number[]) => number;
  buildMetricDelta: (
    entries: DailyEntry[],
    goals: MetricDefinition[],
  ) => Array<{
    goal: MetricDefinition;
    before: number;
    after: number;
    delta: number;
  }>;
  buildEntryEvidence: (
    uid: string,
    entries: DailyEntry[],
    limit?: number,
  ) => Array<{
    id: string;
    source: string;
    timestamp: string;
    snippet: string;
  }>;
  getAnchorDate: (entries: DailyEntry[]) => Date;
}

export type ResolverRegistry = Partial<
  Record<DeterministicIntent, DeterministicResolver>
>;
