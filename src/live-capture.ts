import { EventEmitter } from "node:events";
import { createInterface } from "node:readline";
import { join } from "node:path";
import type { CaptureOptions, LogEntry } from "./types.js";
import { createSession } from "./session.js";
import { normalizeLine, isStackTraceLine, stripAnsi } from "./normalizer.js";
import { redactLogEntry } from "./redactor.js";
import { ensureLogsDir, NdjsonWriter, updateCurrentSymlink } from "./storage.js";

export class LiveCapture extends EventEmitter {
  private _sessionId: string = "";

  get sessionId(): string {
    return this._sessionId;
  }

  async start(
    input: NodeJS.ReadableStream,
    options: CaptureOptions
  ): Promise<void> {
    const session = await createSession();
    this._sessionId = session.id;
    const dir = await ensureLogsDir();
    const filePath = join(dir, session.filename);
    const writer = new NdjsonWriter(filePath);
    await updateCurrentSymlink(dir, session.filename);

    process.on("SIGPIPE", () => {});

    const rl = createInterface({ input, crlfDelay: Infinity });

    let pendingEntry: LogEntry | null = null;
    let stackLines: string[] = [];

    const flushPending = (): void => {
      if (pendingEntry) {
        if (stackLines.length > 0) {
          pendingEntry.stack = stackLines.join("\n");
        }
        const redacted = redactLogEntry(pendingEntry);
        writer.write(redacted);
        this.emit("entry", redacted);
        pendingEntry = null;
        stackLines = [];
      }
    };

    for await (const rawLine of rl) {
      if (options.passthrough) {
        process.stdout.write(rawLine + "\n");
      }

      if (rawLine.trim() === "") continue;

      const stripped = stripAnsi(rawLine);

      if (isStackTraceLine(stripped)) {
        if (pendingEntry) {
          stackLines.push(stripped);
        } else {
          const entry = normalizeLine(rawLine, session, options.source, options.project);
          const redacted = redactLogEntry(entry);
          writer.write(redacted);
          this.emit("entry", redacted);
        }
        continue;
      }

      flushPending();

      const entry = normalizeLine(rawLine, session, options.source, options.project);

      if (entry.level === "ERROR") {
        pendingEntry = entry;
      } else {
        const redacted = redactLogEntry(entry);
        writer.write(redacted);
        this.emit("entry", redacted);
      }
    }

    flushPending();
    await writer.close();
    this.emit("end");
  }
}
