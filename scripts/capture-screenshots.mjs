import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { coach } from "../server/coach.js";

// Sample data in an isolated browser; existing learner projects are untouched.
// Use real starter-guidance code without sending requests to a paid AI provider.
const baseURL = process.env.SCREENSHOT_BASE_URL || "http://localhost:5173";
const directory = resolve("docs/screenshots");
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { ok: true, aiAvailable: false } }),
  );
  await page.route("**/api/coach", async (route) => {
    const result = await coach(route.request().postDataJSON(), { apiKey: "" });
    await route.fulfill({ json: result });
  });
  async function capture(name, ready) {
    await ready.waitFor({ state: "visible" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
      document.activeElement?.blur();
      document.querySelectorAll("[role=dialog]").forEach((el) => {
        el.scrollTop = 0;
      });
    });
    await page.screenshot({
      path: resolve(directory, `${name}.png`),
      animations: "disabled",
      fullPage: ["dashboard", "scope", "lesson"].includes(name),
    });
    console.log(`Captured ${name}.png`);
  }
  await page.goto(baseURL);
  await capture(
    "welcome",
    page.getByRole("button", { name: "Start building", exact: true }),
  );
  await page
    .getByRole("button", { name: "Start building", exact: true })
    .click();
  for (const [label, value] of [
    [
      "What would you love to build?",
      "LeafLog, a simple plant watering journal",
    ],
    [
      "Who are you making it for?",
      "People who love houseplants but forget when they watered them",
    ],
    [
      "What’s the one thing it should do?",
      "Record watering a plant and see its recent watering history",
    ],
  ]) {
    await page.getByLabel(label).fill(value);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Make my five-day plan" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("LeafLog");
  await page
    .getByLabel("The idea in one sentence")
    .fill(
      "A little watering journal for your houseplants. Add a plant, record a watering, and see what needs your attention.",
    );
  await page
    .getByLabel("Build now", { exact: true })
    .fill(
      "Add a plant with a name\nRecord when you water it\nSee the recent watering history",
    );
  await capture(
    "scope",
    page.getByRole("heading", { name: "Your idea, made achievable." }),
  );
  await page.getByRole("button", { name: "This is my starting point" }).click();
  await capture(
    "dashboard",
    page.getByRole("heading", { name: "Your five-day journey" }),
  );
  await page
    .getByRole("navigation", { name: "Training days" })
    .getByRole("button")
    .nth(2)
    .click();
  await capture("lesson", page.locator(".task-card h2"));
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("mobile", page.locator(".task-card h2"));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page
    .getByRole("button", { name: /Something not quite working/ })
    .click();
  await page
    .getByLabel("What were you trying to do?")
    .fill("Record a watering for my monstera.");
  await page
    .getByLabel("What did you expect to happen?")
    .fill("The watering should appear in the plant’s history.");
  await page
    .getByLabel("What happened instead?")
    .fill("Clicking “Add watering” leaves the history empty.");
  await page
    .getByLabel("Exact error message (if there is one)")
    .fill("No error appears on the screen.");
  await page
    .getByLabel("What have you already tried? (optional)")
    .fill("I refreshed the page and tried another plant.");
  await page
    .getByRole("button", { name: "Help me find the next step" })
    .click();
  await capture(
    "coaching",
    page.getByRole("heading", { name: "Here’s a place to start." }),
  );
  await context.close();
} finally {
  await browser.close();
}
