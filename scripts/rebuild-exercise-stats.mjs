// Rebuilds users/{uid}/exerciseStats from workouts and backfills workouts.exerciseIds.
// Usage: node scripts/rebuild-exercise-stats.mjs --uid <uid> [--project v2|prod] [--dry-run]
import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { buildHistories, computeStats } from "../lib/workouts/exercise-stats.ts";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = args.includes("--dry-run");
const uid = opt("uid");
const project = opt("project") ?? "v2";

if (!uid) throw new Error("--uid is required");

const parseEnv = (file) =>
  Object.fromEntries(
    fs.readFileSync(file, "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1)]; }),
  );

const creds =
  project === "prod"
    ? (() => {
        const e = parseEnv(".env.local.backup");
        return { projectId: e.FIREBASE_PROJECT_ID, clientEmail: e.FIREBASE_CLIENT_EMAIL, privateKey: e.FIREBASE_PRIVATE_KEY };
      })()
    : (() => {
        const e = parseEnv(".env.local");
        return { projectId: e.FIREBASE_V2_PROJECT_ID, clientEmail: e.FIREBASE_V2_CLIENT_EMAIL, privateKey: e.FIREBASE_V2_KEY };
      })();

const app = initializeApp({
  credential: cert({ ...creds, privateKey: creds.privateKey.replace(/\\n/g, "\n") }),
});
const db = getFirestore(app);
const userRef = db.collection("users").doc(uid);

const workoutsSnap = await userRef.collection("workouts").get();
const workouts = workoutsSnap.docs.map((d) => ({ ...d.data(), id: d.id }));

const histories = buildHistories(workouts);
const writer = db.bulkWriter();

for (const [exerciseId, history] of histories) {
  const stats = computeStats(exerciseId, history);
  if (!dryRun) {
    writer.set(userRef.collection("exerciseStats").doc(exerciseId), { ...stats, updatedAt: new Date() });
  }
}

let backfilled = 0;
for (const doc of workoutsSnap.docs) {
  const data = doc.data();
  if (!Array.isArray(data.exerciseIds)) {
    backfilled += 1;
    if (!dryRun) {
      writer.set(doc.ref, { exerciseIds: [...new Set((data.exercises ?? []).map((e) => e.exerciseId))] }, { merge: true });
    }
  }
}

await writer.close();
console.log(
  `${dryRun ? "[dry-run] " : ""}project=${project} workouts=${workouts.length} exercisesWithStats=${histories.size} exerciseIdsBackfilled=${backfilled}`,
);
