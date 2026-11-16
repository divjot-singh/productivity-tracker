export type NotificationType =
  | "dailyReminder"
  | "streakRisk"
  | "workoutNudge"
  | "missedDays"
  | "weighIn"
  | "weeklySummary"
  | "pr";

export interface TypeSetting {
  enabled: boolean;
  /** Local "HH:mm"; unused for instant types. */
  time: string;
}

export interface NotificationSettings {
  timezone: string;
  types: Record<NotificationType, TypeSetting>;
}

// Last local date each type was sent on.
export type SentLog = Partial<Record<NotificationType, string>>;

export const SCHEDULED_TYPES: NotificationType[] = [
  "dailyReminder",
  "streakRisk",
  "workoutNudge",
  "missedDays",
  "weighIn",
  "weeklySummary",
];

export const TYPE_LABELS: Record<
  NotificationType,
  { title: string; description: string; scheduled: boolean }
> = {
  dailyReminder: {
    title: "Daily log reminder",
    description: "If you haven't logged today.",
    scheduled: true,
  },
  streakRisk: {
    title: "Streak at risk",
    description: "If a streak of 3+ days is about to break.",
    scheduled: true,
  },
  workoutNudge: {
    title: "Workout day nudge",
    description: "Weekdays, if no workout is logged yet.",
    scheduled: true,
  },
  missedDays: {
    title: "Missed days",
    description: "After 2 days without a log, at most every 3 days.",
    scheduled: true,
  },
  weighIn: {
    title: "Weigh-in",
    description: "If today's weight isn't logged.",
    scheduled: true,
  },
  weeklySummary: {
    title: "Weekly summary",
    description: "Sunday recap of your week.",
    scheduled: true,
  },
  pr: {
    title: "Personal records",
    description: "Instantly when you set a new PR.",
    scheduled: false,
  },
};

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const DEFAULT_SETTINGS: NotificationSettings = {
  timezone: DEFAULT_TIMEZONE,
  types: {
    dailyReminder: { enabled: true, time: "21:00" },
    streakRisk: { enabled: true, time: "22:00" },
    workoutNudge: { enabled: true, time: "18:00" },
    missedDays: { enabled: true, time: "12:00" },
    weighIn: { enabled: true, time: "09:00" },
    weeklySummary: { enabled: true, time: "21:30" },
    pr: { enabled: true, time: "00:00" },
  },
};

export function mergeSettings(
  raw: Partial<NotificationSettings> | null | undefined,
): NotificationSettings {
  const types = { ...DEFAULT_SETTINGS.types };

  for (const type of Object.keys(types) as NotificationType[]) {
    types[type] = { ...types[type], ...(raw?.types?.[type] ?? {}) };
  }

  return { timezone: raw?.timezone || DEFAULT_TIMEZONE, types };
}

export interface LocalMoment {
  date: string;
  minutes: number;
  /** 0 = Sunday. */
  weekday: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function localMoment(now: Date, timezone: string): LocalMoment {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
  };
}

export function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return (hours || 0) * 60 + (minutes || 0);
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);

  return Math.round((b - a) / 86_400_000);
}

// A missed cron tick is retried for this long after the scheduled time.
const GRACE_MINUTES = 120;

// Stage 1: cheap check that needs no database reads beyond settings and the sent log.
export function dueByTime(
  moment: LocalMoment,
  settings: NotificationSettings,
  sent: SentLog,
): NotificationType[] {
  return SCHEDULED_TYPES.filter((type) => {
    const setting = settings.types[type];

    if (!setting.enabled) return false;

    const start = parseTime(setting.time);

    if (moment.minutes < start || moment.minutes >= start + GRACE_MINUTES) {
      return false;
    }

    if (
      type === "workoutNudge" &&
      (moment.weekday === 0 || moment.weekday === 6)
    ) {
      return false;
    }

    if (type === "weeklySummary" && moment.weekday !== 0) return false;

    if (type === "missedDays") {
      const last = sent.missedDays;

      return !last || daysBetween(last, moment.date) >= 3;
    }

    return sent[type] !== moment.date;
  });
}

export interface WeeklyStats {
  daysLogged: number;
  averageScorePercent: number | null;
  workouts: number;
}

export interface UserFacts {
  loggedToday: boolean;
  /** Consecutive logged days ending yesterday. */
  streak: number;
  workoutToday: boolean;
  /** null when the user has no weight goal. */
  weighedToday: boolean | null;
  /** Days since the latest entry; null when there are none. */
  daysSinceLastEntry: number | null;
  weekly: WeeklyStats;
}

export interface NotificationMessage {
  type: NotificationType;
  title: string;
  body: string;
  url: string;
}

// Stage 2: facts decide whether a time-due type is actually worth sending.
export function buildMessage(
  type: NotificationType,
  facts: UserFacts,
): NotificationMessage | null {
  switch (type) {
    case "dailyReminder":
      return facts.loggedToday
        ? null
        : {
            type,
            title: "Log your day",
            body: "You haven't logged today yet. It takes a minute.",
            url: "/today",
          };

    case "streakRisk":
      return facts.loggedToday || facts.streak < 3
        ? null
        : {
            type,
            title: `Your ${facts.streak}-day streak is at risk`,
            body: "Log today before midnight to keep it going.",
            url: "/today",
          };

    case "workoutNudge":
      return facts.workoutToday
        ? null
        : {
            type,
            title: "Workout time?",
            body: "No workout logged yet today.",
            url: "/workouts",
          };

    case "missedDays": {
      const days = facts.daysSinceLastEntry;

      return days !== null && days >= 3 && days <= 7
        ? {
            type,
            title: "We miss you",
            body: `It has been ${days} days since your last log. Pick up where you left off.`,
            url: "/today",
          }
        : null;
    }

    case "weighIn":
      return facts.weighedToday === false
        ? {
            type,
            title: "Weigh-in",
            body: "Log this morning's weight.",
            url: "/today",
          }
        : null;

    case "weeklySummary": {
      const { daysLogged, averageScorePercent, workouts } = facts.weekly;
      const score =
        averageScorePercent === null
          ? ""
          : `, avg score ${averageScorePercent}%`;

      return {
        type,
        title: "Your week in review",
        body: `Logged ${daysLogged}/7 days${score}, ${workouts} workout${workouts === 1 ? "" : "s"}.`,
        url: "/dashboard",
      };
    }

    default:
      return null;
  }
}
