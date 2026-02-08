import { createServer, type Server } from "node:http";
import { getHtmlPage } from "./ui-html.js";
import {
  handleSessions,
  handleEntries,
  handleStream,
  type ApiContext,
} from "./api.js";
import type { LiveCapture } from "./live-capture.js";

export interface ServerOptions {
  port: number;
  liveCapture?: LiveCapture | null;
}

export function startServer(options: ServerOptions): Promise<Server> {
  const { port, liveCapture = null } = options;

  const ctx: ApiContext = { liveCapture };

  const htmlPage = getHtmlPage();
  const htmlBuf = Buffer.from(htmlPage, "utf8");

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    const path = url.pathname;

    try {
      // Static HTML
      if (path === "/" || path === "/index.html") {
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": htmlBuf.length,
        });
        res.end(htmlBuf);
        return;
      }

      // API: sessions list
      if (path === "/api/sessions" && req.method === "GET") {
        await handleSessions(req, res, ctx);
        return;
      }

      // API: session entries
      const entriesMatch = path.match(/^\/api\/sessions\/([^/]+)\/entries$/);
      if (entriesMatch && req.method === "GET") {
        await handleEntries(req, res, decodeURIComponent(entriesMatch[1]), ctx);
        return;
      }

      // API: SSE stream
      const streamMatch = path.match(/^\/api\/sessions\/([^/]+)\/stream$/);
      if (streamMatch && req.method === "GET") {
        handleStream(req, res, decodeURIComponent(streamMatch[1]), ctx);
        return;
      }

      // 404
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve(server);
    });
  });
}
