# V3 Implementation Plan

Date: 2026-08-06

Focus: Minimal onboarding through goals setup, with no explicit onboarding state.

## 1. Confirmed Product Decisions

1. Onboarding status is derived from goals only.

- If goals count is 0, user is not onboarded.
- If goals count is greater than 0, user is onboarded.

2. V3 onboarding route is /onboarding.

3. Onboarding offers two paths.

- Create a custom goal.
- Select one or more default goals as templates.

4. Users can skip onboarding and continue to the app.

- If skipped and goals remain empty, app surfaces empty states with creation actions.

5. At least one goal is required to be considered onboarded.

6. Default goals are templates and remain editable later.

7. No analytics/events in V3.

8. UI must be mobile first and also work well on larger screens.

## 2. Current Baseline

1. Authentication exists and routes users to dashboard.
2. Goals are loaded from /api/goals.
3. Default goals exist in lib/defaults.ts.
4. There is no /onboarding route yet.
5. Dashboard, Today, and Logs do not currently enforce onboarding by goal count.
6. Dashboard has no dedicated empty state action for missing visualizations.

## 3. V3 Scope

In scope:

1. Add onboarding route and UI focused only on goals.
2. Add default-goal template selection flow.
3. Add skip path from onboarding.
4. Add onboarding gate logic based on goals count.
5. Add empty states:

- Dashboard: show create visualization action when no visualizations exist.
- Today: show create goals action when goals are empty.
- Logs: show create goals action when goals are empty.

6. Keep Settings behavior as is.

Out of scope:

1. Explicit user onboarding field in Firestore.
2. Funnel tracking events.
3. Non-goal onboarding steps.

## 4. UX Flow

### 4.1 Routing Behavior

1. After login:

- Fetch goals.
- If goals count is 0, route to /onboarding.
- If goals count is greater than 0, route to /dashboard.

2. On /onboarding:

- Show two primary actions: Create goal or Choose defaults.
- Show skip action: Continue without goals.

3. On finalize:

- If selected goals count is 0, disable finalize and show helper text.
- If selected goals count is greater than 0, enable finalize and save selected goals.
- After successful save, route to /today.

4. Skip behavior:

- Skip routes to /dashboard.
- User sees empty state prompts until at least one goal exists.

### 4.2 Proposed Onboarding UI States

1. Initial state:

- Headline and short explanation.
- Message: You can edit goals later in Settings.
- Buttons:
  - Create custom goal.
  - Choose from default templates.
  - Skip for now.

2. Template selection state:

- Searchable or scrollable checklist of default goals.
- Each card shows goal label, category, type, and short description.
- Selection count summary.
- Actions:
  - Back.
  - Finalize selection.

3. Finalizing state:

- Button loading indicator.
- Success toast.
- Route to /today.

## 5. Technical Design

### 5.1 Onboarding Status Source

Single source of truth:

- GET /api/goals response length.

Rule:

- Onboarded = goals.length greater than 0.

### 5.2 API Additions

1. Add endpoint to read default goal templates.

- GET /api/goals/templates
- Returns sanitized default goals from lib/defaults.ts.

2. Add endpoint to create selected defaults in batch.

- POST /api/goals/templates
- Request: array of selected template ids.
- Behavior:
  - Create goals for selected templates only.
  - Avoid duplicate templates by skipping already existing goal labels.
  - Return created and skipped counts.

3. Keep existing POST /api/goals for custom goal creation.

### 5.3 Client Guard Strategy

Add lightweight goal-based gate utility used by page-level effects:

1. Dashboard page:

- If authenticated and goals.length is 0, redirect to /onboarding.
- If visualizations.length is 0, show empty state with create visualization action.

2. Today page:

- If goals.length is 0, show empty state with create goals action.

3. Logs page:

- If goals.length is 0, show empty state with create goals action.

Note:

- Keep these checks client-side to match existing auth pattern in the app.

## 6. File-Level Plan

### 6.1 New Files

1. app/onboarding/page.tsx

- Onboarding UI and flow orchestration.

2. app/api/goals/templates/route.ts

- GET templates, POST selected templates.

3. lib/goals/templates.ts

- Shared mapping/helper functions for template projection and batch creation payload shaping.

### 6.2 Updated Files

1. app/login/page.tsx

- Replace direct dashboard push with goals-based route decision.

2. app/dashboard/page.tsx

- Add onboarding gate by goals length.
- Add empty state with action link to /settings/visualizations/new when no visualizations.

3. app/today/page.tsx

- Add empty state with action link to /settings/add when goals are empty.

4. app/logs/page.tsx

- Add empty state with action link to /settings/add when goals are empty.

5. repositories/goals.server.repository.ts

- Reuse existing create and read helpers for template batch creation.

6. docs/README.md

- Add reference entry for v3-implementation-plan.md.

## 7. Finalize Strategy Recommendation

To resolve finalize behavior clearly:

1. Finalize button remains disabled until at least one template is selected.
2. When user selects at least one template:

- Enable finalize.
- Save selected templates through POST /api/goals/templates.
- Show success toast with created count.
- Route to /today.

This keeps onboarding deterministic while still allowing skip.

## 8. Acceptance Criteria

1. New authenticated user with zero goals is redirected to /onboarding.
2. Onboarding allows selecting default templates and finalizing.
3. Finalize creates only selected templates.
4. Re-submitting same template selection does not create duplicates.
5. User can skip onboarding and continue.
6. Dashboard with zero visualizations shows create visualization action.
7. Today with zero goals shows create goals action.
8. Logs with zero goals shows create goals action.
9. Once a user has at least one goal, they are no longer redirected to onboarding.
10. Mobile-first layout remains usable on desktop widths.

## 9. Implementation Order

1. Add templates API and repository helpers.
2. Build onboarding page and template selection UI.
3. Update login redirect behavior to goals-based routing.
4. Add dashboard onboarding gate and visualization empty state.
5. Add Today and Logs empty states for missing goals.
6. Validate with typecheck and lint.
7. Update docs index.

## 10. Test Checklist

1. Fresh user logs in and is routed to onboarding.
2. Skip from onboarding lands user in dashboard.
3. Skipped user sees empty-state actions in dashboard, today, and logs.
4. Selecting one template and finalizing creates one goal and routes to today.
5. Selecting multiple templates creates all selected goals.
6. Finalize is disabled when no templates are selected.
7. Existing onboarded user is never redirected to onboarding.
8. Dashboard empty visualizations state shows create visualization action.
9. No regression in Settings goal creation/edit/delete flows.
10. Typecheck and lint pass.
