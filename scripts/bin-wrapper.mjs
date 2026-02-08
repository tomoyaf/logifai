#!/usr/bin/env node
// bin-wrapper — executes the Bun-compiled binary if available, otherwise falls back to JS.

import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform, arch } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PLATFORM_MAP = {
  "darwin-arm64": "logifai-darwin-arm64",
  "darwin-x64": "logifai-darwin-x64",
  "linux-arm64": "logifai-linux-arm64",
  "linux-x64": "logifai-linux-x64",
  "win32-x64": "logifai-windows-x64.exe",
};

const target = `${platform()}-${arch()}`;
const binaryName = PLATFORM_MAP[target];
const binaryPath = binaryName
  ? join(__dirname, "..", "node_modules", ".cache", "logifai", binaryName)
  : null;

if (binaryPath && existsSync(binaryPath)) {
  // Use native binary — forward all args and stdio
  try {
    execFileSync(binaryPath, process.argv.slice(2), {
      stdio: "inherit",
      env: process.env,
    });
  } catch (err) {
    process.exit(err.status ?? 1);
  }
} else {
  // Fallback to JS version
  await import("../dist/cli.js");
}
