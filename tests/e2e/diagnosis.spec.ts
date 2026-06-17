import { expect, test } from "@playwright/test";
import { buildStarterGraph, mockApi } from "../mocks";

test.describe("gemini diagnosis — self-healing deployments", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await buildStarterGraph(page);
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("deploy-btn")).toBeEnabled();
    // arm the chaos flask → next deployment fails at ascent-apply
    await page.getByTestId("chaos-toggle").click();
    await page.getByTestId("deploy-btn").click();
  });

  test("a failed step surfaces the Diagnose button", async ({ page }) => {
    await expect(page.getByTestId("step-ascent-apply")).toHaveAttribute("data-status", "failed", { timeout: 15_000 });
    await expect(page.getByTestId("diagnose-btn")).toBeVisible();
  });

  test("diagnosis modal shows root cause, evidence and patch", async ({ page }) => {
    await expect(page.getByTestId("diagnose-btn")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("diagnose-btn").click();

    const modal = page.getByTestId("diagnosis-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("root-cause-title")).toContainText("name collision");
    await expect(page.getByTestId("diagnosis-confidence")).toHaveText("97% confidence");
    await expect(page.getByTestId("log-excerpt")).toContainText("Error 409");
    await expect(page.getByTestId("patch-diff")).toContainText("random_id.db_suffix.hex");
    await expect(modal).toContainText("NAM-006");
  });

  test("apply fix & retry resumes the flight to orbit", async ({ page }) => {
    await expect(page.getByTestId("diagnose-btn")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("diagnose-btn").click();
    await page.getByTestId("apply-retry-btn").click();

    await expect(page.getByTestId("diagnosis-modal")).toHaveCount(0);
    await expect(page.getByTestId("step-ascent-apply")).toHaveAttribute("data-status", "success", { timeout: 15_000 });
    await expect(page.getByTestId("orbit-confirmed")).toBeVisible({ timeout: 15_000 });
  });

  test("modal can be dismissed without retrying", async ({ page }) => {
    await expect(page.getByTestId("diagnose-btn")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("diagnose-btn").click();
    await page.getByTestId("diagnosis-close").click();
    await expect(page.getByTestId("diagnosis-modal")).toHaveCount(0);
    await expect(page.getByTestId("step-ascent-apply")).toHaveAttribute("data-status", "failed");
  });
});
