import { expect, test } from "@playwright/test";
import { buildStarterGraph, mockApi } from "../mocks";

test.describe("flight deck — deployment tracker", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await buildStarterGraph(page);
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("deploy-btn")).toBeEnabled();
  });

  test("a clean launch progresses PREFLIGHT → ORBIT", async ({ page }) => {
    await page.getByTestId("deploy-btn").click();
    const deck = page.getByTestId("flight-deck");
    await expect(deck).toBeVisible();
    await expect(page.getByTestId("phase-PREFLIGHT")).toBeVisible();

    // steps flip to success as the poll advances
    await expect(page.getByTestId("step-ignition-build")).toHaveAttribute("data-status", "success", { timeout: 15_000 });
    await expect(page.getByTestId("step-orbit-traffic")).toHaveAttribute("data-status", "success", { timeout: 15_000 });
    await expect(page.getByTestId("orbit-confirmed")).toBeVisible();
    await expect(page.getByTestId("deck-progress")).toHaveCSS("width", /.+/);
  });

  test("telemetry log streams during ascent", async ({ page }) => {
    await page.getByTestId("deploy-btn").click();
    const log = page.getByTestId("deck-log");
    await expect(log).toContainText("preflight-policy", { timeout: 15_000 });
    await expect(log).toContainText("Architecture is live", { timeout: 15_000 });
  });

  test("deck collapses and re-expands", async ({ page }) => {
    await page.getByTestId("deploy-btn").click();
    await expect(page.getByTestId("deck-steps")).toBeVisible();
    await page.getByTestId("deck-toggle").click();
    await expect(page.getByTestId("flight-deck")).toHaveClass(/max-h-12/);
    await page.getByTestId("deck-toggle").click();
    await expect(page.getByTestId("flight-deck")).toHaveClass(/max-h-72/);
  });
});
