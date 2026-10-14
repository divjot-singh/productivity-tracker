// Read-only field audit of a user's data in the v2 project. Usage: node scripts/audit-data.mjs <uid>
import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const parseEnv = (f) =>
  Object.fromEntries(
    fs.readFileSync(f, "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1)]; }),
  );
const ve = parseEnv(".env.local");
const app = initializeApp({
  credential: cert({
    projectId: ve.FIREBASE_V2_PROJECT_ID,
    clientEmail: ve.FIREBASE_V2_CLIENT_EMAIL,
    privateKey: ve.FIREBASE_V2_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);
const uid = process.argv[2];
if (!uid) throw new Error("uid required");

const typeOf = (v) =>
  v === null ? "null" : Array.isArray(v) ? "array" : v?.toDate ? "timestamp" : typeof v;

for (const col of ["goals", "entries", "workouts", "exercises", "combinations", "visualizations"]) {
  const snap = await db.collection("users").doc(uid).collection(col).get();
  const stats = {};
  for (const d of snap.docs) {
    for (const [k, v] of Object.entries(d.data())) {
      stats[k] ??= { n: 0, types: new Set() };
      stats[k].n += 1;
      stats[k].types.add(typeOf(v));
    }
  }
  console.log(`\n== ${col} (${snap.size}) ==`);
  for (const [k, s] of Object.entries(stats).sort()) {
    const flag = s.n < snap.size ? `  PARTIAL ${s.n}/${snap.size}` : "";
    console.log(`  ${k}: ${[...s.types].join("|")}${flag}`);
  }
}

const entries = await db.collection("users").doc(uid).collection("entries").get();
let withBreakdown = 0, breakdownWeightSums = [];
for (const d of entries.docs) {
  const b = d.data().breakdown;
  if (Array.isArray(b) && b.length) {
    withBreakdown += 1;
    breakdownWeightSums.push(b.reduce((s, m) => s + (m.weight ?? 0), 0));
  }
}
console.log(`\nentries with breakdown: ${withBreakdown}/${entries.size}`);
console.log("distinct sum(breakdown.weight):", [...new Set(breakdownWeightSums)].sort((a, b) => a - b));
const goals = await db.collection("users").doc(uid).collection("goals").get();
console.log("current sum(goal.weight):", goals.docs.reduce((s, d) => s + (d.data().weight ?? 0), 0));
console.log("zero-weight goals:", goals.docs.filter((d) => !d.data().weight).map((d) => d.data().label));
