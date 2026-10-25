import test from "node:test";
import assert from "node:assert/strict";
import { createAppServer } from "./index.js";

test("HTTP protects API, limits input, serves health and never serves secrets", async (t) => {
  const server = await createAppServer({ apiKey: "", dev: false, port: 0 });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).aiAvailable, false);
  for (const path of [
    "/.env",
    "/package.json",
    "/server/index.js",
    "/.git/config",
    "/api/unknown",
  ])
    assert.equal((await fetch(base + path)).status, 404);
  assert.equal(
    (
      await fetch(`${base}/api/coach`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(`${base}/api/coach`, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "{}",
      })
    ).status,
    415,
  );
  assert.equal(
    (
      await fetch(`${base}/api/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(`${base}/api/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "x".repeat(25_000),
      })
    ).status,
    413,
  );
  const profile = {
    idea: "Plant log",
    audience: "gardeners",
    goal: "Record watering",
    experience: "none",
    time: "30",
  };
  const valid = await fetch(`${base}/api/coach`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "scope", profile }),
  });
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).mode, "guided");
});

test("development preview serves Vite optimized dependencies while still rejecting secrets", async (t) => {
  const server = await createAppServer({ apiKey: "", dev: true });
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
