import type { LogEntry, LogLevel, SessionInfo } from "./types.js";

// eslint-disable-next-line no-control-regex
const ANSI_RE = /[\u001b\u009b]\[[0-9;]*[a-zA-Z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, "");
}

export function detectLevel(line: string): LogLevel {
  const stripped = stripAnsi(line);
  if (/error|exception|fatal|ERR!|\u2717|\u274c/i.test(stripped)) return "ERROR";
  if (/\b(warn|warning)\b|WRN|\u26a0/i.test(stripped)) return "WARN";
  if (/\b(debug)\b|DBG|\ud83d\udd0d/i.test(stripped)) return "DEBUG";
  return "INFO";
}

export function isStackTraceLine(line: string): boolean {
  const stripped = stripAnsi(line).trimStart();
  // V8 / Node.js: "    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)"
  if (/^at\s+.+/.test(stripped)) return true;
  // Python: "  File "/app/main.py", line 10, in <module>"
  if (/^File\s+"[^"]+",\s+line\s+\d+/.test(stripped)) return true;
  // Java: "    at com.example.Main.method(Main.java:42)"
  if (/^at\s+[\w$.]+\([\w.]+:\d+\)/.test(stripped)) return true;
  // Go: "	/app/main.go:42 +0x1a"
  if (/^\/.+\.go:\d+/.test(stripped)) return true;
  // Rust: "   0: rust_begin_unwind"
  if (/^\d+:\s+\w+/.test(stripped)) return false; // too generic, skip
  return false;
}

export function tryParseJson(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

// Apache/Nginx Combined Log Format
const CLF_RE =
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+)/;

// Syslog format
const SYSLOG_RE =
  /^(\w+\s+\d+\s+\d+:\d+:\d+) (\S+) ([^:[\]]+?)(?:\[(\d+)\])?: (.+)$/;

// ISO timestamp prefix: "2026-02-08T10:30:45.123Z some message"
const ISO_TS_RE =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2}))\s+(.+)$/;

interface ParsedFormat {
  timestamp?: string;
  level?: LogLevel;
  message?: string;
  extra?: Record<string, unknown>;
}

export function parseCommonFormats(line: string): ParsedFormat | null {
  const stripped = stripAnsi(line);

  // ISO timestamp prefix
  const isoMatch = stripped.match(ISO_TS_RE);
  if (isoMatch) {
    return {
      timestamp: isoMatch[1],
      message: isoMatch[2],
      level: detectLevel(isoMatch[2]),
    };
  }

  // Apache/Nginx CLF
  const clfMatch = stripped.match(CLF_RE);
  if (clfMatch) {
    const status = parseInt(clfMatch[6], 10);
    let level: LogLevel = "INFO";
    if (status >= 500) level = "ERROR";
    else if (status >= 400) level = "WARN";
    return {
      message: `${clfMatch[3]} ${clfMatch[4]} ${clfMatch[5]} ${clfMatch[6]}`,
      level,
      extra: {
        ip: clfMatch[1],
        method: clfMatch[3],
        path: clfMatch[4],
        status,
      },
    };
  }

  // Syslog
  const syslogMatch = stripped.match(SYSLOG_RE);
  if (syslogMatch) {
    return {
      message: syslogMatch[5],
      level: detectLevel(syslogMatch[5]),
      extra: {
        hostname: syslogMatch[2],
        process: syslogMatch[3],
        syslog_pid: syslogMatch[4] ? parseInt(syslogMatch[4], 10) : undefined,
      },
    };
  }

  return null;
}

export function normalizeLine(
  line: string,
  session: SessionInfo,
  source: string,
  project: string
): LogEntry {
  const stripped = stripAnsi(line);
  const now = new Date().toISOString();

  // Try JSON first
  const json = tryParseJson(stripped);
  if (json) {
    const level =
      typeof json.level === "string" && isValidLevel(json.level)
        ? (json.level.toUpperCase() as LogLevel)
        : detectLevel(stripped);
    return {
      timestamp:
        typeof json.timestamp === "string" ? json.timestamp : now,
      level,
      message: typeof json.message === "string" ? json.message : stripped,
      source,
      project,
      session_id: session.id,
      git_branch: session.gitBranch,
      pid: process.pid,
      raw: false,
      stack: null,
      _original: json,
    };
  }

  // Try common formats
  const parsed = parseCommonFormats(stripped);
  if (parsed) {
    return {
      timestamp: parsed.timestamp ?? now,
      level: parsed.level ?? detectLevel(stripped),
      message: parsed.message ?? stripped,
      source,
      project,
      session_id: session.id,
      git_branch: session.gitBranch,
      pid: process.pid,
      raw: false,
      stack: null,
      _original: parsed.extra ?? null,
    };
  }

  // Raw unstructured log
  return {
    timestamp: now,
    level: detectLevel(stripped),
    message: stripped,
    source,
    project,
    session_id: session.id,
    git_branch: session.gitBranch,
    pid: process.pid,
    raw: true,
    stack: null,
    _original: null,
  };
}

function isValidLevel(s: string): boolean {
  return ["error", "warn", "info", "debug"].includes(s.toLowerCase());
}
