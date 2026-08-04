# V2 Implementation Plan

Date: 2026-08-03

## Goal

Ship V2 with:

1. Correct category comparison logic on Dashboard (percentage by category score/weight).
2. Correct wake time and bed time trend semantics on a sleep-day axis.
3. Better Today UX aligned with Apple Fitness style interaction.
4. Goals management with controlled edit and safe delete rules.
5. Dashboard visualizations sourced from Firebase (no fallback to defaults in V2 runtime path).

## Current Status

### Completed Immediately (Point 1)

- Category breakdown and leaderboard now use:
  - category score = sum of weighted scores for that category
  - category weight = sum of weights present in that category history
  - category percentage = `(category score / category weight) * 100`
- Leaderboard now displays both:
  - percentage
  - raw score/weight context
- Wake and bed time trends now:
  - display time labels as clock time
  - use a sleep-day axis where post-midnight values are treated as later than late-evening values
  - preserve ordering semantics such that `23:00` is earlier than `01:30`

## V2 Scope By Area

## 1) Dashboard

### 1.1 Category Widgets

What to change:

- Keep percentage as the primary comparison value for category widgets.
- Keep raw score and weight visible as secondary context.

How to implement:

- Category provider returns percentage + score + weight.
- Leaderboard renderer uses percentage for ranking and displays score/weight as detail text.
- Radar and category trend widgets use normalized percentage values for scale consistency.

Acceptance criteria:

- Rankings are not biased toward categories with larger absolute weights.
- Every category row shows `%` and `score / weight`.

### 1.2 Wake Time and Bed Time Trends

What to change:

- Time axes show `HH:mm`, never decimal values.
- Time comparison runs on a sleep-day axis.

How to implement:

- Parse `HH:mm` to minutes.
- Normalize values under cutoff into next-day range for ordering.
- Use clock-time formatter for axis labels, tooltip labels, and timeline row values.
- Use duration formatter for day-to-day delta labels in timelines.

Acceptance criteria:

- Bedtime sequence `23:00 -> 00:30 -> 01:30` appears as increasing later times.
- Tooltips and axis ticks show time, not fractional hours.

## 2) Today Experience (Design + Build in V2)

Target UX direction:

- Calendar-style date selector.
- Sticky header with live Life Score and XP updates.
- Inputs remain scrollable and compact (no oversized card wrappers).
- Save confirmation becomes a bottom sheet instead of centered dialog.

What to change:

- Replace date input control with a compact calendar selector surface.
- Keep score and XP in a fixed/sticky top strip.
- Keep grouped inputs in a clean vertical flow with tighter spacing.
- Replace current modal review with bottom sheet summary and primary save CTA.

Implementation notes:

- Preserve existing scoring calculation flow.
- Preserve server save contract for `/api/entries`.
- Keep confirmation review content but move to sheet interaction pattern.

Acceptance criteria:

- User can select any day quickly from calendar control.
- Score and XP stay visible while scrolling inputs.
- Save interaction uses a bottom sheet with full summary and final confirmation.

## 3) Logs

No V2 change planned.

## 4) Goals Management

### 4.1 Editing

Target behavior:

- Allow editing from goal detail page and inline entry points.
- Restrict edits to numeric tuning only.

Locked fields (not editable in V2):

- goal name
- description
- category
- scoring type

Editable fields in V2:

- weight
- numeric scoring values (targets, ranges, multipliers, bonuses, score tuning fields)

How to implement:

- Add goal detail route/page for focused editing.
- Add inline “Edit” action in goal list that deep-links to detail editor.
- Server-side guard in PATCH route to enforce immutable field policy.

Acceptance criteria:

- Restricted fields cannot be changed via UI.
- Restricted fields cannot be changed via API payload tampering.
- Numeric changes persist and reflect in scoring and dashboard outputs.

### 4.2 Deletion Restrictions

V2 requirement:

- Do not allow unsafe deletion.

Proposed safe baseline:

- Block delete if goal has historical references in entries.
- Block delete for protected seed/core goals.
- Show actionable message when delete is blocked.

Open decision needed before implementation:

- confirm exact final policy and whether soft-delete should be used instead of hard-delete.

## 5) Visualizations Source of Truth

V2 requirement:

- Dashboard visualizations should come from Firebase collection.
- Do not read visualization definitions from defaults at runtime.

What to change:

- Ensure `GET /api/dashboard` reads only stored visualization definitions from repository.
- Keep deterministic fallback behavior explicit (empty state or one-time seed flow), not implicit defaults.

Developer tooling requirement:

- Add visualization seeding action to settings dev page:
  - add “Seed Visualizations” button in `app/settings/dev/page.tsx`
  - seed from `DEFAULT_VISUALIZATIONS` into Firebase for current user

Acceptance criteria:

- Dashboard shows visualizations only from Firebase state.
- On clean account, developer can seed visualizations using dev page action.

## Implementation Order for Remaining V2 Work

1. Today page UX redesign (calendar + sticky score/XP + bottom sheet).
2. Goals detail + inline entry points with immutable field restrictions.
3. Delete restriction policy implementation.
4. Firebase-only visualization sourcing and dev seeding button.
5. Regression pass on dashboard, logs, settings, and today flows.

## Testing Checklist

- Dashboard category widgets:
  - percentage math
  - ranking correctness
  - score/weight secondary labels
- Time widgets:
  - post-midnight ordering
  - axis labels and tooltips as `HH:mm`
  - delta labels readable and correct
- Today:
  - calendar date selection
  - sticky live score/XP
  - bottom sheet review and save
- Goals:
  - immutable fields locked at UI and API layers
  - numeric edits persist
  - deletion restrictions enforced with clear errors
- Visualization sourcing:
  - Firebase-only load path
  - dev seeding path works from dev page

## Open Questions To Resolve Before Full V2 Build

1. Final delete policy:
   - hard block with no override, or soft-delete with archival?
2. Immutable field policy exception:
   - should icon be immutable too?
3. Calendar UX depth:
   - month view only, or month + quick recent strip?
