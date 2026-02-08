export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  project: string;
  session_id: string;
  git_branch: string | null;
  git_commit: string | null;
  pid: number;
  raw: boolean;
  stack: string | null;
  _original: Record<string, unknown> | null;
}

export interface SessionInfo {
  id: string;
  startedAt: Date;
  filename: string;
  gitBranch: string | null;
  gitCommit: string | null;
}

export interface CaptureOptions {
  source: string;
  project: string;
  passthrough: boolean;
}
