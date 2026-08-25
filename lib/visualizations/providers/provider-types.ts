import { DailyEntry } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";
import { VisualizationDefinition } from "@/models/visualization";
import { EntryValue } from "@/models/entry";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
} from "@/models/workout";
import { WorkoutVisualizationMetricKeyUnion } from "@/lib/visualizations/exercise-keys";

export interface DataPoint {
  date: string;
}

export interface StatValuePoint extends DataPoint {
  value: number;
}

export interface MetricValuePoint extends DataPoint {
  value: EntryValue;

  score: number;

  weight: number;

  bonus: number;

  xp: number;
}

export interface CategoryValuePoint extends DataPoint {
  value: number;

  score: number;

  weight: number;

  percentage: number;

  bonus: number;

  xp: number;
}

export interface LeaderboardItem {
  id: string;

  label: string;

  value: number;

  score?: number;

  weight?: number;

  percentage?: number;

  unit?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   ENTRY                                    */
/* -------------------------------------------------------------------------- */

export interface StatProviderData {
  values: StatValuePoint[];

  valueKind?: "number" | "boolean" | "time";

  unit?: string;

  label?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   METRIC                                   */
/* -------------------------------------------------------------------------- */

export interface MetricHistoryData {
  id: string;

  label: string;

  category: string;

  target: EntryValue;

  valueKind?: "number" | "boolean" | "time";

  unit?: string;

  values: MetricValuePoint[];
}

/* -------------------------------------------------------------------------- */
/*                                    GOAL                                    */
/* -------------------------------------------------------------------------- */

export interface GoalProviderData {
  id: string;

  label: string;

  category: string;

  target: EntryValue;

  valueKind?: "number" | "boolean" | "time";

  unit?: string;

  values: MetricValuePoint[];
}

/* -------------------------------------------------------------------------- */
/*                                  CATEGORY                                  */
/* -------------------------------------------------------------------------- */

export interface CategoryProviderData {
  id: string;

  label: string;

  values: CategoryValuePoint[];

  items?: LeaderboardItem[];
}

/* -------------------------------------------------------------------------- */
/*                                  EXERCISE                                  */
/* -------------------------------------------------------------------------- */

export interface ExerciseHistoryData {
  id: string;

  label: string;

  metric: WorkoutVisualizationMetricKeyUnion;

  target?: number | null;

  valueKind: "number";

  unit?: string;

  values: StatValuePoint[];
}

export interface ProviderContext {
  visualization: VisualizationDefinition;

  goals: MetricDefinition[];

  entries: DailyEntry[];

  exercises: ExerciseDefinition[];

  combinations: WorkoutCombination[];

  workouts: WorkoutEntry[];
}

export interface VisualizationProvider<T> {
  getData(context: ProviderContext): Promise<T>;
}
