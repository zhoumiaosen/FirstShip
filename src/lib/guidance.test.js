import test from "node:test";
import assert from "node:assert/strict";
import { createTroubleshootingGuidance } from "./guidance.js";
const profile = { idea: "LeafLog", goal: "Record watering" };
test("course troubleshooting produces a focused prompt from observed behavior", () => {
  const result = createTroubleshootingGuidance({
    profile,
    task: { title: "Build the action" },
    problem: {
      attempt: "Save a watering",
      expected: "History entry",
      actual: "The list stays empty",
      error: "",
      tried: "Refresh",
    },
  });
  assert.match(result.prompt, /LeafLog/);
  assert.match(result.prompt, /The list stays empty/);
  assert.match(result.prompt, /History entry/);
  assert.ok(result.check);
  assert.ok(result.nextStep);
});
test("setup checklist focuses on starting the learner project", () => {
  const result = createTroubleshootingGuidance({
    profile,
    problem: {
      actual: "localhost connection refused",
      error: "ERR_CONNECTION_REFUSED",
    },
  });
  assert.match(result.nextStep, /local address/);
  assert.match(result.check, /local address/);
});
test("missing observed behavior gets a useful validation error", () => {
  assert.throws(
    () => createTroubleshootingGuidance({ profile, problem: { actual: " " } }),
    /what happened/i,
  );
});
