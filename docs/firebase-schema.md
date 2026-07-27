# Firestore Schema

## Purpose

This document defines the Firestore database design for the Productivity Tracker application.

It acts as the source of truth for:
- Collections
- Documents
- Field definitions
- Data types
- Relationships
- Security
- Query patterns
- Future scalability

---

# Database Design Principles

1. Every user owns their own data.
2. Firestore is the single source of truth.
3. Dashboard data is always computed.
4. Duplicate daily entries are prevented using the document ID.
5. Collections should be optimized for Firestore query patterns.
6. The schema should support future AI insights and dashboard customization.

---

# Collection Structure

users/
    {uid}/
        entries/
            {yyyy-mm-dd}

---

# User Document

Path

users/{uid}

Fields

uid
string

name
string

email
string

createdAt
timestamp

timezone
string

onboardingCompleted
boolean

settings
map

goals
map

---

# Settings

theme

dashboardLayout

timezone

Future

notifications

language

---

# Goals

sleep

water

exercise

reading

deepWork

meditation

Future

customGoals

---

# Entries Collection

Path

users/{uid}/entries/{yyyy-mm-dd}

Reason

The document ID is the date.

Benefits

- Prevent duplicate entries.
- No query needed to check if a date exists.
- Easy reads.
- Easy updates.

---

# Entry Fields

(To be finalized after metric discussion.)

---

# Security Rules

Users can only access their own documents.

Authentication is required.

No public writes.

---

# Required Queries

Authentication

Create user

Get current user

Today's Entry

Check if today's document exists.

Create entry.

Update entry.

Delete entry.

Daily Logs

Get entries ordered by date.

Dashboard

Get latest 7 entries.

Get latest 30 entries.

Get entries in a date range.

Future

Custom widgets

Goal progress

AI analysis

CSV export

---

# Future Collections

None currently.

Potential future collections

reports

templates

sharedDashboards

notifications