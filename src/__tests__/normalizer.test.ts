import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stripAnsi,
  detectLevel,
  isStackTraceLine,
  tryParseJson,
  parseCommonFormats,
  normalizeLine,
} from "../normalizer.js";
import type { SessionInfo } from "../types.js";

const mockSession: SessionInfo = {
  id: "test1234",
  startedAt: new Date("2026-02-08T10:00:00Z"),
  filename: "session-20260208-100000-test1234.ndjson",
  gitBranch: "main",
};

describe("normalizer", () => {
  describe("stripAnsi", () => {
    it("removes ANSI escape codes", () => {
      assert.equal(stripAnsi("\x1b[31mERROR\x1b[0m: test"), "ERROR: test");
    });

    it("preserves plain text", () => {
      assert.equal(stripAnsi("hello world"), "hello world");
    });
  });

  describe("detectLevel", () => {
    it("detects ERROR", () => {
      assert.equal(detectLevel("Error: Module not found"), "ERROR");
      assert.equal(detectLevel("fatal error occurred"), "ERROR");
      assert.equal(detectLevel("UnhandledException: boom"), "ERROR");
    });

    it("detects WARN", () => {
      assert.equal(detectLevel("Warning: deprecated API"), "WARN");
      assert.equal(detectLevel("[WARN] memory usage high"), "WARN");
    });

    it("detects DEBUG", () => {
      assert.equal(detectLevel("[DEBUG] query executed"), "DEBUG");
    });

    it("defaults to INFO", () => {
      assert.equal(detectLevel("Server started on port 3000"), "INFO");
    });

    it("handles ANSI-colored text", () => {
      assert.equal(detectLevel("\x1b[31mError\x1b[0m: crash"), "ERROR");
    });
  });

  describe("isStackTraceLine", () => {
    it("detects V8 stack trace", () => {
      assert.ok(isStackTraceLine("    at Object.<anonymous> (/app/src/index.js:3:15)"));
      assert.ok(isStackTraceLine("    at Module._compile (node:internal/modules/cjs/loader:1256:14)"));
    });

    it("detects Python stack trace", () => {
      assert.ok(isStackTraceLine('  File "/app/main.py", line 10, in <module>'));
    });

    it("rejects non-stack lines", () => {
      assert.ok(!isStackTraceLine("INFO: server started"));
      assert.ok(!isStackTraceLine(""));
    });
  });

  describe("tryParseJson", () => {
    it("parses valid JSON objects", () => {
      const result = tryParseJson('{"level":"error","message":"boom"}');
      assert.deepEqual(result, { level: "error", message: "boom" });
    });

    it("returns null for non-JSON", () => {
      assert.equal(tryParseJson("INFO: hello"), null);
    });

    it("returns null for JSON arrays", () => {
      assert.equal(tryParseJson("[1,2,3]"), null);
    });

    it("returns null for invalid JSON starting with {", () => {
      assert.equal(tryParseJson("{not json}"), null);
    });
  });

  describe("parseCommonFormats", () => {
    it("parses ISO timestamp prefixed log", () => {
      const result = parseCommonFormats("2026-02-08T10:30:45.123Z INFO server started");
      assert.ok(result);
      assert.equal(result.timestamp, "2026-02-08T10:30:45.123Z");
      assert.equal(result.message, "INFO server started");
    });

    it("parses Apache CLF", () => {
      const result = parseCommonFormats(
        '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200'
      );
      assert.ok(result);
      assert.equal(result.level, "INFO");
      assert.ok(result.extra);
      assert.equal(result.extra.method, "GET");
      assert.equal(result.extra.status, 200);
    });

    it("parses CLF with 5xx as ERROR", () => {
      const result = parseCommonFormats(
        '10.0.0.1 - - [08/Feb/2026:10:30:45] "POST /api HTTP/1.1" 500'
      );
      assert.ok(result);
      assert.equal(result.level, "ERROR");
    });

    it("parses syslog format", () => {
      const result = parseCommonFormats(
        "Feb  8 10:30:45 myhost myapp[12345]: Connection established"
      );
      assert.ok(result);
      assert.equal(result.message, "Connection established");
      assert.ok(result.extra);
      assert.equal(result.extra.hostname, "myhost");
    });

    it("returns null for unrecognized format", () => {
      assert.equal(parseCommonFormats("just a regular line"), null);
    });
  });

  describe("normalizeLine", () => {
    it("normalizes JSON log", () => {
      const entry = normalizeLine(
        '{"level":"error","message":"db connection failed","timestamp":"2026-02-08T10:30:45Z"}',
        mockSession,
        "test-source",
        "/app"
      );
      assert.equal(entry.level, "ERROR");
      assert.equal(entry.message, "db connection failed");
      assert.equal(entry.timestamp, "2026-02-08T10:30:45Z");
      assert.equal(entry.raw, false);
      assert.ok(entry._original);
    });

    it("normalizes plain text", () => {
      const entry = normalizeLine(
        "Server listening on port 3000",
        mockSession,
        "test-source",
        "/app"
      );
      assert.equal(entry.level, "INFO");
      assert.equal(entry.message, "Server listening on port 3000");
      assert.equal(entry.raw, true);
      assert.equal(entry.session_id, "test1234");
    });

    it("normalizes ANSI-colored error", () => {
      const entry = normalizeLine(
        "\x1b[31mError: Module not found\x1b[0m",
        mockSession,
        "test-source",
        "/app"
      );
      assert.equal(entry.level, "ERROR");
      assert.equal(entry.message, "Error: Module not found");
    });

    it("sets session metadata", () => {
      const entry = normalizeLine("test", mockSession, "my-source", "/my/project");
      assert.equal(entry.source, "my-source");
      assert.equal(entry.project, "/my/project");
      assert.equal(entry.session_id, "test1234");
      assert.equal(entry.git_branch, "main");
    });
  });
});
