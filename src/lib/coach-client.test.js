import test from "node:test";
import assert from "node:assert/strict";
import { getCoachHealth, requestCoaching } from "./coach-client.js";
const profile = {
  idea: "LeafLog plant watering journal",
  audience: "plant owners",
  goal: "Record a watering",
  experience: "none",
  time: "30 minutes",
};
const noNetwork = () => {
  throw Error("Online demo must not call a server");
};
test("online demo scope and health work without any network or key", async () => {
  const options = { onlineDemo: true, fetchImpl: noNetwork };
  assert.deepEqual(await getCoachHealth(options), {
    ok: true,
    aiAvailable: false,
  });
  const result = await requestCoaching({ action: "scope", profile }, options);
  assert.equal(result.mode, "guided");
  assert.match(result.result.coreTask, /watering/i);
});
test("online demo troubleshooting uses the learner context without a server", async () => {
  const answer = await requestCoaching(
    {
      action: "help",
      profile,
      task: { title: "Build main action" },
      problem: {
        attempt: "Save a watering",
        expected: "History updates",
        actual: "The list stays empty",
        error: "",
        tried: "Refresh",
      },
    },
    { onlineDemo: true, fetchImpl: noNetwork },
  );
  assert.equal(answer.mode, "guided");
  assert.match(answer.result.prompt, /The list stays empty/);
  assert.match(answer.result.prompt, /LeafLog/);
  assert.ok(answer.result.check);
});
test("local app still uses server coaching and surfaces server errors", async () => {
  let url;
  const result = await requestCoaching(
    { action: "scope", profile },
    {
      onlineDemo: false,
      fetchImpl: async (path) => {
        url = path;
        return Response.json({ mode: "ai", result: { title: "Live result" } });
      },
    },
  );
  assert.equal(url, "/api/coach");
  assert.equal(result.mode, "ai");
  await assert.rejects(
    () =>
      requestCoaching(
        { action: "scope", profile },
        {
          onlineDemo: false,
          fetchImpl: async () =>
            Response.json({ error: "Please retry" }, { status: 502 }),
        },
      ),
    /Please retry/,
  );
});
