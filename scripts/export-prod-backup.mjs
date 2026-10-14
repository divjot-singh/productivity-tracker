// Read-only export of every users/* document tree in the prod project to JSON files.
// Usage: node scripts/export-prod-backup.mjs <output-dir>
import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const outDir = process.argv[2];

if (!outDir) throw new Error("output directory is required");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local.backup", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1)];
    }),
);

const db = getFirestore(
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  }),
);

async function dump(docRef) {
  const snapshot = await docRef.get();
  const node = { id: docRef.id, data: snapshot.exists ? snapshot.data() : null, collections: {} };

  for (const collection of await docRef.listCollections()) {
    const docs = await collection.listDocuments();

    node.collections[collection.id] = await Promise.all(docs.map(dump));
  }

  return node;
}

fs.mkdirSync(outDir, { recursive: true });

for (const userRef of await db.collection("users").listDocuments()) {
  const tree = await dump(userRef);
  const file = path.join(outDir, `${userRef.id}.json`);

  fs.writeFileSync(
    file,
    JSON.stringify(tree, (_key, value) => (value?.toDate ? value.toDate().toISOString() : value)),
  );
  console.log(`wrote ${file}`);
}
