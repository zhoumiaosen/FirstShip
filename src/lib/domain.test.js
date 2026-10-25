import test from "node:test";
import assert from "node:assert/strict";
import {
  DAYS,
  createGuidedScope,
  createProject,
  getDays,
  completeTask,
  getProgress,
  safeUrl,
  exportSummary,
} from "./domain.js";
import { STORAGE_KEY, loadProject, saveProject } from "./storage.js";
const profile = {
  idea: "A workout tracker with payments and social feeds",
  audience: "busy parents",
  goal: "Record a workout and view the last seven days",
  experience: "new",
  time: "30",
};
const make = () => createProject(profile, createGuidedScope(profile));
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    data,
  };
};
test("guidance narrows different ideas around their own audience and core task", () => {
  const first = createGuidedScope(profile),
    other = createGuidedScope({
      ...profile,
      idea: "A recipe organizer",
      goal: "Save a recipe and find it by ingredient",
      audience: "home cooks",
    });
  assert.notEqual(first.title, other.title);
  assert.match(first.coreTask, /Record a workout/);
  assert.match(other.coreTask, /Save a recipe/);
  assert.equal(first.audience, "busy parents");
  assert.ok(first.features.length <= 3);
  assert.ok(first.later.some((x) => /payments/i.test(x)));
  assert.ok(first.later.some((x) => /social/i.test(x)));
});
test("ten concrete personalized lessons remain available without calendar locks", () => {
  const p = make(),
    days = getDays(p);
  assert.equal(DAYS.length, 5);
  assert.equal(days.length, 5);
  assert.equal(days.flatMap((d) => d.tasks).length, 10);
  assert.ok(days.every((d) => d.tasks.length === 2));
  assert.match(days[2].tasks[0].prompt, /Record a workout/);
  assert.ok(
    days.every((d) =>
      d.tasks.every(
        (t) => t.checks.length >= 2 && t.learn && t.expect && t.reflection,
      ),
    ),
  );
});
test("completion rejects unchecked tasks, whitespace reflection, invalid IDs and early finish", () => {
  const p = make(),
    task = getDays(p)[0].tasks[0];
  assert.throws(() =>
    completeTask(
      p,
      task.id,
      task.checks.map(() => false),
      "I tried it",
    ),
  );
  assert.throws(() =>
    completeTask(
      p,
      task.id,
      task.checks.map(() => true),
      "   ",
    ),
  );
  assert.throws(() => completeTask(p, "fake", [true], "I tried it"));
  assert.throws(() =>
    completeTask(p, "day-5-task-2", [true, true, true], "I tried it"),
  );
  const next = completeTask(
    p,
    task.id,
    task.checks.map(() => true),
    "I checked the first screen",
  );
  assert.equal(getProgress(next).completed, 1);
  assert.equal(getProgress(next).percent, 10);
  assert.equal(Object.keys(p.completed).length, 0);
});
test("all tasks can be completed and summary distinguishes unfinished work", () => {
  let p = make();
  assert.match(exportSummary(p), /In progress/);
  for (const task of getDays(p).flatMap((d) => d.tasks))
    p = completeTask(
      p,
      task.id,
      task.checks.map(() => true),
      "I observed the expected behavior.",
    );
  assert.equal(getProgress(p).percent, 100);
  assert.match(exportSummary(p), /Completed/);
  assert.match(exportSummary(p), /learner-confirmed/i);
});
test("URLs allow only web destinations", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,x"), "");
  assert.equal(safeUrl("https://example.com/app"), "https://example.com/app");
  assert.equal(safeUrl("https://user:pass@example.com"), "");
});
test("storage round trips while corrupt data stays untouched", () => {
  const storage = memory(),
    p = make();
  assert.equal(saveProject(p, storage).ok, true);
  assert.deepEqual(loadProject(storage).project, p);
  storage.setItem(STORAGE_KEY, "{oops");
  assert.equal(loadProject(storage).project, null);
  assert.ok(loadProject(storage).warning);
  assert.equal(storage.getItem(STORAGE_KEY), "{oops");
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, project: { ...p, completed: { evil: {} } } }),
  );
  assert.equal(loadProject(storage).project, null);
});
test("quota failures return warning and unknown schema is rejected", () => {
  const p = make();
  const broken = {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("quota");
    },
  };
  assert.equal(saveProject(p, broken).ok, false);
  assert.ok(loadProject(broken).warning);
  const storage = memory();
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, project: p }));
  assert.equal(loadProject(storage).project, null);
});
test("malformed saved task drafts cannot reach the interface", () => {
  const storage = memory(),
    p = { ...make(), draftChecks: { "day-1-task-1": "not-an-array" } };
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, project: p }));
  assert.equal(loadProject(storage).project, null);
});
test("blocked localStorage getter is handled without a crash", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw Error("SecurityError");
    },
  });
  try {
    assert.equal(loadProject().project, null);
    assert.ok(loadProject().warning);
    assert.equal(saveProject(make()).ok, false);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});
test("oversized marketplace and fitness ideas become one small local workflow", () => {
  const marketplace = createGuidedScope({
    ...profile,
    idea: "BUILD AIRBNB WITH PAYMENTS AND LIVE CHAT",
    goal: "Launch a marketplace with booking, payment processing, live chat, and AI recommendations",
  });
  assert.match(marketplace.coreTask, /listings/i);
  assert.doesNotMatch(
    marketplace.coreTask,
    /booking|payments|chat|recommendations/i,
  );
  assert.match(marketplace.later.join(" "), /booking/i);
  assert.match(marketplace.later.join(" "), /chat/i);
  const fitness = createGuidedScope({
    ...profile,
    idea: "All-in-one fitness social network",
    goal: "Track workouts, recommend AI routines, sell coaching subscriptions, and connect wearable devices",
  });
  assert.match(fitness.coreTask, /workout/i);
  assert.doesNotMatch(
    fitness.coreTask,
    /recommend|subscriptions|wearable|social/i,
  );
  assert.match(fitness.description, /suggest|review|edit/i);
});
test("unknown compound goal keeps one simple action and defers paid services", () => {
  const scope = createGuidedScope({
    ...profile,
    idea: "My garden planning assistant",
    goal: "Record a plant, then connect a weather API, and automatically generate AI recommendations",
  });
  assert.match(scope.coreTask, /Record a plant/i);
  assert.doesNotMatch(scope.coreTask, /API|automatically|AI recommendations/i);
  assert.match(scope.later.join(" "), /AI|paid|API/i);
  assert.ok(scope.coreTask.length <= 300);
});
test("storage scope validation agrees with required API fields and array bounds", () => {
  const storage = memory();
  for (const scope of [
    { ...make().scope, features: [] },
    { ...make().scope, done: [] },
    { ...make().scope, later: [] },
    { ...make().scope, description: " " },
    { ...make().scope, audience: "" },
    { ...make().scope, title: "x".repeat(101) },
    { ...make().scope, features: ["x".repeat(701)] },
    { ...make().scope, done: Array(6).fill("a") },
    { ...make().scope, later: Array(9).fill("a") },
  ]) {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, project: { ...make(), scope } }),
    );
    assert.equal(loadProject(storage).project, null);
  }
});
test("contextual help drafts survive reload without weakening shape checks", () => {
  const storage = memory(),
    p = {
      ...make(),
      helpDraft: {
        "day-1-task-1": {
          attempt: "Opened the app",
          actual: "Blank screen",
          expected: "My app",
          error: "",
          tried: "",
        },
      },
    };
  assert.equal(saveProject(p, storage).ok, true);
  assert.deepEqual(loadProject(storage).project.helpDraft, p.helpDraft);
  assert.equal(
    saveProject(
      { ...p, helpDraft: { "invalid-task": { actual: "Blank" } } },
      storage,
    ).ok,
    false,
  );
  assert.equal(
    saveProject(
      { ...p, helpDraft: { "day-1-task-1": { actual: { malformed: true } } } },
      storage,
    ).ok,
    false,
  );
});

test("summary keeps final reflections and chosen features, without unsafe links", () => {
  const p = createProject(
    {
      idea: "Garden journal",
      audience: "gardeners",
      goal: "Record watering",
      experience: "none",
      time: "30",
    },
    createGuidedScope({
      idea: "Garden journal",
      audience: "gardeners",
      goal: "Record watering",
    }),
  );
  p.reflections = {
    learned: "I can ask for a focused fix.",
    proud: "The watering list.",
    next: "Test empty inputs earlier.",
  };
  const summary = exportSummary(p);
  assert.ok(summary.includes("I can ask for a focused fix."));
  assert.ok(summary.includes(p.scope.features[0]));
  assert.ok(summary.includes("Test empty inputs earlier."));
});
