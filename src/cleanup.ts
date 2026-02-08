import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { logsDir } from "./storage.js";
import { loadSettings } from "./settings.js";
import { SESSION_RE } from "./api.js";

export interface CleanupOptions {
  maxAgeDays?: number;
  maxTotalBytes?: number;
  protectedSessionIds?: Set<string>;
  dryRun?: boolean;
}

export interface CleanupResult {
  deletedFiles: string[];
  deletedCount: number;
  freedBytes: number;
}

interface SessionFile {
  filename: string;
  id: string;
  startedAt: Date;
  size: number;
}

export function parseDuration(s: string): number {
  const m = s.match(/^(\d+)\s*d$/i);
  if (!m) throw new Error(`Invalid duration: "${s}" (expected format: "30d")`);
  return parseInt(m[1], 10);
}

export function parseSize(s: string): number {
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(M|G|MB|GB)$/i);
  if (!m) throw new Error(`Invalid size: "${s}" (expected format: "500M" or "1G")`);
  const value = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  if (unit === "G" || unit === "GB") return Math.round(value * 1024 * 1024 * 1024);
  return Math.round(value * 1024 * 1024);
}

export async function performCleanup(options: CleanupOptions): Promise<CleanupResult> {
  const dir = logsDir();
  const protectedIds = options.protectedSessionIds ?? new Set<string>();

  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return { deletedFiles: [], deletedCount: 0, freedBytes: 0 };
  }

  // Collect session files with metadata
  const sessions: SessionFile[] = [];
  for (const f of files) {
    const m = f.match(SESSION_RE);
    if (!m) continue;
    const [, y, mo, d, h, mi, s, id] = m;
    const startedAt = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
    try {
      const st = await stat(join(dir, f));
      sessions.push({ filename: f, id, startedAt, size: st.size });
    } catch {
      // File disappeared — skip
    }
  }

  // Sort oldest first
  sessions.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

  const toDelete = new Set<string>();

  // Phase A: mark sessions older than maxAgeDays
  if (options.maxAgeDays !== undefined && options.maxAgeDays >= 0) {
    const cutoff = new Date(Date.now() - options.maxAgeDays * 24 * 60 * 60 * 1000);
    for (const s of sessions) {
      if (s.startedAt < cutoff && !protectedIds.has(s.id)) {
        toDelete.add(s.filename);
      }
    }
  }

  // Phase B: enforce total size limit
  if (options.maxTotalBytes !== undefined && options.maxTotalBytes > 0) {
    // Calculate remaining size (excluding already-marked files)
    const remaining = sessions.filter((s) => !toDelete.has(s.filename));
    let totalSize = remaining.reduce((sum, s) => sum + s.size, 0);

    // Delete oldest first until under limit
    for (const s of remaining) {
      if (totalSize <= options.maxTotalBytes) break;
      if (protectedIds.has(s.id)) continue;
      toDelete.add(s.filename);
      totalSize -= s.size;
    }
  }

  // Protection: always keep at least 1 session
  const survivingCount = sessions.filter((s) => !toDelete.has(s.filename)).length;
  if (survivingCount === 0 && sessions.length > 0) {
    // Remove the newest session from deletion set
    const newest = sessions[sessions.length - 1];
    toDelete.delete(newest.filename);
  }

  // Execute deletions
  const deletedFiles: string[] = [];
  let freedBytes = 0;

  for (const s of sessions) {
    if (!toDelete.has(s.filename)) continue;
    if (options.dryRun) {
      deletedFiles.push(s.filename);
      freedBytes += s.size;
      continue;
    }
    try {
      await unlink(join(dir, s.filename));
      deletedFiles.push(s.filename);
      freedBytes += s.size;
    } catch (err) {
      // ENOENT is fine (concurrent deletion)
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        // Skip other errors silently
      }
    }
  }

  return { deletedFiles, deletedCount: deletedFiles.length, freedBytes };
}

export async function autoCleanup(protectedSessionIds?: Set<string>): Promise<void> {
  try {
    const settings = await loadSettings();
    if (!settings.retention.auto_cleanup) return;

    await performCleanup({
      maxAgeDays: settings.retention.retention_days,
      maxTotalBytes: settings.retention.max_total_size_mb * 1024 * 1024,
      protectedSessionIds,
    });
  } catch {
    // Swallow errors — never block capture startup
  }
}
