import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function createPlan(page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start building", exact: true })
    .click();
  await page
    .getByLabel("What would you love to build?")
    .fill("A plant watering journal");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Who are you making it for?")
    .fill("People with houseplants");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("What’s the one thing it should do?")
    .fill("Record watering a plant and see recent entries");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Make my five-day plan" }).click();
  await expect(
    page.getByRole("heading", { name: "Your idea, made achievable." }),
  ).toBeVisible();
}
async function approve(page) {
  await page
    .getByLabel("Project name", { exact: true })
    .fill("My Plant Journal");
  await page.getByRole("button", { name: "This is my starting point" }).click();
  await expect(
    page.getByRole("heading", { name: "Your five-day journey" }),
  ).toBeVisible();
}

test("own idea → editable scope → ten learner-confirmed tasks → export; survives reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await createPlan(page);
  await approve(page);
  await expect(page.getByText("0 of 10 tasks checked by you")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "My Plant Journal", exact: true }),
  ).toBeVisible();
  for (let day = 1; day <= 5; day++) {
    await page
      .getByRole("navigation", { name: "Training days" })
      .getByRole("button")
      .nth(day - 1)
      .click();
    for (let task = 1; task <= 2; task++) {
      const card = page.locator(".task-card");
      await expect(
        card.getByRole("button", { name: "I checked it—continue" }),
      ).toBeDisabled();
      await expect(card.locator(".prompt-box")).toContainText(
        "My Plant Journal",
      );
      for (const box of await card.getByRole("checkbox").all())
        await box.check();
      await expect(
        card.getByRole("button", { name: "I checked it—continue" }),
      ).toBeDisabled();
      await card
        .locator("textarea")
        .fill(
          `I tried day ${day}, task ${task}, and checked the visible result.`,
        );
      await card.getByRole("button", { name: "I checked it—continue" }).click();
    }
  }
  await expect(
    page.getByText("10 of 10 tasks learner-confirmed"),
  ).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download my project summary" })
    .click();
  const download = await downloading;
  const content = await readFile(await download.path(), "utf8");
  expect(content).toContain("Status: Completed (10/10 tasks)");
  expect(content).toContain("My Plant Journal");
  expect(content).toContain("learner-confirmed");
  await page.reload();
  await expect(page.getByText("10 of 10 tasks checked by you")).toBeVisible();
  expect(errors).toEqual([]);
});

test("help retains details across close/reopen and reload, then provides a course checklist", async ({
  page,
}) => {
  await createPlan(page);
  await approve(page);
  await page.getByRole("button", { name: "Start day one" }).click();
  await page
    .getByRole("button", { name: /Something not quite working/ })
    .click();
  await page
    .getByLabel("What were you trying to do?")
    .fill("Start my local preview");
  await page.getByLabel("What did you expect to happen?").fill("See my app");
  await page.getByLabel("What happened instead?").fill("Connection refused");
  await page
    .getByLabel("Exact error message (if there is one)")
    .fill("ERR_CONNECTION_REFUSED");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue my journey" })
    .isVisible()
    .catch(() => false);
  await page
    .getByRole("navigation", { name: "Training days" })
    .getByRole("button")
    .first()
    .click();
  await page
    .getByRole("button", { name: /Something not quite working/ })
    .click();
  await expect(page.getByLabel("What happened instead?")).toHaveValue(
    "Connection refused",
  );
  await page
    .getByRole("button", { name: "Help me find the next step" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Here’s a place to start." }),
  ).toBeVisible();
  await expect(page.locator(".help-result")).toContainText("Guided course");
  await expect(page.locator(".help-result .prompt-box")).toContainText(
    "ERR_CONNECTION_REFUSED",
  );
});

test("the course narrows ambitious ideas and validates edited plans", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start building", exact: true })
    .click();
  for (const [label, value] of [
    ["What would you love to build?", "Airbnb for students"],
    ["Who are you making it for?", "Students"],
    ["What’s the one thing it should do?", "Book rooms with payments and chat"],
  ]) {
    await page.getByLabel(label).fill(value);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Make my five-day plan" }).click();
  await expect(
    page.getByLabel("The one main thing it should do"),
  ).not.toHaveValue("Book rooms with payments and chat");
  await page.getByLabel("Project name", { exact: true }).fill(" ");
  await page.getByRole("button", { name: "This is my starting point" }).click();
  await expect(page.getByRole("alert")).toContainText("Add a project name");
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Student Room Finder");
  await page.getByRole("button", { name: "This is my starting point" }).click();
  await expect(
    page.getByRole("heading", { name: "Your five-day journey" }),
  ).toBeVisible();
});

test("small screen fits and all five days remain navigable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createPlan(page);
  await approve(page);
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "work/mobile-lesson.png", fullPage: true });
});

test("partial restored help draft does not crash and can be completed", async ({
  page,
}) => {
  await createPlan(page);
  await approve(page);
  await page.evaluate(() => {
    const key = "firstship.project.v1";
    const data = JSON.parse(localStorage.getItem(key));
    data.project.helpDraft = { "day-1-task-1": { actual: "Blank page" } };
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await page
    .getByRole("navigation", { name: "Training days" })
    .getByRole("button")
    .first()
    .click();
  await page
    .getByRole("button", { name: /Something not quite working/ })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("What happened instead?")).toHaveValue(
    "Blank page",
  );
  await expect(page.getByLabel("What were you trying to do?")).toHaveValue("");
});
