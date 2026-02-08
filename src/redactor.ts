import type { LogEntry } from "./types.js";

const REDACTED = "[REDACTED]";

const SENSITIVE_PATTERNS: { pattern: RegExp; replacement: string | ((match: string) => string) }[] = [
  // Bearer tokens
  { pattern: /Bearer\s+[A-Za-z0-9\-_.]+/gi, replacement: `Bearer ${REDACTED}` },
  // GitHub PAT (classic & fine-grained)
  { pattern: /gh[ps]_[A-Za-z0-9]{36,}/g, replacement: REDACTED },
  // OpenAI API Key
  { pattern: /sk-[A-Za-z0-9]{20,}/g, replacement: REDACTED },
  // Anthropic API Key
  { pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/g, replacement: REDACTED },
  // AWS Access Key ID
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: REDACTED },
  // Database connection strings (postgres, mysql, mongodb)
  {
    pattern: /(postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/gi,
    replacement: (match: string) => {
      const proto = match.split("://")[0];
      return `${proto}://${REDACTED}:${REDACTED}@`;
    },
  },
  // JWT tokens
  {
    pattern: /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.]+/g,
    replacement: REDACTED,
  },
  // Generic API key patterns (key=..., api_key=..., apikey=..., token=...)
  {
    pattern: /(api[_-]?key|token|secret|password|credential)[\s]*[=:]\s*["']?[A-Za-z0-9\-_.]{16,}["']?/gi,
    replacement: (match: string) => {
      const sep = match.includes("=") ? "=" : ":";
      const key = match.split(/[=:]/)[0];
      return `${key}${sep}${REDACTED}`;
    },
  },
  // Private key blocks
  {
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    replacement: REDACTED,
  },
];

export function redact(text: string): string {
  let result = text;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    if (typeof replacement === "string") {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement as (match: string) => string);
    }
  }
  return result;
}

export function redactLogEntry(entry: LogEntry): LogEntry {
  return {
    ...entry,
    message: redact(entry.message),
    stack: entry.stack ? redact(entry.stack) : null,
    _original: entry._original ? redactObject(entry._original) : null,
  };
}

function redactObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = redact(value);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
