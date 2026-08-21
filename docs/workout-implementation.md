# Workout Tracking Implementation Plan

## Goal

Extend the existing Productivity Tracker with a structured workout system that allows the user to:

1. Maintain an exercise library.
2. Organize exercises into one or more categories/combinations.
3. Select one or more combinations for a workout.
4. Record individual sets with weight, reps, and effort.
5. Track optional current and target weights.
6. View exercise-level progress over time.
7. Visualize workout volume, weight, reps, effort and strength progression.
8. Interact with workout data through the existing chat experience.

The implementation should keep exercise definitions separate from workout history so that exercises can be edited without changing historical workout records.

---

# App Integration Decisions (Finalized)

These decisions adapt the generic plan below to this application's actual architecture
(Next.js App Router, Firebase/Firestore, config-driven dashboard, deterministic chat).

## Data storage

Workout data lives in **separate Firestore collections**, independent of daily entries:

```text
users/{uid}/exercises/{exerciseId}
users/{uid}/combinations/{combinationId}
users/{uid}/workouts/{workoutId}
```

Workouts do **not** reuse or extend the daily entry documents.

## Scoring

Workouts are **fully separate** from the productivity score/XP engine.
Logging a workout must not affect score, XP, streaks, or metric-based dashboard widgets.

## Workout cadence

**One workout per day**, keyed by date (same shape as a daily entry: one editable
document per date). A single workout contains **multiple exercises**; the user
selects exercises and adds set entries under each.

## Navigation & structure

Workouts are a **self-contained hub section at `/workouts`** with an internal
sub-nav (mirroring the existing Settings sub-nav pattern):

```text
/workouts
  ├── Log          (record today's workout: select exercises, add sets)
  ├── Exercises    (exercise library CRUD)
  ├── Combinations (combination CRUD)
  └── Progress     (exercise-level analytics)
```

- All workout management (exercise library + combinations) lives under `/workouts`.
  Settings keeps only `Goals` and `Visualizations`.
- Detail + edit screens follow the existing `settings/goal/[id]` /
  `settings/visualizations/[id]` pattern (list → detail → edit, plus `new`).
- **Entry point (recommended):** `/workouts` hub reached via a Sidebar link
  (desktop) and a nav menu/dropdown + Dashboard workout card (mobile). The
  bottom nav stays at 5 items.
- **Alternative (open):** a 6th bottom-nav item. Decide during Phase 2.
- Recording workouts happens **only in `/workouts` → Log**. The Record (`/today`)
  tab is unchanged and continues to record daily entries only (no Entry|Workout
  toggle).

## Dashboard & visualization

Workout charts are **fully config-driven**, integrated into the existing
`VisualizationDefinition` system. This requires new `provider` and `executor`
types (see Phase 3), so workout widgets are user-configurable exactly like
existing ones. In addition, dedicated purpose-built progress screens live under
`/workouts → Progress`.

## Chat

Phase 4 starts **read-only** (progress / history / analytics questions) and
extends the existing deterministic chat (new intents + resolvers + fetchers),
not LLM-freeform mutation. Workout logging via chat is deferred to a later
iteration.

---

# Phase 1 — Exercise Management

## Objective

Create the exercise catalog and the UI/API required to manage exercises.

The exercise catalog is the source of truth for exercises.

### Exercise model

Each exercise should contain:

- `id`
- `name`
- `categories[]`
- `muscleGroups[]`
- `equipment`
- `type`
- `description`
- `notes[]`
- `tracking`
- `weightTracking`
- `progression`
- `currentWeight`
- `targetWeight`
- `active`

### Categories

An exercise must support multiple categories.

Example:

```text
Dumbbell Bench Press
categories:
  - push
  - chest
```

Another exercise:

```text
Incline Dumbbell Curl
categories:
  - pull
  - biceps
  - arms
```

Do not model this as a single `category`.

This allows future combinations such as:

- Push
- Pull
- Legs
- Chest
- Back
- Shoulders
- Arms
- Biceps
- Triceps
- Core
- Functional
- Custom combinations

without changing the exercise itself.

---

## Exercise CRUD

### Create

Allow the user to create a custom exercise.

Required:

- Name
- At least one category

Optional:

- Muscle groups
- Equipment
- Type
- Description
- Notes
- Weight tracking mode
- Progression strategy
- Current weight
- Target weight

### Update

Allow the user to modify:

- Name
- Categories
- Muscle groups
- Equipment
- Description
- Notes
- Tracking configuration
- Progression configuration
- Current weight
- Target weight

Changing an exercise definition must not modify historical workout records.

Historical workout records should only store the `exerciseId` and the performance data that occurred at that time.

### Delete

Do not hard-delete an exercise if it has historical workout data.

Instead:

```text
active = false
```

This is effectively a soft delete.

Inactive exercises:

- Should not appear in new workout selections by default.
- Should remain visible in historical workout records.
- Should remain available for historical analytics.
- Can optionally be restored later.

If an exercise has never been used, a hard delete can be considered.

---

# Combination Management

A combination is a reusable workout grouping.

Examples:

```text
Push
Pull
Legs
Chest
Back
Arms
Core
Functional
```

A combination should contain:

```text
id
name
description
exerciseIds[]
active
```

Important:

A combination references exercises.

It does not duplicate exercise definitions.

Example:

```text
Push
  -> db_bench_press
  -> incline_db_press
  -> db_shoulder_press
  -> lateral_raise
  -> triceps_pushdown
```

An exercise can belong to unlimited combinations.

This makes it possible to create a future "Chest" workout without changing the Push workout.

---

# Combination CRUD

### Create

Create a new combination and select exercises from the exercise library.

### Update

Allow:

- Rename combination
- Change description
- Add exercises
- Remove exercises
- Reorder exercises
- Activate/deactivate combination

### Delete

Soft-delete combinations that have historical workout usage.

Historical workout records should remain intact.

---

# Recommended UI

All workout screens live under the `/workouts` hub with an internal sub-nav
(mirroring `SettingsSubNav`):

```text
/workouts
  ├── Log          (record today's workout)
  ├── Exercises    (exercise library)
  ├── Combinations (reusable groupings)
  └── Progress     (analytics)
```

Exercise Library:

```text
Exercise
Category
Muscles
Equipment
Current
Target
Actions
```

Exercise detail/edit screen should show the description and technique notes and
follow the existing list → `[id]` detail → edit pattern used by
`settings/goal/[id]` and `settings/visualizations/[id]` (plus a `new` route).

---

# Phase 2 — Workout Entries

## Objective

Allow the user to record actual workout sessions.

A workout entry should contain:

```text
id
date
combinationIds[]
exercises[]
notes?
```

Each workout exercise:

```text
exerciseId
sets[]
notes?
```

Each set:

```text
weight
reps
effort
```

Optional future properties:

```text
duration
distance
```

This allows exercises such as Farmer's Carry to be tracked without forcing every exercise into a weight × reps model.

---

# Selecting a Workout

Recording happens in `/workouts → Log`. There is **one workout document per
date**; opening Log for a date loads the existing workout for editing or starts
a new one. The Record (`/today`) tab is not involved.

The user starts a workout by selecting one or more combinations.

Example:

```text
Today's workout

[x] Push
[x] Core
[ ] Pull
[ ] Legs
```

The system then generates the exercise list from those combinations.

The user can:

- Remove an exercise for today's workout.
- Add another exercise manually.
- Reorder exercises.
- Add multiple combinations.

Do not modify the underlying combination when the user changes today's exercise list.

This is important because a temporary change should only affect the current workout.

---

# Logging Sets

The primary workout UI should make entering sets extremely fast.

Example:

```text
Dumbbell Bench Press

Set    Weight    Reps    Effort
1      60        10      2
2      70        8       3
3      80        6       4
4      90        3       5

+ Add Set
```

The user should not be forced to use the same weight for every set.

The system should support:

```text
Ascending weight:
60 × 10
70 × 8
80 × 6
90 × 3
```

as well as:

```text
Descending weight:
40 × 10
35 × 12
30 × 15
```

and straight sets when desired.

---

# Effort

Use a 1–5 scale:

```text
1 = Very easy
2 = Easy
3 = Moderate
4 = Hard
5 = Maximum effort
```

The effort value belongs to the individual set.

This allows later analysis such as:

- Average effort
- Weight achieved at effort 4
- Performance on high-fatigue days
- Whether strength is improving at the same perceived effort

---

# Workout Data Integrity

Do not store calculated volume as the primary source of truth.

Store:

```text
weight
reps
```

Then calculate:

```text
setVolume = weight × reps
```

and:

```text
exerciseVolume = sum(setVolume)
```

This avoids duplicated and potentially inconsistent data.

---

# Historical Data

Workout entries must be immutable historical records as much as practical.

If an exercise's name changes:

```text
Dumbbell Bench Press
```

to:

```text
DB Bench Press
```

historical entries should still reference the same exercise ID.

If an exercise is deactivated, historical workouts must continue to display it.

---

# Phase 3 — Workout Visualization & Analytics

## Objective

Build useful progress tracking rather than simply displaying raw workout history.

The most important view should be exercise-level progression.

---

# Exercise Progress Page

When selecting an exercise:

```text
Dumbbell Bench Press

Current Weight: 90 kg
Target Weight: 100 kg
```

Then display:

### Weight progression

Chart:

```text
Weight
  |
  |          ●
  |      ●
  |   ●
  | ●
  +---------------- Date
```

Use the highest working weight or top-set weight for each workout.

---

### Rep progression

Display:

- Maximum reps
- Average reps
- Reps at a selected weight
- Best set

---

### Volume progression

Calculate:

```text
Volume = Σ(weight × reps)
```

Example:

```text
60 × 10 = 600
70 × 8  = 560
80 × 6  = 480

Total = 1,640 kg
```

Show total exercise volume per workout and over time.

---

### Estimated 1RM

For suitable compound exercises, calculate estimated 1RM from a working set.

This provides a useful strength metric without requiring the user to actually test a one-rep maximum.

The exact formula should be centralized in the analytics layer rather than stored in every workout record.

---

# Config-driven dashboard integration

Workout widgets integrate into the existing `VisualizationDefinition` system
rather than a bespoke rendering path. This requires extending:

```text
VisualizationProviderType  -> add: workout | exercise
VisualizationExecutorType  -> add executors for weight / volume / reps / 1RM / PR
```

Data shape differs from metric/entry providers (sets/reps/weight/effort per
exercise), so new providers must read from the `workouts` collection and
aggregate deterministically. Existing metric/entry widgets are untouched, and
workout widgets become user-configurable exactly like current ones.

The dedicated `/workouts → Progress` screens use purpose-built charts for the
rich per-exercise views (weight/rep/volume/1RM trends); the dashboard shows the
configurable summary widgets.

---

# Dashboard

Add a Workout section to the existing dashboard.

Potential widgets:

### Weekly training

```text
Workouts: 3
Push: 1
Pull: 1
Legs: 1
```

### Training volume

```text
This week
Chest       8,420 kg
Back        9,120 kg
Legs       12,840 kg
```

### Strength progress

Show selected major lifts:

- Deadlift
- Squat
- Dumbbell Bench Press
- Dumbbell Shoulder Press

### Exercise PRs

Examples:

```text
Deadlift
Best weight: 160 kg
Best reps: 5
Estimated 1RM: X

Squat
Best weight: 130 kg
Best reps: 6
Estimated 1RM: X
```

---

# Target Progress

If `targetWeight` exists:

```text
Current: 90 kg
Target: 100 kg
Progress: 90%
```

If no target exists, do not show target progress.

This is why `currentWeight` and `targetWeight` should remain optional.

Also consider deriving current weight automatically from workout history rather than requiring the user to manually maintain it.

The manually stored `currentWeight` should therefore be treated as a convenience/default value, while workout history remains the authoritative source for actual performance.

---

# Phase 4 — Chat Integration

## Objective

Extend the existing productivity tracker chat so that workout data becomes another source of structured user data.

The chat should eventually understand:

- Exercises
- Combinations
- Workout history
- Sets
- Reps
- Weight
- Effort
- Progress
- Targets

---

# Chat capabilities

The first version should support read-only questions.

Examples:

```text
How has my deadlift progressed over the last 3 months?

What was my best bench session?

How much volume did I do for chest this month?

Am I getting stronger at squats?

What was my heaviest deadlift at effort 4?

How many times did I train legs this month?

Which exercises have improved the most?

How close am I to my 100 kg bench target?
```

The chat should retrieve structured workout data rather than trying to infer it from natural-language logs.

---

# Workout-aware intent classification

Extend the existing deterministic chat (`chat/intents/parser.ts` +
`chat/resolvers/registry.ts` + `chat/fetchers.ts`). Add a workout fetch plan,
normalizers, and new intents/resolvers. Phase 4 ships **read-only** first;
mutations via chat are deferred.

Add workout-related intents to the existing chat intent system.

Potential intents:

```text
WORKOUT_LOG
WORKOUT_PROGRESS
WORKOUT_HISTORY
WORKOUT_ANALYTICS
EXERCISE_INFO
EXERCISE_MANAGEMENT
COMBINATION_MANAGEMENT
WORKOUT_RECOMMENDATION
```

For example:

```text
"How has my deadlift improved?"
```

→ `WORKOUT_PROGRESS`

```text
"What was my heaviest squat last month?"
```

→ `WORKOUT_HISTORY`

```text
"Add Romanian deadlift to Legs"
```

→ `COMBINATION_MANAGEMENT`

```text
"What should I do for Pull today?"
```

→ `WORKOUT_RECOMMENDATION`

---

# Chat should use tools/actions for mutations

Do not allow the LLM to directly modify workout data.

Use structured application actions.

Example:

```text
User
  ↓
Chat
  ↓
Intent classification
  ↓
Workout tool
  ↓
Application/database
```

Potential actions:

```text
getExercise
searchExercises
createExercise
updateExercise
deactivateExercise

getCombination
createCombination
updateCombination
deactivateCombination

createWorkout
getWorkout
getWorkoutHistory

getExerciseProgress
getWorkoutAnalytics
```

The LLM decides which action is appropriate and provides structured parameters.

The backend validates those parameters before performing the operation.

---

# Example: logging a workout through chat

User:

> I did deadlifts today. 120 for 8, 140 for 5 and 160 for 3. Effort was 2, 4 and 5.

Chat should convert this to structured data:

```text
exerciseId: deadlift

sets:
  - weight: 120
    reps: 8
    effort: 2

  - weight: 140
    reps: 5
    effort: 4

  - weight: 160
    reps: 3
    effort: 5
```

Then the backend validates and saves it.

The assistant can respond with a concise confirmation.

---

# Example: progress question

User:

> How is my deadlift progressing?

The chat should not ask the LLM to calculate everything from raw historical documents.

Instead:

```text
Chat
 ↓
WORKOUT_PROGRESS
 ↓
getExerciseProgress(deadlift)
 ↓
Analytics layer
 ↓
Structured result
 ↓
LLM explanation
```

The analytics service can return:

```text
bestWeight
bestRepSet
totalVolume
estimated1RM
volumeTrend
weightTrend
repTrend
recentSessions
```

The LLM then turns that structured information into a useful answer.

---

# Important architecture rule

Workout data should remain **structured database data**, not RAG documents.

RAG is useful for:

- Exercise explanations
- Training principles
- Mobility information
- General fitness knowledge
- User-provided workout notes if they become substantial

But:

```text
"What was my deadlift on August 20?"
```

should be answered through a database query/tool.

Not through vector search.

Similarly:

```text
"How much chest volume did I do last month?"
```

should be a deterministic aggregation.

This will make the workout chat considerably more reliable.

---

# Suggested implementation order

## Phase 1 — Data model + management

Build:

- Exercise + Combination models (`models/`)
- Firestore collections `exercises`, `combinations` (`repositories/`)
- API routes + `/workouts` hub with `Exercises` and `Combinations` tabs
- List → `[id]` detail → edit + `new` (mirrors Settings CRUD pattern)
- Seed initial exercises (from `exervises.json`, added via UI)
- Multi-category support
- Soft deletion (`active = false`)
- Sidebar link + mobile entry point to `/workouts`

## Phase 2 — Recording

Build:

- Workout model + `workouts` collection (one doc per date)
- `/workouts → Log`: combination selection, per-workout exercise selection
- Dynamic set entry (weight/reps/effort), non-uniform sets
- Automatic volume calculation (derived, not stored)
- Workout history view
- Finalize nav entry-point decision (hub menu vs 6th nav item)

## Phase 3 — Analytics + dashboard

Build:

- `/workouts → Progress`: weight / rep / volume / 1RM charts, PRs, target progress
- Analytics layer (centralized 1RM + aggregations)
- New `VisualizationProviderType` (`workout`/`exercise`) + executors
- Config-driven workout dashboard widgets (user-configurable)

## Phase 4 — Chat (read-only first)

Integrate with the existing deterministic chat:

- Workout intents (`WORKOUT_PROGRESS`, `WORKOUT_HISTORY`, `WORKOUT_ANALYTICS`, `EXERCISE_INFO`)
- Workout fetch plan + normalizers + resolvers
- Read-only workout progress / history / analytics questions
- (Deferred) workout logging, recommendations, and mutations via chat

---

# Recommended separation

Keep the system conceptually separated into:

```text
EXERCISE CATALOG
       │
       ├── Exercises
       └── Combinations
              │
              ↓
        WORKOUT ENTRIES
              │
              ↓
          ANALYTICS
              │
              ├── Volume
              ├── Weight
              ├── Reps
              ├── Effort
              ├── Estimated 1RM
              └── PRs
              │
              ↓
             CHAT
```

This separation is important because the same underlying workout data can power both the **normal UI/dashboard** and the **chat interface** without maintaining two different sources of truth.
