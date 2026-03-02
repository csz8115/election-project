import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const STATE_FILE = path.join(process.cwd(), ".testcontainer-state.json");

export default async function globalTeardown() {
  // Just stop all containers started by testcontainers
  // (testcontainers labels them automatically)
  execSync("docker ps -q --filter label=org.testcontainers | xargs -r docker stop", {
    stdio: "inherit",
  });

  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}