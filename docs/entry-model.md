# Daily Entry Model

Each document represents one day's productivity.

Collection

users/{uid}/entries/{yyyy-mm-dd}

---

## Fields

Current entries store goal values in `values`, a map from goal ID to number,
boolean, or string. Scoring uses these values, including defaults for goals
that have not been explicitly answered.

`answeredGoalIds` is an optional array of goal IDs explicitly answered in the
Today view. It is used for ordering and does not change scoring. Entries created
before this field existed have no reliable answer history and are treated as
unanswered until the user answers them again.

The named fields below describe the earlier goal-oriented model; they are not
the current entry storage format.

date
Type: string
Example: 2026-07-26

sleepHours
Type: number

proteinServings
Type: number

weightTraining
Type: boolean

cardioMinutes
Type: number

steps
Type: number

stretching
Type: boolean

healthyEating
Type: boolean

noAlcohol
Type: boolean

primaryGoalProgress
Type: number

helpedWifeExercise
Type: boolean

householdHelp
Type: boolean

wakeTime
Type: string

bedTime
Type: string

oralHygieneCount
Type: number

lifeScore
Type: number

xp
Type: number

createdAt
Type: timestamp

updatedAt
Type: timestamp
