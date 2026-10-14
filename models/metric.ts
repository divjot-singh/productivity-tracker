// models/metric.ts

import { Date } from "firebase/ai";

export type MetricValue = number | boolean | string;

export type MetricType = "number" | "boolean" | "time";

export type GoalStatus = "active" | "archived";

export type MetricCategory =
  "health" | "fitness" | "lifestyle" | "family" | "routine" | "custom";

// ---------------- SCORING TYPES ----------------

export type ScoringType =
  "boolean" | "goal" | "options" | "range" | "time-range" | "multiplier";

// ---------------- SCORE DEFINITIONS ----------------

export interface OptionScore {
  value: string | number | boolean;
  label: string;
  multiplier: number;
}

export interface TimeRangeScore {
  from: string; // HH:mm
  to: string; // HH:mm
  multiplier: number;
}

export interface RangeScore {
  min: number;
  max: number;
  multiplier: number;
}

export interface ScoringDefinition {
  type: ScoringType;

  options?: OptionScore[];

  ranges?: RangeScore[];

  time?: TimeRangeScore[];

  multiplier?: number;

  bonusRate?: number;
  maxScore?: number;
}

// ---------------- METRIC ----------------

export interface MetricDefinition {
  id: string;

  label: string;
  icon: string;

  description?: string;
  scoringExplanation?: string;

  category: MetricCategory;

  displayOrder: number;

  type: MetricType;

  unit?: string;

  defaultValue: MetricValue;

  target: MetricValue;

  weight: number;

  scoring: ScoringDefinition;

  /**
   * Whether the goal is a protected seed/core goal that cannot be deleted.
   */
  isProtected?: boolean;

  /** Missing on legacy documents; mappers read it as "active". */
  status?: GoalStatus;

  /** ISO date (YYYY-MM-DD) of the last day the goal was scored. */
  archivedAt?: string;

  /** Weight before archiving; offered as a suggestion on reactivation. */
  previousWeight?: number;

  schemaVersion?: number;

  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Config {
  metrics: MetricDefinition[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
