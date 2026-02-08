#!/usr/bin/env node

import { capture } from "./capture.js";
import { startServer } from "./server.js";
import { LiveCapture } from "./live-capture.js";
import { parseReference, resolveReference } from "./ref.js";
import type { AddressInfo } from "node:net";

const VERSION = "0.1.0";

const HELP = `logifai - Auto-capture development command output

Usage:
  command 2>&1 | logifai [options]    Live capture + Web UI
  logifai [options]                   Browse saved sessions
  logifai show <reference>            Resolve a log line reference

Commands:
  show <reference>   Resolve a logifai:// reference and print entries
    --format json|text   Output format (default: json)

Options:
  --source <name>    Source label (default: "unknown")
  --project <path>   Project path (default: cwd)
  --port <number>    Web UI port (default: 3100)
  --no-ui            Disable Web UI (capture only)
  --no-passthrough   Don't echo stdin to stdout
  --help             Show this help
  --version          Show version
`;

function parseArgs(args: string[]): {
  command: string | null;
  source: string;
  project: string;
  passthrough: boolean;
  port: number;
  noUi: boolean;
  showRef: string;
  format: "json" | "text";
} {
  let command: string | null = null;
  let source = "unknown";
  let project = process.cwd();
  let passthrough = true;
  let port = 3100;
  let noUi = false;
  let showRef = "";
  let format: "json" | "text" = "json";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "capture") {
      command = "capture";
    } else if (arg === "show") {
      command = "show";
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        showRef = args[++i];
      }
    } else if (arg === "--format" && i + 1 < args.length) {
      const val = args[++i];
      if (val === "text" || val === "json") format = val;
    } else if (arg === "--source" && i + 1 < args.length) {
      source = args[++i];
    } else if (arg === "--project" && i + 1 < args.length) {
      project = args[++i];
    } else if (arg === "--port" && i + 1 < args.length) {
      port = parseInt(args[++i], 10) || 3100;
    } else if (arg === "--no-passthrough") {
      passthrough = false;
    } else if (arg === "--no-ui") {
      noUi = true;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      process.stdout.write(VERSION + "\n");
      process.exit(0);
    }
  }

  return { command, source, project, passthrough, port, noUi, showRef, format };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // show command: resolve a logifai:// reference
  if (parsed.command === "show") {
    if (!parsed.showRef) {
      process.stderr.write("Error: missing reference argument\nUsage: logifai show <logifai://SESSION:LINES>\n");
      process.exit(1);
    }
    try {
      const refs = parseReference(parsed.showRef);
      const entries = await resolveReference(refs);
      if (parsed.format === "text") {
        for (const e of entries) {
          process.stdout.write(`[${e._ref}] ${e.timestamp} ${e.level} ${e.message}\n`);
          if (e.stack) {
            process.stdout.write(e.stack + "\n");
          }
        }
      } else {
        process.stdout.write(JSON.stringify(entries, null, 2) + "\n");
      }
    } catch (err) {
      process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
    return;
  }

  const isPiped = !process.stdin.isTTY;

  // Piped input with --no-ui: capture only (legacy behavior)
  if (isPiped && parsed.noUi) {
    await capture(process.stdin, {
      source: parsed.source,
      project: parsed.project,
      passthrough: parsed.passthrough,
    });
    return;
  }

  // Piped input without --no-ui: live capture + web UI
  if (isPiped) {
    const live = new LiveCapture();
    const server = await startServer({ port: parsed.port, liveCapture: live });
    const addr = server.address() as AddressInfo;
    process.stderr.write(`logifai UI: http://127.0.0.1:${addr.port}\n`);

    await live.start(process.stdin, {
      source: parsed.source,
      project: parsed.project,
      passthrough: parsed.passthrough,
    });

    // Keep server running for a bit after capture ends so user can browse
    process.stderr.write("Capture complete. UI still running (Ctrl+C to exit).\n");
    // Wait until user kills the process
    await new Promise<void>(() => {
      process.on("SIGINT", () => {
        server.close();
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        server.close();
        process.exit(0);
      });
    });
    return;
  }

  // TTY (no pipe): browse mode — start server only
  const server = await startServer({ port: parsed.port });
  const addr = server.address() as AddressInfo;
  process.stderr.write(`logifai UI: http://127.0.0.1:${addr.port}\n`);
  process.stderr.write("Press Ctrl+C to exit.\n");

  await new Promise<void>(() => {
    process.on("SIGINT", () => {
      server.close();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      server.close();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
