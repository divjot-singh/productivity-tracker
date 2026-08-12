import type { DeterministicIntent } from "./types";

export function parseDeterministicIntent(message: string): DeterministicIntent {
  const text = message.toLowerCase();

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
