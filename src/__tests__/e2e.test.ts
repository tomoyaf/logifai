import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, readdir, readlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const CLI_PATH = join(import.meta.dirname, "..", "cli.js");

function runCli(
  args: string[],
  options: { input?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [CLI_PATH, ...args], {
      env: options.env ?? process.env,
      timeout: options.timeout ?? 10000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });

    proc.on("error", reject);

    if (options.input !== undefined) {
      proc.stdin.write(options.input);
      proc.stdin.end();
    } else {
      proc.stdin.end();
    }
  });
}

describe("e2e", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-e2e-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("--help prints usage", async () => {
    const { stdout, code } = await runCli(["--help"]);
    assert.equal(code, 0);
    assert.ok(stdout.includes("logifai"));
    assert.ok(stdout.includes("command 2>&1 | logifai"));
  });

  it("--version prints version", async () => {
    const { stdout, code } = await runCli(["--version"]);
    assert.equal(code, 0);
    assert.match(stdout.trim(), /^\d+\.\d+\.\d+$/);
  });

  it("defaults to capture when stdin is piped with no subcommand", async () => {
    const env = { ...process.env, XDG_STATE_HOME: tmpDir };
    const { code } = await runCli([], { input: "test line\n", env });
    assert.equal(code, 0);
  });

  it("captures piped input to NDJSON file", async () => {
    const logsDir = join(tmpDir, "logifai", "logs");
    const env = { ...process.env, XDG_STATE_HOME: tmpDir };

    const inputLines = [
      "INFO: server started on port 3000",
      "Error: connection refused",
      "    at Socket.connect (net.js:123:45)",
      '{"level":"warn","message":"cache miss","timestamp":"2026-02-08T12:00:00Z"}',
      "",
    ].join("\n");

    const { stdout, code } = await runCli(
      ["--source", "e2e-test", "--project", "/test/app"],
      { input: inputLines, env }
    );

    assert.equal(code, 0);

    // Passthrough should echo input
    assert.ok(stdout.includes("INFO: server started on port 3000"));

    // Check NDJSON file was created
    const files = await readdir(logsDir);
    const sessionFile = files.find((f) => f.startsWith("session-"));
    assert.ok(sessionFile, "session file should exist");

    // Check symlink
    const linkTarget = await readlink(join(logsDir, "current.ndjson"));
    assert.equal(linkTarget, sessionFile);

    // Parse entries
    const content = await readFile(join(logsDir, sessionFile!), "utf-8");
    const entries = content
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));

    // Should have 3 entries (INFO, ERROR with stack, WARN JSON)
    assert.equal(entries.length, 3);

    // First: plain INFO
    assert.equal(entries[0].level, "INFO");
    assert.equal(entries[0].source, "e2e-test");
    assert.equal(entries[0].project, "/test/app");

    // Second: ERROR with accumulated stack
    assert.equal(entries[1].level, "ERROR");
    assert.ok(entries[1].stack);
    assert.ok(entries[1].stack.includes("Socket.connect"));

    // Third: parsed JSON
    assert.equal(entries[2].level, "WARN");
    assert.equal(entries[2].message, "cache miss");
    assert.equal(entries[2].raw, false);
  });

  it("--no-passthrough suppresses stdout echo", async () => {
    const env = { ...process.env, XDG_STATE_HOME: tmpDir };
    const { stdout, code } = await runCli(
      ["--no-passthrough"],
      { input: "test line\n", env }
    );
    assert.equal(code, 0);
    assert.equal(stdout, "");
  });

  it("'capture' subcommand still works for backward compatibility", async () => {
    const env = { ...process.env, XDG_STATE_HOME: tmpDir };
    const { stdout, code } = await runCli(
      ["capture", "--source", "compat-test"],
      { input: "hello\n", env }
    );
    assert.equal(code, 0);
    assert.ok(stdout.includes("hello"));
  });
});
