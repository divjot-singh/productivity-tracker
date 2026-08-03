import fs from "fs";
import path from "path";

import { DailyEntry } from "@/models/entry";

export function saveMockEntries(entries: DailyEntry[]) {
  const filePath = path.join(process.cwd(), "generated-entries.json");

  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), "utf-8");

  console.log(`Mock entries saved: ${filePath}`);
}
