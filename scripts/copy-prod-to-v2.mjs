// Read-only on prod; writes only to the v2 project. Usage:
//   node scripts/copy-prod-to-v2.mjs --list
//   node scripts/copy-prod-to-v2.mjs --prod-uid <uid> --target-uid <uid> [--dry-run]
import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const parseEnv = (file) =>
  Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1)];
      }),
  );

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const prodEnv = parseEnv(".env.local.backup");
const v2Env = parseEnv(".env.local");

const makeApp = (name, projectId, clientEmail, privateKey) =>
  initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    },
    name,
  );

const prodApp = makeApp(
  "prod",
  prodEnv.FIREBASE_PROJECT_ID,
  prodEnv.FIREBASE_CLIENT_EMAIL,
  prodEnv.FIREBASE_PRIVATE_KEY,
);
const v2App = makeApp(
  "v2",
  v2Env.FIREBASE_V2_PROJECT_ID,
  v2Env.FIREBASE_V2_CLIENT_EMAIL,
  v2Env.FIREBASE_V2_KEY,
);

if (prodEnv.FIREBASE_PROJECT_ID === v2Env.FIREBASE_V2_PROJECT_ID) {
  throw new Error("prod and v2 project ids are identical; aborting");
}

const prodDb = getFirestore(prodApp);
const v2Db = getFirestore(v2App);

async function countTree(docRef, depth = 0, out = {}) {
  const cols = await docRef.listCollections();
  for (const col of cols) {
    const snap = await col.get();
    const key = col.path.replace(/\/[^/]+\//g, "/*/");
    out[key] = (out[key] ?? 0) + snap.size;
    for (const doc of snap.docs) await countTree(doc.ref, depth + 1, out);
  }
  return out;
}

if (flag("list")) {
  const roots = await prodDb.listCollections();
  console.log("prod top-level collections:", roots.map((c) => c.id));
  const users = await prodDb.collection("users").listDocuments();
  console.log("prod users/ doc ids:", users.map((d) => d.id));
  for (const u of users) {
    console.log(`\ncounts under users/${u.id}:`);
    console.log(await countTree(u));
  }
  const v2Users = await v2Db.collection("users").listDocuments();
  console.log("\nv2 users/ doc ids:", v2Users.map((d) => d.id));
  process.exit(0);
}

const prodUid = opt("prod-uid");
const targetUid = opt("target-uid");
if (!prodUid || !targetUid) throw new Error("--prod-uid and --target-uid are required");
const dryRun = flag("dry-run");

const writer = v2Db.bulkWriter();
let docs = 0;

async function copyDoc(src, dst) {
  const snap = await src.get();
  if (snap.exists) {
    docs += 1;
    if (!dryRun) writer.set(dst, snap.data());
  }
  for (const col of await src.listCollections()) {
    const colSnap = await col.get();
    for (const d of colSnap.docs) {
      await copyDoc(d.ref, dst.collection(col.id).doc(d.id));
    }
  }
}

await copyDoc(prodDb.collection("users").doc(prodUid), v2Db.collection("users").doc(targetUid));
await writer.close();
console.log(`${dryRun ? "[dry-run] would copy" : "copied"} ${docs} documents to v2 users/${targetUid}`);
