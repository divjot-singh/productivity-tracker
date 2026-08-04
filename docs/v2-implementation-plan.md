# V2 Implementation Plan

**Date:** 2026-08-03  
**Current focus:** Visualization Management

## Current Status

### Completed

1. **Dashboard — Category Comparison Logic** ✅
   - Category score = sum of weighted scores.
   - Category weight = sum of weights.
   - Category percentage = `(score / weight) * 100`.
   - Leaderboard uses percentage as the primary comparison and score/weight as secondary context.
   - Radar/category trends use normalized percentages.

2. **Dashboard — Wake Time and Bed Time Trends** ✅
   - Clock-time `HH:mm` labels.
   - Sleep-day ordering.
   - Correct ordering such as `23:00 → 00:30 → 01:30`.
   - Tooltips/axes use clock time.

3. **Today Experience** ✅
   - Calendar-style date selector.
   - Existing-entry indicators and loading.
   - Sticky live Life Score/XP.
   - Capped progress indicator.
   - Compact grouped inputs.
   - Empty numeric fields normalize to `0`.
   - Scoring info UI.
   - In-app reset confirmation.
   - Bottom-sheet review/save.
   - Saved values remain visible.
   - Selected date remains selected.
   - Existing entries can be updated.

4. **Goals Management — Editing** ✅
   - Numeric/scoring configuration is editable.
   - Icon is editable.
   - Name, description, category and scoring type are locked.
   - Immutable-field policy is enforced server-side.

5. **Goals Management — Deletion** ✅
   - Complete permanent deletion.
   - No soft-delete.
   - Historical-entry references block deletion.
   - Protected seed/core goals block deletion.
   - Server-side enforcement.
   - In-app destructive confirmation.

### Remaining

6. **Visualization Management** 🚧 NEXT
7. **Final regression pass** ⏳

---

# 1. Dashboard

**Status: ✅ Complete**

No further V2 work unless regression testing identifies an issue.

# 2. Today Experience

**Status: ✅ Complete**

No further V2 work unless regression testing identifies an issue.

# 3. Logs

**Status: ⏸ No V2 change planned**

# 4. Goals Management

**Status: ✅ Complete**

Goals editing and deletion are complete.

# 5. Visualization Management

**Status: 🚧 NEXT IMPLEMENTATION**

The Dashboard already renders visualization cards. V2 now adds a proper management experience under Settings so users can view, add, edit and delete their visualization definitions.

Firebase is the runtime source of truth.

`DEFAULT_VISUALIZATIONS` is seed/default data only and must never be an implicit runtime fallback.

## 5.1 Settings Navigation

Settings should expose:

```text
Settings

Goals
Visualizations
```

Goals continues to the existing Goals management page.

Visualizations goes to a new page, preferably:

```text
app/settings/visualizations/page.tsx
```

Use the repository's existing routing/settings conventions if different.

## 5.2 Visualization List

Use a UI pattern similar to Goals:

```text
Visualizations

[ + Add Visualization ]

Global
────────────────────────
[ Visualization Card ]
[ Visualization Card ]

Goals
────────────────────────
[ Visualization Card ]
[ Visualization Card ]

Categories
────────────────────────
[ Visualization Card ]
[ Visualization Card ]
```

### Grouping

Group by the existing `scope`:

```ts
type VisualizationScope = "global" | "goal" | "category";
```

Display labels:

- Global
- Goals
- Categories

Sort within each group by `displayOrder`.

Do not hard-code the current ordering.

### Cards

Cards should be visually similar to the existing Dashboard visualization cards, but act as management cards.

Show concise information such as:

- Title
- Description
- Widget type
- Scope
- Period
- Aggregation
- Visibility state

Avoid making cards overly dense.

Clicking a card should open its detail/edit page.

## 5.3 Visualization Detail

Suggested route:

```text
app/settings/visualizations/[id]/page.tsx
```

The detail page should show the current definition in a readable form and provide controlled editing.

### Editable properties

Recommended V2 editable properties:

```text
title
description
period
aggregation (when supported)
displayOrder
visible
options (when supported)
```

Current options are:

```ts
interface VisualizationOptions {
  comparison?: VisualizationComparison;
  greenIfDeltaPositive?: boolean;
}
```

Only show options when relevant to the selected visualization.

Examples:

- `comparison` is relevant to stat-style visualizations.
- `greenIfDeltaPositive` is relevant to timeline visualizations.

### Locked properties

Do not freely edit:

```text
id
widget
scope
provider
executor
key
```

These determine the visualization's runtime semantics.

Display them as read-only metadata if useful.

Do not allow the UI or API to turn a valid visualization into an arbitrary invalid combination.

## 5.4 Configuration-Driven Editing

Do not build one generic form that assumes all visualization types have identical settings.

Inspect the actual provider/executor/widget implementation first.

Examples of likely controls:

### Stat card

- Title
- Description
- Period
- Aggregation
- Comparison
- Visible
- Display order

### Timeline

- Title
- Description
- Period
- Green-if-delta-positive
- Visible
- Display order

### Trend chart

- Title
- Description
- Period
- Aggregation
- Visible
- Display order

### Category leaderboard

- Title
- Description
- Period
- Aggregation
- Visible
- Display order

These are examples, not hard-coded rules. Derive the actual supported combinations from the existing repository.

## 5.5 Add Visualization

Provide:

```text
+ Add Visualization
```

Prefer a dedicated creation route if the form is substantial:

```text
app/settings/visualizations/new/page.tsx
```

Otherwise use the project's existing sheet/dialog pattern.

Do not expose the raw `VisualizationDefinition` as JSON.

The creation UI should guide the user through valid choices.

Example:

```text
Add Visualization

Title
[________________]

Description
[________________]

Type
[ Stat Card ▼ ]

Scope
[ Global ▼ ]

Source
[ Entry ▼ ]

Data
[ Score ▼ ]

Period
[ 7 days ▼ ]

Aggregation
[ Latest ▼ ]

Additional options
[...]

Visible
[ ✓ ]

Display Order
[ 60 ]

[ Cancel ] [ Add Visualization ]
```

The fields must dynamically adapt to the selected visualization configuration.

### Valid configuration

The individual TypeScript unions do not guarantee that every combination is executable.

Inspect:

```text
widget
provider
executor
key
period
aggregation
options
```

and determine the actual supported combinations from the repository.

Do not permit arbitrary combinations such as:

```text
heatmap + streak + category + unsupported key
```

Server-side validation is required.

### ID

Users should never enter an ID.

Generate a unique ID using the project's existing ID convention.

The ID remains immutable.

### Display order

Give new visualizations a sensible default.

Prefer placing a new visualization at the end of its scope group by deriving the next order from existing Firebase data.

Do not hard-code a global order value.

## 5.6 Delete Visualization

Users may permanently delete visualizations.

Unlike Goals, visualizations do not need a historical-reference restriction because visualization definitions are configuration, not historical entry data.

Use an in-app confirmation dialog:

```text
Delete visualization?

"Life Score Today" will be permanently removed from your dashboard.

This action cannot be undone.

[ Cancel ]       [ Delete ]
```

After deletion:

```text
Delete
  ↓
Remove from Firebase
  ↓
Return to visualization list
  ↓
Dashboard no longer renders it
```

Server-side ownership/user scoping is required.

## 5.7 Visibility vs Deletion

These are separate concepts.

### Hide

```text
visible = false
```

The definition remains stored but does not appear on the Dashboard.

### Delete

Permanently removes the definition.

Recommended detail-page structure:

```text
[ Save Changes ]

Visibility
[ On / Off ]

Danger Zone

[ Delete Visualization ]
```

## 5.8 Firebase Runtime Source of Truth

Dashboard visualization definitions must come from Firebase.

Do NOT implement:

```ts
storedVisualizations || DEFAULT_VISUALIZATIONS;
```

or any equivalent implicit fallback.

If Firebase contains no visualizations, return/show an explicit empty state.

`DEFAULT_VISUALIZATIONS` is only for explicit seeding/initialization.

## 5.9 Visualization API/Repository

Before coding, inspect:

- Visualization model/types.
- Visualization repository.
- `/api/dashboard`.
- Existing visualization routes.
- Firebase collection structure.
- Existing seed/developer tooling.

Reuse existing repository/API/auth patterns.

If CRUD does not already exist, add only the missing operations following existing `/api/goals` conventions.

Expected capabilities, only if needed:

```text
GET    /api/visualizations
GET    /api/visualizations/:id
POST   /api/visualizations
PATCH  /api/visualizations/:id
DELETE /api/visualizations/:id
```

Do not create duplicate endpoints.

## 5.10 Developer Seeding

Retain/use:

```text
app/settings/dev/page.tsx
```

with:

```text
Seed Visualizations
```

This should seed `DEFAULT_VISUALIZATIONS` for the current user.

It must not overwrite existing user definitions during normal Dashboard or Settings loading.

## 5.11 Existing Users

Do not overwrite existing Firebase visualization definitions.

If a user has 3 stored visualizations, Settings must show those 3.

If the user has 0:

```text
Visualizations

No visualizations yet.

[ + Add Visualization ]
```

Do not silently populate defaults.

## 5.12 Final UX

```text
Settings
│
├── Goals
│     ↓
│   Existing Goals Management
│
└── Visualizations
      ↓
    Visualization List
      │
      ├── Global
      │    ├── Card
      │    └── Card
      │
      ├── Goals
      │    ├── Card
      │    └── Card
      │
      └── Categories
           ├── Card
           └── Card

      [+ Add Visualization]

      Card
        ↓
      Detail
        ├── Edit supported properties
        ├── Save
        ├── Toggle visibility
        └── Delete
```

# 6. Remaining V2 Implementation Order

The first five areas are complete.

## 1. Visualization Management

Implement:

- Settings navigation entry.
- Visualization list.
- Scope-based grouping.
- Visualization cards.
- Visualization detail/edit page.
- Controlled editing.
- Add visualization flow.
- Visibility toggle.
- Permanent deletion.
- Firebase CRUD where missing.
- Server-side validation.
- Firebase-only Dashboard sourcing.
- Developer seeding.

## 2. Regression Pass

After visualization management:

- Dashboard
- Today
- Logs
- Goals
- Settings
- Visualization CRUD
- Existing user data
- Seeded user data

# 7. Testing Checklist

## Dashboard

- Category percentage math.
- Ranking correctness.
- Score/weight secondary labels.
- Radar percentage normalization.
- Category trend percentage normalization.
- Post-midnight time ordering.
- `HH:mm` axes/tooltips.
- Correct time deltas.

## Today

- Date selection.
- Existing-entry indicators.
- Existing entry loading.
- New date empty state.
- Sticky score/XP.
- Live progress.
- Empty numeric values.
- Empty → `0` normalization.
- Reset confirmation.
- Bottom-sheet review.
- New entry save.
- Existing entry update.
- Saved values remain visible.
- Selected date remains selected.

## Goals

- Editing.
- Immutable fields.
- Icon editing.
- Server validation.
- Persistence.
- Historical-reference deletion block.
- Protected-goal deletion block.
- Permanent delete confirmation.

## Visualizations

### List

- Firebase data loads.
- Correct Global / Goals / Categories grouping.
- Correct `displayOrder`.
- Cards show useful summary.
- Empty state works.
- Existing configurations are not overwritten.

### Detail

- Current definition loads.
- Editable properties work.
- Locked properties remain read-only.
- Relevant options only.
- Valid period options.
- Valid aggregation options.
- Save persists.
- Visibility toggle works.
- Dashboard reflects changes.

### Add

- Creation flow works.
- Invalid combinations are prevented.
- ID generated automatically.
- Display order defaults correctly.
- Firebase persistence works.
- New visualization appears in correct scope.
- Dashboard renders it.

### Delete

- In-app confirmation.
- Permanent deletion.
- Firebase deletion.
- Removed from Settings.
- Removed from Dashboard.
- Ownership enforced server-side.

### Runtime source

- Dashboard reads only Firebase visualization definitions.
- No implicit default fallback.
- Empty Firebase state is explicit.
- Developer seed works.
- Existing user configurations remain untouched.

# 8. Final Decisions

| Question                                    | Final Decision                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Dashboard category comparison               | Percentage based on score / weight                                                                        |
| Wake/bed time semantics                     | Sleep-day axis                                                                                            |
| Today redesign                              | Complete                                                                                                  |
| Goals editing                               | Complete                                                                                                  |
| Goal icon editing                           | Allowed                                                                                                   |
| Goal structural fields                      | Locked                                                                                                    |
| Goal deletion                               | Complete permanent deletion                                                                               |
| Delete goal with historical references      | Blocked                                                                                                   |
| Delete protected/core goal                  | Blocked                                                                                                   |
| Soft delete goals                           | Not used                                                                                                  |
| Visualization management                    | **Next**                                                                                                  |
| Visualization location                      | Settings → Visualizations                                                                                 |
| Visualization list style                    | Similar to Goals                                                                                          |
| Visualization grouping                      | By `scope`: Global / Goals / Categories                                                                   |
| Visualization detail                        | Dedicated edit/detail page                                                                                |
| Visualization editable properties           | Title, description, supported period, supported aggregation, display order, visibility, supported options |
| Visualization locked properties             | ID, widget, scope, provider, executor, key                                                                |
| Visualization creation                      | Allowed                                                                                                   |
| Visualization deletion                      | Permanent deletion allowed                                                                                |
| Visualization delete historical restriction | Not required                                                                                              |
| Visualization visibility                    | Separate from deletion                                                                                    |
| Visualization runtime source                | Firebase only                                                                                             |
| `DEFAULT_VISUALIZATIONS` runtime fallback   | Not allowed                                                                                               |
| `DEFAULT_VISUALIZATIONS` usage              | Explicit seeding/initialization                                                                           |
| Next implementation area                    | **Visualization Management**                                                                              |

# 9. Current V2 State

```text
Dashboard category comparison     ✅ Complete
Wake/bed time trends              ✅ Complete
Today UX                          ✅ Complete
Logs                              ⏸ No V2 changes
Goals editing                     ✅ Complete
Goal deletion                     ✅ Complete
Visualization management         🚧 NEXT
Regression pass                   ⏳
```

# 10. Instructions for the Coding Model

Implement this against the existing repository.

Before changing code, inspect:

```text
VisualizationDefinition
DEFAULT_VISUALIZATIONS
Visualization repository
Visualization API routes
Dashboard API
Dashboard visualization renderer
Settings/navigation
Goals management implementation
Firebase collection structure
Developer seeding tools
```

Rules:

1. Do not assume the repository structure.
2. Reuse existing components, API conventions, repositories, validation, auth and Firebase utilities.
3. Do not introduce a second visualization model.
4. Do not duplicate existing CRUD APIs.
5. Keep Dashboard rendering architecture intact.
6. Settings manages definitions; Dashboard renders them.
7. `DEFAULT_VISUALIZATIONS` is seed data, never runtime fallback.
8. Preserve existing user visualization data.
9. Validate visualization combinations server-side.
10. Do not allow clients to bypass locked properties.
11. Use existing authentication/user-scoping patterns.
12. Use existing UI primitives and styling.
13. Use in-app dialogs/sheets for destructive confirmation; never `window.confirm()`.
14. Avoid broad unrelated refactors.

## Type context

```ts
export type VisualizationScope = "global" | "goal" | "category";

export type VisualizationPeriod =
  { type: "days"; value: number } | { type: "all" };

export type VisualizationProviderType =
  "entry" | "metric" | "goal" | "category";

export type VisualizationExecutorType =
  | "trend"
  | "progress"
  | "stat"
  | "streak"
  | "leaderboard"
  | "heatmap"
  | "timeline"
  | "insight";

export type VisualizationAggregation =
  | "latest"
  | "sum"
  | "average"
  | "count"
  | "daily"
  | "weekly"
  | "monthly"
  | "rolling-average"
  | "streak";

export type VisualizationWidget =
  | "stat-card"
  | "progress-bar"
  | "progress-ring"
  | "line-chart"
  | "bar-chart"
  | "area-chart"
  | "heatmap"
  | "leaderboard"
  | "timeline"
  | "radar-chart"
  | "insight-card";

export interface VisualizationOptions {
  comparison?: VisualizationComparison;
  greenIfDeltaPositive?: boolean;
}

export interface VisualizationDefinition {
  id: string;
  title: string;
  description?: string;
  widget: VisualizationWidget;
  scope: VisualizationScope;
  provider: VisualizationProviderType;
  executor: VisualizationExecutorType;
  key: string;
  period: VisualizationPeriod;
  aggregation: VisualizationAggregation;
  displayOrder: number;
  visible: boolean;
  options?: VisualizationOptions;
}
```

### Critical constraint

The TypeScript unions do not prove that every combination is executable.

Before implementing Add/Edit, inspect the actual executor/provider/widget implementations and determine valid combinations.

Do not allow arbitrary:

```text
widget × provider × executor × key × aggregation × options
```

combinations.

The form and server validation must follow the repository's real execution capabilities.

# 11. Recommended Implementation Sequence

### Step 1 — Inspect

Understand current visualization architecture and existing Settings/Goals patterns.

### Step 2 — Firebase/API

Ensure visualization CRUD and user scoping exist, adding only missing operations.

### Step 3 — Runtime Source

Make Dashboard visualization loading Firebase-only. Remove implicit defaults fallback.

### Step 4 — Settings List

Build Settings → Visualizations with scope grouping and cards.

### Step 5 — Detail/Edit

Build the detail page with editable/locked property rules.

### Step 6 — Add

Build configuration-driven creation and server validation.

### Step 7 — Delete

Add permanent deletion with an in-app confirmation.

### Step 8 — Seed

Ensure developer seeding works without overwriting existing definitions.

### Step 9 — Regression

Verify Dashboard, Today, Goals, Logs and Settings.

Do not make broad unrelated refactors while implementing this feature.
