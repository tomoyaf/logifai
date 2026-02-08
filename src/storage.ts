import { mkdir, symlink, unlink, stat } from "node:fs/promises";
import { createWriteStream, type WriteStream } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { LogEntry } from "./types.js";

export function logsDir(): string {
  const xdgState = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  return join(xdgState, "logifai", "logs");
}

export async function ensureLogsDir(): Promise<string> {
  const dir = logsDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  return dir;
}

export class NdjsonWriter {
  private stream: WriteStream;
  readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.stream = createWriteStream(filePath, {
      flags: "a",
      mode: 0o600,
    });
  }

  write(entry: LogEntry): void {
    this.stream.write(JSON.stringify(entry) + "\n");
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end((err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export async function updateCurrentSymlink(
  dir: string,
  filename: string
): Promise<void> {
  const linkPath = join(dir, "current.ndjson");
  try {
    await unlink(linkPath);
  } catch (err) {
    // Ignore if symlink doesn't exist
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  await symlink(filename, linkPath);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
