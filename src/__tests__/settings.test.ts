import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { configDir, loadSettings, saveSettings, DEFAULT_RETENTION } from "../settings.js";

describe("settings", () => {
  let tmpDir: string;
  const origXdg = process.env.XDG_CONFIG_HOME;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-settings-test-"));
    process.env.XDG_CONFIG_HOME = tmpDir;
  });

  afterEach(async () => {
    if (origXdg === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = origXdg;
    }
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("configDir", () => {
    it("uses XDG_CONFIG_HOME", () => {
      const dir = configDir();
      assert.equal(dir, join(tmpDir, "logifai"));
    });
  });

  describe("loadSettings", () => {
    it("returns default settings when file does not exist", async () => {
      const settings = await loadSettings();
      assert.deepEqual(settings, { language: "en", retention: { ...DEFAULT_RETENTION } });
    });

    it("returns saved settings", async () => {
      await saveSettings({ language: "ja", retention: { ...DEFAULT_RETENTION } });
      const settings = await loadSettings();
      assert.deepEqual(settings, { language: "ja", retention: { ...DEFAULT_RETENTION } });
    });

    it("falls back to default for invalid language value", async () => {
      // Write an invalid settings file directly
      const { mkdir, writeFile } = await import("node:fs/promises");
      const dir = configDir();
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "settings.json"), JSON.stringify({ language: "fr" }));

      const settings = await loadSettings();
      assert.deepEqual(settings, { language: "en", retention: { ...DEFAULT_RETENTION } });
    });

    it("falls back to default for malformed JSON", async () => {
      const { mkdir, writeFile } = await import("node:fs/promises");
      const dir = configDir();
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "settings.json"), "not-json{{{");

      const settings = await loadSettings();
      assert.deepEqual(settings, { language: "en", retention: { ...DEFAULT_RETENTION } });
    });
  });

  describe("saveSettings", () => {
    it("creates the config directory", async () => {
      await saveSettings({ language: "en", retention: { ...DEFAULT_RETENTION } });
      const dir = configDir();
      const s = await stat(dir);
      assert.ok(s.isDirectory());
    });

    it("saves and round-trips settings", async () => {
      await saveSettings({ language: "ja", retention: { ...DEFAULT_RETENTION } });
      const raw = await readFile(join(configDir(), "settings.json"), "utf8");
      const parsed = JSON.parse(raw);
      assert.equal(parsed.language, "ja");

      const loaded = await loadSettings();
      assert.deepEqual(loaded, { language: "ja", retention: { ...DEFAULT_RETENTION } });
    });

    it("overwrites existing settings", async () => {
      await saveSettings({ language: "ja", retention: { ...DEFAULT_RETENTION } });
      await saveSettings({ language: "en", retention: { ...DEFAULT_RETENTION } });
      const loaded = await loadSettings();
      assert.deepEqual(loaded, { language: "en", retention: { ...DEFAULT_RETENTION } });
    });
  });
});
