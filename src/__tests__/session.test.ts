import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSessionId,
  getGitBranch,
  formatSessionFilename,
  createSession,
} from "../session.js";

describe("session", () => {
  describe("generateSessionId", () => {
    it("returns an 8-character hex string", () => {
      const id = generateSessionId();
      assert.equal(id.length, 8);
      assert.match(id, /^[0-9a-f]{8}$/);
    });

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateSessionId()));
      assert.equal(ids.size, 100);
    });
  });

  describe("getGitBranch", () => {
    it("returns a string or null", async () => {
      const branch = await getGitBranch();
      // In a git repo with commits, returns branch name; otherwise null
      assert.ok(
        branch === null || (typeof branch === "string" && branch.length > 0),
        `expected string or null, got: ${branch}`
      );
    });
  });

  describe("formatSessionFilename", () => {
    it("formats correctly", () => {
      const date = new Date("2026-02-08T10:30:45.000Z");
      // Use UTC components to avoid timezone issues
      const y = date.getUTCFullYear();
      const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      const filename = formatSessionFilename(date, "a1b2c3d4");
      assert.match(filename, /^session-\d{8}-\d{6}-a1b2c3d4\.ndjson$/);
      // The date part should contain 20260208 (in local time it may differ, so just check pattern)
      assert.ok(filename.startsWith("session-"));
      assert.ok(filename.endsWith("-a1b2c3d4.ndjson"));
    });
  });

  describe("createSession", () => {
    it("returns a complete SessionInfo", async () => {
      const session = await createSession();
      assert.equal(typeof session.id, "string");
      assert.equal(session.id.length, 8);
      assert.ok(session.startedAt instanceof Date);
      assert.match(session.filename, /^session-\d{8}-\d{6}-[0-9a-f]{8}\.ndjson$/);
      // gitBranch is string or null
      assert.ok(
        session.gitBranch === null || typeof session.gitBranch === "string"
      );
    });
  });
});
