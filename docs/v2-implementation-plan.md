# V2 Implementation Plan

**Date:** 2026-08-03  
**Current focus:** Goals Management

## Goal

Ship V2 with:

1. Correct category comparison logic on Dashboard.
2. Correct wake time and bed time trend semantics on a sleep-day axis.
3. Better Today UX aligned with Apple Fitness style interaction.
4. Goals management with controlled editing and safe complete deletion rules.
5. Dashboard visualizations sourced from Firebase, with no implicit fallback to defaults in the V2 runtime path.

---

# Current Status

## Completed

### 1. Dashboard — Category Comparison Logic ✅

Completed.

Category breakdown and leaderboard now use:

- **Category score** = sum of weighted scores for that category.
- **Category weight** = sum of weights present in that category history.
- **Category percentage** = `(category score / category weight) * 100`.

Leaderboard now displays:

- Percentage as the primary comparison value.
- Raw score / weight as secondary context.

Radar and category trend widgets use normalized percentage values for consistent scale comparison.

### 2. Dashboard — Wake Time and Bed Time Trends ✅

Completed.

Time trends now:

- Display clock time as `HH:mm`.
- Use a sleep-day axis for ordering.
- Treat post-midnight values as later than late-evening values.
- Preserve correct ordering semantics such as:

```text
23:00 → 00:30 → 01:30
```

Tooltips, axis labels, and timeline values use clock-time formatting.

### 3. Today Experience ✅

Completed.

The Today page now has the V2 UX direction:

- Calendar-style date selector.
- Existing-entry date indicators.
- Selected date remains visible.
- Existing entries can be loaded and edited.
- Sticky status area for live Life Score and XP.
- Progress indicator with capped visual progress.
- Compact grouped metric inputs.
- Empty numeric inputs rather than forced visible `0`.
- Empty numeric values normalize to `0` for scoring/API submission.
- Scoring explanations exposed through info UI.
- Reset uses an in-app confirmation UI rather than `window.confirm`.
- Review and Save uses a bottom-sheet interaction.
- Saving keeps the selected date and saved values visible rather than clearing the form.
- Existing dates can be updated without creating a separate client-side editing flow.

The Today page is considered complete for the current V2 scope.

---

# V2 Scope By Area

## 1) Dashboard

### 1.1 Category Widgets

**Status: ✅ Complete**

Keep percentage as the primary comparison value for category widgets.

Keep raw score and weight visible as secondary context.

Acceptance criteria completed:

- Rankings are not biased toward categories with larger absolute weights.
- Every category row shows `%` and `score / weight`.
- Radar and category trend visualizations use normalized percentages.

### 1.2 Wake Time and Bed Time Trends

**Status: ✅ Complete**

Acceptance criteria completed:

- Time axes show `HH:mm`, never decimal values.
- Post-midnight ordering is handled using a sleep-day axis.
- Bedtime sequence `23:00 → 00:30 → 01:30` appears as increasing later times.
- Tooltips and axis ticks show clock time.

---

# 2) Today Experience

**Status: ✅ Complete**

The Today redesign has been implemented and is no longer part of the remaining V2 build queue.

The final behavior is:

```text
Select date
    ↓
Load existing entry if present
    ↓
Edit / enter values
    ↓
Live score + XP update
    ↓
Review & Save
    ↓
Bottom-sheet confirmation
    ↓
Save
    ↓
Keep selected date + saved values visible
```

No further Today redesign work is required for V2 unless regression testing identifies an issue.

---

# 3) Logs

**Status: No V2 change planned**

The Logs experience remains unchanged for this V2 iteration.

---

# 4) Goals Management

**Status: 🚧 Next implementation**

This is the next area to implement.

## 4.1 Goal Editing

### Target behavior

Allow users to edit goals from:

- Goal detail page.
- Inline edit entry points from the goal list.

The edit experience should be focused on **numeric/scoring configuration**, not structural changes to the goal.

### Editable fields

The following fields are editable in V2:

- `weight`
- Numeric scoring values
- Targets
- Ranges
- Multipliers
- Bonus values
- Other numeric scoring/tuning fields supported by the existing scoring configuration
- `icon`

The exact numeric fields shown should remain driven by the existing goal/scoring configuration rather than hard-coding unrelated fields into the UI.

### Locked fields

The following fields are **not editable in V2**:

- Goal name
- Description
- Category
- Scoring type

These fields should be displayed as read-only in the UI.

### API enforcement

The immutable-field policy must be enforced server-side.

The PATCH API must reject attempts to modify:

```text
name
description
category
scoring type
```

even if a client manually sends those fields.

Do not rely on UI disabling alone.

The server should validate the incoming payload and either reject immutable fields with a clear validation error or construct an update object containing only permitted fields.

Prefer explicit server-side validation so accidental API misuse is visible.

### Acceptance criteria

- User can open a goal for editing.
- User can edit permitted numeric/scoring fields.
- User can edit the icon.
- Goal name cannot be changed.
- Description cannot be changed.
- Category cannot be changed.
- Scoring type cannot be changed.
- UI cannot submit immutable fields as editable changes.
- API rejects/treats immutable field modification attempts as invalid.
- Numeric changes persist to Firebase.
- Updated goal configuration is immediately reflected in scoring.
- Updated configuration is reflected in Dashboard outputs after relevant data is recalculated/loaded.

---

## 4.2 Goal Detail Page

Add a focused goal detail/edit page.

Suggested route:

```text
app/settings/goals/[id]/page.tsx
```

or the equivalent route consistent with the existing project structure.

The page should provide:

### Header

```text
← Goals

[Icon]

Goal Name
Category
```

The name/category are informational and read-only.

### Editable configuration

Show only the fields relevant to the selected goal's configuration.

For example:

```text
Weight
[ 8 ]

Target
[ 3 ]

Bonus Rate
[ 0.1 ]

Icon
[ icon selector ]
```

Do not show irrelevant scoring fields.

The form should be configuration-driven.

### Save

Provide a clear primary action:

```text
Save Changes
```

Disable it while saving.

After successful save:

- Show success feedback.
- Keep the user on the goal detail page.
- Show the updated values.
- Do not reset the form.

### Cancel / Back

Allow the user to return without saving.

If there are unsaved changes, consider a confirmation before leaving.

---

## 4.3 Goal List Inline Entry Point

The existing goal list should expose an Edit action.

Example:

```text
Protein
Nutrition

Weight: 8
Target: 3

                     Edit
```

Clicking Edit should navigate to the goal detail page.

Do not create a large inline editing form inside the list unless the existing UI strongly benefits from it.

The goal detail page should remain the primary editing surface.

---

## 4.4 Icon Editing

The icon is explicitly editable in V2.

The icon editor should:

- Use the application's existing icon system if one exists.
- Avoid allowing arbitrary unsafe values.
- Persist the selected icon through the existing goal update API.
- Show the current icon when opening the editor.

If the project already has a finite icon set, use that set rather than allowing arbitrary icon names.

The server should validate the icon value against the supported icon set if practical.

---

# 5) Goal Deletion

**Status: 🚧 Implement after goal editing**

## Final deletion policy

Use **complete deletion**.

No soft-delete/archive mechanism is required for V2.

However, deletion must be blocked when it would break historical data integrity.

### Delete should be blocked when:

1. The goal has historical references in entries.
2. The goal is a protected seed/core goal.

### Delete should be allowed when:

- The goal has no historical entry references.
- The goal is not protected.

There is no override for these restrictions in the V2 UI.

---

## 5.1 Historical References

Before deleting a goal, the server must determine whether the goal is referenced by historical entries.

Do not rely only on the client.

The server-side delete operation must perform the integrity check.

If historical references exist, return a clear error such as:

```text
This goal cannot be deleted because it has historical entries.
```

The UI should present an actionable explanation.

Do not silently fail.

---

## 5.2 Protected Goals

Protected seed/core goals cannot be deleted.

The protected state should come from the existing goal/config model rather than relying on a hard-coded list in the UI wherever possible.

If the current model does not have a protection flag, inspect the existing seeding/config architecture before introducing one.

Potential representation:

```ts
isProtected?: boolean
```

Do not introduce this field blindly if the existing data model already provides an equivalent concept.

---

## 5.3 Delete Confirmation

Deletion is permanent.

Use an in-app confirmation dialog, not `window.confirm()`.

Example:

```text
┌─────────────────────────────────────┐
│ Delete goal?                        │
│                                     │
│ This will permanently delete this   │
│ goal. This action cannot be undone. │
│                                     │
│ Cancel                 Delete       │
└─────────────────────────────────────┘
```

The Delete action should use destructive styling.

If the server determines deletion is blocked, show the reason instead of presenting a destructive confirmation that can never succeed.

---

## 5.4 Delete Acceptance Criteria

- Delete action exists on the goal detail page.
- Delete action uses an in-app confirmation dialog.
- Deletion is permanent.
- Goals with historical entry references cannot be deleted.
- Protected seed/core goals cannot be deleted.
- API enforces deletion restrictions.
- Client cannot bypass restrictions by modifying request payloads.
- Successful deletion removes the goal from Firebase.
- Successful deletion returns the user to the goals list.
- Failed deletion keeps the goal intact and displays a clear reason.

---

# 6) Visualizations Source of Truth

**Status: ⏳ Remaining V2 work**

## Requirement

Dashboard visualizations must come from Firebase.

Do not read visualization definitions from `DEFAULT_VISUALIZATIONS` during the normal V2 runtime path.

### Runtime behavior

`GET /api/dashboard` should read stored visualization definitions from the repository.

The runtime should not silently fall back to defaults.

If no visualizations exist:

- Return an explicit empty state, or
- Require the one-time developer seeding flow.

Do not implicitly substitute defaults.

---

## 6.1 Visualization Seeding

Add a developer action to:

```text
app/settings/dev/page.tsx
```

Add:

```text
Seed Visualizations
```

The action should seed:

```text
DEFAULT_VISUALIZATIONS
```

into Firebase for the current user.

The developer should be able to use this on a clean account before testing Dashboard visualizations.

### Acceptance criteria

- Dashboard visualization definitions come from Firebase.
- No implicit default fallback occurs at runtime.
- Clean account can be initialized through the dev page.
- Seed action is safe to execute according to the project's existing seeding conventions.
- Dashboard loads seeded visualization definitions correctly.

---

# 7) Remaining V2 Implementation Order

The first three areas are complete.

The remaining work should now be implemented in this order:

## 1. Goals Editing

- Inspect existing goal list/settings implementation.
- Add goal detail page.
- Add controlled numeric/scoring editing.
- Add icon editing.
- Add client-side validation.
- Add PATCH API support if not already present.
- Add server-side immutable-field enforcement.
- Verify persistence in Firebase.
- Verify updated configuration affects scoring/dashboard behavior.

## 2. Goal Deletion Restrictions

- Determine how historical goal references are stored.
- Implement server-side historical-reference check.
- Identify/protect seed/core goals.
- Add permanent delete action.
- Add in-app confirmation.
- Add clear blocked-delete messages.
- Test successful and blocked deletion paths.

## 3. Firebase-Only Visualization Sourcing

- Remove implicit runtime fallback to `DEFAULT_VISUALIZATIONS`.
- Ensure dashboard repository reads stored visualization definitions.
- Add dev-page seed action.
- Test clean-account initialization.

---

# 8) Testing Checklist

## Dashboard

### Category widgets

- Percentage math
- Ranking correctness
- Score/weight secondary labels
- Radar percentage normalization
- Category trend percentage normalization

### Time widgets

- Post-midnight ordering
- `HH:mm` axis labels
- `HH:mm` tooltip labels
- Correct day-to-day delta calculations

## Today

- Calendar date selection
- Existing-entry indicators
- Existing entry loading
- New date empty state
- Sticky live score/XP
- Live progress updates
- Numeric blank values
- Blank → `0` normalization
- Reset confirmation
- Reset behavior
- Bottom-sheet review
- Save new entry
- Update existing entry
- Saved values remain visible after save
- Selected date remains selected
- Calendar marker appears after save

## Goals

### Editing

- Open goal detail page
- Edit weight
- Edit target
- Edit numeric scoring values
- Edit icon
- Name remains locked
- Description remains locked
- Category remains locked
- Scoring type remains locked
- PATCH API rejects/treats immutable-field modifications correctly
- Changes persist
- Updated values affect scoring

### Deletion

- Delete goal with no history
- Block goal with historical entries
- Block protected goal
- Destructive confirmation UI
- Server-side enforcement
- Successful deletion returns to goal list
- Failed deletion preserves goal

## Visualizations

- Firebase-only runtime loading
- No implicit defaults
- Empty visualization state
- Dev seeding action
- Seeded dashboard visualization loading

---

# 9) Final Decisions

| Question                          | Final Decision                                  |
| --------------------------------- | ----------------------------------------------- |
| Dashboard category comparison     | Percentage based on score / weight              |
| Wake/bed time semantics           | Sleep-day axis                                  |
| Today redesign                    | Complete                                        |
| Today calendar depth              | Already fixed; no further decision required     |
| Goal name editing                 | Not allowed in V2                               |
| Goal description editing          | Not allowed in V2                               |
| Goal category editing             | Not allowed in V2                               |
| Goal scoring type editing         | Not allowed in V2                               |
| Goal numeric/scoring tuning       | Allowed                                         |
| Goal icon editing                 | **Allowed**                                     |
| Goal deletion                     | **Complete permanent deletion**                 |
| Delete with historical references | **Blocked**                                     |
| Delete protected/core goal        | **Blocked**                                     |
| Soft delete                       | **Not used in V2**                              |
| Delete override                   | **No override**                                 |
| Visualization runtime source      | Firebase only                                   |
| Visualization defaults            | Used for explicit seeding, not runtime fallback |
| Next implementation area          | **Goals Editing**                               |

---

# 10) Current V2 State

```text
Dashboard category comparison     ✅ Complete
Wake/bed time trends              ✅ Complete
Today UX                          ✅ Complete
Logs                              ⏸ No V2 changes
Goals editing                     🚧 NEXT
Goal deletion restrictions        ⏳
Firebase visualizations           ⏳
```

**Next task: implement Goals Editing.**

Before changing the goals code, inspect the existing:

- Goal list/page
- Goal detail components, if any
- `MetricDefinition` / goal model
- Goals repository
- `/api/goals` routes
- Firebase data structure
- Scoring configuration types
- Existing seed/default goal configuration
- Existing settings navigation

Do not assume the current schema. Reuse the existing model and repository patterns wherever possible.
