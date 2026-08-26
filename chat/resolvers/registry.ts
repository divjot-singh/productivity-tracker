import type { ResolverHelpers, ResolverRegistry } from "./types";
import { createCurrentGoalStatusResolver } from "./handlers/current-goal-status";
import { createEntryOutcomesResolver } from "./handlers/entry-outcomes";
import { createFamilyHealthGoalsEnabledResolver } from "./handlers/family-health-goals-enabled";
import { createFourWeekTrendResolver } from "./handlers/four-week-trend";
import { createFrequentThemesTagsResolver } from "./handlers/frequent-themes-tags";
import { createHighestProductivityDayResolver } from "./handlers/highest-productivity-day";
import {
  clarifyFocusNextResolver,
  clarifyLessProductiveResolver,
  clarifyRecentlyResolver,
  clarifyShowProgressResolver,
} from "./handlers/clarifications";
import { createMetricMostDeclinedResolver } from "./handlers/metric-most-declined";
import { createMetricMostImprovedResolver } from "./handlers/metric-most-improved";
import { createMostProductiveTimePeriodsResolver } from "./handlers/most-productive-time-periods";
import {
  createRecurringHighPatternsResolver,
  createRecurringLowPatternsResolver,
} from "./handlers/recurring-patterns";
import { createShortWeeklyReviewResolver } from "./handlers/short-weekly-review";
import { createTopGoalsProgressResolver } from "./handlers/top-goals-progress";
import { createWeekComparisonResolver } from "./handlers/week-comparison";
import { createWeekVsLastWeekEntriesResolver } from "./handlers/week-vs-last-week-entries";
import { createWorkoutAnalyticsResolver } from "./handlers/workout-analytics";
import { createWorkoutBestPerformanceResolver } from "./handlers/workout-best-performance";
import { createWorkoutHistoryResolver } from "./handlers/workout-history";
import { createWorkoutProgressResolver } from "./handlers/workout-progress";
import { createWorkoutTargetProgressResolver } from "./handlers/workout-target-progress";
import { createWorkoutRemainingExercisesResolver } from "./handlers/workout-remaining-exercises";

export function createDeterministicResolverRegistry(
  helpers: ResolverHelpers,
): ResolverRegistry {
  return {
    top_goals_progress: createTopGoalsProgressResolver(helpers),
    entry_outcomes: createEntryOutcomesResolver(helpers),
    current_goal_status: createCurrentGoalStatusResolver(helpers),
    week_highest_productivity_day:
      createHighestProductivityDayResolver(helpers),
    week_vs_last_week_entries: createWeekVsLastWeekEntriesResolver(helpers),
    four_week_trend: createFourWeekTrendResolver(helpers),
    week_comparison: createWeekComparisonResolver(helpers),
    recurring_high_patterns: createRecurringHighPatternsResolver(helpers),
    recurring_low_patterns: createRecurringLowPatternsResolver(helpers),
    family_health_goals_enabled:
      createFamilyHealthGoalsEnabledResolver(helpers),
    metric_most_improved: createMetricMostImprovedResolver(helpers),
    metric_most_declined: createMetricMostDeclinedResolver(helpers),
    frequent_themes_tags: createFrequentThemesTagsResolver(helpers),
    most_productive_time_periods:
      createMostProductiveTimePeriodsResolver(helpers),
    short_weekly_review: createShortWeeklyReviewResolver(helpers),
    clarify_recently: clarifyRecentlyResolver,
    clarify_focus_next: clarifyFocusNextResolver,
    clarify_show_progress: clarifyShowProgressResolver,
    clarify_less_productive: clarifyLessProductiveResolver,
    workout_progress: createWorkoutProgressResolver(),
    workout_best_performance: createWorkoutBestPerformanceResolver(),
    workout_volume_analysis: createWorkoutAnalyticsResolver(),
    workout_history: createWorkoutHistoryResolver(),
    workout_target_progress: createWorkoutTargetProgressResolver(),
    workout_remaining_exercises: createWorkoutRemainingExercisesResolver(),
  };
}
