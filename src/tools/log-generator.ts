#!/usr/bin/env node

/**
 * Random log generator for logifai testing and demos.
 * Usage: node dist/tools/log-generator.js [--count N] [--interval MS] [--infinite] [--seed N]
 * Pipe to logifai: npm run generate-logs | logifai
 */

// ---------- Seedable PRNG (xorshift32) ----------

let _seed = Date.now() & 0xffffffff;

function xorshift32(): number {
  _seed ^= _seed << 13;
  _seed ^= _seed >> 17;
  _seed ^= _seed << 5;
  return (_seed >>> 0) / 0xffffffff;
}

function rand(): number {
  return xorshift32();
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// ---------- Data pools ----------

const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
const LEVEL_WEIGHTS = [0.1, 0.5, 0.25, 0.15]; // cumulative: 0.1, 0.6, 0.85, 1.0

function weightedLevel(): string {
  const r = rand();
  let cumulative = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    cumulative += LEVEL_WEIGHTS[i];
    if (r < cumulative) return LEVELS[i];
  }
  return "INFO";
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const HTTP_PATHS = [
  "/api/users", "/api/orders", "/api/products", "/api/auth/login",
  "/api/health", "/api/search", "/api/config", "/api/sessions",
  "/api/uploads", "/static/bundle.js",
];
const HTTP_STATUSES = [200, 200, 200, 201, 204, 301, 304, 400, 401, 403, 404, 500, 502, 503];
const IPS = [
  "127.0.0.1", "192.168.1.42", "10.0.0.15", "172.16.0.100",
  "203.0.113.50", "198.51.100.23",
];
const HOSTNAMES = ["web-01", "api-server", "myhost", "worker-3", "db-primary"];
const PROCESSES = ["myapp", "nginx", "sshd", "node", "postgres", "redis-server"];
const USERNAMES = ["frank", "alice", "bob", "admin", "-"];

const INFO_MESSAGES = [
  "Server started on port 3000",
  "Request handled successfully",
  "Database connection pool initialized",
  "Cache hit for key user:1234",
  "Background job completed: email_send",
  "Health check passed",
  "Configuration loaded from environment",
  "Worker process spawned",
  "Session created for user admin",
  "File uploaded: report.pdf (2.3MB)",
  "Scheduled task executed: cleanup_temp_files",
  "WebSocket connection established",
  "TLS handshake completed",
  "Rate limiter initialized: 100 req/min",
  "Metrics exported to Prometheus endpoint",
];

const WARN_MESSAGES = [
  "Slow query detected (1523ms): SELECT * FROM orders",
  "Memory usage above 80%: 847MB/1024MB",
  "Deprecated API endpoint called: /api/v1/users",
  "Connection pool nearing capacity: 45/50",
  "Retry attempt 2/3 for external API call",
  "Disk usage warning: /var/log at 87%",
  "Request timeout approaching: 4800ms/5000ms",
  "Certificate expires in 7 days",
  "Rate limit threshold reached for IP 203.0.113.50",
  "⚠ Fallback configuration used for missing env var",
];

const ERROR_MESSAGES = [
  "DB connection failed",
  "Failed to authenticate user: invalid credentials",
  "ECONNREFUSED: Connection refused to downstream service",
  "Out of memory: heap allocation failed",
  "✗ Unhandled promise rejection: TypeError: Cannot read properties of undefined",
  "❌ Build failed with 3 errors",
  "File not found: /data/config.yaml",
  "EACCES: permission denied, open '/var/run/app.pid'",
  "Payload too large: 12MB exceeds 10MB limit",
  "FATAL: role 'appuser' does not exist",
  "🔍 DNS resolution failed for api.example.com",
];

const DEBUG_MESSAGES = [
  "Processing request: GET /api/users?page=2",
  "Cache miss for key session:abc123",
  "Query plan: Index Scan on users_email_idx",
  "Middleware chain: [auth, rateLimit, validate, handler]",
  "Event emitted: user.login { userId: 42 }",
  "GC pause: 12ms (minor)",
  "Socket keep-alive ping sent",
  "Template compiled: dashboard.ejs (3ms)",
];

// ---------- Sensitive data for redaction testing ----------

const SENSITIVE_DATA = [
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "Authorization: Bearer sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234",
  "api_key=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "Using token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh",
  "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
  "Connection string: postgres://admin:s3cret_p@ssw0rd@db.example.com:5432/mydb",
  "Connecting to mongodb://root:hunter2@mongo.internal:27017/prod",
  "token=eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJhcGkuZXhhbXBsZS5jb20ifQ.signature_here",
  "Set api_key=sk-1234567890abcdef1234567890abcdef",
  "redis://default:MyRedisP@ss@redis.example.com:6379",
];

// ---------- Stack traces ----------

const NODE_STACK = `TypeError: Cannot read properties of undefined (reading 'map')
    at processItems (/app/src/handlers/items.ts:45:23)
    at async Router.handle (/app/node_modules/express/lib/router/index.js:284:7)
    at async Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)
    at async /app/src/middleware/errorHandler.ts:12:5`;

const PYTHON_STACK = `Traceback (most recent call last):
  File "/app/main.py", line 42, in handle_request
    result = process_data(payload)
  File "/app/processors/data.py", line 18, in process_data
    return transform(data["items"])
  File "/app/processors/transform.py", line 7, in transform
    raise ValueError("Invalid data format")
ValueError: Invalid data format`;

const JAVA_STACK = `java.lang.NullPointerException: Cannot invoke method on null object
    at com.example.service.UserService.findById(UserService.java:42)
    at com.example.controller.UserController.getUser(UserController.java:28)
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)`;

const GO_STACK = `goroutine 1 [running]:
main.processRequest(0xc0000b4000, 0x1a)
	/app/main.go:42 +0x1a5
net/http.HandlerFunc.ServeHTTP(0xc0000b2000, {0x7f4b2c, 0xc0000b4000}, 0xc0000b6000)
	/usr/local/go/src/net/http/server.go:2136 +0x29
net/http.(*ServeMux).ServeHTTP(0xc000098000, {0x7f4b2c, 0xc0000b4000}, 0xc0000b6000)
	/usr/local/go/src/net/http/server.go:2514 +0x145`;

const STACK_TRACES = [NODE_STACK, PYTHON_STACK, JAVA_STACK, GO_STACK];

// ---------- Log generators ----------

function nowISO(): string {
  return new Date().toISOString();
}

function clfDate(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const tz = "+0900";
  return `${dd}/${mon}/${yyyy}:${hh}:${mm}:${ss} ${tz}`;
}

function syslogDate(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, " ");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${months[d.getMonth()]} ${day} ${hh}:${mm}:${ss}`;
}

function messageForLevel(level: string): string {
  switch (level) {
    case "ERROR": return pick(ERROR_MESSAGES);
    case "WARN": return pick(WARN_MESSAGES);
    case "DEBUG": return pick(DEBUG_MESSAGES);
    default: return pick(INFO_MESSAGES);
  }
}

/** 1. Plain text log */
function genPlainText(): string {
  const level = weightedLevel();
  return `[${level}] ${messageForLevel(level)}`;
}

/** 2. JSON structured log */
function genJsonLog(): string {
  const level = weightedLevel().toLowerCase();
  const msg = messageForLevel(level.toUpperCase());
  const obj: Record<string, unknown> = {
    level,
    message: msg,
    timestamp: nowISO(),
    service: pick(["api", "worker", "gateway", "scheduler"]),
  };
  if (level === "error") {
    obj.code = pick(["ECONNREFUSED", "ENOENT", "EACCES", "TIMEOUT", "VALIDATION_ERROR"]);
  }
  if (rand() < 0.3) {
    obj.requestId = `req-${randInt(10000, 99999)}`;
  }
  return JSON.stringify(obj);
}

/** 3. ISO timestamp log */
function genISOTimestamp(): string {
  const level = weightedLevel();
  return `${nowISO()} ${level} ${messageForLevel(level)}`;
}

/** 4. Apache CLF */
function genApacheCLF(): string {
  const ip = pick(IPS);
  const user = pick(USERNAMES);
  const method = pick(HTTP_METHODS);
  const path = pick(HTTP_PATHS);
  const status = pick(HTTP_STATUSES);
  const size = randInt(128, 65536);
  return `${ip} - ${user} [${clfDate()}] "${method} ${path} HTTP/1.1" ${status} ${size}`;
}

/** 5. Syslog */
function genSyslog(): string {
  const host = pick(HOSTNAMES);
  const proc = pick(PROCESSES);
  const pid = randInt(1000, 65535);
  const msg = messageForLevel(weightedLevel());
  return `${syslogDate()} ${host} ${proc}[${pid}]: ${msg}`;
}

/** 6. Stack trace error — returns multiple lines */
function genStackTrace(): string {
  return pick(STACK_TRACES);
}

/** 7. ANSI color log */
function genAnsiColor(): string {
  const level = weightedLevel();
  const colors: Record<string, string> = {
    ERROR: "\x1b[31m",   // red
    WARN: "\x1b[33m",    // yellow
    INFO: "\x1b[32m",    // green
    DEBUG: "\x1b[36m",   // cyan
  };
  const reset = "\x1b[0m";
  const color = colors[level] ?? "";
  return `${color}${level}${reset} ${messageForLevel(level)}`;
}

/** Generate a line with sensitive data embedded */
function genSensitiveLine(): string {
  const data = pick(SENSITIVE_DATA);
  const contexts = [
    `[DEBUG] Loading config: ${data}`,
    `${nowISO()} INFO Authenticating with ${data}`,
    `{"level":"debug","message":"Using credential: ${data}","timestamp":"${nowISO()}"}`,
  ];
  return pick(contexts);
}

// All generators (stack trace has lower weight since it's multi-line)
type Generator = () => string;
const GENERATORS: { fn: Generator; weight: number }[] = [
  { fn: genPlainText, weight: 0.2 },
  { fn: genJsonLog, weight: 0.2 },
  { fn: genISOTimestamp, weight: 0.15 },
  { fn: genApacheCLF, weight: 0.12 },
  { fn: genSyslog, weight: 0.1 },
  { fn: genStackTrace, weight: 0.08 },
  { fn: genAnsiColor, weight: 0.1 },
  { fn: genSensitiveLine, weight: 0.05 },
];

function pickGenerator(): Generator {
  const r = rand();
  let cumulative = 0;
  for (const g of GENERATORS) {
    cumulative += g.weight;
    if (r < cumulative) return g.fn;
  }
  return genPlainText;
}

// ---------- CLI ----------

function parseArgs(argv: string[]): { count: number; interval: number; infinite: boolean; seed: number | null } {
  const args = argv.slice(2);
  let count = 50;
  let interval = 300;
  let infinite = false;
  let seed: number | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--count":
        count = parseInt(args[++i], 10);
        if (isNaN(count) || count < 1) {
          process.stderr.write("Error: --count must be a positive integer\n");
          process.exit(1);
        }
        break;
      case "--interval":
        interval = parseInt(args[++i], 10);
        if (isNaN(interval) || interval < 0) {
          process.stderr.write("Error: --interval must be a non-negative integer\n");
          process.exit(1);
        }
        break;
      case "--infinite":
        infinite = true;
        break;
      case "--seed":
        seed = parseInt(args[++i], 10);
        if (isNaN(seed)) {
          process.stderr.write("Error: --seed must be an integer\n");
          process.exit(1);
        }
        break;
      case "--help":
      case "-h":
        process.stdout.write(`Usage: log-generator [options]

Options:
  --count N      Number of log lines to output (default: 50)
  --interval MS  Maximum delay between lines in ms (default: 300)
  --infinite     Output indefinitely until Ctrl+C
  --seed N       Seed for reproducible output
  -h, --help     Show this help
`);
        process.exit(0);
        break;
      default:
        process.stderr.write(`Unknown option: ${args[i]}\n`);
        process.exit(1);
    }
  }

  return { count, interval, infinite, seed };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  if (opts.seed !== null) {
    _seed = opts.seed;
  }

  const minInterval = Math.max(50, Math.floor(opts.interval * 0.15));

  let emitted = 0;
  const shouldContinue = () => opts.infinite || emitted < opts.count;

  // Handle SIGINT/SIGPIPE gracefully
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGPIPE", () => process.exit(0));

  while (shouldContinue()) {
    const gen = pickGenerator();
    const output = gen();

    // Multi-line output (stack traces) — each line counts as one
    const lines = output.split("\n");
    for (const line of lines) {
      if (!shouldContinue()) break;
      const ok = process.stdout.write(line + "\n");
      emitted++;

      // Handle backpressure
      if (!ok) {
        await new Promise<void>((resolve) => process.stdout.once("drain", resolve));
      }
    }

    // Random delay between log entries
    if (shouldContinue() && opts.interval > 0) {
      const delay = randInt(minInterval, opts.interval);
      await sleep(delay);
    }
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${err}\n`);
  process.exit(1);
});
