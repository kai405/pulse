import { expect, test } from "@playwright/test";

test("landing communicates the product and opens the labeled result", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /practice with proof/i })).toBeVisible();
  await page.getByRole("link", { name: /explore a sample analysis/i }).click();
  await expect(page.getByText("Sample analysis:")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Transcript & evidence" })).toBeVisible();
  await page.getByRole("tab", { name: "Transcript & evidence" }).click();
  await expect(page.getByText("Timestamped transcript")).toBeVisible();
});

test("guest onboarding reaches a dashboard without pretending sample data is personal", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `e2e-onboarding-${crypto.randomUUID()}` });
  await page.goto("/auth");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/display name/i).fill("Demo Speaker");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /i understand/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(/complete one practice to replace the clearly labeled example/i)).toBeVisible();
  await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();
  await page.request.delete("/api/account");
});

test("practice setup persists a custom session and handles denied devices", async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto("/practice");
  await page.getByRole("button", { name: "Write my own" }).click();
  await page.getByLabel("Custom prompt").fill("Explain one idea that changed how you work.");
  await page.getByRole("button", { name: "Check devices" }).click();
  await expect(page).toHaveURL(/studio/);
  await page.getByRole("button", { name: /check microphone and camera/i }).click();
  await expect(page.getByText(/permission|access|microphone/i).last()).toBeVisible();
});

test("records with browser media APIs, preserves provider failures, and deletes the failed session", async ({ page, context }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `e2e-recording-${crypto.randomUUID()}` });
  await page.goto("/auth");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await context.grantPermissions(["microphone", "camera"], { origin: "http://127.0.0.1:3100" });
  await page.goto("/practice");
  await page.getByRole("button", { name: "Off" }).click();
  await page.getByRole("button", { name: "Check devices" }).click();
  await page.getByRole("button", { name: /check microphone and camera/i }).click();
  const begin = page.getByRole("button", { name: "Begin preparation" });
  await expect(begin).toBeEnabled({ timeout: 10_000 });
  await begin.click();
  await expect(page.getByText("Recording", { exact: true })).toBeVisible({ timeout: 8_000 });
  await page.waitForTimeout(1_250);
  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByRole("heading", { name: "Recording complete." })).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /save and analyze/i }).click();
  const localSaveError = page.getByRole("heading", { name: /recording is still safe here/i });
  await expect.poll(async () => page.url().includes("/processing") || await localSaveError.isVisible(), { timeout: 20_000 }).toBe(true);
  if (page.url().includes("/processing")) {
    await expect(page.getByRole("heading", { name: /analysis stopped, but your session is safe/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /delete session/i }).click();
    await page.getByRole("button", { name: /delete permanently/i }).click();
    await expect(page).toHaveURL(/\/history/);
    await expect(page.getByText("All entries below are samples")).toBeVisible();
  } else {
    await expect(localSaveError).toBeVisible();
    await page.getByRole("link", { name: /view labeled sample analysis/i }).click();
    await expect(page.getByText("Sample analysis:")).toBeVisible();
  }
  await page.request.delete("/api/account");
});

test("history and progress clearly label fixtures in an empty workspace", async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByText("All entries below are samples")).toBeVisible();
  await page.goto("/progress");
  await expect(page.getByText(/clearly labeled sample sessions/i)).toBeVisible();
});

test("guest account deletion removes the temporary workspace", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `e2e-delete-${crypto.randomUUID()}` });
  await page.goto("/auth");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.goto("/settings");
  await expect(page.getByText("Temporary guest")).toBeVisible();
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("button", { name: /delete permanently/i }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /practice with proof/i })).toBeVisible();
});
