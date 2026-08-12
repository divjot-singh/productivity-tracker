import type { DeterministicResolver } from "../types";

export const clarifyRecentlyResolver: DeterministicResolver = () => ({
  clarificationQuestion:
    "Do you want a summary for the last 7 days, 14 days, or 30 days?",
  followUpRequired: true,
});

export const clarifyFocusNextResolver: DeterministicResolver = () => ({
  clarificationQuestion:
    "Should I prioritize suggestions based on your lowest-scoring metrics this week, or your long-term trends?",
  followUpRequired: true,
});

export const clarifyShowProgressResolver: DeterministicResolver = () => ({
  clarificationQuestion:
    "Do you want progress by goals, by daily scores, or both, and for what date range?",
  followUpRequired: true,
});

export const clarifyLessProductiveResolver: DeterministicResolver = () => ({
  clarificationQuestion:
    "Which period should I analyze for lower productivity: this week, last week, or the last 30 days?",
  followUpRequired: true,
});
