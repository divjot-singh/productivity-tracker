import { daysBetween, type UserFacts } from "@/lib/notifications/rules";
import { getEntries } from "@/repositories/entry.server.repository";
import { getGoals } from "@/repositories/goals.server.repository";
import { getWorkouts } from "@/repositories/workouts.server.repository";

function shiftDate(date: string, days: number): string {
  const moment = new Date(`${date}T00:00:00Z`);

  moment.setUTCDate(moment.getUTCDate() + days);

  return moment.toISOString().slice(0, 10);
}

// Reads the last 60 days; only called once a notification is actually due.
export async function loadUserFacts(
  uid: string,
  today: string,
): Promise<UserFacts> {
  const [entries, goals, workouts] = await Promise.all([
    getEntries(uid, today, shiftDate(today, -60)),
    getGoals(uid),
    getWorkouts(uid, { limit: 14 }),
  ]);

  const byDate = new Map(entries.map((entry) => [entry.date, entry]));

  let streak = 0;

  while (byDate.has(shiftDate(today, -(streak + 1)))) {
    streak += 1;
  }

  const latest = entries.find((entry) => entry.date <= today);
  const weightGoal = goals.find(
    (goal) => goal.status !== "archived" && /weight/i.test(goal.label ?? ""),
  );
  const todayEntry = byDate.get(today);

  const weekStart = shiftDate(today, -6);
  const weekEntries = entries.filter(
    (entry) => entry.date >= weekStart && entry.date <= today,
  );
  const percents = weekEntries
    .map((entry) => entry.scorePercent)
    .filter((value): value is number => typeof value === "number");

  return {
    loggedToday: Boolean(todayEntry),
    streak,
    workoutToday: workouts.some((workout) => workout.date === today),
    weighedToday: weightGoal
      ? Number(todayEntry?.values?.[weightGoal.id as string]) > 0
      : null,
    daysSinceLastEntry: latest ? daysBetween(latest.date, today) : null,
    weekly: {
      daysLogged: weekEntries.length,
      averageScorePercent: percents.length
        ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
        : null,
      workouts: workouts.filter(
        (workout) => workout.date >= weekStart && workout.date <= today,
      ).length,
    },
  };
}
