import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const STATE_FILE = path.join(process.cwd(), ".testcontainer-state.json");
const DB_DEBUG = process.env.INTEGRATION_DB_DEBUG === "1";

export default async function globalTeardown() {
  let containerId: string | undefined;

  if (fs.existsSync(STATE_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as {
      containerId?: string;
    };
    containerId = parsed.containerId;
  }

  try {
    // Stop only this run's container to avoid killing other test runs.
    if (containerId) {
      if (DB_DEBUG) {
        console.log(`[integration-db] globalTeardown stopping container id=${containerId}`);
      }
      execSync(`docker stop ${containerId}`, { stdio: "ignore" });
    }
  } catch (error) {
    // Do not keep stale state if docker stop fails (e.g. daemon unavailable).
    console.warn("globalTeardown warning: failed to stop test DB container", error);
  } finally {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
  }
}
