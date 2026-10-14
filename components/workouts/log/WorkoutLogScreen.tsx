"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import ActionBar from "@/components/common/ActionBar";
import DateSelector from "@/components/today/DateSelector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/api/client";
import { localDate } from "@/lib/dates";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import type { ExerciseStats } from "@/lib/workouts/exercise-stats";
import {
  buildExercise,
  createEditorSet,
  detectSetRecords,
  diffCombination,
  fromWorkout,
  isWorkingDone,
  lastSession,
  recentSessions,
  recordsExcluding,
  sessionRecords,
  sessionVolume,
  sortCombinations,
  suggestCombinationChanges,
  toWorkoutExercises,
  workoutVolume,
  type EditorExercise,
} from "@/lib/workouts/session";
import type {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
  WorkoutSetEntry,
} from "@/models/workout";

import AddExerciseSheet from "./AddExerciseSheet";
import CombinationPanel from "./CombinationPanel";
import ExerciseCard from "./ExerciseCard";
import ExerciseInfoSheet from "./ExerciseInfoSheet";
import ExerciseOverviewSheet from "./ExerciseOverviewSheet";
import ExercisePager, { type ExerciseProgress } from "./ExercisePager";
import FinishSummarySheet, { type FinishSummary } from "./FinishSummarySheet";

interface Editor {
  date: string;
  combinationId: string | null;
  exercises: EditorExercise[];
  startedAt?: string;
  finishedAt?: string;
  notes?: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  saving: "Saving...",
  saved: "Saved",
  error: "Not saved",
};

export default function WorkoutLogScreen() {
  const { user } = useRequireAuth();
  const searchParams = useSearchParams();

  const [date, setDate] = useState(
    () => searchParams.get("date") ?? localDate(),
  );
  const [editor, setEditor] = useState<Editor | null>(null);
  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [stats, setStats] = useState<Map<string, ExerciseStats>>(new Map());
  const [baseReady, setBaseReady] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [addOpen, setAddOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [comboBusy, setComboBusy] = useState(false);

  const dirtyRef = useRef(false);
  const savedRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const nameOf = useCallback(
    (id: string) => exerciseMap.get(id)?.name ?? id,
    [exerciseMap],
  );

  // Reference data and history load once per user.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const [combinationData, exerciseData, workoutData, statsData] =
          await Promise.all([
            apiRequest<WorkoutCombination[]>(
              user,
              "/api/combinations?includeInactive=true",
            ),
            apiRequest<ExerciseDefinition[]>(
              user,
              "/api/exercises?includeInactive=true",
            ),
            apiRequest<WorkoutEntry[]>(user, "/api/workouts"),
            apiRequest<ExerciseStats[]>(user, "/api/exercise-stats").catch(
              () => [],
            ),
          ]);

        if (cancelled) return;

        setCombinations(
          sortCombinations(
            (combinationData ?? []).filter((item) => item.active),
          ),
        );
        setExercises((exerciseData ?? []).filter((item) => item.active));
        setWorkouts(workoutData ?? []);
        setStats(
          new Map((statsData ?? []).map((item) => [item.exerciseId, item])),
        );
        setBaseReady(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load workouts",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // The selected day's saved workout.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const workout = await apiRequest<WorkoutEntry | null>(
          user,
          `/api/workouts/${date}`,
        );

        if (cancelled) return;

        dirtyRef.current = false;
        savedRef.current = Boolean(workout);
        setHasSaved(Boolean(workout));
        setSaveState("idle");
        setEditor({
          date,
          combinationId: workout?.combinationIds[0] ?? null,
          exercises: workout ? fromWorkout(workout) : [],
          startedAt: workout?.startedAt,
          finishedAt: workout?.finishedAt,
          notes: workout?.notes,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load workout",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date, user]);

  const persist = useCallback(
    async (current: Editor): Promise<boolean> => {
      if (!user) return false;

      const completed = toWorkoutExercises(current.exercises);

      setSaveState("saving");

      try {
        if (completed.length === 0) {
          if (savedRef.current) {
            await apiRequest(user, `/api/workouts/${current.date}`, {
              method: "DELETE",
            });
            savedRef.current = false;
            setHasSaved(false);
            setWorkouts((previous) =>
              previous.filter((item) => item.date !== current.date),
            );
          }
        } else {
          const payload: WorkoutEntry = {
            id: current.date,
            date: current.date,
            combinationIds: current.combinationId
              ? [current.combinationId]
              : [],
            exercises: completed,
            notes: current.notes,
            startedAt: current.startedAt,
            finishedAt: current.finishedAt,
          };

          await apiRequest(user, `/api/workouts/${current.date}`, {
            method: "PUT",
            body: payload,
          });

          savedRef.current = true;
          setHasSaved(true);
          setWorkouts((previous) => [
            payload,
            ...previous.filter((item) => item.date !== current.date),
          ]);
        }

        if (editorRef.current === current) dirtyRef.current = false;

        setSaveState("saved");

        return true;
      } catch (error) {
        setSaveState("error");
        toast.error(
          error instanceof Error ? error.message : "Could not save workout",
        );

        return false;
      }
    },
    [user],
  );

  useEffect(() => {
    if (!editor || !dirtyRef.current) return;

    const timer = setTimeout(() => void persist(editor), 900);

    return () => clearTimeout(timer);
  }, [editor, persist]);

  // Mobile browsers can freeze the tab when it is backgrounded, so save right away.
  useEffect(() => {
    const flush = () => {
      if (
        document.visibilityState === "hidden" &&
        dirtyRef.current &&
        editorRef.current
      ) {
        void persist(editorRef.current);
      }
    };

    document.addEventListener("visibilitychange", flush);

    return () => document.removeEventListener("visibilitychange", flush);
  }, [persist]);

  const edit = useCallback((update: (current: Editor) => Editor) => {
    dirtyRef.current = true;
    setEditor((current) => (current ? update(current) : current));
  }, []);

  async function changeDate(next: string) {
    if (dirtyRef.current && editorRef.current) await persist(editorRef.current);

    setEditor(null);
    setActiveIndex(0);
    setDate(next);
  }

  function selectCombination(id: string | null) {
    const combination = combinations.find((item) => item.id === id);

    setActiveIndex(0);

    edit((current) => {
      if (!combination) return { ...current, combinationId: null };

      const kept = new Map(
        current.exercises
          .filter((item) => item.sets.some((set) => set.done))
          .map((item) => [item.exerciseId, item]),
      );

      const planned = combination.exerciseIds
        .filter((exerciseId) => exerciseMap.has(exerciseId))
        .map(
          (exerciseId) =>
            kept.get(exerciseId) ??
            buildExercise(
              exerciseId,
              exerciseMap.get(exerciseId),
              lastSession(workouts, exerciseId, current.date),
            ),
        );

      const extras = [...kept.values()].filter(
        (item) => !combination.exerciseIds.includes(item.exerciseId),
      );

      return {
        ...current,
        combinationId: combination.id,
        exercises: [...planned, ...extras],
      };
    });
  }

  function addExercise(exerciseId: string) {
    setActiveIndex(editorRef.current?.exercises.length ?? 0);

    edit((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        buildExercise(
          exerciseId,
          exerciseMap.get(exerciseId),
          lastSession(workouts, exerciseId, current.date),
        ),
      ],
    }));
  }

  function updateExercise(
    index: number,
    update: (item: EditorExercise) => EditorExercise,
  ) {
    edit((current) => ({
      ...current,
      exercises: current.exercises.map((item, i) =>
        i === index ? update(item) : item,
      ),
    }));
  }

  function changeSet(
    exerciseIndex: number,
    setIndex: number,
    partial: Partial<WorkoutSetEntry>,
  ) {
    updateExercise(exerciseIndex, (item) => ({
      ...item,
      sets: item.sets.map((set, i) =>
        i === setIndex ? { ...set, ...partial } : set,
      ),
    }));
  }

  function toggleDone(exerciseIndex: number, setIndex: number) {
    const current = editorRef.current;
    const item = current?.exercises[exerciseIndex];
    const set = item?.sets[setIndex];

    if (!current || !item || !set) return;

    if (!set.done) {
      const unit =
        exerciseMap.get(item.exerciseId)?.weightTracking.unit ?? "kg";
      const flags = detectSetRecords(
        set,
        recordsExcluding(stats.get(item.exerciseId), current.date),
        item.sets.filter((other) => other.done),
      );

      if (flags.weightPr) {
        toast.success(
          `New PR: ${nameOf(item.exerciseId)} ${set.weight} ${unit}`,
        );
      } else if (flags.oneRmPr) {
        toast.success(`New best estimated 1RM: ${nameOf(item.exerciseId)}`);
      }
    }

    edit((state) => ({
      ...state,
      startedAt:
        state.startedAt ?? (set.done ? undefined : new Date().toISOString()),
      exercises: state.exercises.map((entry, i) =>
        i === exerciseIndex
          ? {
              ...entry,
              sets: entry.sets.map((s, j) =>
                j === setIndex ? { ...s, done: !s.done } : s,
              ),
            }
          : entry,
      ),
    }));
  }

  function addSet(exerciseIndex: number) {
    updateExercise(exerciseIndex, (item) => {
      const previous = item.sets[item.sets.length - 1];

      return {
        ...item,
        sets: [
          ...item.sets,
          createEditorSet(
            previous
              ? {
                  weight: previous.weight,
                  reps: previous.reps,
                  effort: previous.effort,
                }
              : {},
          ),
        ],
      };
    });
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    edit((current) => ({
      ...current,
      exercises: current.exercises.flatMap((item, i) => {
        if (i !== exerciseIndex) return [item];

        const sets = item.sets.filter((_, j) => j !== setIndex);

        return sets.length > 0 ? [{ ...item, sets }] : [];
      }),
    }));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setActiveIndex(index + direction);

    edit((current) => {
      const next = [...current.exercises];
      const target = index + direction;

      if (target < 0 || target >= next.length) return current;

      [next[index], next[target]] = [next[target], next[index]];

      return { ...current, exercises: next };
    });
  }

  function removeExercise(index: number) {
    const snapshot = editorRef.current;

    edit((current) => ({
      ...current,
      exercises: current.exercises.filter((_, i) => i !== index),
    }));

    if (snapshot) {
      toast("Exercise removed", {
        action: {
          label: "Undo",
          onClick: () => edit(() => snapshot),
        },
      });
    }
  }

  async function deleteWorkout() {
    const snapshot = editorRef.current;

    if (!user || !snapshot) return;

    try {
      await apiRequest(user, `/api/workouts/${snapshot.date}`, {
        method: "DELETE",
      });
    } catch {
      toast.error("Could not delete the workout");

      return;
    }

    savedRef.current = false;
    dirtyRef.current = false;
    setHasSaved(false);
    setSaveState("idle");
    setWorkouts((previous) =>
      previous.filter((item) => item.date !== snapshot.date),
    );
    setEditor({ date: snapshot.date, combinationId: null, exercises: [] });

    toast("Workout deleted", {
      action: { label: "Undo", onClick: () => edit(() => snapshot) },
    });
  }

  async function finish() {
    const current = editorRef.current;

    if (!user || !current) return;

    if (!current.exercises.some((item) => item.sets.some((set) => set.done))) {
      toast.error("Complete at least one set first.");

      return;
    }

    const finishedAt = new Date().toISOString();
    const next: Editor = {
      ...current,
      finishedAt,
      startedAt: current.startedAt ?? finishedAt,
    };

    dirtyRef.current = true;
    setEditor(next);
    editorRef.current = next;

    if (!(await persist(next))) return;

    const records = sessionRecords(next.exercises, stats, next.date).map(
      (record) => {
        const unit =
          exerciseMap.get(record.exerciseId)?.weightTracking.unit ?? "kg";

        return {
          name: nameOf(record.exerciseId),
          label:
            record.kind === "weight"
              ? `${record.value} ${unit}`
              : record.kind === "1rm"
                ? `est. 1RM ${record.value}`
                : `session volume ${Math.round(record.value)}`,
        };
      },
    );

    const comboName =
      combinations.find((item) => item.id === next.combinationId)?.name ?? null;
    const previous = next.combinationId
      ? workouts
          .filter(
            (item) =>
              item.combinationIds.includes(next.combinationId as string) &&
              item.date < next.date,
          )
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : undefined;

    setSummary({
      durationMs: next.startedAt
        ? Date.parse(finishedAt) - Date.parse(next.startedAt)
        : null,
      volume: sessionVolume(next.exercises),
      sets: next.exercises.reduce(
        (sum, item) => sum + item.sets.filter(isWorkingDone).length,
        0,
      ),
      exercises: toWorkoutExercises(next.exercises).length,
      records,
      comboName,
      previousVolume: previous ? workoutVolume(previous) : null,
    });
    setSummaryOpen(true);

    apiRequest<ExerciseStats[]>(user, "/api/exercise-stats")
      .then((data) =>
        setStats(new Map(data.map((item) => [item.exerciseId, item]))),
      )
      .catch(() => undefined);
  }

  const selectedCombination =
    combinations.find((item) => item.id === editor?.combinationId) ?? null;

  const comboExerciseIds = useMemo(
    () =>
      selectedCombination?.exerciseIds.filter((id) => exerciseMap.has(id)) ??
      [],
    [selectedCombination, exerciseMap],
  );

  const diff = useMemo(
    () =>
      selectedCombination && editor
        ? diffCombination(
            comboExerciseIds,
            editor.exercises.map((item) => item.exerciseId),
          )
        : null,
    [selectedCombination, comboExerciseIds, editor],
  );

  const suggestions = useMemo(() => {
    if (!selectedCombination) return null;

    const result = suggestCombinationChanges(selectedCombination, workouts);

    return {
      ...result,
      add: result.add.filter((item) => exerciseMap.has(item.exerciseId)),
      remove: result.remove.filter((item) => exerciseMap.has(item.exerciseId)),
    };
  }, [selectedCombination, workouts, exerciseMap]);

  async function patchCombination(
    combination: WorkoutCombination,
    exerciseIds: string[],
  ) {
    if (!user) return;

    setComboBusy(true);

    try {
      const updated = await apiRequest<WorkoutCombination>(
        user,
        `/api/combinations/${combination.id}`,
        { method: "PATCH", body: { exerciseIds } },
      );

      setCombinations((previous) =>
        previous.map((item) =>
          item.id === combination.id ? { ...item, ...updated } : item,
        ),
      );
      toast.success(`${combination.name} updated`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the combination",
      );
    } finally {
      setComboBusy(false);
    }
  }

  async function updateCombinationFromWorkout() {
    if (!selectedCombination || !editor) return;

    const inactive = selectedCombination.exerciseIds.filter(
      (id) => !exerciseMap.has(id),
    );

    await patchCombination(selectedCombination, [
      ...editor.exercises.map((item) => item.exerciseId),
      ...inactive,
    ]);
  }

  async function saveAsNewCombination(name: string) {
    if (!user || !editor) return;

    setComboBusy(true);

    try {
      const created = await apiRequest<WorkoutCombination>(
        user,
        "/api/combinations",
        {
          method: "POST",
          body: {
            name,
            exerciseIds: editor.exercises.map((item) => item.exerciseId),
            active: true,
          },
        },
      );

      setCombinations((previous) => sortCombinations([...previous, created]));
      edit((current) => ({ ...current, combinationId: created.id }));
      toast.success(`${name} saved`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save the combination",
      );
    } finally {
      setComboBusy(false);
    }
  }

  async function applySuggestion(kind: "add" | "remove", exerciseId: string) {
    if (!selectedCombination) return;

    const ids =
      kind === "add"
        ? [...selectedCombination.exerciseIds, exerciseId]
        : selectedCombination.exerciseIds.filter((id) => id !== exerciseId);

    await patchCombination(selectedCombination, ids);

    if (
      kind === "add" &&
      !editor?.exercises.some((item) => item.exerciseId === exerciseId)
    ) {
      addExercise(exerciseId);
    }
  }

  if (!baseReady || !editor || editor.date !== date) {
    return (
      <div className="space-y-3 px-4 pt-3">
        <div className="bg-muted h-10 animate-pulse rounded-lg" />
        <div className="bg-muted h-9 animate-pulse rounded-full" />
        <div className="bg-muted h-56 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const doneSets = editor.exercises.reduce(
    (sum, item) => sum + item.sets.filter(isWorkingDone).length,
    0,
  );
  const volume = Math.round(sessionVolume(editor.exercises));
  const usedIds = new Set(editor.exercises.map((item) => item.exerciseId));
  const count = editor.exercises.length;
  const active = Math.min(activeIndex, Math.max(0, count - 1));
  const current = editor.exercises[active];
  const progress: ExerciseProgress[] = editor.exercises.map((item) => {
    const done = item.sets.filter((set) => set.done).length;

    return done === 0 ? "none" : done === item.sets.length ? "done" : "partial";
  });

  return (
    <div className="space-y-3 px-4 pt-3 pb-6">
      <DateSelector
        selectedDate={date}
        hasEntry={hasSaved}
        entryDates={new Set(workouts.map((item) => item.date))}
        onChange={(next) => void changeDate(next)}
      />

      <CombinationPanel
        combinations={combinations}
        selectedId={editor.combinationId}
        onSelect={selectCombination}
        nameOf={nameOf}
        diff={diff}
        suggestions={suggestions}
        busy={comboBusy}
        onUpdate={() => void updateCombinationFromWorkout()}
        onSaveAsNew={(name) => void saveAsNewCombination(name)}
        onApplySuggestion={(kind, id) => void applySuggestion(kind, id)}
      />

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {doneSets} working sets - {volume} volume
          {SAVE_LABEL[saveState] ? ` - ${SAVE_LABEL[saveState]}` : ""}
        </span>

        {hasSaved ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Workout options"
                  className="active:bg-accent flex h-8 w-8 items-center justify-center rounded-lg"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void deleteWorkout()}
              >
                Delete workout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {count === 0 ? (
        <div className="bg-card space-y-3 rounded-2xl border p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Pick a combination above or add an exercise to start.
          </p>

          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add exercise
          </Button>
        </div>
      ) : (
        <>
          <ExercisePager
            index={active}
            total={count}
            progress={progress}
            onChange={setActiveIndex}
            onOverview={() => setOverviewOpen(true)}
          />

          {current ? (
            <ExerciseCard
              key={current.key}
              entry={current}
              definition={exerciseMap.get(current.exerciseId)}
              last={lastSession(workouts, current.exerciseId, editor.date)}
              records={recordsExcluding(
                stats.get(current.exerciseId),
                editor.date,
              )}
              canMoveUp={active > 0}
              canMoveDown={active < count - 1}
              onInfo={() => setInfoOpen(true)}
              onSetChange={(setIndex, partial) =>
                changeSet(active, setIndex, partial)
              }
              onToggleDone={(setIndex) => toggleDone(active, setIndex)}
              onRemoveSet={(setIndex) => removeSet(active, setIndex)}
              onAddSet={() => addSet(active)}
              onMove={(direction) => moveExercise(active, direction)}
              onRemove={() => removeExercise(active)}
            />
          ) : null}

          {active < count - 1 && doneSets > 0 ? (
            <button
              type="button"
              onClick={() => void finish()}
              className="text-muted-foreground w-full py-1 text-center text-sm underline"
            >
              Finish workout now
            </button>
          ) : null}

          <ActionBar>
            <Button
              variant="outline"
              className="h-12 flex-1"
              disabled={active === 0}
              onClick={() => setActiveIndex(active - 1)}
            >
              Previous
            </Button>

            {active === count - 1 ? (
              <Button
                className="h-12 flex-1"
                disabled={doneSets === 0}
                onClick={() => void finish()}
              >
                Finish workout
              </Button>
            ) : (
              <Button
                className="h-12 flex-1"
                onClick={() => setActiveIndex(active + 1)}
              >
                Next exercise
              </Button>
            )}
          </ActionBar>
        </>
      )}

      <ExerciseInfoSheet
        open={infoOpen}
        onOpenChange={setInfoOpen}
        definition={current ? exerciseMap.get(current.exerciseId) : undefined}
        records={recordsExcluding(
          current ? stats.get(current.exerciseId) : undefined,
          editor.date,
        )}
        history={
          current
            ? recentSessions(workouts, current.exerciseId, editor.date, 3)
            : []
        }
      />

      <ExerciseOverviewSheet
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
        items={editor.exercises.map((item) => ({
          name: nameOf(item.exerciseId),
          done: item.sets.filter((set) => set.done).length,
          total: item.sets.length,
        }))}
        activeIndex={active}
        onPick={setActiveIndex}
        onAdd={() => setAddOpen(true)}
      />

      <AddExerciseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        exercises={exercises.filter((item) => !usedIds.has(item.id))}
        onPick={addExercise}
      />

      <FinishSummarySheet
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={summary}
      />
    </div>
  );
}
