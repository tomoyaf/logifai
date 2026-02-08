import { mkdir, readFile, writeFile, rename, chmod } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir, platform, arch } from "node:os";
import { createHash } from "node:crypto";
import { VERSION } from "./version.js";

const REPO = "tomoyaf/logifai";
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function cacheDir(): string {
  const xdgCache = process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache");
  return join(xdgCache, "logifai");
}

export function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function isCompiledBinary(): boolean {
  const execName = basename(process.execPath);
  // If running via node or bun runtime, it's not a compiled binary
  return !execName.startsWith("node") && !execName.startsWith("bun");
}

function getPlatformTarget(): string {
  const os = platform();
  const cpu = arch();
  const osMap: Record<string, string> = { linux: "linux", darwin: "darwin", win32: "windows" };
  const archMap: Record<string, string> = { x64: "x64", arm64: "arm64" };
  const osName = osMap[os] ?? os;
  const archName = archMap[cpu] ?? cpu;
  return `${osName}-${archName}`;
}

interface UpdateCheckResult {
  latestVersion: string;
  currentVersion: string;
  hasUpdate: boolean;
}

export async function checkForUpdate(): Promise<UpdateCheckResult | null> {
  // Skip in CI
  if (process.env.CI) return null;

  const dir = cacheDir();
  const cacheFile = join(dir, "update-check.json");

  // Check cache
  try {
    const raw = await readFile(cacheFile, "utf8");
    const cached = JSON.parse(raw) as { version: string; checkedAt: number };
    if (Date.now() - cached.checkedAt < CACHE_TTL_MS) {
      return {
        latestVersion: cached.version,
        currentVersion: VERSION,
        hasUpdate: compareSemver(cached.version, VERSION) > 0,
      };
    }
  } catch {
    // Cache miss or invalid
  }

  // Fetch latest release
  try {
    const res = await fetch(RELEASES_URL, {
      headers: { Accept: "application/vnd.github.v3+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name: string };
    const latestVersion = data.tag_name.replace(/^v/, "");

    // Cache result
    await mkdir(dir, { recursive: true });
    await writeFile(cacheFile, JSON.stringify({ version: latestVersion, checkedAt: Date.now() }) + "\n");

    return {
      latestVersion,
      currentVersion: VERSION,
      hasUpdate: compareSemver(latestVersion, VERSION) > 0,
    };
  } catch {
    // Network error — silently return null
    return null;
  }
}

export async function showUpdateNotification(): Promise<void> {
  const result = await checkForUpdate();
  if (!result?.hasUpdate) return;

  const msg = isCompiledBinary()
    ? `  Update available: ${result.currentVersion} → ${result.latestVersion}\n  Run "logifai update" to update\n`
    : `  Update available: ${result.currentVersion} → ${result.latestVersion}\n  Run "npm update -g logifai" to update\n`;

  process.stderr.write(`\n${msg}\n`);
}

export async function performUpdate(): Promise<void> {
  if (!isCompiledBinary()) {
    process.stderr.write(`logifai v${VERSION}\n`);
    process.stderr.write("Installed via npm. Run the following to update:\n\n");
    process.stderr.write("  npm update -g logifai\n\n");
    return;
  }

  process.stderr.write(`logifai v${VERSION} — checking for updates...\n`);

  const result = await checkForUpdate();
  if (!result) {
    process.stderr.write("Could not check for updates. Please try again later.\n");
    return;
  }

  if (!result.hasUpdate) {
    process.stderr.write(`Already up to date (v${VERSION}).\n`);
    return;
  }

  const target = getPlatformTarget();
  const binaryName = platform() === "win32" ? `logifai-${target}.exe` : `logifai-${target}`;
  const downloadUrl = `https://github.com/${REPO}/releases/download/v${result.latestVersion}/${binaryName}`;
  const checksumUrl = `https://github.com/${REPO}/releases/download/v${result.latestVersion}/checksums.txt`;

  process.stderr.write(`Downloading v${result.latestVersion} for ${target}...\n`);

  try {
    // Download binary and checksums in parallel
    const [binaryRes, checksumRes] = await Promise.all([
      fetch(downloadUrl, { signal: AbortSignal.timeout(60000) }),
      fetch(checksumUrl, { signal: AbortSignal.timeout(10000) }),
    ]);

    if (!binaryRes.ok) {
      process.stderr.write(`Error: binary not found for ${target} (HTTP ${binaryRes.status})\n`);
      process.stderr.write(`Download manually from: https://github.com/${REPO}/releases\n`);
      process.exit(1);
    }

    const binaryData = Buffer.from(await binaryRes.arrayBuffer());

    // Verify checksum if available
    if (checksumRes.ok) {
      const checksumText = await checksumRes.text();
      const expectedLine = checksumText.split("\n").find((l) => l.includes(binaryName));
      if (expectedLine) {
        const expectedHash = expectedLine.split(/\s+/)[0];
        const actualHash = createHash("sha256").update(binaryData).digest("hex");
        if (actualHash !== expectedHash) {
          process.stderr.write("Error: checksum verification failed. Download may be corrupted.\n");
          process.exit(1);
        }
        process.stderr.write("Checksum verified.\n");
      }
    }

    // Replace current binary
    const currentPath = process.execPath;
    const tmpPath = currentPath + ".tmp";

    await writeFile(tmpPath, binaryData);
    await chmod(tmpPath, 0o755);
    await rename(tmpPath, currentPath);

    process.stderr.write(`Updated to v${result.latestVersion}.\n`);
  } catch (err) {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
