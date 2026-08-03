# Dashboard Widget Architecture

## Vision

The dashboard should not contain hardcoded charts or business logic.

Instead, every item displayed on the dashboard is a **Widget**.

A widget defines:

- what should be calculated
- how it should be calculated
- how the frontend should render it

The frontend never performs calculations.

The backend is responsible for:

- loading entries
- loading goals
- loading widget definitions
- executing widget logic
- returning render-ready data

This makes the dashboard fully configurable from Firebase.

---

# Architecture

Firestore

├── goals

├── entries

└── widgets

Backend

↓

Load Goals

↓

Load Entries

↓

Load Widget Configurations

↓

Execute Widget Engine

↓

Return Widget Responses

↓

Frontend

↓

Render Widget Components

The frontend becomes a renderer.

It only switches based on widget type.

switch(widget.type){

line-chart

bar-chart

ring

stat-card

calendar

heatmap

...

}

No calculations should exist in the frontend.

---

# Widget Flow

Widget Config

↓

Widget Executor

↓

Widget Response

↓

React Component

Example

Sleep Trend Widget

↓

SleepTrendExecutor

↓

LineChartResponse

↓

LineChart Component

Every widget owns its own business logic.

---

# Widget Executor

Every widget has its own executor.

Example

/widgets

life-score.ts

goal-progress.ts

streak.ts

category-breakdown.ts

sleep-trend.ts

habit-consistency.ts

weekly-summary.ts

Each exports

executeWidget(config, goals, entries)

↓

returns

WidgetResponse

The API simply loops through every widget and executes it.

---

# Widget Configuration

Every widget is stored in Firestore.

Example

id

title

type

source

period

aggregation

filters

displayOrder

visible

options

Only configuration is stored.

No computed values.

---

# Backend Responsibilities

The backend

• loads goals

• loads entries

• loads widget configs

• executes calculations

• aggregates data

• formats labels

• formats datasets

• calculates streaks

• calculates trends

• calculates averages

• calculates category summaries

The backend returns render-ready data.

---

# Frontend Responsibilities

The frontend

• fetches widget responses

• renders components

• handles loading

• handles empty states

• handles interactions

No calculations.

---

# Why This Architecture

Benefits

✓ Dashboard configurable from Firebase

✓ No frontend changes for new widgets

✓ Widget logic isolated

✓ Easy testing

✓ Easy caching

✓ Easy future AI generated widgets

✓ Multiple dashboards possible

✓ Mobile and Web share same API
