import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { redact, redactLogEntry } from "../redactor.js";
import type { LogEntry } from "../types.js";

describe("redactor", () => {
  describe("redact", () => {
    it("redacts Bearer tokens", () => {
      const input = "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test.sig";
      const result = redact(input);
      assert.ok(!result.includes("eyJhbGciOiJIUzI1NiJ9"));
    });

    it("redacts GitHub PATs", () => {
      assert.ok(!redact("token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn").includes("ghp_"));
    });

    it("redacts OpenAI API keys", () => {
      assert.ok(!redact("OPENAI_KEY=sk-abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmn").includes("sk-abcdef"));
    });

    it("redacts Anthropic API keys", () => {
      assert.ok(!redact("key: sk-ant-abcdefghijklmnopqrstuvwxyz").includes("sk-ant-"));
    });

    it("redacts AWS access key IDs", () => {
      assert.ok(!redact("AWS_KEY=AKIAIOSFODNN7EXAMPLE").includes("AKIAIOSFODNN7EXAMPLE"));
    });

    it("redacts database connection strings", () => {
      const input = "DATABASE_URL=postgres://admin:secretpass@db.example.com:5432/mydb";
      const result = redact(input);
      assert.ok(!result.includes("admin:secretpass"));
      assert.ok(result.includes("postgres://"));
    });

    it("redacts JWT tokens", () => {
      const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      assert.ok(!redact(`token: ${jwt}`).includes("eyJhbGciOiJIUzI1NiJ9"));
    });

    it("redacts generic api_key patterns", () => {
      const result = redact("api_key=abcdef1234567890abcdef");
      assert.ok(!result.includes("abcdef1234567890abcdef"));
      assert.ok(result.includes("api_key="));
    });

    it("preserves non-sensitive text", () => {
      const input = "INFO: Server started on port 3000";
      assert.equal(redact(input), input);
    });
  });

  describe("redactLogEntry", () => {
    it("redacts message and stack fields", () => {
      const entry: LogEntry = {
        timestamp: "2026-02-08T10:00:00Z",
        level: "ERROR",
        message: "Connection failed: postgres://admin:secret@db:5432/app",
        source: "test",
        project: "/app",
        session_id: "abc123",
        git_branch: "main",
        git_commit: "abc1234",
        pid: 1234,
        raw: true,
        stack: "Error at postgres://admin:secret@db:5432/app",
        _original: null,
      };
      const result = redactLogEntry(entry);
      assert.ok(!result.message.includes("admin:secret"));
      assert.ok(!result.stack!.includes("admin:secret"));
    });

    it("redacts _original object recursively", () => {
      const entry: LogEntry = {
        timestamp: "2026-02-08T10:00:00Z",
        level: "INFO",
        message: "ok",
        source: "test",
        project: "/app",
        session_id: "abc123",
        git_branch: null,
        git_commit: null,
        pid: 1234,
        raw: false,
        stack: null,
        _original: {
          token: "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn",
          nested: { secret: "Bearer my-secret-token-value" },
        },
      };
      const result = redactLogEntry(entry);
      const orig = result._original as Record<string, unknown>;
      assert.ok(!(orig.token as string).includes("ghp_"));
      const nested = orig.nested as Record<string, unknown>;
      assert.ok(!(nested.secret as string).includes("my-secret-token-value"));
    });
  });
});
