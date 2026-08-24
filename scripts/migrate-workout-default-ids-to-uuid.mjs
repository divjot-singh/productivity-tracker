#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function loadEnvFromDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function getUidArg() {
  const uid = process.argv[2]?.trim();

  if (!uid) {
    throw new Error(
      "Usage: node scripts/migrate-workout-default-ids-to-uuid.mjs <uid>",
    );
  }

  return uid;
}

function getAdminDb() {
  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });

  return getFirestore(app);
}

function extractExportedArraySource(fileText, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = fileText.indexOf(marker);

  if (markerIndex < 0) {
    throw new Error(`Could not find ${exportName} in lib/defaults.ts`);
  }

  const assignmentIndex = fileText.indexOf("=", markerIndex);

  if (assignmentIndex < 0) {
    throw new Error(`Could not find assignment for ${exportName}`);
  }

  const arrayStart = fileText.indexOf("[", assignmentIndex);

  if (arrayStart < 0) {
    throw new Error(`Could not find array start for ${exportName}`);
  }

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = arrayStart; i < fileText.length; i += 1) {
    const ch = fileText[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true;
      continue;
    }

    if (!inDouble && !inTemplate && ch === "'" && inSingle) {
      inSingle = false;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && inDouble) {
      inDouble = false;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && !inTemplate) {
      inTemplate = true;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && inTemplate) {
      inTemplate = false;
      continue;
    }

    if (inSingle || inDouble || inTemplate) {
      continue;
    }

    if (ch === "[") {
      depth += 1;
      continue;
    }

    if (ch === "]") {
      depth -= 1;

      if (depth === 0) {
        return fileText.slice(arrayStart, i + 1);
      }
    }
  }

  throw new Error(`Could not find matching array end for ${exportName}`);
}

function loadDefaults() {
  const defaultsPath = path.join(process.cwd(), "lib", "defaults.ts");
  const defaultsText = readFileSync(defaultsPath, "utf8");

  const combinationsSource = extractExportedArraySource(
    defaultsText,
    "DEFAULT_COMBINATIONS",
  );
  const exercisesSource = extractExportedArraySource(
    defaultsText,
    "DEFAULT_EXERCISES",
  );

  const DEFAULT_COMBINATIONS = Function(`return (${combinationsSource});`)();
  const DEFAULT_EXERCISES = Function(`return (${exercisesSource});`)();

  if (
    !Array.isArray(DEFAULT_COMBINATIONS) ||
    !Array.isArray(DEFAULT_EXERCISES)
  ) {
    throw new Error("Failed to parse defaults arrays from lib/defaults.ts");
  }

  return { DEFAULT_COMBINATIONS, DEFAULT_EXERCISES };
}

function toRows(mapping) {
  return Object.entries(mapping)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([oldId, newId]) => `| ${oldId} | ${newId} |`)
    .join("\n");
}

function hasRecordedSet(setEntry) {
  return setEntry?.weight !== null && setEntry?.reps !== null;
}

async function deleteSubcollectionDocs(adminDb, uid, collectionName) {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection(collectionName)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const chunks = [];
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += 450) {
    chunks.push(docs.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batch = adminDb.batch();
    for (const doc of chunk) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  return snapshot.size;
}

async function run() {
  loadEnvFromDotEnvLocal();

  const uid = getUidArg();
  const now = new Date();
  const adminDb = getAdminDb();
  const { DEFAULT_COMBINATIONS, DEFAULT_EXERCISES } = loadDefaults();

  const exerciseIdMap = {};
  const combinationIdMap = {};

  for (const exercise of DEFAULT_EXERCISES) {
    exerciseIdMap[exercise.id] = randomUUID();
  }

  for (const combination of DEFAULT_COMBINATIONS) {
    combinationIdMap[combination.id] = randomUUID();
  }

  const userRef = adminDb.collection("users").doc(uid);

  const workoutsSnapshot = await userRef.collection("workouts").get();
  const workoutStats = [];

  for (const doc of workoutsSnapshot.docs) {
    const workout = doc.data();

    const patched = {
      ...workout,
      combinationIds: (workout.combinationIds ?? []).map(
        (oldId) => combinationIdMap[oldId] ?? oldId,
      ),
      exercises: (workout.exercises ?? []).map((exerciseEntry) => ({
        ...exerciseEntry,
        exerciseId:
          exerciseIdMap[exerciseEntry.exerciseId] ?? exerciseEntry.exerciseId,
      })),
      updatedAt: now,
    };

    await doc.ref.set(patched, { merge: true });

    const recordedExerciseCount = (patched.exercises ?? []).filter((exercise) =>
      (exercise.sets ?? []).some(hasRecordedSet),
    ).length;

    workoutStats.push({
      date: patched.date,
      recordedExerciseCount,
      totalExerciseCount: patched.exercises?.length ?? 0,
    });
  }

  const deletedExercises = await deleteSubcollectionDocs(
    adminDb,
    uid,
    "exercises",
  );
  const deletedCombinations = await deleteSubcollectionDocs(
    adminDb,
    uid,
    "combinations",
  );

  for (const exercise of DEFAULT_EXERCISES) {
    const nextId = exerciseIdMap[exercise.id];

    await userRef
      .collection("exercises")
      .doc(nextId)
      .set({
        ...exercise,
        id: nextId,
        createdAt: now,
        updatedAt: now,
      });
  }

  for (const combination of DEFAULT_COMBINATIONS) {
    const nextId = combinationIdMap[combination.id];

    await userRef
      .collection("combinations")
      .doc(nextId)
      .set({
        ...combination,
        id: nextId,
        exerciseIds: (combination.exerciseIds ?? []).map(
          (oldExerciseId) => exerciseIdMap[oldExerciseId] ?? oldExerciseId,
        ),
        createdAt: now,
        updatedAt: now,
      });
  }

  const outDir = path.join(process.cwd(), "scripts", "migration-output");
  mkdirSync(outDir, { recursive: true });

  const outFile = path.join(
    outDir,
    `workout-id-mapping-${uid}-${now.toISOString().replace(/[:.]/g, "-")}.md`,
  );

  const markdown = `# Workout UUID Migration\n\n- User UID: ${uid}\n- Migrated at: ${now.toISOString()}\n- Deleted existing exercises: ${deletedExercises}\n- Deleted existing combinations: ${deletedCombinations}\n- Recreated default exercises: ${DEFAULT_EXERCISES.length}\n- Recreated default combinations: ${DEFAULT_COMBINATIONS.length}\n- Patched workout documents: ${workoutsSnapshot.size}\n\n## Exercise ID Map\n\n| Old ID | New UUID |\n| --- | --- |\n${toRows(exerciseIdMap)}\n\n## Combination ID Map\n\n| Old ID | New UUID |\n| --- | --- |\n${toRows(combinationIdMap)}\n\n## Workout Recorded Exercise Counts\n\nCount rule: exercise is counted only when at least one set has both weight and reps present.\n\n| Date | Recorded Exercises | Total Exercises |\n| --- | --- | --- |\n${workoutStats
    .sort((left, right) => String(left.date).localeCompare(String(right.date)))
    .map(
      (item) =>
        `| ${item.date ?? ""} | ${item.recordedExerciseCount} | ${item.totalExerciseCount} |`,
    )
    .join("\n")}\n`;

  writeFileSync(outFile, markdown, "utf8");

  console.log(
    JSON.stringify({ uid, outFile, exerciseIdMap, combinationIdMap }, null, 2),
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
