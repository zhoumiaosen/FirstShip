import test from "node:test";
import assert from "node:assert/strict";
import {
  coach,
  validateInput,
  isScope,
  isHelp,
  makeRateLimiter,
} from "./coach.js";
const profile = {
  idea: "A garden watering tracker",
  audience: "houseplant owners",
  goal: "record when I water a plant",
  experience: "none",
  time: "30",
};
const scope = {
  title: "Plant log",
  description: "Record plant watering",
  audience: "houseplant owners",
  coreTask: "Log one watering",
  features: ["Add plants"],
  done: ["Watering persists"],
  later: ["Social network"],
};
const help = {
  explanation: "The app may not be running.",
  nextStep: "Check the terminal.",
  prompt: "Check the dev server and report its local URL.",
  check: "Open the reported URL.",
};
test("scope requests reject blank and oversized input", () => {
  assert.throws(
    () =>
      validateInput({ action: "scope", profile: { ...profile, idea: " " } }),
    /idea/i,
  );
  assert.throws(
    () =>
      validateInput({
        action: "scope",
        profile: { ...profile, goal: "a".repeat(4001) },
      }),
    /goal/i,
  );
  assert.throws(() => validateInput({ action: "delete", profile }), /action/i);
});
test("guided mode works without credentials and keeps learner context", async () => {
  const result = await coach({ action: "scope", profile }, { apiKey: "" });
  assert.equal(result.mode, "guided");
  assert.ok(isScope(result.result));
  assert.match(JSON.stringify(result.result), /plant|water|garden/i);
  const answer = await coach(
    {
      action: "help",
      profile,
      scope,
      problem: {
        attempt: "Open app",
        expected: "See page",
        actual: "Blank screen",
        error: "",
        tried: "",
      },
    },
    { apiKey: "" },
  );
  assert.ok(isHelp(answer.result));
  assert.match(answer.result.prompt, /Blank screen/);
});
test("live response is validated and no secret or stored conversation in upstream body", async () => {
  let body;
  const result = await coach(
    { action: "scope", profile },
    {
      apiKey: "test-secret",
      model: "test-model",
      fetchImpl: async (url, opts) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        body = JSON.parse(opts.body);
        assert.equal(opts.headers.Authorization, "Bearer test-secret");
        return new Response(
          JSON.stringify({
            output: [
              {
                type: "message",
                content: [{ type: "output_text", text: JSON.stringify(scope) }],
              },
            ],
          }),
        );
      },
    },
  );
  assert.deepEqual(result, { mode: "ai", result: scope });
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.model, "test-model");
  assert.ok(!JSON.stringify(body).includes("test-secret"));
});
test("invalid provider content fails explicitly rather than becoming guided success", async () => {
  for (const payload of [
    { output: [] },
    { output: [{ content: [{ type: "output_text", text: "not json" }] }] },
    { output: [{ content: [{ type: "output_text", text: "{}" }] }] },
  ]) {
    await assert.rejects(
      () =>
        coach(
          { action: "scope", profile },
          {
            apiKey: "x",
            fetchImpl: async () => new Response(JSON.stringify(payload)),
          },
        ),
      (e) => e.status === 502,
    );
  }
});
test("provider errors and timeouts are sanitized", async () => {
  await assert.rejects(
    () =>
      coach(
        { action: "scope", profile },
        {
          apiKey: "secret",
          fetchImpl: async () =>
            new Response("private provider error", { status: 401 }),
        },
      ),
    (e) => e.status === 502 && !e.message.includes("private"),
  );
  await assert.rejects(
    () =>
      coach(
        { action: "scope", profile },
        {
          apiKey: "secret",
          fetchImpl: async () => {
            throw new DOMException("aborted", "TimeoutError");
          },
        },
      ),
    (e) => e.status === 504,
  );
});
test("help validates required context and returns structured live guidance", async () => {
  assert.throws(
    () => validateInput({ action: "help", profile, problem: { actual: "" } }),
    /actual/i,
  );
  const answer = await coach(
    { action: "help", profile, scope, problem: { actual: "error" } },
    {
      apiKey: "x",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            output: [
              {
                content: [{ type: "output_text", text: JSON.stringify(help) }],
              },
            ],
          }),
        ),
    },
  );
  assert.deepEqual(answer.result, help);
});
test("schemas reject excessive scope or missing help fields", () => {
  assert.ok(isScope(scope));
  assert.equal(isScope({ ...scope, features: Array(12).fill("x") }), false);
  assert.equal(isScope({ ...scope, done: [] }), false);
  assert.equal(isHelp({ explanation: "x" }), false);
});
test("rate limiter bounds repeated calls and resets", () => {
  const allow = makeRateLimiter(2, 1000);
  assert.equal(allow("a", 0), true);
  assert.equal(allow("a", 1), true);
  assert.equal(allow("a", 2), false);
  assert.equal(allow("b", 2), true);
  assert.equal(allow("a", 1001), true);
});
