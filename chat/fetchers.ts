/**
 * Phase 2 - Fetchers
 *
 * Goal:
 * Build read-only data loaders for chat retrieval.
 * These should only fetch user-scoped data and never mutate anything.
 *
 * Data sources to use (server-side repositories, not HTTP calls):
 * - repositories/entry.server.repository.ts -> getEntries(uid)
 * - repositories/goals.server.repository.ts -> getGoals(uid)
 * - repositories/visualization.server.repository.ts -> getVisualizationDefinitions(uid)
 *
 * Rules:
 * 1) Production user scope must come from Firebase auth context.
 * 2) devUserId override is allowed only in non-production mode.
 * 3) Keep Firebase rules strict. Do not relax rules for testing.
 * 4) Read-only only. No create/update/delete calls.
 *
 * Suggested implementation types:
 *
 * type ChatDomain = "entries" | "goals" | "visualizations" | "settings" | "metrics" | "all";
 *
 * interface FetchPlan {
 *   effectiveUserId: string;
 *   domains: ChatDomain[];
 *   dateFrom: string; // YYYY-MM-DD
 *   dateTo: string; // YYYY-MM-DD
 *   defaultWindowDays: 84;
 * }
 *
 * interface RawFetchResult {
 *   entries: import("@/models/entry").DailyEntry[];
 *   goals: import("@/models/metric").MetricDefinition[];
 *   visualizations: import("@/models/visualization").VisualizationDefinition[];
 * }
 *
 * Suggested functions:
 * - resolveEffectiveUserId(authUid: string, devUserId?: string): string
 * - buildFetchPlan(message: string, filters: { domains?: ChatDomain | ChatDomain[]; dateFrom?: string; dateTo?: string }, effectiveUserId: string): FetchPlan
 *   - If filters.domains is missing, infer domains from message intent.
 *   - If intent is unclear, default to ["all"].
 *   - Validate date strings as YYYY-MM-DD.
 * - fetchEntries(plan: FetchPlan): Promise<DailyEntry[]>
 * - fetchGoals(plan: FetchPlan): Promise<MetricDefinition[]>
 * - fetchVisualizations(plan: FetchPlan): Promise<VisualizationDefinition[]>
 * - fetchRawDocuments(plan: FetchPlan): Promise<RawFetchResult>
 *
 * Sample input:
 * {
 *   authUid: "u_123",
 *   message: "How did my fitness goals trend this month?",
 *   filters: { domains: "all" }
 * }
 *
 * Sample output:
 * {
 *   entries: [ ...last 84 days entries... ],
 *   goals: [ ...goal definitions... ],
 *   visualizations: [ ...visualization definitions... ]
 * }
 */

import type { ChatDomainType } from "@/models/chat/chat-request";
import type { DailyEntry } from "@/models/entry";
import type { MetricCategory } from "@/models/metric";
import type { MetricDefinition } from "@/models/metric";
import type { VisualizationDefinition } from "@/models/visualization";
import type {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
} from "@/models/workout";
import { getEntries } from "@/repositories/entry.server.repository";
import { getCombinations } from "@/repositories/combinations.server.repository";
import { getExercises } from "@/repositories/exercises.server.repository";
import { getGoals } from "@/repositories/goals.server.repository";
import { getVisualizationDefinitions } from "@/repositories/visualization.server.repository";
import { getWorkouts } from "@/repositories/workouts.server.repository";
import { Keywords } from "./keywords";

const DEFAULT_WINDOW_DAYS = 84;

interface FetchPlan {
  effectiveUserId: string;
  domains: ChatDomainType[];
  dateFrom: string;
  dateTo: string;
  defaultWindowDays: number;
  metadataFilters: {
    goalIds?: string[];
    metricIds?: string[];
    categories?: string[];
    tags?: string[];
    minScore?: number;
    maxScore?: number;
  };
}

interface RawFetchResult {
  entries: DailyEntry[];
  goals: MetricDefinition[];
  visualizations: VisualizationDefinition[];
  workouts: WorkoutEntry[];
  exercises: ExerciseDefinition[];
  combinations: WorkoutCombination[];
}

export class Fetcher {
  keywords = new Keywords();

  private toYyyyMmDd(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private subtractDays(date: Date, days: number): Date {
    return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private extractDateRangeFromIntent(
    message: string,
  ): { dateFrom: string; dateTo: string } | null {
    const text = message.toLowerCase();
    const now = new Date();

    // Handle "this week vs last week" or "compare weeks"
    if (
      /\b(?:this|last|previous)\s+week|week\s+vs|weeks?\s+comparison\b/.test(
        text,
      )
    ) {
      // If it's comparing weeks, fetch 2 weeks of data (14 days)
      return {
        dateFrom: this.toYyyyMmDd(this.subtractDays(now, 14)),
        dateTo: this.toYyyyMmDd(now),
      };
    }

    const relativeWindow = text.match(
      /\b(?:last|past)\s+(\d+)\s+(day|days|week|weeks|month|months)\b/,
    );
    if (relativeWindow) {
      const amount = Number(relativeWindow[1]);
      const unit = relativeWindow[2];
      if (Number.isFinite(amount) && amount > 0) {
        const days = unit.startsWith("day")
          ? amount
          : unit.startsWith("week")
            ? amount * 7
            : amount * 30;

        return {
          dateFrom: this.toYyyyMmDd(this.subtractDays(now, days)),
          dateTo: this.toYyyyMmDd(now),
        };
      }
    }

    if (/\b(last|previous)\s+month\b/.test(text)) {
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const firstDayCurrentMonth = new Date(Date.UTC(year, month, 1));
      const firstDayLastMonth = new Date(Date.UTC(year, month - 1, 1));
      const lastDayLastMonth = new Date(
        firstDayCurrentMonth.getTime() - 24 * 60 * 60 * 1000,
      );

      return {
        dateFrom: this.toYyyyMmDd(firstDayLastMonth),
        dateTo: this.toYyyyMmDd(lastDayLastMonth),
      };
    }

    if (/\bthis\s+month\b/.test(text)) {
      const firstDayCurrentMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      return {
        dateFrom: this.toYyyyMmDd(firstDayCurrentMonth),
        dateTo: this.toYyyyMmDd(now),
      };
    }

    // "between X and Y" — must come before simple "today"/"yesterday" checks
    const betweenMatch = text.match(
      /\bbetween\s+(.+?)\s+and\s+(.+?)(?:\s*[?.,]|$)/,
    );
    if (betweenMatch) {
      const resolveDate = (str: string): Date | null => {
        const s = str.trim().toLowerCase();
        if (s === "today" || s === "now" || /\btoday\b/.test(s)) return now;
        if (s === "yesterday" || /\byesterday\b/.test(s))
          return this.subtractDays(now, 1);
        return this.parseNaturalDate(s, now);
      };
      const a = resolveDate(betweenMatch[1]);
      const b = resolveDate(betweenMatch[2]);
      if (a && b) {
        const [from, to] = a <= b ? [a, b] : [b, a];
        return { dateFrom: this.toYyyyMmDd(from), dateTo: this.toYyyyMmDd(to) };
      }
    }

    // "since X" / "from X" — parse start date, end is today
    const sinceMatch = text.match(/\b(?:since|from)\s+(.+?)(?:\s*[?.,]|$)/);
    if (sinceMatch) {
      const parsed = this.parseNaturalDate(sinceMatch[1].trim(), now);
      if (parsed) {
        return {
          dateFrom: this.toYyyyMmDd(parsed),
          dateTo: this.toYyyyMmDd(now),
        };
      }
    }

    // "till X" / "until X" / "up to X" — parse end date and use default
    // rolling window as the start boundary.
    const untilMatch = text.match(
      /\b(?:till|until|up\s+to|upto|through|thru|by)\s+(.+?)(?:\s*[?.,]|$)/,
    );
    if (untilMatch) {
      const parsed = this.parseNaturalDate(untilMatch[1].trim(), now);
      if (parsed) {
        const effectiveTo = parsed <= now ? parsed : now;
        return {
          dateFrom: this.toYyyyMmDd(
            this.subtractDays(effectiveTo, DEFAULT_WINDOW_DAYS - 1),
          ),
          dateTo: this.toYyyyMmDd(effectiveTo),
        };
      }
    }

    if (/\btoday\b/.test(text)) {
      // If both "today" and "yesterday" appear, return 2-day range
      if (/\byesterday\b/.test(text)) {
        return {
          dateFrom: this.toYyyyMmDd(this.subtractDays(now, 1)),
          dateTo: this.toYyyyMmDd(now),
        };
      }
      // If "today" + a specific date appear together, return range from that date to today
      const otherDate = this.parseNaturalDate(text, now);
      if (otherDate) {
        const todayStr = this.toYyyyMmDd(now);
        const otherStr = this.toYyyyMmDd(otherDate);
        if (otherStr !== todayStr) {
          const [from, to] =
            otherStr < todayStr ? [otherStr, todayStr] : [todayStr, otherStr];
          return { dateFrom: from, dateTo: to };
        }
      }
      const today = this.toYyyyMmDd(now);
      return { dateFrom: today, dateTo: today };
    }

    if (/\byesterday\b/.test(text)) {
      const yesterdayDate = this.subtractDays(now, 1);
      const yesterdayStr = this.toYyyyMmDd(yesterdayDate);
      // If yesterday + a specific date appear together, return range between them
      const otherDate = this.parseNaturalDate(text, now);
      if (otherDate) {
        const otherStr = this.toYyyyMmDd(otherDate);
        if (otherStr !== yesterdayStr) {
          const [from, to] =
            otherStr < yesterdayStr
              ? [otherStr, yesterdayStr]
              : [yesterdayStr, otherStr];
          return { dateFrom: from, dateTo: to };
        }
      }
      return { dateFrom: yesterdayStr, dateTo: yesterdayStr };
    }

    // Named weekday: "last monday", "this wednesday", "last friday"
    const weekdayMatch = text.match(
      /\b(last|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
    );
    if (weekdayMatch) {
      const parsed = this.parseNamedWeekday(
        weekdayMatch[1],
        weekdayMatch[2],
        now,
      );
      if (parsed) {
        return {
          dateFrom: this.toYyyyMmDd(parsed),
          dateTo: this.toYyyyMmDd(parsed),
        };
      }
    }

    // Specific dates: "1st august", "august 1st", "aug 1", "12th july", "july 12", "1 aug 2026", etc.
    const specificDate = this.parseNaturalDate(text, now);
    if (specificDate) {
      const today = this.toYyyyMmDd(now);
      const parsedStr = this.toYyyyMmDd(specificDate);
      const [from, to] =
        parsedStr <= today ? [parsedStr, today] : [today, parsedStr];
      return { dateFrom: from, dateTo: to };
    }

    return null;
  }

  private parseNaturalDate(text: string, now: Date): Date | null {
    const MONTHS: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };

    const t = text.toLowerCase().trim();

    // "1st august 2026", "august 1st 2026", "1 aug 2026"
    const withYear =
      t.match(
        /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/,
      ) ??
      t.match(
        /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})\b/,
      );

    if (withYear) {
      let day: number, monthStr: string, year: number;
      if (/^\d/.test(withYear[1])) {
        day = parseInt(withYear[1]);
        monthStr = withYear[2];
        year = parseInt(withYear[3]);
      } else {
        monthStr = withYear[1];
        day = parseInt(withYear[2]);
        year = parseInt(withYear[3]);
      }
      const month =
        MONTHS[
          monthStr
            .toLowerCase()
            .replace(/[^a-z]/g, "")
            .substring(0, 9)
        ];
      if (month !== undefined) {
        return new Date(Date.UTC(year, month, day));
      }
    }

    // "1st august", "august 1st", "aug 1", "1 aug"
    const noYear =
      t.match(
        /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/,
      ) ??
      t.match(
        /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
      );

    if (noYear) {
      let day: number, monthStr: string;
      if (/^\d/.test(noYear[1])) {
        day = parseInt(noYear[1]);
        monthStr = noYear[2];
      } else {
        monthStr = noYear[1];
        day = parseInt(noYear[2]);
      }
      const monthKey = monthStr
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .substring(0, 9);
      const month = MONTHS[monthKey];
      if (month !== undefined) {
        // Infer year: if the resulting date is in the future, use previous year
        const year = now.getUTCFullYear();
        const candidate = new Date(Date.UTC(year, month, day));
        if (candidate > now) {
          return new Date(Date.UTC(year - 1, month, day));
        }
        return candidate;
      }
    }

    return null;
  }

  private parseNamedWeekday(
    modifier: string,
    weekday: string,
    now: Date,
  ): Date | null {
    const DAYS: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const target = DAYS[weekday];
    if (target === undefined) return null;

    const currentDay = now.getUTCDay();
    let diff: number;

    if (modifier === "last") {
      diff =
        currentDay >= target ? currentDay - target : currentDay + 7 - target;
      if (diff === 0) diff = 7; // "last sunday" when today is sunday = 7 days ago
    } else {
      // "this"
      diff =
        currentDay >= target ? currentDay - target : currentDay + 7 - target;
    }

    return this.subtractDays(now, diff);
  }

  private hasKeywordMatch(text: string, keyword: string): boolean {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(text);
  }

  private inferDomainsFromMessage(message: string): ChatDomainType[] {
    const text = message.toLowerCase();
    const inferred = new Set<ChatDomainType>();

    const hasWeightTrainingCycleQuestion =
      /\b(weight\s+training)\b/.test(text) &&
      /\b(cycle|cycles)\b/.test(text) &&
      /\b(how\s+many|count|number\s+of)\b/.test(text);

    if (hasWeightTrainingCycleQuestion) {
      return ["entries", "goals", "visualizations"];
    }

    if (
      this.keywords.goalKeywords.some((keyword) =>
        this.hasKeywordMatch(text, keyword),
      )
    ) {
      inferred.add("goals");
    }

    if (
      this.keywords.visualizationKeywords.some((keyword) =>
        this.hasKeywordMatch(text, keyword),
      )
    ) {
      inferred.add("visualizations");
    }

    if (
      this.keywords.entryKeywords.some((keyword) =>
        this.hasKeywordMatch(text, keyword),
      )
    ) {
      inferred.add("entries");
    }

    if (
      this.keywords.workoutKeywords.some((keyword) =>
        this.hasKeywordMatch(text, keyword),
      )
    ) {
      inferred.add("workouts");
    }

    if (
      inferred.has("goals") ||
      inferred.has("visualizations") ||
      this.hasKeywordMatch(text, "trend") ||
      this.hasKeywordMatch(text, "compare") ||
      this.hasKeywordMatch(text, "weekly") ||
      this.hasKeywordMatch(text, "monthly")
    ) {
      inferred.add("entries");
    }

    if (inferred.size === 0) {
      return ["all"];
    }
    console.log("Inferred domains from message:", [...inferred]);
    return [...inferred];
  }

  private isValidDateString(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }

    return parsed.toISOString().slice(0, 10) === value;
  }

  private hasRequestedMetadataFilters(plan: FetchPlan): boolean {
    const metadataFilters = plan.metadataFilters;
    return Boolean(
      metadataFilters.goalIds?.length ||
      metadataFilters.metricIds?.length ||
      metadataFilters.categories?.length ||
      metadataFilters.tags?.length ||
      metadataFilters.minScore !== undefined ||
      metadataFilters.maxScore !== undefined,
    );
  }

  private includesAny(haystack: string[], needles: string[]): boolean {
    if (needles.length === 0) return true;
    const haystackSet = new Set(haystack.map((v) => v.toLowerCase()));
    return needles.some((needle) => haystackSet.has(needle.toLowerCase()));
  }

  private applyMetadataFilters(
    plan: FetchPlan,
    raw: RawFetchResult,
  ): RawFetchResult {
    if (!this.hasRequestedMetadataFilters(plan)) {
      return raw;
    }

    const metadataFilters = plan.metadataFilters;
    const requestedMetricIds = [
      ...(metadataFilters.metricIds ?? []),
      ...(metadataFilters.goalIds ?? []),
    ];
    const requestedCategories = metadataFilters.categories ?? [];
    const requestedTags = metadataFilters.tags ?? [];

    const filteredGoals = raw.goals.filter((goal) => {
      if (
        requestedMetricIds.length > 0 &&
        !requestedMetricIds.includes(goal.id)
      ) {
        return false;
      }

      if (
        requestedCategories.length > 0 &&
        !requestedCategories.some(
          (category) => category.toLowerCase() === goal.category.toLowerCase(),
        )
      ) {
        return false;
      }

      if (requestedTags.length > 0) {
        const goalTagSource = [
          goal.id,
          goal.label,
          goal.description ?? "",
          goal.category,
          goal.type,
        ];
        if (!this.includesAny(goalTagSource, requestedTags)) {
          return false;
        }
      }

      return true;
    });

    const goalById = raw.goals.reduce<Record<string, MetricDefinition>>(
      (acc, goal) => {
        acc[goal.id] = goal;
        return acc;
      },
      {},
    );

    const filteredEntries = raw.entries.filter((entry) => {
      const metricIdsInEntry = Object.keys(entry.values);

      if (
        requestedMetricIds.length > 0 &&
        !metricIdsInEntry.some((metricId) =>
          requestedMetricIds.includes(metricId),
        )
      ) {
        return false;
      }

      if (requestedCategories.length > 0) {
        const categoriesInEntry = metricIdsInEntry
          .map((metricId) => goalById[metricId]?.category)
          .filter(
            (category): category is MetricCategory => category !== undefined,
          );

        if (
          !requestedCategories.some((category) =>
            categoriesInEntry.some(
              (entryCategory) =>
                entryCategory.toLowerCase() === category.toLowerCase(),
            ),
          )
        ) {
          return false;
        }
      }

      if (requestedTags.length > 0) {
        const tagSource: string[] = [
          entry.date,
          String(entry.score ?? 0),
          String(entry.xp ?? 0),
          ...metricIdsInEntry,
          ...metricIdsInEntry.map(
            (metricId) => goalById[metricId]?.label ?? "",
          ),
        ];
        if (!this.includesAny(tagSource, requestedTags)) {
          return false;
        }
      }

      const score = entry.score ?? 0;
      if (
        metadataFilters.minScore !== undefined &&
        score < metadataFilters.minScore
      ) {
        return false;
      }

      if (
        metadataFilters.maxScore !== undefined &&
        score > metadataFilters.maxScore
      ) {
        return false;
      }

      return true;
    });

    const filteredVisualizations = raw.visualizations.filter((viz) => {
      if (
        requestedMetricIds.length > 0 &&
        !requestedMetricIds.includes(viz.key)
      ) {
        return false;
      }

      if (
        requestedCategories.length > 0 &&
        !requestedCategories.some(
          (category) =>
            category.toLowerCase() === viz.scope.toLowerCase() ||
            category.toLowerCase() === viz.provider.toLowerCase(),
        )
      ) {
        return false;
      }

      if (requestedTags.length > 0) {
        const vizTagSource = [
          viz.id,
          viz.title,
          viz.description ?? "",
          viz.key,
          viz.widget,
          viz.provider,
          viz.executor,
          viz.aggregation,
          viz.scope,
        ];
        if (!this.includesAny(vizTagSource, requestedTags)) {
          return false;
        }
      }

      return true;
    });

    return {
      entries: filteredEntries,
      goals: filteredGoals,
      visualizations: filteredVisualizations,
      workouts: raw.workouts,
      exercises: raw.exercises,
      combinations: raw.combinations,
    };
  }

  resolveEffectiveUserId(authUid: string, devUserId?: string): string {
    if (process.env.NODE_ENV === "production") {
      return authUid;
    }

    return devUserId || authUid;
  }

  buildFetchPlan(
    message: string,
    filters: {
      domains?: ChatDomainType | ChatDomainType[];
      dateFrom?: string;
      dateTo?: string;
      goalIds?: string[];
      metricIds?: string[];
      categories?: string[];
      tags?: string[];
      minScore?: number;
      maxScore?: number;
    } = {},
    effectiveUserId: string,
  ): FetchPlan {
    const explicitDomains = Array.isArray(filters.domains)
      ? filters.domains
      : filters.domains
        ? [filters.domains]
        : [];

    const domains =
      explicitDomains.length > 0
        ? explicitDomains
        : this.inferDomainsFromMessage(message);

    const now = new Date();
    const yyyyMmDd = this.toYyyyMmDd(now);
    const inferredRange = this.extractDateRangeFromIntent(message);
    console.log("Inferred date range from message:", inferredRange);
    const dateFrom =
      filters.dateFrom ||
      inferredRange?.dateFrom ||
      this.toYyyyMmDd(this.subtractDays(now, DEFAULT_WINDOW_DAYS));
    const dateTo = filters.dateTo || inferredRange?.dateTo || yyyyMmDd;

    if (!this.isValidDateString(dateFrom)) {
      throw new Error(
        `Invalid dateFrom format: ${dateFrom}. Expected YYYY-MM-DD.`,
      );
    }

    if (!this.isValidDateString(dateTo)) {
      throw new Error(`Invalid dateTo format: ${dateTo}. Expected YYYY-MM-DD.`);
    }

    if (dateFrom > dateTo) {
      throw new Error(
        `Invalid date range: dateFrom (${dateFrom}) cannot be after dateTo (${dateTo}).`,
      );
    }

    return {
      effectiveUserId,
      domains,
      dateFrom,
      dateTo,
      defaultWindowDays: DEFAULT_WINDOW_DAYS,
      metadataFilters: {
        goalIds: filters.goalIds,
        metricIds: filters.metricIds,
        categories: filters.categories,
        tags: filters.tags,
        minScore: filters.minScore,
        maxScore: filters.maxScore,
      },
    };
  }

  fetchEntries(plan: FetchPlan): Promise<DailyEntry[]> {
    return getEntries(plan.effectiveUserId, plan.dateTo, plan.dateFrom);
  }

  fetchGoals(plan: FetchPlan): Promise<MetricDefinition[]> {
    return getGoals(plan.effectiveUserId);
  }

  fetchVisualizations(plan: FetchPlan): Promise<VisualizationDefinition[]> {
    return getVisualizationDefinitions(plan.effectiveUserId);
  }

  async fetchWorkouts(plan: FetchPlan): Promise<WorkoutEntry[]> {
    const workouts = await getWorkouts(plan.effectiveUserId);

    return workouts.filter(
      (workout) => workout.date >= plan.dateFrom && workout.date <= plan.dateTo,
    );
  }

  fetchExercises(plan: FetchPlan): Promise<ExerciseDefinition[]> {
    return getExercises(plan.effectiveUserId, { includeInactive: true });
  }

  fetchCombinations(plan: FetchPlan): Promise<WorkoutCombination[]> {
    return getCombinations(plan.effectiveUserId, { includeInactive: true });
  }

  async fetchRawDocuments(plan: FetchPlan): Promise<RawFetchResult> {
    const includeAll = plan.domains.includes("all");

    const entriesPromise =
      includeAll || plan.domains.includes("entries")
        ? this.fetchEntries(plan)
        : Promise.resolve<DailyEntry[]>([]);

    const goalsPromise =
      includeAll ||
      plan.domains.includes("goals") ||
      plan.domains.includes("entries")
        ? this.fetchGoals(plan)
        : Promise.resolve<MetricDefinition[]>([]);

    const visualizationsPromise =
      includeAll || plan.domains.includes("visualizations")
        ? this.fetchVisualizations(plan)
        : Promise.resolve<VisualizationDefinition[]>([]);

    const workoutsPromise =
      includeAll || plan.domains.includes("workouts")
        ? this.fetchWorkouts(plan)
        : Promise.resolve<WorkoutEntry[]>([]);

    const exercisesPromise =
      includeAll || plan.domains.includes("workouts")
        ? this.fetchExercises(plan)
        : Promise.resolve<ExerciseDefinition[]>([]);

    const combinationsPromise =
      includeAll || plan.domains.includes("workouts")
        ? this.fetchCombinations(plan)
        : Promise.resolve<WorkoutCombination[]>([]);

    const [entries, goals, visualizations, workouts, exercises, combinations] =
      await Promise.all([
        entriesPromise,
        goalsPromise,
        visualizationsPromise,
        workoutsPromise,
        exercisesPromise,
        combinationsPromise,
      ]);

    return this.applyMetadataFilters(plan, {
      entries,
      goals,
      visualizations,
      workouts,
      exercises,
      combinations,
    });
  }
}
