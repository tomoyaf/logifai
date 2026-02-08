---
name: logifai-logs
description: Search and analyze development logs captured by logifai. Use when investigating errors, debugging runtime issues, or reviewing recent application activity. Automatically triggered when user mentions "logs", "errors", "what went wrong", or references recent failures.
allowed-tools: Read, Grep, Glob, Bash
---

# logifai Development Logs

logifai automatically captures output from development commands (e.g. `npm run dev 2>&1 | logifai`) and saves them as NDJSON files.

## Log Location

```
~/.local/state/logifai/logs/
├── session-YYYYMMDD-HHmmss-{id}.ndjson   # Session files
└── current.ndjson -> session-...ndjson     # Symlink to latest session
```

## NDJSON Schema

Each line is a JSON object:

```json
{
  "timestamp": "2026-02-08T10:30:45.123Z",
  "level": "ERROR | WARN | INFO | DEBUG",
  "message": "Log message text",
  "source": "npm-run-dev",
  "project": "/home/user/my-app",
  "session_id": "a1b2c3d4",
  "git_branch": "feature/auth",
  "git_commit": "e91d055",
  "pid": 12345,
  "raw": true,
  "stack": "Error stack trace if detected",
  "_original": {}
}
```

## Quick Search Commands

### List recent sessions
```bash
ls -lt ~/.local/state/logifai/logs/session-*.ndjson | head -10
```

### Search current session for errors
```bash
grep '"level":"ERROR"' ~/.local/state/logifai/logs/current.ndjson
```

### Search all sessions for a keyword
```bash
grep -l "keyword" ~/.local/state/logifai/logs/*.ndjson
```

### Get context around an error
```bash
grep -B 5 -A 5 "Module not found" ~/.local/state/logifai/logs/current.ndjson
```

### Find errors with stack traces
```bash
grep '"stack"' ~/.local/state/logifai/logs/current.ndjson | grep -v '"stack":null'
```

## Advanced Queries (with jq)

```bash
# Last 50 ERROR entries
tail -n 500 ~/.local/state/logifai/logs/current.ndjson | jq 'select(.level == "ERROR")' | tail -50

# Errors after a specific time
jq 'select(.level == "ERROR" and .timestamp >= "2026-02-08T10:00:00")' ~/.local/state/logifai/logs/current.ndjson

# Errors with stack traces
jq 'select(.level == "ERROR" and .stack != null)' ~/.local/state/logifai/logs/current.ndjson

# Group by level
jq -s 'group_by(.level) | map({level: .[0].level, count: length})' ~/.local/state/logifai/logs/current.ndjson
```

## Log Line References

Users may paste log line references from the Web UI in the format `logifai://SESSION_ID:LINES`.

### Resolve a reference
```bash
logifai show 'logifai://a1b2c3d4:42,50-55'
```

### When user pastes a logifai:// reference
1. Run `logifai show '<reference>'` to resolve it
2. Parse the JSON output to understand the log entries
3. Analyze as requested (explain errors, suggest fixes, etc.)

### Reference format
- Single line: `logifai://a1b2c3d4:42`
- Multiple lines: `logifai://a1b2c3d4:42,45,50`
- Range: `logifai://a1b2c3d4:42-55`
- Mixed: `logifai://a1b2c3d4:10,20-30,50`
- Multiple sessions: `logifai://a1b2c3d4:10-15+ff990011:1-5`

## Investigation Workflow

When user asks about errors or issues:
1. Check `current.ndjson` for recent ERROR entries
2. Look for stack traces (`.stack != null`)
3. Check surrounding WARN/INFO entries for context
4. Search across sessions if not found in current

When user asks "what went wrong":
1. Search for ERROR level logs in current session
2. Check for stack traces
3. Look for related WARN logs nearby
4. Summarize findings with timestamps and context
