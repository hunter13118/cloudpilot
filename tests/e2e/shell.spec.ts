import { expect, test } from "@playwright/test";
import { mockApi } from "../mocks";

test.describe("mission control shell", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
  });

  test("boots the cockpit with branding and demo badge", async ({ page }) => {
    await expect(page.getByTestId("topbar")).toContainText("MILKMAN ENTERPRISE");
    await expect(page.getByTestId("topbar")).toContainText("CloudPilot");
    await expect(page.getByTestId("mode-badge")).toHaveText(/DEMO MODE/);
    await expect(page.getByTestId("canvas-empty")).toBeVisible();
  });

  test("renders the full service catalog from the API", async ({ page }) => {
    for (const cat of ["compute", "data", "ai", "network", "ops"]) {
      await expect(page.getByTestId(`palette-cat-${cat}`)).toBeVisible();
    }
    await expect(page.getByTestId("palette-item-gemini")).toContainText("Gemini API");
  });

  test("palette search filters services", async ({ page }) => {
    await page.getByTestId("palette-search").fill("sql");
    await expect(page.getByTestId("palette-item-cloud_sql")).toBeVisible();
    await expect(page.getByTestId("palette-item-cloud_run")).toHaveCount(0);
  });

  test("deploy is locked until Gemini has generated a plan", async ({ page }) => {
    await expect(page.getByTestId("deploy-btn")).toBeDisabled();
  });

  test("project pill is editable — bring-your-own-GCP", async ({ page }) => {
    const input = page.getByTestId("project-pill").locator("input");
    await input.fill("anybodys-gcp-project");
    await expect(input).toHaveValue("anybodys-gcp-project");
  });
});
