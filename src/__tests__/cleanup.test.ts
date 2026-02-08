import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { performCleanup, parseDuration, parseSize, autoCleanup } from "../cleanup.js";

describe("cleanup", () => {
  let tmpDir: string;
  const origXdg = process.env.XDG_STATE_HOME;
  const origConfig = process.env.XDG_CONFIG_HOME;

  function sessionFilename(daysAgo: number, id: string): string {
    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `session-${y}${mo}${dd}-${h}${mi}${s}-${id}.ndjson`;
  }

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-cleanup-test-"));
    process.env.XDG_STATE_HOME = tmpDir;
    process.env.XDG_CONFIG_HOME = join(tmpDir, "config");
    // Create logs dir
    await mkdir(join(tmpDir, "logifai", "logs"), { recursive: true });
  });

  afterEach(async () => {
    if (origXdg === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = origXdg;
    if (origConfig === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = origConfig;
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("parseDuration", () => {
    it("parses '30d' to 30", () => {
      assert.equal(parseDuration("30d"), 30);
    });

    it("parses '0d' to 0", () => {
      assert.equal(parseDuration("0d"), 0);
    });

    it("parses '365D' (uppercase)", () => {
      assert.equal(parseDuration("365D"), 365);
    });

    it("throws on invalid input", () => {
      assert.throws(() => parseDuration("abc"), /Invalid duration/);
      assert.throws(() => parseDuration("30"), /Invalid duration/);
      assert.throws(() => parseDuration(""), /Invalid duration/);
    });
  });

  describe("parseSize", () => {
    it("parses '1G' to bytes", () => {
      assert.equal(parseSize("1G"), 1024 * 1024 * 1024);
    });

    it("parses '500M' to bytes", () => {
      assert.equal(parseSize("500M"), 500 * 1024 * 1024);
    });

    it("parses '1GB'", () => {
      assert.equal(parseSize("1GB"), 1024 * 1024 * 1024);
    });

    it("parses '2.5G'", () => {
      assert.equal(parseSize("2.5G"), Math.round(2.5 * 1024 * 1024 * 1024));
    });

    it("throws on invalid input", () => {
      assert.throws(() => parseSize("abc"), /Invalid size/);
      assert.throws(() => parseSize("500"), /Invalid size/);
    });
  });

  describe("performCleanup", () => {
    it("deletes sessions older than maxAgeDays", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      const old = sessionFilename(60, "aabbccdd");
      const recent = sessionFilename(5, "11223344");

      await writeFile(join(dir, old), '{"msg":"old"}\n');
      await writeFile(join(dir, recent), '{"msg":"recent"}\n');

      const result = await performCleanup({ maxAgeDays: 30 });
      assert.equal(result.deletedCount, 1);
      assert.ok(result.deletedFiles[0].includes("aabbccdd"));

      const remaining = await readdir(dir);
      assert.ok(remaining.some((f) => f.includes("11223344")));
      assert.ok(!remaining.some((f) => f.includes("aabbccdd")));
    });

    it("enforces maxTotalBytes by deleting oldest first", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      const f1 = sessionFilename(10, "aaaaaaaa");
      const f2 = sessionFilename(5, "bbbbbbbb");
      const f3 = sessionFilename(1, "cccccccc");

      // Each file ~100 bytes
      const data = '{"message":"' + "x".repeat(80) + '"}\n';
      await writeFile(join(dir, f1), data);
      await writeFile(join(dir, f2), data);
      await writeFile(join(dir, f3), data);

      // Allow only ~200 bytes total — should delete the oldest one
      const result = await performCleanup({ maxTotalBytes: 200 });
      assert.ok(result.deletedCount >= 1);
      assert.ok(result.deletedFiles.some((f) => f.includes("aaaaaaaa")));
    });

    it("protects specified session IDs", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      const old = sessionFilename(60, "aabbccdd");
      await writeFile(join(dir, old), '{"msg":"old"}\n');

      const result = await performCleanup({
        maxAgeDays: 30,
        protectedSessionIds: new Set(["aabbccdd"]),
      });
      assert.equal(result.deletedCount, 0);
    });

    it("always keeps at least 1 session", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      const f1 = sessionFilename(60, "aaaaaaaa");
      const f2 = sessionFilename(50, "bbbbbbbb");
      await writeFile(join(dir, f1), '{"msg":"old1"}\n');
      await writeFile(join(dir, f2), '{"msg":"old2"}\n');

      const result = await performCleanup({ maxAgeDays: 0 });
      assert.equal(result.deletedCount, 1);
      // The newest one survives
      const remaining = await readdir(dir);
      assert.ok(remaining.some((f) => f.includes("bbbbbbbb")));
    });

    it("supports dry-run mode", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      const old = sessionFilename(60, "aabbccdd");
      const recent = sessionFilename(5, "11223344");
      await writeFile(join(dir, old), '{"msg":"old"}\n');
      await writeFile(join(dir, recent), '{"msg":"recent"}\n');

      const result = await performCleanup({ maxAgeDays: 30, dryRun: true });
      assert.equal(result.deletedCount, 1);
      assert.ok(result.deletedFiles[0].includes("aabbccdd"));

      // File should still exist (dry-run)
      const remaining = await readdir(dir);
      assert.ok(remaining.some((f) => f.includes("aabbccdd")));
    });

    it("returns empty result when logs dir does not exist", async () => {
      await rm(join(tmpDir, "logifai", "logs"), { recursive: true, force: true });
      const result = await performCleanup({ maxAgeDays: 30 });
      assert.equal(result.deletedCount, 0);
    });

    it("ignores non-session files", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      await writeFile(join(dir, "current.ndjson"), "link target\n");
      await writeFile(join(dir, "readme.txt"), "notes\n");

      const result = await performCleanup({ maxAgeDays: 0 });
      assert.equal(result.deletedCount, 0);
    });
  });

  describe("autoCleanup", () => {
    it("does not throw on missing config", async () => {
      // autoCleanup should swallow all errors
      await autoCleanup();
    });

    it("respects auto_cleanup=false", async () => {
      const dir = join(tmpDir, "logifai", "logs");
      const old = sessionFilename(60, "aabbccdd");
      await writeFile(join(dir, old), '{"msg":"old"}\n');

      // Write settings with auto_cleanup: false
      const configDir = join(tmpDir, "config", "logifai");
      await mkdir(configDir, { recursive: true });
      await writeFile(
        join(configDir, "settings.json"),
        JSON.stringify({
          language: "en",
          retention: { max_total_size_mb: 1024, retention_days: 30, auto_cleanup: false },
        }),
      );

      await autoCleanup();

      // File should still exist
      const remaining = await readdir(dir);
      assert.ok(remaining.some((f) => f.includes("aabbccdd")));
    });
  });
});
