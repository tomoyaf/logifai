import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface RetentionSettings {
  max_total_size_mb: number;
  retention_days: number;
  auto_cleanup: boolean;
}

export const DEFAULT_RETENTION: RetentionSettings = {
  max_total_size_mb: 1024,
  retention_days: 30,
  auto_cleanup: true,
};

export interface Settings {
  language: "en" | "ja";
  retention: RetentionSettings;
}

const DEFAULT_SETTINGS: Settings = { language: "en", retention: { ...DEFAULT_RETENTION } };
const VALID_LANGUAGES = new Set(["en", "ja"]);

export function configDir(): string {
  const xdgConfig =
    process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(xdgConfig, "logifai");
}

function normalizeRetention(raw: unknown): RetentionSettings {
  const defaults = DEFAULT_RETENTION;
  if (!raw || typeof raw !== "object") return { ...defaults };
  const r = raw as Record<string, unknown>;
  return {
    max_total_size_mb:
      typeof r.max_total_size_mb === "number" && r.max_total_size_mb > 0
        ? r.max_total_size_mb
        : defaults.max_total_size_mb,
    retention_days:
      typeof r.retention_days === "number" && r.retention_days > 0
        ? r.retention_days
        : defaults.retention_days,
    auto_cleanup:
      typeof r.auto_cleanup === "boolean"
        ? r.auto_cleanup
        : defaults.auto_cleanup,
  };
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
      const retention = normalizeRetention(parsed.retention);
      return { language: parsed.language, retention };
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
