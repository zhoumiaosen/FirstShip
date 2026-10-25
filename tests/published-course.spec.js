import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("public app launches from introduction and completes the journey with no backend", async ({
  page,
}) => {
  const apiRequests = [],
    errors = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.includes("/api/")) apiRequests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .locator(".hero-actions")
    .getByRole("link", { name: /Try FirstShip/ })
    .click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.locator("body")).not.toContainText(
    /Online demo|Starter guidance|AI-personalized|Live AI/,
  );
  await page
    .getByRole("button", { name: "Start building", exact: true })
    .click();
  for (const [label, value] of [
    ["What would you love to build?", "A plant watering journal"],
    ["Who are you making it for?", "Houseplant owners"],
    [
      "What’s the one thing it should do?",
      "Record a watering and view its history",
    ],
  ]) {
    await page.getByLabel(label).fill(value);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Make my five-day plan" }).click();
  await expect(
    page.getByRole("heading", { name: "Your idea, made achievable." }),
  ).toBeVisible();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("My Online Plant Journal");
  await page.getByRole("button", { name: "This is my starting point" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "My Online Plant Journal", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Training days" })
    .getByRole("button")
    .first()
    .click();
  await page
    .getByRole("button", { name: /Something not quite working/ })
    .click();
  await page.getByLabel("What were you trying to do?").fill("Save a watering");
  await page
    .getByLabel("What did you expect to happen?")
    .fill("A new history entry");
  await page
    .getByLabel("What happened instead?")
    .fill("The history stays empty");
  await page
    .getByRole("button", { name: "Help me find the next step" })
    .click();
  await expect(page.locator(".help-result")).toContainText("Guided course");
  await expect(page.locator(".help-result .prompt-box")).toContainText(
    "The history stays empty",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  for (let day = 1; day <= 5; day++) {
    await page
      .getByRole("navigation", { name: "Training days" })
      .getByRole("button")
      .nth(day - 1)
      .click();
    for (let task = 1; task <= 2; task++) {
      const card = page.locator(".task-card");
      for (const box of await card.getByRole("checkbox").all())
        await box.check();
      await card
        .locator("textarea")
        .fill(`Observed day ${day} task ${task} in the guided course.`);
      await card.getByRole("button", { name: "I checked it—continue" }).click();
    }
  }
  await expect(
    page.getByText("10 of 10 tasks learner-confirmed"),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download my project summary" })
    .click();
  const download = await downloadEvent;
  expect(await readFile(await download.path(), "utf8")).toContain(
    "Status: Completed (10/10 tasks)",
  );
  await page.reload();
  await expect(page.getByText("10 of 10 tasks checked by you")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Learning menu" }).click();
  await page
    .getByRole("navigation", { name: "Training days" })
    .getByRole("button")
    .nth(4)
    .click();
  await expect(page.locator(".lesson-heading")).toContainText("DAY 5");
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});
