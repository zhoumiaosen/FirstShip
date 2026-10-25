import test from "node:test";
import assert from "node:assert/strict";
import { createAppServer } from "./index.js";

test("preview serves the course and exposes no coaching API or private files", async (t) => {
  const server = await createAppServer({ dev: false });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base)).status, 200);
  for (const path of [
    "/.env",
    "/package.json",
    "/server/index.js",
    "/.git/config",
    "/api/health",
    "/api/coach",
  ])
    assert.equal((await fetch(base + path)).status, 404);
  assert.equal(
    (await fetch(base + "/api/coach", { method: "POST", body: "{}" })).status,
    404,
  );
  assert.equal((await fetch(base, { method: "POST", body: "{}" })).status, 405);
});

test("development preview serves Vite optimized dependencies while still rejecting secrets", async (t) => {
  const server = await createAppServer({ dev: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const main = await fetch(`${base}/src/main.jsx`);
  assert.equal(main.status, 200);
  const source = await main.text();
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((x) => x[1])
    .filter((x) => x.startsWith("/node_modules/.vite/"));
  assert.ok(
    imports.length > 0,
    "transformed entry imports optimized dependencies",
  );
  for (const path of imports)
    assert.equal(
      (await fetch(base + path)).status,
      200,
      `dependency ${path} must load`,
    );
  assert.equal((await fetch(`${base}/.env`)).status, 404);
});
