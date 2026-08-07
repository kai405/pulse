import { expect, test } from "@playwright/test";

const screens = [
  ["landing", "/"],
  ["auth", "/auth"],
  ["onboarding", "/onboarding"],
  ["dashboard", "/dashboard"],
  ["practice", "/practice"],
  ["result-overview", "/sessions/sample-community-change"],
  ["history", "/history"],
  ["progress", "/progress"],
  ["settings", "/settings"],
] as const;

test("capture major desktop surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [name, path] of screens) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: `artifacts/visual/desktop-${name}.png`, fullPage: true, caret: "initial" });
  }

  await page.goto("/practice");
  await page.getByRole("button", { name: "Check devices" }).click();
  await expect(page.getByRole("heading", { name: /make sure pulse can hear you/i })).toBeVisible();
  await page.screenshot({ path: "artifacts/visual/desktop-studio-preflight.png", fullPage: true, caret: "initial" });

  await page.route("**/api/sessions/visual-processing/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ id: "visual-processing", status: "processing", current_stage: "measuring", failure_code: null, failure_message: null, updated_at: new Date().toISOString() }),
  }));
  await page.goto("/sessions/visual-processing/processing");
  await expect(page.getByRole("heading", { name: /turning your practice into evidence/i })).toBeVisible();
  await page.screenshot({ path: "artifacts/visual/desktop-processing.png", fullPage: true, caret: "initial" });

  await page.route("**/api/sessions/visual-failed/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ id: "visual-failed", status: "failed", current_stage: "failed", failure_code: "provider_configuration", failure_message: "Live analysis requires an OpenAI API key.", updated_at: new Date().toISOString() }),
  }));
  await page.goto("/sessions/visual-failed/processing");
  await expect(page.getByRole("heading", { name: /analysis stopped, but your session is safe/i })).toBeVisible();
  await page.screenshot({ path: "artifacts/visual/desktop-processing-failed.png", fullPage: true, caret: "initial" });

  await page.goto("/history");
  await page.getByPlaceholder("Search prompts").fill("No matching speech exists");
  await expect(page.getByText("No sessions match those filters.")).toBeVisible();
  await page.screenshot({ path: "artifacts/visual/desktop-history-empty.png", fullPage: true, caret: "initial" });

  await page.goto("/sessions/sample-community-change");
  await page.getByRole("tab", { name: "Transcript & evidence" }).click();
  await expect(page.getByText("Timestamped transcript")).toBeVisible();
  await page.screenshot({ path: "artifacts/visual/desktop-result-evidence.png", fullPage: true, caret: "initial" });
});

test("capture responsive critical surfaces", async ({ page }) => {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "projector", width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const [name, path] of [["landing", "/"], ["practice", "/practice"], ["result", "/sessions/sample-community-change"]] as const) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.screenshot({ path: `artifacts/visual/${viewport.name}-${name}.png`, fullPage: true, caret: "initial" });
    }
  }
});

test("dark actions retain accessible label contrast", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard");
  await expect(page.locator("h1").first()).toBeVisible();
  for (const element of [page.getByRole("link", { name: "Today" }), page.getByRole("link", { name: "Start a practice" })]) {
    await expect(element).toHaveCSS("color", "rgb(255, 255, 255)");
  }
});

test("critical mobile surfaces do not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/practice", "/sessions/sample-community-change"]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    const audit = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>("body *")].flatMap((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 2 || rect.left < -2
          ? [{ tag: element.tagName, className: String(element.className).slice(0, 180), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }]
          : [];
      }).slice(0, 12),
    }));
    expect(audit.scrollWidth, `${path}: ${JSON.stringify(audit.offenders)}`).toBe(audit.viewport);
  }
});

test("major routes emit no uncaught browser errors or server failures", async ({ page }) => {
  const failures: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()} @ ${message.location().url}`); });
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`); });

  for (const [, path] of screens) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
  }

  expect(failures).toEqual([]);
});
