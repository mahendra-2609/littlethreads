import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Minimal .env loader so the project needs no dotenv dependency.
 * Existing environment variables always win, so hosting platforms override the file.
 */
try {
  const text = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // No .env file — rely on the real environment.
}
