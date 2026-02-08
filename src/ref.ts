import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { LogEntry } from "./types.js";
import { resolveSessionFile, SESSION_RE } from "./api.js";
import { logsDir } from "./storage.js";

export interface LineRef {
  sessionId: string;
  lines: number[]; // sorted, deduplicated, 1-based
}

export interface ResolvedEntry extends LogEntry {
  _ref: string; // "sessionId:lineNum"
  _line: number; // 1-based physical line number
}

/**
 * Parse a logifai:// reference string into LineRef objects.
 * Format: logifai://SESSION_ID:LINE_SPEC[+SESSION_ID:LINE_SPEC...]
 */
export function parseReference(ref: string): LineRef[] {
  let uri = ref.trim();
  if (uri.startsWith("logifai://")) {
    uri = uri.slice("logifai://".length);
  }
  if (!uri) {
    throw new Error("Empty reference");
  }

  const segments = uri.split("+");
  const refs: LineRef[] = [];

  for (const seg of segments) {
    const colonIdx = seg.indexOf(":");
    if (colonIdx === -1) {
      throw new Error(`Invalid reference segment: "${seg}" (missing ':')`);
    }
    const sessionId = seg.slice(0, colonIdx);
    const lineSpec = seg.slice(colonIdx + 1);
    if (!sessionId || !lineSpec) {
      throw new Error(`Invalid reference segment: "${seg}"`);
    }
    if (!/^[a-f0-9]+$/.test(sessionId)) {
      throw new Error(`Invalid session ID: "${sessionId}"`);
    }
    const lines = expandLineSpec(lineSpec);
    if (lines.length === 0) {
      throw new Error(`Empty line spec in segment: "${seg}"`);
    }
    refs.push({ sessionId, lines });
  }

  return refs;
}

/**
 * Expand a line spec string into sorted, deduplicated line numbers.
 * Examples: "42" → [42], "10,20-30,50" → [10,20,21,...,30,50]
 */
export function expandLineSpec(spec: string): number[] {
  const parts = spec.split(",");
  const lines = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-", 2);
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
        throw new Error(`Invalid range: "${trimmed}"`);
      }
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      if (hi - lo > 10000) {
        throw new Error(`Range too large: "${trimmed}" (max 10000 lines)`);
      }
      for (let i = lo; i <= hi; i++) {
        lines.add(i);
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (isNaN(n) || n < 1) {
        throw new Error(`Invalid line number: "${trimmed}"`);
      }
      lines.add(n);
    }
  }

  return [...lines].sort((a, b) => a - b);
}

/**
 * Format line numbers into a compact reference string.
 * Consecutive numbers are compressed into ranges.
 * [10,11,12,15] → "logifai://SESSION:10-12,15"
 */
export function formatReference(sessionId: string, lines: number[]): string {
  if (lines.length === 0) return `logifai://${sessionId}:`;
  const sorted = [...lines].sort((a, b) => a - b);
  const parts: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      parts.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  parts.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);

  return `logifai://${sessionId}:${parts.join(",")}`;
}

/**
 * Resolve references by reading session files and returning the matching entries.
 */
export async function resolveReference(refs: LineRef[]): Promise<ResolvedEntry[]> {
  const dir = logsDir();
  const results: ResolvedEntry[] = [];

  for (const ref of refs) {
    const filePath = await resolveSessionFile(dir, ref.sessionId);
    if (!filePath) {
      throw new Error(`Session not found: "${ref.sessionId}"`);
    }

    const wantedSet = new Set(ref.lines);
    const stream = createReadStream(filePath, { encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    let lineNum = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      lineNum++;
      if (!wantedSet.has(lineNum)) continue;
      try {
        const entry = JSON.parse(line) as LogEntry;
        const resolved: ResolvedEntry = {
          ...entry,
          _ref: `${ref.sessionId}:${lineNum}`,
          _line: lineNum,
        };
        results.push(resolved);
      } catch {
        // Skip malformed lines
      }
    }
  }

  return results;
}
