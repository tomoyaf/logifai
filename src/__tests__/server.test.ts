import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { request } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { startServer } from "../server.js";
import type { LogEntry } from "../types.js";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: "2026-02-08T10:00:00.000Z",
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

function httpGet(
  port: number,
  path: string
): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: "127.0.0.1", port, path, method: "GET" },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d.toString()));
        res.on("end", () =>
          resolve({
            status: res.statusCode || 0,
            headers: res.headers as Record<string, string | string[] | undefined>,
            body,
          })
        );
      }
    );
    req.on("error", reject);
    req.end();
  });
}

describe("server", () => {
  let tmpDir: string;
  let server: Server;
  let port: number;
  const origXdg = process.env.XDG_STATE_HOME;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "logifai-server-"));
    process.env.XDG_STATE_HOME = tmpDir;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (origXdg === undefined) {
      delete process.env.XDG_STATE_HOME;
    } else {
      process.env.XDG_STATE_HOME = origXdg;
    }
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function startTestServer(): Promise<void> {
    server = await startServer({ port: 0 });
    port = (server.address() as AddressInfo).port;
  }

  it("GET / returns HTML", async () => {
    await startTestServer();
    const { status, headers, body } = await httpGet(port, "/");
    assert.equal(status, 200);
    assert.ok((headers["content-type"] as string).includes("text/html"));
    assert.ok(body.includes("logifai"));
    assert.ok(body.includes("<!DOCTYPE html>"));
  });

  it("GET /api/sessions returns empty list when no sessions", async () => {
    await startTestServer();
    const { status, body } = await httpGet(port, "/api/sessions");
    assert.equal(status, 200);
    const data = JSON.parse(body);
    assert.deepEqual(data.sessions, []);
    assert.equal(data.liveSessionId, null);
  });

  it("GET /api/sessions returns session list", async () => {
    const logsDir = join(tmpDir, "logifai", "logs");
    await mkdir(logsDir, { recursive: true });

    const entry = makeEntry({ session_id: "aabb1122" });
    await writeFile(
      join(logsDir, "session-20260208-100000-aabb1122.ndjson"),
      JSON.stringify(entry) + "\n"
    );

    await startTestServer();
    const { status, body } = await httpGet(port, "/api/sessions");
    assert.equal(status, 200);
    const data = JSON.parse(body);
    assert.equal(data.sessions.length, 1);
    assert.equal(data.sessions[0].id, "aabb1122");
    assert.ok(data.sessions[0].startedAt.includes("2026"));
  });

  it("GET /api/sessions/:id/entries returns entries", async () => {
    const logsDir = join(tmpDir, "logifai", "logs");
    await mkdir(logsDir, { recursive: true });

    const entries = [
      makeEntry({ message: "line 1", level: "INFO" }),
      makeEntry({ message: "line 2", level: "ERROR" }),
      makeEntry({ message: "line 3", level: "WARN" }),
    ];
    await writeFile(
      join(logsDir, "session-20260208-100000-aabb1122.ndjson"),
      entries.map((e) => JSON.stringify(e)).join("\n") + "\n"
    );

    await startTestServer();
    const { status, body } = await httpGet(port, "/api/sessions/aabb1122/entries");
    assert.equal(status, 200);
    const data = JSON.parse(body);
    assert.equal(data.entries.length, 3);
    assert.equal(data.total, 3);
    assert.equal(data.entries[0].message, "line 1");
  });

  it("GET /api/sessions/:id/entries supports offset and limit", async () => {
    const logsDir = join(tmpDir, "logifai", "logs");
    await mkdir(logsDir, { recursive: true });

    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ message: `line ${i}` })
    );
    await writeFile(
      join(logsDir, "session-20260208-100000-aabb1122.ndjson"),
      entries.map((e) => JSON.stringify(e)).join("\n") + "\n"
    );

    await startTestServer();
    const { status, body } = await httpGet(
      port,
      "/api/sessions/aabb1122/entries?offset=3&limit=2"
    );
    assert.equal(status, 200);
    const data = JSON.parse(body);
    assert.equal(data.entries.length, 2);
    assert.equal(data.entries[0].message, "line 3");
    assert.equal(data.entries[1].message, "line 4");
    assert.equal(data.total, 10);
  });

  it("GET /api/sessions/:id/entries returns 404 for unknown session", async () => {
    await startTestServer();
    const { status } = await httpGet(port, "/api/sessions/nonexistent/entries");
    assert.equal(status, 404);
  });

  it("returns 404 for unknown routes", async () => {
    await startTestServer();
    const { status } = await httpGet(port, "/unknown/path");
    assert.equal(status, 404);
  });

  it("binds to 127.0.0.1", async () => {
    await startTestServer();
    const addr = server.address() as AddressInfo;
    assert.equal(addr.address, "127.0.0.1");
  });
});
