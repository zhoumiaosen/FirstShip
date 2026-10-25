import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const send = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};

export async function createAppServer(options = {}) {
  const dev = options.dev ?? false;
  let vite = null;
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    const host = req.headers.host;
    if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))
      return send(res, 403, {
        error: "This local preview only accepts localhost requests.",
      });
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, `http://${host}`).pathname,
      );
    } catch {
      return send(res, 400, { error: "Invalid request path." });
    }
    const optimizedModule =
      dev &&
      /^\/node_modules\/\.vite\/deps\/[A-Za-z0-9_.-]+\.(js|map)$/.test(
        pathname,
      );
    if (
      pathname.startsWith("/api/") ||
      (!optimizedModule &&
        pathname.split("/").some((part) => part.startsWith("."))) ||
      pathname.includes("\\")
    )
      return send(res, 404, { error: "Not found." });
    if (req.method !== "GET" && req.method !== "HEAD")
      return send(res, 405, { error: "Method not allowed." });
    if (vite)
      return vite.middlewares(req, res, () =>
        send(res, 404, { error: "Not found." }),
      );
    const dist = resolve(root, "dist");
    const requested = resolve(dist, `.${pathname}`);
    if (requested !== dist && !requested.startsWith(dist + sep))
      return send(res, 404, { error: "Not found." });
    try {
      let target = requested;
      try {
        if (!(await stat(target)).isFile()) throw new Error();
      } catch {
        if (extname(pathname)) return send(res, 404, { error: "Not found." });
        target = resolve(dist, "index.html");
      }
      const content = await readFile(target);
      res.writeHead(200, {
        "Content-Type": mime[extname(target)] || "application/octet-stream",
        "Cache-Control":
          extname(target) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      return res.end(req.method === "HEAD" ? undefined : content);
    } catch {
      return send(res, 404, {
        error: "App files are not built yet. Run npm run build first.",
      });
    }
  });
  if (dev)
    vite = await (
      await import("vite")
    ).createServer({
      root,
      server: { middlewareMode: true, host: "127.0.0.1", hmr: { server } },
      appType: "spa",
    });
  server.requestTimeout = 45_000;
  server.headersTimeout = 10_000;
  if (vite) server.on("close", () => vite.close());
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 5173);
  const server = await createAppServer({ dev: process.argv.includes("--dev") });
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `Port ${port} is already in use. Set PORT to another value.`
        : "Could not start FirstShip.",
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`FirstShip is ready at http://localhost:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => server.close(() => process.exit(0)));
}
