import * as fs from "node:fs";
import * as path from "node:path";

const STATE_FILE = path.join(process.cwd(), ".testcontainer-state.json");
const DB_DEBUG = process.env.INTEGRATION_DB_DEBUG === "1";

if (fs.existsSync(STATE_FILE)) {
  const { url, containerId, host, port } = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as {
    url: string;
    containerId?: string;
    host?: string;
    port?: number;
  };

  // Keep both vars aligned so Prisma runtime/CLI cannot drift to .env DB.
  process.env.DATABASE_URL_TEST = url;
  process.env.DATABASE_URL = url;

  if (DB_DEBUG) {
    console.log(
      `[integration-db] envSetup loaded state ` +
        `id=${containerId ?? "unknown"} host=${host ?? "unknown"} port=${port ?? "unknown"}`,
    );
    console.log(`[integration-db] envSetup DATABASE_URL=${url}`);
  }
} else {
  // Avoid accidentally reusing stale shell-level vars.
  delete process.env.DATABASE_URL_TEST;
  delete process.env.DATABASE_URL;

  if (DB_DEBUG) {
    console.warn(`[integration-db] envSetup missing ${STATE_FILE}`);
  }
}
