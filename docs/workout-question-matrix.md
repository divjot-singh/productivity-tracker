# Workout Question Matrix

This document defines the expected intent, expected exercise IDs, and expected fetch logic for the workout-only questions in this chat.

## Core contract

- Multi-lift PR / strongest lift questions -> `workout_best_performance`
- Bodyweight-relative strength questions -> `workout_best_performance`
- Squat alias / follow-up questions -> `workout_best_performance`
- Top / bottom target-completion ranking questions -> `workout_target_progress`
- Mixed bodyweight + target completion queries -> evaluate PR and target progress together

## Exact matrix

| # | Question | Expected intent | Expected exercise IDs | Expected fetch logic |
|---|---|---|---|---|
| 1 | What is the heaviest weight I have done in my bench press, barbell squats and deadlift? | `workout_best_performance` | `["db_bench_press", "barbell_squat", "deadlift"]` | Fetch workout records for all three exercise IDs, filter to weight-bearing sets, compute max weight per exercise, return the per-lift PR summary |
| 2 | What are my bench, squat and deadlift PRs? | `workout_best_performance` | `["db_bench_press", "barbell_squat", "deadlift"]` | Same as above; summary of each lift’s top recorded weight |
| 3 | Check my deadlift, bench press and squat PR. | `workout_best_performance` | `["deadlift", "db_bench_press", "barbell_squat"]` | Resolve the three names to canonical IDs and return max weight for each |
| 4 | What are my top three lifts by weight? | `workout_best_performance` | All strength exercise IDs | Fetch all workout entries for strength exercises, compute max weight per exercise, sort descending, return top 3 |
| 5 | Which is my heaviest bench, squat, and deadlift? | `workout_best_performance` | `["db_bench_press", "barbell_squat", "deadlift"]` | Same as PR logic; select the biggest recorded weight per lift |
| 6 | Are they good for my body weight? | `workout_best_performance` | Prior PR context for bench/squat/deadlift + current/last bodyweight | Reuse previous multi-lift PR context; parse bodyweight from current or prior message; compute lift/bodyweight ratio |
| 7 | Are they good enough for my body weight? | `workout_best_performance` | Prior PR context for bench/squat/deadlift + bodyweight | Same as above; interpret as relative-strength quality check |
| 8 | Are my bench, squat and deadlift good for my 83.5kg body weight? | `workout_best_performance` | `["db_bench_press", "barbell_squat", "deadlift"]` | Parse 83.5kg from the message, fetch PRs for the three lifts, calculate relative strength |
| 9 | How do my lifts compare relative to my body weight? | `workout_best_performance` | Prior PR context / all relevant strength IDs | Fetch current PRs and compare lift values to bodyweight |
| 10 | Are my PRs strong enough for my size? | `workout_best_performance` | Prior PR context + bodyweight/size input | Use a recent bodyweight value and interpret the ratio for bench/squat/deadlift |
| 11 | What is my barbell squat PR? | `workout_best_performance` | `["barbell_squat"]` | Fetch squat workout sessions and compute max weight |
| 12 | What is my squat PR? | `workout_best_performance` | `["barbell_squat"]` | Same as above; alias `squat` -> `barbell_squat` |
| 13 | What about barbell squats? | `workout_best_performance` | `["barbell_squat"]` | Treat as squat PR follow-up; fetch squat data and answer |
| 14 | Check my squat numbers. | `workout_best_performance` | `["barbell_squat"]` | Fetch squat metrics and summarize the relevant squat stats |
| 15 | What’s my squat and deadlift PR? | `workout_best_performance` | `["barbell_squat", "deadlift"]` | Fetch both exercise IDs and return each lift’s max weight |
| 16 | Give me the top 5 exercises where I have the highest percentage of target completion. | `workout_target_progress` | All exercises with `targetWeight` metadata | Fetch all target-bearing exercises, compute actual / target %, sort descending, return top 5 |
| 17 | Give me the 5 exercises with the lowest target completion. | `workout_target_progress` | All exercises with `targetWeight` metadata | Fetch all target-bearing exercises, compute actual / target %, sort ascending, return bottom 5 |
| 18 | Which exercises are closest to their targets? | `workout_target_progress` | All exercises with `targetWeight` metadata | Fetch all target-bearing exercises, compute absolute distance to target, sort ascending |
| 19 | Which exercises are farthest from their targets? | `workout_target_progress` | All exercises with `targetWeight` metadata | Fetch all target-bearing exercises, compute absolute distance to target, sort descending |
| 20 | Rank all exercises by target progress. | `workout_target_progress` | All exercises with `targetWeight` metadata | Fetch all target-bearing exercises, compute completion %, sort descending |
| 21 | What about squat? | `workout_best_performance` | `["barbell_squat"]` | Resolve the bare squat follow-up and fetch squat PR |
| 22 | What about barbell squats? | `workout_best_performance` | `["barbell_squat"]` | Same as above |
| 23 | And for my body weight? | `workout_best_performance` | Prior PR context + bodyweight | Reuse prior multi-lift PR values and bodyweight context |
| 24 | How does that look relative to my mass? | `workout_best_performance` | Prior PR context + bodyweight/mass input | Reuse previous PR context and convert “mass” to bodyweight for relative-strength comparison |
| 25 | Bench, squat and deadlift PR and are they good for my body weight? | `workout_best_performance` | `["db_bench_press", "barbell_squat", "deadlift"]` | Fetch all three PRs, then evaluate each against bodyweight |
| 26 | Check my deadlift, bench press and squat PR, then tell me if they’re good enough for my body weight. | `workout_best_performance` | `["deadlift", "db_bench_press", "barbell_squat"]` | Fetch all three PRs and compare each to bodyweight |
| 27 | Compare my bench, squat and deadlift with my target completion and bodyweight strength. | `workout_best_performance` + `workout_target_progress` | `["db_bench_press", "barbell_squat", "deadlift"]` and all target-bearing exercises | Fetch PRs for the three lifts and target-progress data for all exercises, then compare them in one answer |

## Data contract for the fetcher

For all PR questions, the fetcher should return a normalized structure like:

```ts
[
  {
    exerciseId: "barbell_squat",
    exerciseName: "Barbell Squat",
    topWeight: 120,
    date: "2026-08-01",
    volume: 600,
    totalReps: 5,
    totalSets: 1,
    averageEffort: 5
  },
  {
    exerciseId: "db_bench_press",
    exerciseName: "Dumbbell Bench Press",
    topWeight: 90,
    date: "2026-08-01",
    volume: 450,
    totalReps: 5,
    totalSets: 1,
    averageEffort: 4
  },
  {
    exerciseId: "deadlift",
    exerciseName: "Deadlift",
    topWeight: 150,
    date: "2026-08-01",
    volume: 450,
    totalReps: 3,
    totalSets: 1,
    averageEffort: 5
  }
]
```

For target-completion questions, the fetcher should return a normalized structure like:

```ts
[
  {
    exerciseId: "db_bench_press",
    exerciseName: "Dumbbell Bench Press",
    actualWeight: 90,
    targetWeight: 100,
    completionPercent: 90
  },
  {
    exerciseId: "barbell_squat",
    exerciseName: "Barbell Squat",
    actualWeight: 120,
    targetWeight: 140,
    completionPercent: 85.7
  },
  {
    exerciseId: "deadlift",
    exerciseName: "Deadlift",
    actualWeight: 150,
    targetWeight: 190,
    completionPercent: 78.9
  }
]
```

## Implementation rule

The fetcher must satisfy both contract types:

- PR questions: fetch by exercise ID and return the heaviest valid set weight for the selected exercise(s)
- Target-completion questions: fetch by exercise ID and target metadata, then compute completion percentage using actual vs target weight

This matrix is the source-of-truth contract for the workout chat behavior.
