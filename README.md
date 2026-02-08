# logifai

**Auto-capture development logs for Claude Code — stop copy-pasting terminal output.**

[![npm version](https://img.shields.io/npm/v/logifai)](https://www.npmjs.com/package/logifai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

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
- **Smart Normalization** — auto-detects JSON, infers log levels (ERROR/WARN/INFO/DEBUG), groups stack traces
- **Automatic Redaction** — API keys, tokens, passwords, and connection strings are masked before storage
- **Claude Code Skill** — Claude searches your logs automatically when you ask about errors
- **NDJSON Storage** — structured, greppable, `jq`-friendly format
- **Zero Dependencies** — built on Node.js standard library only

## Quick Start

### 1. Install

```bash
npm install -g logifai
```

### 2. Capture logs

```bash
npm run dev 2>&1 | logifai
```

Output passes through to your terminal as normal — logifai records it in the background.

### 3. Install the Claude Code Skill

**Plugin (recommended)**

```
/plugin marketplace add tomoyaf/logifai
/plugin install logifai@logifai-marketplace
```

**Manual copy (alternative)**

```bash
cp -r "$(npm root -g)/logifai/skills/logifai" ~/.claude/skills/logifai
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
  "stack": "Error: Module not found\n    at Object.<anonymous> ..."
}
```

The Claude Code Skill (installed via `/plugin install` or manually to `~/.claude/skills/logifai/SKILL.md`) gives Claude the knowledge to search these files using `grep`, `jq`, and standard tools — no MCP server needed.

## CLI Reference

```
command 2>&1 | logifai [options]

Options:
  --source <name>    Source label for log entries (default: "unknown")
  --project <path>   Project path (default: current directory)
  --no-passthrough   Don't echo stdin to stdout
  --help             Show help
  --version          Show version
```

When stdin is piped, logifai automatically captures and stores logs. No subcommand needed.

### Examples

```bash
# Basic capture
npm run dev 2>&1 | logifai

# Label the source
npm run build 2>&1 | logifai --source build

# Capture without terminal echo
npm test 2>&1 | logifai --no-passthrough

# Capture any command
docker compose up 2>&1 | logifai --source docker
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

All data stays on your machine. No external services, no telemetry, no network calls.

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | Done | Pipe capture, NDJSON storage, normalizer, redactor, Claude Code Skill |
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
git clone https://github.com/user/logifai.git
cd logifai
npm install
npm run build
npm test
```

## License

[MIT](LICENSE)
