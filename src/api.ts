import { readdir, stat, readlink } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { logsDir } from "./storage.js";
import type { LiveCapture } from "./live-capture.js";
import type { LogEntry } from "./types.js";

// session-YYYYMMDD-HHMMSS-{id}.ndjson
const SESSION_RE = /^session-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-([a-f0-9]+)\.ndjson$/;

export interface ApiContext {
  liveCapture: LiveCapture | null;
}

interface SessionMeta {
  id: string;
  startedAt: string;
  filename: string;
  size: number;
}

export async function handleSessions(
  _req: IncomingMessage,
  res: ServerResponse,
  ctx: ApiContext
): Promise<void> {
  const dir = logsDir();
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    json(res, 200, { sessions: [], liveSessionId: null });
    return;
  }

  const sessions: SessionMeta[] = [];
  for (const f of files) {
    const m = f.match(SESSION_RE);
    if (!m) continue;
    const [, y, mo, d, h, mi, s, id] = m;
    const startedAt = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
    try {
      const st = await stat(join(dir, f));
      sessions.push({ id, startedAt, filename: f, size: st.size });
    } catch {
      sessions.push({ id, startedAt, filename: f, size: 0 });
    }
  }

  // Sort newest first
  sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const liveSessionId = ctx.liveCapture?.sessionId || null;
  json(res, 200, { sessions, liveSessionId });
}

export async function handleEntries(
  req: IncomingMessage,
  res: ServerResponse,
  sessionId: string,
  _ctx: ApiContext
): Promise<void> {
  const dir = logsDir();
  const filePath = await resolveSessionFile(dir, sessionId);
  if (!filePath) {
    json(res, 404, { error: "Session not found" });
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
  const limit = Math.min(5000, Math.max(1, parseInt(url.searchParams.get("limit") || "500", 10) || 500));
  const levelFilter = url.searchParams.get("level")?.split(",") || null;
  const searchFilter = url.searchParams.get("search")?.toLowerCase() || null;

  const entries: LogEntry[] = [];
  let total = 0;
  let skipped = 0;

  try {
    const stream = createReadStream(filePath, { encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line) as LogEntry;

        // Apply server-side filters
        if (levelFilter && !levelFilter.includes(entry.level)) continue;
        if (searchFilter && !entry.message.toLowerCase().includes(searchFilter)) continue;

        total++;
        if (skipped < offset) {
          skipped++;
          continue;
        }
        if (entries.length < limit) {
          entries.push(entry);
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    json(res, 500, { error: "Failed to read session file" });
    return;
  }

  json(res, 200, { entries, total, offset, limit });
}

export function handleStream(
  _req: IncomingMessage,
  res: ServerResponse,
  sessionId: string,
  ctx: ApiContext
): void {
  const liveCapture = ctx.liveCapture;
  if (!liveCapture || liveCapture.sessionId !== sessionId) {
    json(res, 404, { error: "No live session with this ID" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const onEntry = (entry: LogEntry): void => {
    res.write(`event: entry\ndata: ${JSON.stringify(entry)}\n\n`);
  };

  const onEnd = (): void => {
    res.write("event: end\ndata: {}\n\n");
    cleanup();
    res.end();
  };

  const keepalive = setInterval(() => {
    res.write(":keepalive\n\n");
  }, 30_000);

  const cleanup = (): void => {
    clearInterval(keepalive);
    liveCapture.off("entry", onEntry);
    liveCapture.off("end", onEnd);
  };

  liveCapture.on("entry", onEntry);
  liveCapture.on("end", onEnd);

  res.on("close", cleanup);
}

async function resolveSessionFile(
  dir: string,
  sessionId: string
): Promise<string | null> {
  // "current" resolves the symlink
  if (sessionId === "current") {
    try {
      const target = await readlink(join(dir, "current.ndjson"));
      return join(dir, target);
    } catch {
      return null;
    }
  }

  // Find session file by ID
  try {
    const files = await readdir(dir);
    for (const f of files) {
      const m = f.match(SESSION_RE);
      if (m && m[7] === sessionId) {
        return join(dir, f);
      }
    }
  } catch {
    // dir doesn't exist
  }
  return null;
}

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}
