import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, readdir, readlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { capture } from "../capture.js";
import type { LogEntry } from "../types.js";

function createInputStream(lines: string[]): Readable {
  return Readable.from(lines.map((l) => l + "\n").join(""));
}

describe("capture", () => {
  let tmpDir: string;
  const origXdg = process.env.XDG_STATE_HOME;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-capture-"));
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

  it("captures plain text lines", async () => {
    const input = createInputStream([
      "INFO: server started",
      "listening on port 3000",
    ]);
    await capture(input, { source: "test", project: "/app", passthrough: false });

    const dir = join(tmpDir, "logifai", "logs");
    const fileList = await readdir(dir);
    const ndjsonFile = fileList.find((f) => f.startsWith("session-"));
    assert.ok(ndjsonFile, "should create session file");

    const content = await readFile(join(dir, ndjsonFile), "utf-8");
    const entries: LogEntry[] = content
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));

    assert.equal(entries.length, 2);
    assert.equal(entries[0].message, "INFO: server started");
    assert.equal(entries[0].level, "INFO");
    assert.equal(entries[0].source, "test");
  });

  it("accumulates stack traces for ERROR entries", async () => {
    const input = createInputStream([
      "Error: Module not found",
      "    at Object.<anonymous> (/app/src/index.js:3:15)",
      "    at Module._compile (node:internal/modules/cjs/loader:1256:14)",
      "INFO: recovered",
    ]);
    await capture(input, { source: "test", project: "/app", passthrough: false });

    const dir = join(tmpDir, "logifai", "logs");
    const fileList = await readdir(dir);
    const ndjsonFile = fileList.find((f) => f.startsWith("session-"));
    assert.ok(ndjsonFile);

    const content = await readFile(join(dir, ndjsonFile!), "utf-8");
    const entries: LogEntry[] = content
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));

    assert.equal(entries.length, 2);
    // First entry should be ERROR with stack
    assert.equal(entries[0].level, "ERROR");
    assert.ok(entries[0].stack);
    assert.ok(entries[0].stack!.includes("Object.<anonymous>"));
    assert.ok(entries[0].stack!.includes("Module._compile"));
    // Second entry is the INFO line
    assert.equal(entries[1].level, "INFO");
  });

  it("redacts sensitive data", async () => {
    const input = createInputStream([
      "Connecting to postgres://admin:secretpass@db:5432/app",
    ]);
    await capture(input, { source: "test", project: "/app", passthrough: false });

    const dir = join(tmpDir, "logifai", "logs");
    const fileList = await readdir(dir);
    const ndjsonFile = fileList.find((f) => f.startsWith("session-"));
    const content = await readFile(join(dir, ndjsonFile!), "utf-8");
    const entry: LogEntry = JSON.parse(content.trim());

    assert.ok(!entry.message.includes("admin:secretpass"));
    assert.ok(entry.message.includes("[REDACTED]"));
  });

  it("handles JSON input", async () => {
    const input = createInputStream([
      '{"level":"warn","message":"disk space low","timestamp":"2026-02-08T10:00:00Z"}',
    ]);
    await capture(input, { source: "test", project: "/app", passthrough: false });

    const dir = join(tmpDir, "logifai", "logs");
    const fileList = await readdir(dir);
    const ndjsonFile = fileList.find((f) => f.startsWith("session-"));
    const content = await readFile(join(dir, ndjsonFile!), "utf-8");
    const entry: LogEntry = JSON.parse(content.trim());

    assert.equal(entry.level, "WARN");
    assert.equal(entry.message, "disk space low");
    assert.equal(entry.raw, false);
  });

  it("creates current.ndjson symlink", async () => {
    const input = createInputStream(["test line"]);
    await capture(input, { source: "test", project: "/app", passthrough: false });

    const dir = join(tmpDir, "logifai", "logs");
    const target = await readlink(join(dir, "current.ndjson"));
    assert.ok(target.startsWith("session-"));
  });
});
