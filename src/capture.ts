import { createInterface } from "node:readline";
import { join } from "node:path";
import type { CaptureOptions, LogEntry } from "./types.js";
import { createSession } from "./session.js";
import { normalizeLine, isStackTraceLine, stripAnsi } from "./normalizer.js";
import { redactLogEntry } from "./redactor.js";
import { ensureLogsDir, NdjsonWriter, updateCurrentSymlink } from "./storage.js";

export async function capture(
  input: NodeJS.ReadableStream,
  options: CaptureOptions
): Promise<void> {
  const session = await createSession();
  const dir = await ensureLogsDir();
  const filePath = join(dir, session.filename);
  const writer = new NdjsonWriter(filePath);
  await updateCurrentSymlink(dir, session.filename);

  // Ignore SIGPIPE (e.g. downstream consumer closes pipe)
  process.on("SIGPIPE", () => {});

  const rl = createInterface({ input, crlfDelay: Infinity });

  let pendingEntry: LogEntry | null = null;
  let stackLines: string[] = [];

  function flushPending(): void {
    if (pendingEntry) {
      if (stackLines.length > 0) {
        pendingEntry.stack = stackLines.join("\n");
      }
      writer.write(redactLogEntry(pendingEntry));
      pendingEntry = null;
      stackLines = [];
    }
  }

  for await (const rawLine of rl) {
    // Passthrough: echo to stdout
    if (options.passthrough) {
      process.stdout.write(rawLine + "\n");
    }

    // Skip empty lines
    if (rawLine.trim() === "") continue;

    const stripped = stripAnsi(rawLine);

    // Check if this is a stack trace line
    if (isStackTraceLine(stripped)) {
      if (pendingEntry) {
        stackLines.push(stripped);
      } else {
        // Orphaned stack trace line — emit as its own entry
        const entry = normalizeLine(rawLine, session, options.source, options.project);
        writer.write(redactLogEntry(entry));
      }
      continue;
    }

    // Not a stack trace line — flush any pending entry first
    flushPending();

    // Normalize new line
    const entry = normalizeLine(rawLine, session, options.source, options.project);

    // If ERROR level, defer writing to accumulate stack traces
    if (entry.level === "ERROR") {
      pendingEntry = entry;
    } else {
      writer.write(redactLogEntry(entry));
    }
  }

  // Flush remaining pending entry
  flushPending();

  await writer.close();
}
