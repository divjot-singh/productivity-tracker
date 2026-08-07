"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";

import AppShell from "@/components/layout/AppShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DailyEntry, EntryValue } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full appearance-none rounded-[10px] border px-3 text-sm transition outline-none focus:ring-1";

type RowValue = EntryValue | "";

const EMPTY_OPTION_VALUE = "__EMPTY__";

export default function BackfillPage() {
  const { user } = useRequireAuth();

  const [goals, setGoals] = useState<MetricDefinition[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<
    Record<string, DailyEntry>
  >({});
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [startDate, setStartDate] = useState(() =>
    format(subDays(new Date(), 6), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [draftValues, setDraftValues] = useState<Record<string, RowValue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const [goalsResponse, entriesResponse] = await Promise.all([
          apiRequest<MetricDefinition[]>(user, "/api/goals"),
          apiRequest<DailyEntry[]>(user, "/api/entries"),
        ]);

        const zeroWeightGoals = goalsResponse.filter(
          (goal) => goal.weight === 0,
        );

        setGoals(zeroWeightGoals);

        const byDate = entriesResponse.reduce(
          (acc, entry) => {
            acc[entry.date] = entry;
            return acc;
          },
          {} as Record<string, DailyEntry>,
        );

        setEntriesByDate(byDate);

        if (zeroWeightGoals.length > 0) {
          setSelectedGoalId((previous) => previous || zeroWeightGoals[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load backfill data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const selectedGoal = useMemo(() => {
    return goals.find((goal) => goal.id === selectedGoalId) ?? null;
  }, [goals, selectedGoalId]);

  const dates = useMemo(() => {
    if (!selectedGoal || !startDate || !endDate || startDate > endDate) {
      return [];
    }

    return getDatesInRange(startDate, endDate);
  }, [selectedGoal, startDate, endDate]);

  function getDraftKey(goalId: string, date: string) {
    return `${goalId}:${date}`;
  }

  function getRowValue(date: string): RowValue {
    if (!selectedGoal) {
      return "";
    }

    const draftKey = getDraftKey(selectedGoal.id, date);

    if (Object.prototype.hasOwnProperty.call(draftValues, draftKey)) {
      return draftValues[draftKey] ?? "";
    }

    return getExistingGoalValue(entriesByDate[date], selectedGoal.id);
  }

  function updateRowValue(date: string, value: RowValue) {
    if (!selectedGoal) {
      return;
    }

    const draftKey = getDraftKey(selectedGoal.id, date);

    setDraftValues((previous) => ({
      ...previous,
      [draftKey]: value,
    }));
  }

  async function handleSave() {
    if (!user || !selectedGoal) {
      return;
    }

    const filledRows = dates
      .map((date) => ({ date, value: getRowValue(date) }))
      .filter((row) => row.value !== "");

    if (filledRows.length === 0) {
      toast.error("Add at least one value to save");
      return;
    }

    try {
      setSaving(true);

      for (const row of filledRows) {
        const existingValues = entriesByDate[row.date]?.values ?? {};

        await apiRequest(user, "/api/entries", {
          method: "POST",
          body: {
            date: row.date,
            values: {
              ...existingValues,
              [selectedGoal.id]: row.value,
            },
          },
        });
      }

      const refreshedEntries = await apiRequest<DailyEntry[]>(
        user,
        "/api/entries",
      );
      const refreshedByDate = refreshedEntries.reduce(
        (acc, entry) => {
          acc[entry.date] = entry;
          return acc;
        },
        {} as Record<string, DailyEntry>,
      );

      setEntriesByDate(refreshedByDate);
      setDraftValues({});
      toast.success(
        `Saved ${filledRows.length} ${filledRows.length === 1 ? "entry" : "entries"}`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to save backfill values");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">
          Loading backfill...
        </div>
      </AppShell>
    );
  }

  if (goals.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
          <div className="bg-card rounded-2xl border p-8 text-center">
            <h1 className="text-xl font-semibold">No zero-weight goals</h1>

            <p className="text-muted-foreground mt-2 text-sm">
              Backfill is available only for goals with weight set to 0.
            </p>

            <Link
              href="/settings"
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              Go to settings
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm space-y-6 px-4 pt-4 pb-28">
        <div>
          <h1 className="text-3xl font-bold">Backfill</h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Fill historical values for zero-weight goals
          </p>
        </div>

        <div className="bg-card space-y-4 rounded-2xl border p-4">
          <div className="space-y-2">
            <Label>Goal (weight = 0)</Label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className={NATIVE_SELECT_CLASS}
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {startDate > endDate && (
          <p className="text-sm text-red-500">
            Start date must be before end date.
          </p>
        )}

        {selectedGoal && dates.length > 0 && (
          <div className="bg-card overflow-hidden rounded-2xl border">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">{selectedGoal.label}</h2>
              <p className="text-muted-foreground text-xs">
                {dates.length} {dates.length === 1 ? "day" : "days"}
              </p>
            </div>

            <div className="max-h-[50dvh] overflow-y-auto">
              <div className="space-y-3 p-4">
                {dates.map((date) => (
                  <div key={date} className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Date
                      </Label>
                      <Input type="date" value={date} disabled />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Value
                      </Label>
                      {renderValueInput(
                        selectedGoal,
                        getRowValue(date),
                        (nextValue) => updateRowValue(date, nextValue),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving || dates.length === 0}>
            {saving ? "Saving..." : "Save backfill"}
          </Button>

          <Link
            href="/logs"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to logs
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function renderValueInput(
  goal: MetricDefinition,
  value: RowValue,
  onChange: (value: RowValue) => void,
) {
  if (goal.scoring.type === "boolean") {
    const selectValue =
      value === "" ? EMPTY_OPTION_VALUE : String(Boolean(value));

    return (
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === EMPTY_OPTION_VALUE) {
            onChange("");
            return;
          }

          onChange(e.target.value === "true");
        }}
        className={NATIVE_SELECT_CLASS}
      >
        <option value={EMPTY_OPTION_VALUE}>Not set</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (goal.scoring.type === "options" && goal.scoring.options?.length) {
    const selectValue =
      value === "" ? EMPTY_OPTION_VALUE : JSON.stringify(value);

    return (
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === EMPTY_OPTION_VALUE) {
            onChange("");
            return;
          }

          try {
            onChange(JSON.parse(e.target.value) as EntryValue);
          } catch {
            onChange("");
          }
        }}
        className={NATIVE_SELECT_CLASS}
      >
        <option value={EMPTY_OPTION_VALUE}>Not set</option>
        {goal.scoring.options.map((option) => (
          <option
            key={String(option.value)}
            value={JSON.stringify(option.value)}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (goal.type === "time" || goal.scoring.type === "time-range") {
    return (
      <Input
        type="time"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : e.target.value)}
      />
    );
  }

  return (
    <Input
      type="number"
      inputMode="decimal"
      value={value === "" ? "" : Number(value)}
      onChange={(e) =>
        onChange(e.target.value === "" ? "" : Number(e.target.value))
      }
    />
  );
}

function getExistingGoalValue(
  entry: DailyEntry | undefined,
  goalId: string,
): RowValue {
  if (!entry) {
    return "";
  }

  const value = entry.values?.[goalId];

  return value === undefined ? "" : value;
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(format(current, "yyyy-MM-dd"));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
