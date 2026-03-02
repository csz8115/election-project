import * as fs from "node:fs";
import * as path from "node:path";

const STATE_FILE = path.join(process.cwd(), ".testcontainer-state.json");

if (fs.existsSync(STATE_FILE)) {
  const { url } = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as {
    url: string;
  };

  process.env.DATABASE_URL_TEST = url;
}