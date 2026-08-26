import type { DeterministicIntent } from "./types";

export function parseDeterministicIntent(message: string): DeterministicIntent {
  const text = message.toLowerCase();

  const isBareExerciseFollowUp =
    /^(?:what\s+is\s+my\s+)?(?:barbell\s+)?(?:squat|bench(?:\s+press)?|deadlift)\??$/.test(
      text,
    ) || /^(?:barbell\s+)?(?:squat|bench(?:\s+press)?|deadlift)\??$/.test(text);

  if (isBareExerciseFollowUp) {
    return "workout_best_performance";
  }

  const hasBodyweightStrengthQuestion =
    /\b(body weight|bodyweight|bw|relative strength|good enough|good for my weight|good for my body weight|are they good|are they strong enough|are they good enough)\b/.test(
      text,
    ) ||
    /\b(good enough|enough for my body weight|relative strength|are they good|are they strong enough|are they good enough)\b/.test(
      text,
    ) ||
    /\b(strong enough for my size|good for my size|for my size|for my mass|relative to my mass|for my body mass)\b/.test(
      text,
    );

  const hasPRQuestionLanguage =
    /\b(pr|personal record|personal best|best|heaviest|highest|max|strongest|stronger)\b/.test(
      text,
    ) ||
    /\b(top\s+\d+\s+lifts|top\s+three\s+lifts|top\s+five\s+lifts|top\s+three\s+exercises|top\s+three\s+weights|top\s+three\s+lifts\s+by\s+weight|top\s+three\s+by\s+weight|heaviest\s+lift|heaviest\s+lifts)\b/.test(
      text,
    ) ||
    /\b(heaviest\s+bench|heaviest\s+squat|heaviest\s+deadlift|bench,?\s*squat,?\s*and\s*deadlift|squat\s+and\s+deadlift|bench\s+and\s+deadlift)\b/.test(
      text,
    );

  const hasTopLiftByWeightQuestion =
    /\b(top\s+(?:\d+|three|five)\s+lifts(?:\s+by\s+weight)?|top\s+(?:\d+|three|five)\s+by\s+weight|heaviest\s+lift|heaviest\s+lifts)\b/.test(
      text,
    ) && /\b(lift|lifts|exercise|exercises|weight)\b/.test(text);

  if (hasBodyweightStrengthQuestion || hasTopLiftByWeightQuestion) {
    return "workout_best_performance";
  }

  const hasExerciseFollowUpQuestion =
    /\bwhat\s+about\b.*\b(?:barbell\s+)?(?:squat|bench(?:\s+press)?|deadlift)s?\??\b/.test(
      text,
    ) ||
    /\b(?:barbell\s+)?(?:squat|bench(?:\s+press)?|deadlift)s?\??\b/.test(text);

  if (hasExerciseFollowUpQuestion) {
    return "workout_best_performance";
  }

  const hasWorkoutIntent =
    /\b(workout|exercise|exercises|combination|combinations|deadlift|bench|bench press|squat|squats|push|pull|legs|chest|back|shoulders|arms|sets|reps|volume|effort|target|lift|lifts|pr|prs|personal record|personal records|personal best|curl|curls|row|rows|fly|flye|flyes|flies|raise|raises|extension|extensions|pulldown|pushdown|thrust|thrusts|carry|carries|crunch|crunches|jump|jumps|press|presses|dip|dips|lunge|lunges|calf|calves|hamstring|hamstrings|quad|quads|glute|glutes|abs|core|pec|pecs|lat|lats|tricep|triceps|bicep|biceps|rdl|woodchop|pallof|deadbug)\b/.test(
      text,
    );

  if (hasWorkoutIntent) {
    const hasTargetProgressLanguage =
      /\b(target|targets|close|closest|closer|far|farther|farthest|furthest|distance|progress toward|how close|completion|completed)\b/.test(
        text,
      ) &&
      /\b(weight|target|targets|bench|deadlift|squat|press|exercise|exercises)\b/.test(
        text,
      );
    const hasAllExerciseLeaderboardLanguage =
      /\b(all|every)\b/.test(text) &&
      /\b(exercise|exercises)\b/.test(text) &&
      /\b(top|highest|lowest|bottom|completion|target)\b/.test(text);

    const hasAllExercisePrRequest =
      /\b(all|every|each)\b/.test(text) &&
      /\b(exercise|exercises|lift|lifts)\b/.test(text) &&
      /\b(pr|prs|personal record|personal records|personal best|record|records|heaviest)\b/.test(
        text,
      );

    // A combined "all PRs + their target completion" request is answered by the
    // best-performance resolver (it renders PRs with optional target columns),
    // so it must win over the pure target-progress ranking route.
    if (hasAllExercisePrRequest) {
      return "workout_best_performance";
    }

    if (hasTargetProgressLanguage || hasAllExerciseLeaderboardLanguage) {
      return "workout_target_progress";
    }

    if (
      (hasPRQuestionLanguage || hasBodyweightStrengthQuestion) &&
      (/\b(deadlift|bench|press|squat|exercise|workout|lift|lifts|pr|personal record)\b/.test(
        text,
      ) ||
        hasBodyweightStrengthQuestion)
    ) {
      return "workout_best_performance";
    }

    if (
      /\b(top\b|highest\b|best\b|strongest\b|heaviest\b)\b/.test(text) &&
      /\b(lift|lifts|exercise|exercises|weight)\b/.test(text)
    ) {
      return "workout_best_performance";
    }

    if (
      /\b(what\s+about|what\s+is\s+my|what\s+are\s+my|check\s+my|how\s+about|tell\s+me\s+about)\b/.test(
        text,
      ) &&
      /\b(squat|barbell\s+squat|barbell\s+squats)\b/.test(text)
    ) {
      return "workout_best_performance";
    }

    if (
      /\b(squat|barbell\s+squat|barbell\s+squats)\b/.test(text) &&
      /\b(pr|best|heaviest|top|highest|what\s+about|check|my)\b/.test(text)
    ) {
      return "workout_best_performance";
    }

    if (/\b(volume|effort)\b/.test(text)) {
      return "workout_volume_analysis";
    }

    if (
      /\b(how many times|when did i last|last time|what workouts did i do|did i train|workout history|history)\b/.test(
        text,
      )
    ) {
      return "workout_history";
    }

    if (
      /\b(progress|progressed|progressing|improved|improving|stronger|strength|trend)\b/.test(
        text,
      )
    ) {
      return "workout_progress";
    }
  }

  const hasMutationActionIntent =
    /\b(delete|remove)\b.*\b(entry|goal|log|record)\b/.test(text) ||
    /\b(update|edit|change)\b.*\b(entry|goal|log|record|score|xp)\b/.test(
      text,
    ) ||
    /\b(create|add)\b.*\b(entry|goal|log|record)\b/.test(text) ||
    /\b(mark|set)\b.*\b(done|complete|completed)\b/.test(text);

  const isHistoricalReadOnlyQuery =
    /\b(did i|have i|what did i|which .* did i)\b/.test(text) &&
    /\b(create|created|add|added|submit|submitted|update|updated|remove|removed|delete|deleted)\b/.test(
      text,
    );

  if (
    /\b(top|best)\b/.test(text) &&
    /\bgoal|goals\b/.test(text) &&
    /\b(progress|completion|complete|completed)\b/.test(text)
  ) {
    return "top_goals_progress";
  }

  if (
    /\b(top|best)\b/.test(text) &&
    /\bgoal|goals\b/.test(text) &&
    /\bthis\s+week\b/.test(text) &&
    /\b(last|previous)\s+week\b/.test(text)
  ) {
    return "top_goals_progress";
  }

  if (!hasMutationActionIntent || isHistoricalReadOnlyQuery) {
    const hasEntryIntent =
      /\b(entry|entries|log|logs|submit|submitted|create|created)\b/.test(text);
    const hasOutcomeIntent =
      /\b(outcome|outcomes|result|results|score|xp|main)\b/.test(text);
    const hasTimeIntent =
      /\b(yesterday|today|last\s+\d+\s+days?|past\s+\d+\s+days?)\b/.test(text);

    if (hasEntryIntent && (hasOutcomeIntent || hasTimeIntent)) {
      return "entry_outcomes";
    }
  }

  if (
    /\b(status|current status)\b/.test(text) &&
    /\b(active\s+goal|active\s+goals|goal|goals)\b/.test(text) &&
    /\bweek|this\s+week\b/.test(text)
  ) {
    return "current_goal_status";
  }

  if (
    /\bhighest|best|top\b/.test(text) &&
    /\bproductivity\s+score|overall\s+productivity\s+score|score\b/.test(
      text,
    ) &&
    /\bweek|this\s+week\b/.test(text)
  ) {
    return "week_highest_productivity_day";
  }

  if (
    /\bhow\s+many\b/.test(text) &&
    /\bentries|logs\b/.test(text) &&
    /\bthis\s+week\b/.test(text) &&
    /\blast\s+week\b/.test(text)
  ) {
    return "week_vs_last_week_entries";
  }

  if (
    /\btrend\b/.test(text) &&
    /\b4\s+weeks|four\s+weeks|last\s+4\s+weeks\b/.test(text)
  ) {
    return "four_week_trend";
  }

  if (
    /\bcompare\b/.test(text) &&
    /\bthis\s+week\b/.test(text) &&
    /\blast\s+week\b/.test(text)
  ) {
    return "week_comparison";
  }

  if (
    /\brecurring\s+patterns?\b/.test(text) &&
    /\bscore\s+is\s+high\b/.test(text)
  ) {
    return "recurring_high_patterns";
  }

  if (
    /\brecurring\s+patterns?\b/.test(text) &&
    /\bscore\s+is\s+low\b/.test(text)
  ) {
    return "recurring_low_patterns";
  }

  if (
    /\bgoals\b/.test(text) &&
    /\bfamily|health\b/.test(text) &&
    /\benabled|active|currently\b/.test(text)
  ) {
    return "family_health_goals_enabled";
  }

  if (/\bmetric\b/.test(text) && /\bimproved\b/.test(text)) {
    return "metric_most_improved";
  }

  if (/\bmetric\b/.test(text) && /\bdeclined\b/.test(text)) {
    return "metric_most_declined";
  }

  if (
    /\btime\s+periods?|periods?\b/.test(text) &&
    /\bmost\s+productive\b/.test(text)
  ) {
    return "most_productive_time_periods";
  }

  if (/\bthemes|tags\b/.test(text) && /\boften|most\b/.test(text)) {
    return "frequent_themes_tags";
  }

  if (/\bshort\s+weekly\s+review\b/.test(text)) {
    return "short_weekly_review";
  }

  if (/^how am i doing recently\??$/.test(text)) {
    return "clarify_recently";
  }

  if (/^what should i focus on next\??$/.test(text)) {
    return "clarify_focus_next";
  }

  if (/^show me my progress\.?$/.test(text)) {
    return "clarify_show_progress";
  }

  if (/^why was i less productive\??$/.test(text)) {
    return "clarify_less_productive";
  }

  return "unknown";
}
