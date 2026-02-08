import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseReference,
  expandLineSpec,
  formatReference,
  resolveReference,
} from "../ref.js";
import type { LogEntry } from "../types.js";

describe("expandLineSpec", () => {
  it("expands a single line number", () => {
    assert.deepEqual(expandLineSpec("42"), [42]);
  });

  it("expands comma-separated lines", () => {
    assert.deepEqual(expandLineSpec("10,20,30"), [10, 20, 30]);
  });

  it("expands a range", () => {
    assert.deepEqual(expandLineSpec("3-6"), [3, 4, 5, 6]);
  });

  it("expands mixed specs", () => {
    assert.deepEqual(expandLineSpec("10,20-23,50"), [10, 20, 21, 22, 23, 50]);
  });

  it("deduplicates and sorts", () => {
    assert.deepEqual(expandLineSpec("5,3,5,1-3"), [1, 2, 3, 5]);
  });

  it("throws on invalid line number", () => {
    assert.throws(() => expandLineSpec("abc"), /Invalid line number/);
  });

  it("throws on zero line number", () => {
    assert.throws(() => expandLineSpec("0"), /Invalid line number/);
  });

  it("throws on negative line number", () => {
    assert.throws(() => expandLineSpec("-1"), /Invalid range/);
  });

  it("throws on too large range", () => {
    assert.throws(() => expandLineSpec("1-20000"), /Range too large/);
  });
});

describe("parseReference", () => {
  it("parses single line ref", () => {
    const refs = parseReference("logifai://a1b2c3d4:42");
    assert.equal(refs.length, 1);
    assert.equal(refs[0].sessionId, "a1b2c3d4");
    assert.deepEqual(refs[0].lines, [42]);
  });

  it("parses multiple lines", () => {
    const refs = parseReference("logifai://abcdef01:10,20,30");
    assert.equal(refs.length, 1);
    assert.deepEqual(refs[0].lines, [10, 20, 30]);
  });

  it("parses range ref", () => {
    const refs = parseReference("logifai://abcdef01:5-8");
    assert.deepEqual(refs[0].lines, [5, 6, 7, 8]);
  });

  it("parses mixed ref", () => {
    const refs = parseReference("logifai://abcdef01:1,5-7,10");
    assert.deepEqual(refs[0].lines, [1, 5, 6, 7, 10]);
  });

  it("parses multiple sessions", () => {
    const refs = parseReference("logifai://a1b2c3d4:10-15+ff990011:1-5");
    assert.equal(refs.length, 2);
    assert.equal(refs[0].sessionId, "a1b2c3d4");
    assert.deepEqual(refs[0].lines, [10, 11, 12, 13, 14, 15]);
    assert.equal(refs[1].sessionId, "ff990011");
    assert.deepEqual(refs[1].lines, [1, 2, 3, 4, 5]);
  });

  it("works without logifai:// prefix", () => {
    const refs = parseReference("a1b2c3d4:42");
    assert.equal(refs[0].sessionId, "a1b2c3d4");
    assert.deepEqual(refs[0].lines, [42]);
  });

  it("throws on empty reference", () => {
    assert.throws(() => parseReference("logifai://"), /Empty reference/);
  });

  it("throws on missing colon", () => {
    assert.throws(() => parseReference("logifai://abcdef01"), /missing ':'/);
  });

  it("throws on invalid session ID", () => {
    assert.throws(() => parseReference("logifai://INVALID:42"), /Invalid session ID/);
  });
});

describe("formatReference", () => {
  it("formats single line", () => {
    assert.equal(formatReference("abcdef01", [42]), "logifai://abcdef01:42");
  });

  it("compresses consecutive lines into ranges", () => {
    assert.equal(
      formatReference("abcdef01", [10, 11, 12, 15]),
      "logifai://abcdef01:10-12,15"
    );
  });

  it("formats multiple separate lines", () => {
    assert.equal(
      formatReference("abcdef01", [1, 5, 10]),
      "logifai://abcdef01:1,5,10"
    );
  });

  it("handles single range", () => {
    assert.equal(
      formatReference("abcdef01", [1, 2, 3, 4, 5]),
      "logifai://abcdef01:1-5"
    );
  });

  it("handles unsorted input", () => {
    assert.equal(
      formatReference("abcdef01", [5, 3, 4, 1]),
      "logifai://abcdef01:1,3-5"
    );
  });
});

describe("resolveReference", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-ref-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("resolves entries from a session file", async () => {
    const logsDir = join(tmpDir, "logifai", "logs");
    await mkdir(logsDir, { recursive: true });

    const entries: LogEntry[] = [
      { timestamp: "2026-01-01T00:00:00Z", level: "INFO", message: "line 1", source: "test", project: "/test", session_id: "aabbccdd", git_branch: null, git_commit: null, pid: 1, raw: true, stack: null, _original: null },
      { timestamp: "2026-01-01T00:00:01Z", level: "ERROR", message: "line 2", source: "test", project: "/test", session_id: "aabbccdd", git_branch: null, git_commit: null, pid: 1, raw: true, stack: "at foo", _original: null },
      { timestamp: "2026-01-01T00:00:02Z", level: "WARN", message: "line 3", source: "test", project: "/test", session_id: "aabbccdd", git_branch: null, git_commit: null, pid: 1, raw: true, stack: null, _original: null },
    ];

    const filename = "session-20260101-000000-aabbccdd.ndjson";
    const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
    await writeFile(join(logsDir, filename), content);

    const originalEnv = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = tmpDir;

    try {
      const result = await resolveReference([
        { sessionId: "aabbccdd", lines: [1, 3] },
      ]);

      assert.equal(result.length, 2);
      assert.equal(result[0].message, "line 1");
      assert.equal(result[0]._line, 1);
      assert.equal(result[0]._ref, "aabbccdd:1");
      assert.equal(result[1].message, "line 3");
      assert.equal(result[1]._line, 3);
      assert.equal(result[1]._ref, "aabbccdd:3");
    } finally {
      if (originalEnv === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = originalEnv;
      }
    }
  });

  it("throws on non-existent session", async () => {
    const originalEnv = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = tmpDir;

    try {
      await assert.rejects(
        () => resolveReference([{ sessionId: "deadbeef", lines: [1] }]),
        /Session not found/
      );
    } finally {
      if (originalEnv === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = originalEnv;
      }
    }
  });
});
