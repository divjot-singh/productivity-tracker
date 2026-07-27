# Productivity Tracker

A modern, scalable productivity tracking web application built with **Next.js**, **Firebase**, and **TypeScript**.

The project follows an **API-first architecture**, where all business logic executes on the server and Firestore is treated as the single source of truth.

---

# Vision

Create a productivity system that helps users improve every area of life through measurable daily actions.

The application allows users to:

- Track daily habits
- Measure consistency
- Build streaks
- Monitor long-term trends
- View meaningful analytics
- Set personal goals
- Receive AI-powered productivity insights (future)

The architecture is designed to support multiple users without requiring major refactoring.

---

# Tech Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui

## Backend

- Next.js API Routes
- Firebase Authentication
- Firebase Admin SDK
- Firestore

## Charts

- Recharts

## Validation

- Zod

## Deployment

- Vercel

---

# Architecture

```
                Client

                   │

        Firebase Authentication

                   │

          Firebase ID Token

                   │

        Next.js API Routes

                   │

 Firebase Admin verifyIdToken()

                   │

          Business Logic

                   │

            Firestore
```

---

# Authentication Flow

1. User signs in with Firebase Authentication.
2. Client requests Firebase ID Token.
3. Every API request includes

```
Authorization: Bearer <token>
```

4. API verifies token using Firebase Admin SDK.
5. Business logic executes.
6. Firestore is updated.
7. Response is returned.

---

# Folder Structure

```
app/

    api/

        config/

        entries/

        dashboard/

components/

contexts/

lib/

    firebase.ts

    firebase-admin.ts

    server-auth.ts

    scoring/

models/

repositories/

services/
```

---

# Firestore Structure

```
users/

    uid/

        profile/

        config/

            metrics

        entries/

            yyyy-mm-dd
```

---

# Current Progress

## ✅ Authentication

Completed

- Firebase Authentication
- Protected Routes
- AuthContext
- Firebase ID Tokens
- Firebase Admin verification
- Secure API authentication

---

## ✅ API Layer

Completed

Implemented

- GET /api/config
- POST /api/config
- GET /api/entries
- POST /api/entries

The client no longer communicates directly with Firestore.

---

## ✅ Firestore Architecture

Implemented

Client SDK

```
lib/firebase.ts
```

Server SDK

```
lib/firebase-admin.ts
```

Authentication

```
lib/server-auth.ts
```

Repositories

```
config.server.repository.ts

entry.server.repository.ts
```

Repositories only perform Firestore operations.

---

## ✅ Dynamic Metric System

The application is completely configuration-driven.

Every metric defines

- id
- label
- description
- category
- displayOrder
- type
- target
- defaultValue
- weight
- bonusRate
- scoring strategy

Adding a new metric only requires updating the configuration.

---

## ✅ Supported Metric Types

- Boolean
- Number
- Time

---

## ✅ Supported Scoring

Implemented

- Boolean
- Target
- Numeric Range
- Time Range

Lookup scoring is being replaced by proper range-based scoring.

Future

- Formula
- Percentage
- Weighted
- AI

---

## ✅ Scoring Engine

Location

```
lib/scoring/
```

Responsibilities

- Calculate metric score
- Calculate XP
- Generate breakdown
- Calculate total score

Client

- Live Preview

Server

- Final calculation before save

The server is always the source of truth.

---

## ✅ Today's Entry

Completed

- Dynamic form generation
- Category grouping
- Live Score preview
- Live XP preview
- Date selection
- Save through API
- Loading state
- Error handling
- Authenticated requests

Remaining

- Load previous entry when date changes
- Edit existing entry
- Duplicate detection
- Better success notification

---

## ✅ Daily Logs

Completed

- API integration
- Reverse chronological history
- Expandable cards
- Metric breakdown
- Stored score
- Stored XP

Remaining

- Pagination
- Search
- Filters
- Calendar view

---

## ✅ Settings

Completed

- Read metric configuration
- Group metrics
- Development reseed endpoint

Remaining

- Goal management
- Theme
- Notifications
- Dashboard preferences

---

## ⏳ Dashboard

Next major milestone.

Planned

- KPI Cards
- Weekly Trends
- Monthly Trends
- Streak Tracking
- XP Charts
- Category Analysis
- Goal Completion
- Habit Consistency

---

# Models

## MetricDefinition

Contains

- metadata
- targets
- weights
- scoring strategy
- bonus configuration

---

## DailyEntry

Contains

- date
- values
- score
- xp
- breakdown
- timestamps

Client sends

```
date

values
```

Server calculates

```
score

xp

breakdown
```

---

# Repository Pattern

Repositories only perform database operations.

Repositories never perform

- validation
- score calculation
- xp calculation
- business logic

Business logic belongs in

- API Routes
- Shared libraries

---

# Development Principles

## API First

The client never accesses Firestore directly.

Everything goes through API Routes.

---

## Server Owns Business Logic

The server calculates

- Score
- XP
- Breakdown

The client only sends raw values.

---

## Firestore is the Source of Truth

Dashboard calculations should always use stored entries.

Never trust client-generated values.

---

## Dynamic Configuration

The UI is driven by metric definitions.

No UI changes should be required when adding new metrics.

---

## Strong Typing

Use shared TypeScript models.

Avoid `any`.

---

## Small Components

Components should

- be reusable
- remain composable
- avoid business logic

---

# UI Theme

Current stack

- Tailwind CSS v4
- shadcn/ui
- CSS Variables

Use semantic colors

```
bg-background

bg-card

bg-muted

text-foreground

text-muted-foreground

border-border

bg-primary

bg-secondary

bg-accent
```

Avoid

```
bg-zinc-*

text-zinc-*

border-zinc-*
```

---

# Known TODOs

## Today's Entry

- Fix numeric input backspace issue
- Improve Switch styling
- Load existing entry for selected date
- Prevent accidental overwrite
- Replace alerts with toast notifications

---

## Theme

- Complete semantic color migration
- Remove all hardcoded zinc colors
- Improve card elevation
- Improve dark mode contrast

---

## Dashboard

- KPI Cards
- Weekly Charts
- Monthly Charts
- Streaks
- Category Breakdown
- XP History
- Completion %
- Goal Progress

---

# Future Roadmap

## Analytics

- Weekly Reports
- Monthly Reports
- Yearly Reports
- Goal Analysis
- Habit Trends

---

## AI

- Productivity Coach
- Weekly Reviews
- Monthly Reviews
- Habit Suggestions
- Goal Recommendations
- Burnout Detection

---

## Gamification

- Levels
- XP Progression
- Achievements
- Badges
- Challenges

---

## Mobile

- PWA
- Offline Support
- Push Notifications
- Calendar Integration

---

# Guiding Principles

- Firestore is never accessed directly from UI.
- API Routes own all business logic.
- Firebase Admin SDK is server-only.
- Client only submits raw metric values.
- Server calculates score and XP.
- Metric configuration drives the application.
- Repositories only perform persistence.
- Pages should focus on UI and state.
- Use semantic color tokens instead of hardcoded colors.
- Keep the scoring engine centralized.