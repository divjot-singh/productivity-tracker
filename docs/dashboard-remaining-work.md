# Dashboard Remaining Work

## Purpose

This document captures the remaining implementation and refinement work for the dashboarding phase based on the current workspace state.

It is grounded in:

- `docs/dashboard-architecture.md`
- `app/api/dashboard/route.ts`
- `app/dashboard/page.tsx`
- `lib/defaults.ts`
- `lib/services/visualization-service.ts`
- `lib/visualizations/providers/*`
- `lib/visualizations/executors/*`
- `lib/visualizations/renderers/*`

This is the final source of truth for dashboard progress.

The dashboard is currently using mock entry data intentionally, which is the correct setup for refining the visualization engine before enough real historical data exists.

---

## Current State Summary

The core dashboard pipeline already exists:

1. Dashboard page fetches `/api/dashboard`.
2. API route loads goals, visualization definitions, and mock entries.
3. `VisualizationService` filters entries by period and invokes provider + executor.
4. The frontend uses a renderer registry to pick a widget component.

What is already implemented:

- Provider registry with `entry`, `metric`, `goal`, and `category`
- Executors for `stat`, `trend`, `progress`, `streak`, `leaderboard`, and `heatmap`
- Renderers for `stat-card`, `progress-bar`, `progress-ring`, `line-chart`, `area-chart`, `bar-chart`, `radar-chart`, `leaderboard`, `heatmap`, `timeline`, and `insight-card`
- Default dashboard visualizations now cover summary, progress, streak, leaderboard, heatmap, and trend widgets

What is already visible from the current code:

- The architecture is correct.
- The mock-data workflow is already wired in the dashboard API.
- The dashboard is rendering-oriented, which matches the intended design.

What is not complete yet:

- Some widgets still need better semantic presentation choices, but the chart contract and axis handling are now substantially improved.
- Final dashboard composition should still be refined for your personal decision-making flow.

---

## Key Gaps Identified

### 1. Provider Contract Gap

Status:

- Completed.

`goal-provider.ts` is now part of the active provider type union and provider registry.

Implication:

- Goal-oriented widgets are now first-class in the pipeline.

### 2. Executor Depth Gap

Status:

- Mostly completed for `progressExecutor`, `streakExecutor`, `leaderboardExecutor`, and `heatmapExecutor`.

The remaining executor work is now about richer variants and future widgets rather than basic pass-through removal.

Implication:

- The remaining executor work is mostly about richer future widget types, not missing core transformations.

### 3. Renderer Coverage Gap

The widget model includes these widgets:

- `stat-card`
- `progress-bar`
- `progress-ring`
- `line-chart`
- `bar-chart`
- `area-chart`
- `heatmap`
- `leaderboard`
- `timeline`
- `radar-chart`
- `insight-card`

The renderer registry currently supports:

- `stat-card`
- `progress-bar`
- `progress-ring`
- `line-chart`
- `area-chart`
- `bar-chart`
- `heatmap`
- `leaderboard`
- `radar-chart`

Implication:

- All currently modeled widget types are renderable.

### 4. Chart Quality Gap

The current graph renderers are now materially improved, but some visualization choices still need refinement before the dashboard is considered final.

Main issues:

- Timeline and insight widgets are still missing.
- Category-level visualization choices still need iteration to find the clearest presentation.
- Chart legends and richer context remain limited for future multi-series use.

### 5. Documentation Ownership

Dashboard progress should live only in this file so the visualization roadmap does not drift across multiple partial notes.

---

## Providers To Implement Or Enhance

### Implement: goal provider activation

Status:

- Completed.

Work:

- Add `goal` to the provider type union.
- Register `goalProvider` in `provider-registry.ts`.
- Normalize its output contract so it matches the active provider typing used across the engine.

Why:

- This unlocks target-aware widgets cleanly.
- It avoids overloading `metricHistoryProvider` with goal-progress-specific responsibilities.

Primary use cases:

- progress bar widgets
- progress ring widgets
- goal completion summary cards
- target vs actual timeline widgets

### Enhance: metric history provider

Work:

- Normalize number, boolean, and time goal values into executor-friendly shapes.
- Make the target and unit consistently available.
- Support missing-value handling more cleanly.
- Remove debug logging and tighten error handling.

Why:

- The dashboard will eventually need to render mixed metric types without special-case UI logic.

Primary use cases:

- metric trends
- rolling averages
- progress widgets for numeric goals
- comparisons against prior periods

### Enhance: category provider

Work:

- Support both daily category history and aggregated category summaries.
- Prepare category-level output that can feed radar, leaderboard, and heatmap widgets without extra frontend assumptions.

Why:

- The current provider can support trend-like category series, but it is not yet shaped for broader dashboard widgets.

Primary use cases:

- radar chart
- category leaderboard
- category heatmap
- category summary insight cards

### Enhance: entry provider

Work:

- Expose richer metadata for period comparisons.
- Clarify handling for score and XP focused widgets.
- Make the response contract explicit enough for stat and trend widgets to share it safely.

Why:

- Entry-level widgets will likely become the dashboard summary row.

Primary use cases:

- life score cards
- XP cards
- score trend charts
- streak calculations based on entry-level completion rules

---

## Executors To Implement Or Enhance

### Implement properly: progress executor

Status:

- Completed for current dashboard widgets.

Current issue:

- It currently passes data through instead of computing `value`, `target`, `percentage`, labels, and display semantics.

Planned implementation:

- Compute progress from current value and target.
- Clamp and format percentage.
- Support number-based goals first.
- Define behavior for boolean and time metrics explicitly.

Widgets enabled:

- `progress-bar`
- `progress-ring`

### Implement properly: streak executor

Status:

- Completed for current dashboard widgets.

Current issue:

- It currently passes data through instead of calculating streaks.

Planned implementation:

- Compute current streak.
- Compute longest streak.
- Define what counts as a success for each supported metric type.
- Return a clean streak-specific response shape.

Widgets enabled:

- stat-card style streak summary
- future streak-specific widgets

### Implement properly: leaderboard executor

Status:

- Completed for current dashboard widgets.

Current issue:

- It currently passes data through and does not actually rank or aggregate.

Planned implementation:

- Aggregate category or metric data.
- Sort items deterministically.
- Return top N rows and optional supporting metadata.

Widgets enabled:

- `leaderboard`
- ranked insight cards

### Enhance: trend executor

Status:

- Partially completed.

Current issue:

- It assumes one series and performs only a minimal label/value transform.

Planned enhancement:

- Support multi-series datasets.
- Support aggregation modes such as daily, weekly, monthly, and rolling average.
- Preserve unit metadata where relevant.
- Improve date formatting strategy.
- Support category-oriented data without forcing it into the same simplistic shape.

Widgets enabled:

- `line-chart`
- `area-chart`
- `bar-chart`
- `radar-chart`
- future comparison charts

### Enhance: stat executor

Status:

- Partially completed.

Current issue:

- It is the most complete executor, but comparison behavior can be stronger.

Planned enhancement:

- Ensure comparison windows align with filtered periods.
- Improve zero and empty-state handling.
- Format units and decimals more deliberately.

Widgets enabled:

- top-row summary stats
- metric summary cards

---

## Renderers To Implement Or Enhance

### Enhance: line chart renderer

Problems today:

- Too basic visually.
- Always shows point labels.
- No shared tooltip, no legend, no unit awareness.
- Only supports the first dataset.

Enhancements:

- Support multiple series.
- Show labels conditionally, not by default.
- Introduce shared chart container and tooltip.
- Improve tick density and mobile readability.
- Add optional trend accenting for the latest point.

### Enhance: area chart renderer

Problems today:

- Same single-series limitation.
- Hidden axes reduce readability.
- Gradient treatment is okay but not yet systematized.

Enhancements:

- Shared chart shell.
- Better axis visibility rules.
- Better fill theme and optional comparison overlays.
- Smarter label suppression.

### Enhance: bar chart renderer

Problems today:

- Hidden x-axis weakens readability.
- Single-series only.
- Tooltip and labels are duplicated patterns.

Enhancements:

- Shared tooltip.
- Responsive label strategy.
- Better category/date labeling.
- Optional stacked and grouped variants if the executor returns multiple datasets.

### Enhance: radar chart renderer

Problems today:

- Duplicate angle-axis usage.
- Static radius domain.
- Limited styling and context.

Enhancements:

- Remove duplicated axis configuration.
- Drive scale from returned data.
- Add clearer labels and optional target overlay.

### Enhance: progress bar renderer

Enhancements:

- Better number formatting.
- Optional status text.
- Better spacing and hierarchy for titles and targets.

### Enhance: progress ring renderer

Enhancements:

- Improve ring visual treatment.
- Support subtitle and target context.
- Handle edge cases like values over 100% or missing target more gracefully.

### Enhance: stat card renderer

Enhancements:

- Better handling for integer vs decimal values.
- Improve comparison coloring to work with the app theme.
- Add optional icon, sparkline, or status treatment later.

### Implement: leaderboard renderer

Status:

- Completed.

Needed because:

- The executor type exists, the widget model includes it, and the docs mention it, but the frontend cannot render it yet.

Expected output:

- ranked rows
- value formatting
- optional badges or trend markers

### Implement: heatmap renderer

Status:

- Completed for entry-score consistency heatmaps.

Needed because:

- It is one of the highest-value dashboard widgets for consistency tracking, especially while validating long mock histories.

Expected output:

- calendar-style daily consistency grid
- category or metric intensity coloring
- hover details

### Implement: timeline renderer

Status:

- Completed.

Needed because:

- Time-based activity summaries and milestones need a more narrative widget than charts.

Expected output:

- chronological event list
- milestone markers
- target completion events

### Implement: insight card renderer

Status:

- Completed.

Needed because:

- Not every useful dashboard output should be chart-shaped.

Expected output:

- generated textual insight
- supporting numeric evidence
- optional comparison badge

---

## Recommended Default Dashboard Expansion While Still Using Mock Data

The current default dashboard is heavily trend-chart-focused. While mock data is in place, the dashboard should deliberately exercise more widget types.

Recommended additions:

1. Life score stat card
2. XP stat card
3. Sleep progress ring
4. Steps progress bar
5. Current streak card
6. Category leaderboard
7. Consistency heatmap

Why this matters:

- It tests more of the engine before production data is introduced.
- It exposes contract weaknesses earlier.
- It prevents overfitting the system to only trend charts.

---

## Proposed Implementation Order

### Phase 1: Fix core contracts

1. Activate and normalize `goalProvider`
2. Implement real `progressExecutor`
3. Implement real `streakExecutor`
4. Implement real `leaderboardExecutor`
5. Tighten provider typings and remove drift

### Phase 2: Refine current chart renderers

1. Create a shared chart shell
2. Create shared tooltip and formatting helpers
3. Refine line, area, bar, and radar renderers
4. Remove always-on point labels from dense views

### Phase 3: Expand widget coverage

1. Refine final dashboard composition and display order for your personal use cases.

### Phase 4: Expand default mock-data dashboard

1. Add stat widgets
2. Add progress widgets
3. Add leaderboard and heatmap widgets
4. Rebalance display order for visual hierarchy

---

## UI Recommendations

These are the dashboard UI improvements I recommend in parallel with visualization work.

### 1. Introduce a shared visualization card shell

Every widget should sit inside the same structural frame:

- title
- subtitle or context line
- content area
- footer for comparison or target details

This will make the dashboard feel intentional rather than a collection of separate chart demos.

### 2. Reduce chart noise

Right now the charts are too label-heavy for regular dashboard use.

Recommendation:

- hide point labels by default
- use hover for exact values
- show only min, max, latest, or selected highlight points

### 3. Improve hierarchy on the dashboard page

Recommended layout:

1. top summary row for score, XP, streak, and one progress widget
2. main trend section
3. category comparison section
4. consistency and insight section

This will make the page easier to scan on both desktop and mobile.

### 4. Add widget-level metadata

Useful metadata examples:

- period badge like `30D`
- goal category badge
- comparison caption like `vs previous period`
- updated timestamp later when real data is used

### 5. Standardize color meaning

The dashboard should not rely on one generic primary color for every chart.

Recommendation:

- score and XP use one visual family
- fitness, health, routine, family, and lifestyle categories each get a stable accent
- success, warning, and decline states get semantic colors

### 6. Improve loading, empty, and unsupported states

Current dashboard behavior is minimal.

Recommendation:

- add loading skeletons
- add meaningful empty states per widget
- replace plain unsupported-widget text with a styled fallback card

### 7. Make mobile chart behavior intentional

Recommendation:

- reduce tick density on small screens
- allow horizontal breathing room inside cards
- keep tooltips readable without covering the entire chart

### 8. Add dashboard controls later

After the current engine stabilizes, useful controls would be:

- period selector
- category filter
- widget reorder or pinning

These should come after the contracts stabilize, not before.

---

## Recommendation Summary

If I were implementing the next dashboard iteration, I would do the work in this order:

1. Fix provider and executor contracts first.
2. Refine the existing chart renderers into a shared chart system.
3. Add missing widget renderers starting with leaderboard and heatmap.
4. Expand the default mock-data dashboard so more widget types are exercised now.
5. Apply UI hierarchy and visual polish once the widget set is broader.

This keeps the current mock-data phase useful instead of treating it as temporary throwaway work.
