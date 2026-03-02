import * as fs from "node:fs";
import * as path from "node:path";
import { startTestDatabase } from "./integration/repositories/helpers/postgres";

const STATE_FILE = path.join(process.cwd(), ".testcontainer-state.json");

export default async function globalSetup() {
  const started = await startTestDatabase();

  // Persist info because globalSetup runs in a separate process
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({
      url: started.url,
    }),
    "utf8",
  );
}