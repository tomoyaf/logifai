# logifai

**Auto-capture development logs for Claude Code — stop copy-pasting terminal output.**

[![npm version](https://img.shields.io/npm/v/logifai)](https://www.npmjs.com/package/logifai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platform-linux%20%7C%20macOS%20%7C%20windows-brightgreen)](https://github.com/tomoyaf/logifai/releases)

## The Problem

When debugging with Claude Code, you're constantly doing this:

```
1. Run your dev server
2. Hit an error
3. Scroll through terminal output
4. Copy the error message
5. Paste it into Claude Code
6. Ask "what's this?"
```

**logifai eliminates steps 3-5.** Your logs are always there — just ask Claude.

```
1. npm run dev 2>&1 | logifai
2. Hit an error
3. Ask Claude Code "what went wrong?"
4. Claude automatically searches your logs and answers
```

## Features

- **Pipe & Capture** — `command 2>&1 | logifai` records everything
- **Web UI** — browser-based log viewer with live streaming, filtering, and search
- **Smart Normalization** — auto-detects JSON, infers log levels (ERROR/WARN/INFO/DEBUG), groups stack traces
- **Automatic Redaction** — API keys, tokens, passwords, and connection strings are masked before storage
- **Claude Code Skill** — Claude searches your logs automatically when you ask about errors
- **NDJSON Storage** — structured, greppable, `jq`-friendly format
- **Zero Runtime Dependencies** — single binary, no runtime needed
- **Self-Update** — `logifai update` checks GitHub Releases and updates in-place

## Quick Start

### 1. Install

```bash
curl -fsSL https://raw.githubusercontent.com/tomoyaf/logifai/main/install.sh | sh
```

> Windows users: download `logifai-windows-x64.exe` from [Releases](https://github.com/tomoyaf/logifai/releases) and add it to your PATH.

### 2. Capture logs

```bash
npm run dev 2>&1 | logifai
```

Output passes through to your terminal as normal — logifai records it in the background. A Web UI opens at `http://127.0.0.1:3100` for live streaming and search.

To browse previously saved sessions without capturing:

```bash
logifai
```

### 3. Install the Claude Code Skill

**Plugin (recommended)**

```
/plugin marketplace add tomoyaf/logifai
/plugin install logifai@logifai-marketplace
```

**Manual copy (alternative)**

```bash
mkdir -p ~/.claude/skills/logifai
curl -fsSL https://raw.githubusercontent.com/tomoyaf/logifai/main/skills/logifai/SKILL.md \
  -o ~/.claude/skills/logifai/SKILL.md
```

### 4. Ask Claude

Just ask Claude Code naturally:

- "What errors happened recently?"
- "Show me the stack trace from the last failure"
- "What went wrong with the API call?"

Claude automatically searches your captured logs and responds with context.

## How It Works

```
stdin ──→ Normalizer ──→ Redactor ──→ NDJSON file
          │                            │
          ├─ JSON auto-detect          └─ ~/.local/state/logifai/logs/
          ├─ Level inference               ├─ session-*.ndjson
          ├─ Stack trace grouping          └─ current.ndjson (symlink)
          └─ CLF/Syslog parsing
                                       ──→ Web UI (http://127.0.0.1:3100)
                                           ├─ Live streaming via SSE
                                           ├─ Level filtering
                                           └─ Keyword search
```

Each log line becomes a structured JSON entry:

```json
{
  "timestamp": "2026-02-08T10:30:45.123Z",
  "level": "ERROR",
  "message": "Module not found: @/components/Button",
  "source": "npm-run-dev",
  "project": "/home/user/my-app",
  "session_id": "a1b2c3d4",
  "git_branch": "feature/auth",
  "git_commit": "e91d055",
  "pid": 12345,
  "raw": false,
  "stack": "Error: Module not found\n    at Object.<anonymous> ...",
  "_original": null
}
```

The Claude Code Skill (installed via `/plugin install` or manually to `~/.claude/skills/logifai/SKILL.md`) gives Claude the knowledge to search these files using `grep`, `jq`, and standard tools — no MCP server needed.

## CLI Reference

```
Usage:
  command 2>&1 | logifai [options]    Live capture + Web UI
  logifai [options]                   Browse saved sessions
  logifai show <reference>            Resolve a log line reference
  logifai cleanup [options]           Clean up old session files
  logifai update                      Update to the latest version

Commands:
  show <reference>   Resolve a logifai:// reference and print entries
    --format json|text   Output format (default: json)

  cleanup            Delete old session files based on retention settings
    --older-than <duration>  Delete sessions older than (e.g. "30d")
    --max-size <size>        Max total size (e.g. "1G", "500M")
    --dry-run                Show what would be deleted without deleting

  update             Update logifai to the latest version

Options:
  --source <name>    Source label (default: "unknown")
  --project <path>   Project path (default: cwd)
  --port <number>    Web UI port (default: 3100)
  --no-ui            Disable Web UI (capture only)
  --no-passthrough   Don't echo stdin to stdout
  --help             Show this help
  --version          Show version
```

**Three modes of operation:**

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Live capture + Web UI** | Piped stdin (default) | Captures logs, serves Web UI with live streaming |
| **Capture only** | Piped stdin + `--no-ui` | Captures logs without Web UI (legacy behavior) |
| **Browse** | No pipe (TTY) | Opens Web UI to browse previously saved sessions |

### Examples

```bash
# Basic capture (opens Web UI at http://127.0.0.1:3100)
npm run dev 2>&1 | logifai

# Label the source
npm run build 2>&1 | logifai --source build

# Capture without terminal echo
npm test 2>&1 | logifai --no-passthrough

# Capture any command
docker compose up 2>&1 | logifai --source docker

# Capture only, no Web UI (legacy mode)
npm run dev 2>&1 | logifai --no-ui

# Use a custom port
npm run dev 2>&1 | logifai --port 8080

# Browse saved sessions (no pipe needed)
logifai

# Update to the latest version
logifai update
```

## Storage

Logs are stored following the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/):

```
~/.local/state/logifai/logs/
├── session-20260208-103045-a1b2c3d4.ndjson   # Session files
├── session-20260208-140522-e5f6g7h8.ndjson
└── current.ndjson -> session-...ndjson         # Symlink to latest
```

Respects `$XDG_STATE_HOME` if set.

### Manual Queries

```bash
# Recent errors
grep '"level":"ERROR"' ~/.local/state/logifai/logs/current.ndjson

# Errors with context
grep -B 5 -A 5 "Module not found" ~/.local/state/logifai/logs/current.ndjson

# With jq
jq 'select(.level == "ERROR" and .stack != null)' ~/.local/state/logifai/logs/current.ndjson
```

## Security

### Automatic Redaction

Sensitive data is automatically masked before being written to disk:

| Pattern | Example |
|---------|---------|
| Bearer tokens | `Bearer [REDACTED]` |
| GitHub PATs | `[REDACTED]` |
| OpenAI/Anthropic API keys | `[REDACTED]` |
| AWS Access Key IDs | `[REDACTED]` |
| Database connection strings | `postgres://[REDACTED]:[REDACTED]@...` |
| JWT tokens | `[REDACTED]` |
| Generic secrets (`api_key=...`, `token=...`) | `api_key=[REDACTED]` |
| Private key blocks | `[REDACTED]` |

### File Permissions

- Log directory: `700` (owner-only access)
- Log files: `600` (owner read/write only)

### Local Only

All captured data stays on your machine. No telemetry. The only network call is an optional update check to GitHub Releases (once per day, skipped when `CI=true`).

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | Done | Pipe capture, NDJSON storage, normalizer, redactor, Web UI, Claude Code Skill, `show` command, `cleanup` command, settings management, single binary distribution, `update` command |
| **Phase 2** | Planned | `logifai exec` — child process mode with TTY propagation and signal forwarding |
| **Phase 3** | Planned | SQLite FTS5 index, `.logifai.toml` config file, `logifai start` |
| **Phase 4** | Planned | MCP server, semantic search, anomaly detection |

See [doc.md](doc.md) for the full technical specification.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Commit and push
6. Open a Pull Request

### Development

```bash
git clone https://github.com/tomoyaf/logifai.git
cd logifai
npm install
npm run build    # TypeScript compilation
npm test         # Run tests with node:test
```

#### Building binaries

Requires [Bun](https://bun.sh/) for binary compilation:

```bash
npm run build:binary         # Local platform binary
npm run build:all            # All platforms (cross-compile)
```

## License

[MIT](LICENSE)
