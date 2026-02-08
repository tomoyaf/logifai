import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import type { SessionInfo } from "./types.js";

export function generateSessionId(): string {
  return randomUUID().slice(0, 8);
}

export function getGitBranch(): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", ["rev-parse", "--abbrev-ref", "HEAD"], (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      const branch = stdout.trim();
      resolve(branch || null);
    });
  });
}

export function formatSessionFilename(date: Date, id: string): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `session-${y}${mo}${d}-${h}${mi}${s}-${id}.ndjson`;
}

export async function createSession(): Promise<SessionInfo> {
  const id = generateSessionId();
  const startedAt = new Date();
  const gitBranch = await getGitBranch();
  const filename = formatSessionFilename(startedAt, id);
  return { id, startedAt, filename, gitBranch };
}
