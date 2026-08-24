import {
  ExerciseCategory,
  ExerciseEquipment,
  ExerciseMuscleGroup,
  ExerciseProgressionStrategy,
  ExerciseType,
  ExerciseWeightTrackingMode,
  ExerciseWeightUnit,
} from "@/lib/workouts/constants";

export type ExerciseTrackingConfig = {
  weight: boolean;
  reps: boolean;
  effort: boolean;
  duration?: boolean;
  distance?: boolean;
};

export interface ExerciseWeightTracking {
  unit: ExerciseWeightUnit;
  mode: ExerciseWeightTrackingMode;
}

export interface ExerciseRepRange {
  min: number;
  max: number;
}

export interface ExerciseProgression {
  repRange: ExerciseRepRange | null;
  strategy: ExerciseProgressionStrategy;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  categories: ExerciseCategory[];
  muscleGroups: ExerciseMuscleGroup[];
  equipment?: ExerciseEquipment;
  type?: ExerciseType;
  description?: string;
  notes: string[];
  tracking: ExerciseTrackingConfig;
  weightTracking: ExerciseWeightTracking;
  progression: ExerciseProgression;
  currentWeight: number | null;
  targetWeight: number | null;
  active: boolean;
}

export interface WorkoutCombination {
  id: string;
  name: string;
  description?: string;
  coachingNotes?: string;
  warmupGuidance?: string;
  exerciseIds: string[];
  active: boolean;
  optionalExercises?: string[];
}

export interface WorkoutSetEntry {
  weight: number | null;
  reps: number | null;
  effort: 1 | 2 | 3 | 4 | 5 | null;
  isWarmup: boolean;
}

export interface WorkoutExerciseEntry {
  exerciseId: string;
  sets: WorkoutSetEntry[];
  notes?: string;
}

export interface WorkoutEntry {
  id: string;
  date: string;
  combinationIds: string[];
  exercises: WorkoutExerciseEntry[];
  notes?: string;
}
