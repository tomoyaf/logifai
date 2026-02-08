import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface Settings {
  language: "en" | "ja";
}

const DEFAULT_SETTINGS: Settings = { language: "en" };
const VALID_LANGUAGES = new Set(["en", "ja"]);

export function configDir(): string {
  const xdgConfig =
    process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(xdgConfig, "logifai");
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await readFile(join(configDir(), "settings.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      VALID_LANGUAGES.has(parsed.language)
    ) {
      return { language: parsed.language };
    }
  } catch {
    // File missing or unreadable — return defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const dir = configDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(
    join(dir, "settings.json"),
    JSON.stringify(settings, null, 2) + "\n",
    { mode: 0o600 },
  );
}
