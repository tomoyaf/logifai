#!/usr/bin/env node
// postinstall script — downloads the Bun-compiled binary for the current platform.
// Falls back silently to the JS version if download fails.

import { createWriteStream, mkdirSync, chmodSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { get as httpsGet } from "node:https";
import { platform, arch } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const version = pkgJson.version;

const REPO = "tomoyaf/logifai";

const PLATFORM_MAP = {
  "darwin-arm64": "logifai-darwin-arm64",
  "darwin-x64": "logifai-darwin-x64",
  "linux-arm64": "logifai-linux-arm64",
  "linux-x64": "logifai-linux-x64",
  "win32-x64": "logifai-windows-x64.exe",
};

const target = `${platform()}-${arch()}`;
const binaryName = PLATFORM_MAP[target];

if (!binaryName) {
  console.log(`logifai: no prebuilt binary for ${target}, using JS version`);
  process.exit(0);
}

const cacheDir = join(__dirname, "..", "node_modules", ".cache", "logifai");
const binaryPath = join(cacheDir, binaryName);

if (existsSync(binaryPath)) {
  process.exit(0);
}

const downloadUrl = `https://github.com/${REPO}/releases/download/v${version}/${binaryName}`;
const checksumUrl = `https://github.com/${REPO}/releases/download/v${version}/checksums.txt`;

function fetch(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { "User-Agent": "logifai-postinstall" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function downloadToFile(url, dest) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { "User-Agent": "logifai-postinstall" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadToFile(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const stream = createWriteStream(dest);
      res.pipe(stream);
      stream.on("finish", () => { stream.close(); resolve(); });
      stream.on("error", reject);
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  mkdirSync(cacheDir, { recursive: true });

  // Download binary
  console.log(`logifai: downloading ${binaryName} v${version}...`);
  await downloadToFile(downloadUrl, binaryPath);

  // Verify checksum
  try {
    const checksumData = (await fetch(checksumUrl)).toString("utf8");
    const line = checksumData.split("\n").find((l) => l.includes(binaryName));
    if (line) {
      const expected = line.split(/\s+/)[0];
      const actual = createHash("sha256").update(readFileSync(binaryPath)).digest("hex");
      if (actual !== expected) {
        unlinkSync(binaryPath);
        console.log("logifai: checksum mismatch, using JS version");
        process.exit(0);
      }
      console.log("logifai: checksum verified");
    }
  } catch {
    // Checksum verification is best-effort
  }

  // Make executable on Unix
  if (platform() !== "win32") {
    chmodSync(binaryPath, 0o755);
  }

  console.log("logifai: binary installed successfully");
}

main().catch(() => {
  // Silent failure — JS version will be used as fallback
  try { unlinkSync(binaryPath); } catch {}
  process.exit(0);
});
