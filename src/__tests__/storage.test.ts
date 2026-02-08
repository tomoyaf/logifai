import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, readlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  logsDir,
  ensureLogsDir,
  NdjsonWriter,
  updateCurrentSymlink,
} from "../storage.js";
import type { LogEntry } from "../types.js";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: "2026-02-08T10:00:00Z",
    level: "INFO",
    message: "test message",
    source: "test",
    project: "/app",
    session_id: "abc12345",
    git_branch: "main",
    pid: 1234,
    raw: true,
    stack: null,
    _original: null,
    ...overrides,
  };
}

describe("storage", () => {
  let tmpDir: string;
  const origXdg = process.env.XDG_STATE_HOME;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-test-"));
    process.env.XDG_STATE_HOME = tmpDir;
  });

  afterEach(async () => {
    if (origXdg === undefined) {
      delete process.env.XDG_STATE_HOME;
    } else {
      process.env.XDG_STATE_HOME = origXdg;
    }
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("logsDir", () => {
    it("uses XDG_STATE_HOME", () => {
      const dir = logsDir();
      assert.equal(dir, join(tmpDir, "logifai", "logs"));
    });
  });

  describe("ensureLogsDir", () => {
    it("creates the directory", async () => {
      const dir = await ensureLogsDir();
      assert.equal(dir, join(tmpDir, "logifai", "logs"));
      const { stat } = await import("node:fs/promises");
      const s = await stat(dir);
      assert.ok(s.isDirectory());
    });
  });

  describe("NdjsonWriter", () => {
    it("writes entries as NDJSON", async () => {
      const dir = await ensureLogsDir();
      const filePath = join(dir, "test.ndjson");
      const writer = new NdjsonWriter(filePath);

      writer.write(makeEntry({ message: "first" }));
      writer.write(makeEntry({ message: "second", level: "ERROR" }));
      await writer.close();

      const content = await readFile(filePath, "utf-8");
      const lines = content.trim().split("\n");
      assert.equal(lines.length, 2);

      const first = JSON.parse(lines[0]);
      assert.equal(first.message, "first");
      assert.equal(first.level, "INFO");

      const second = JSON.parse(lines[1]);
      assert.equal(second.message, "second");
      assert.equal(second.level, "ERROR");
    });
  });

  describe("updateCurrentSymlink", () => {
    it("creates a symlink to the session file", async () => {
      const dir = await ensureLogsDir();
      const filename = "session-test.ndjson";

      // Create the target file
      const writer = new NdjsonWriter(join(dir, filename));
      writer.write(makeEntry());
      await writer.close();

      await updateCurrentSymlink(dir, filename);

      const target = await readlink(join(dir, "current.ndjson"));
      assert.equal(target, filename);
    });

    it("replaces existing symlink", async () => {
      const dir = await ensureLogsDir();
      const file1 = "session-1.ndjson";
      const file2 = "session-2.ndjson";

      await updateCurrentSymlink(dir, file1);
      await updateCurrentSymlink(dir, file2);

      const target = await readlink(join(dir, "current.ndjson"));
      assert.equal(target, file2);
    });
  });
});
