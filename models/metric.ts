// models/metric.ts

export type MetricValue = number | boolean | string;

export type MetricType = "number" | "boolean" | "time" | "time-range";

export type MetricCategory =
  "health" | "fitness" | "lifestyle" | "family" | "routine";

// ---------------- SCORING TYPES ----------------

export type ScoringType =
  "boolean" | "target" | "lookup" | "range" | "time-range";

// ---------------- SCORE DEFINITIONS ----------------

export interface LookupScore {
  value: string | number | boolean | "after";
  score: number;
}

export interface TimeRangeScore {
  from: string; // HH:mm
  to: string; // HH:mm
  score: number;
}

export interface RangeScore {
  min: number;
  max: number;
  score: number;
}

export interface ScoringDefinition {
  type: ScoringType;

  /**
   * Used for lookup scoring
   * Example:
   * Wake time:
   * 07:30 -> 10
   * 08:00 -> 8
   */
  values?: LookupScore[];
  time?: TimeRangeScore[];

  /**
   * Used for range scoring
   * Example:
   * Sleep:
   * 8-8.9 hours -> 10
   */
  ranges?: RangeScore[];
}

// ---------------- METRIC ----------------

export interface MetricDefinition {
  id: string;

  label: string;

  description?: string;

  category: MetricCategory;

  displayOrder: number;

  type: MetricType;

  unit?: string;

  /**
   * Initial value when creating today's form
   */
  defaultValue: MetricValue;

  /**
   * Goal target
   */
  target: MetricValue;

  /**
   * Contribution weight
   */
  weight: number;

  /**
   * Extra XP multiplier
   */
  bonusRate: number;

  scoring: ScoringDefinition;
}
