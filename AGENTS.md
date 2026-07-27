<!-- BEGIN:nextjs-agent-rules -->

# Next.js Version

This project uses a newer version of Next.js than your training data.

Before making framework-specific changes:

- Read the relevant documentation in `node_modules/next/dist/docs/`.
- Do not rely on memorized Next.js APIs or conventions.
- Follow the documented APIs.
- Respect deprecation notices.

<!-- END:nextjs-agent-rules -->

# Productivity Tracker Agent Instructions

## Core Principles

- Never make assumptions.
- If any requirement is unclear, ambiguous, or incomplete, stop and ask clarifying questions before writing code.
- Do not invent APIs, components, business logic, database schemas, or UI.

---

# Documentation Workflow

`/docs` is the single source of truth for project architecture.

For any task involving architecture, UI, routing, Firebase, Firestore, business logic, scoring, authentication, or implementation:

1. Read `docs/README.md`.
2. Identify the relevant document(s).
3. Read only the required documentation.
4. Do not read every document unless explicitly requested.

If documentation and implementation differ:

- Report the difference.
- Ask which source should be treated as correct.
- Never silently choose one.

---

# Implementation Workflow

Before making changes:

1. Read the relevant documentation.
2. Read the existing implementation.
3. Compare documentation with the current implementation.
4. Identify what has already been completed.
5. Implement only the missing or requested work.
6. Do not reimplement completed features.

---

# Existing Code

Before writing new code:

- Search the repository for existing implementations.
- Prefer extending existing components, hooks, services, utilities, and Firestore helpers.
- Avoid duplicate code.

---

# Large Changes

If a task affects multiple files or project architecture:

Before writing code, provide:

1. Summary of the current implementation.
2. Files that will be modified.
3. Implementation plan.
4. Any risks or breaking changes.
5. Clarifying questions (if required).

Wait for approval before making significant architectural or multi-file changes.

---

# Coding Standards

Use:

- TypeScript
- Next.js App Router
- Functional React components
- Tailwind CSS
- Existing project architecture and conventions

Unless explicitly requested:

- Do not introduce new libraries.
- Do not rename files.
- Do not restructure folders.

---

# Response Format

For implementation requests, always respond in this order:

1. Understanding
2. Documentation consulted
3. Current implementation summary
4. Proposed implementation plan
5. Clarifying questions (if any)
6. Code

Do not skip these steps.

---

# Repository Context

Treat the repository as the primary source of truth.

Before changing code:

- Understand how the existing implementation works.
- Preserve existing behaviour unless instructed otherwise.
- Minimise changes to only what is required.
