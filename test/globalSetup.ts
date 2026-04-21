import * as fs from "node:fs";
import * as path from "node:path";
import { startTestDatabase } from "./integration/repositories/helpers/postgres";

const STATE_FILE = path.join(process.cwd(), ".testcontainer-state.json");
const DB_DEBUG = process.env.INTEGRATION_DB_DEBUG === "1";

export default async function globalSetup() {
  // Clear stale state from interrupted/failed previous runs.
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }

  const started = await startTestDatabase();

  if (DB_DEBUG) {
    console.log(
      `[integration-db] globalSetup started postgres container ` +
        `id=${started.containerId} host=${started.host} port=${started.port}`,
    );
    console.log(`[integration-db] globalSetup DATABASE_URL=${started.url}`);
  }

  // Persist info because globalSetup runs in a separate process
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({
      url: started.url,
      containerId: started.containerId,
      host: started.host,
      port: started.port,
      startedAt: new Date().toISOString(),
    }),
    "utf8",
  );
}
