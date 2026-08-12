# Phase 2 Requirements Checklist

## Objective

Implement deterministic, read-only baseline retrieval with evidence-backed answering.

## Build Order

1. Fetchers

- Resolve effective user scope
- Fetch entries, goals, visualizations
- Apply default 84-day window for entries

2. Normalization

- Convert each domain object into NormalizedDocument
- Preserve sourcePath and timestamp for citations

3. Scoring

- Rank by keyword overlap + recency + domain boost
- Select top 2 evidence documents

4. HITL and policy gating

- Refuse action and cross-user requests
- Clarify ambiguous or weak-evidence requests
- Enforce no-evidence-no-answer

5. Answer generation

- Build grounded prompt from top evidence only
- Return success/clarification/refusal response shape

## Definition of Done

- Every non-refusal answer contains evidence citations
- Ambiguous prompts trigger clarification
- Action and cross-user prompts are refused
- No write path used in chat flow
- Baseline 25-question set can be executed

## Files

- chat/fetchers.ts
- chat/normalizers.ts
- chat/scorer.ts
- chat/hitl.ts
- chat/answer-generator.ts
