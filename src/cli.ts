#!/usr/bin/env node

import { capture } from "./capture.js";

const VERSION = "0.1.0";

const HELP = `logifai - Auto-capture development command output

Usage:
  command 2>&1 | logifai [options]

Options:
  --source <name>    Source label (default: "unknown")
  --project <path>   Project path (default: cwd)
  --no-passthrough   Don't echo stdin to stdout
  --help             Show this help
  --version          Show version
`;

function parseArgs(args: string[]): {
  command: string | null;
  source: string;
  project: string;
  passthrough: boolean;
} {
  let command: string | null = null;
  let source = "unknown";
  let project = process.cwd();
  let passthrough = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "capture") {
      // Accept "capture" as explicit subcommand for backward compatibility
      command = "capture";
    } else if (arg === "--source" && i + 1 < args.length) {
      source = args[++i];
    } else if (arg === "--project" && i + 1 < args.length) {
      project = args[++i];
    } else if (arg === "--no-passthrough") {
      passthrough = false;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      process.stdout.write(VERSION + "\n");
      process.exit(0);
    }
  }

  return { command, source, project, passthrough };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // Default to capture when stdin is piped (no subcommand required)
  if (!parsed.command && !process.stdin.isTTY) {
    parsed.command = "capture";
  }

  if (!parsed.command) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  if (parsed.command === "capture") {
    if (process.stdin.isTTY) {
      process.stderr.write("Error: No piped input detected.\n");
      process.stderr.write("Usage: command 2>&1 | logifai\n");
      process.exit(1);
    }

    await capture(process.stdin, {
      source: parsed.source,
      project: parsed.project,
      passthrough: parsed.passthrough,
    });
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
