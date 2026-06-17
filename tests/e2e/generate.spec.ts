import { expect, test } from "@playwright/test";
import { GENERATE_RUN } from "../fixtures";
import { buildStarterGraph, enableRealMode, mockApi } from "../mocks";

test.describe("gemini generation — the 2M-token pass", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await enableRealMode(page); // BYOK → generate hits the mocked edge function
    await page.goto("/");
    await buildStarterGraph(page);
  });

  test("warns when the canvas is empty", async ({ page }) => {
    await page.goto("/"); // fresh, empty canvas
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("toast")).toContainText("Drag services");
  });

  test("streams the reasoning trace with phase chips", async ({ page }) => {
    await page.getByTestId("generate-btn").click();
    const stream = page.getByTestId("reasoning-stream");
    await expect(stream).toBeVisible();
    // typewriter eventually reveals every line
    await expect(stream.locator("li.log-line")).toHaveCount(GENERATE_RUN.reasoning.length, { timeout: 15_000 });
    await expect(stream).toContainText("No RAG chunking required");
    await expect(page.getByTestId("run-summary")).toContainText("147 enterprise standards");
  });

  test("token gauge shows the single-pass context ingest", async ({ page }) => {
    await page.getByTestId("generate-btn").click();
    const gauge = page.getByTestId("token-gauge");
    await expect(gauge).toContainText("1.23M");
    await expect(gauge).toContainText("of 2M tokens");
    await expect(gauge).toContainText("Live Terraform State");
  });

  test("compliance tab grades the design against standards", async ({ page }) => {
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("reasoning-stream")).toBeVisible();
    await page.getByTestId("tab-compliance").click();
    await expect(page.getByTestId("compliance-score")).toHaveText("94");
    await expect(page.getByTestId("finding-f-sql")).toContainText("SEC-004");
    await expect(page.getByTestId("finding-f-waf")).toContainText("WARN");
    await expect(page.getByTestId("autofix-f-waf")).toContainText("Gemini autofix");
  });

  test("IaC tab renders standards-compliant terraform", async ({ page }) => {
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("reasoning-stream")).toBeVisible();
    await page.getByTestId("tab-iac").click();
    const code = page.getByTestId("iac-code");
    await expect(code).toContainText("google_cloud_run_v2_service");
    await expect(code).toContainText("ipv4_enabled    = false");
    await expect(page.getByTestId("iac-panel")).toContainText("main.tf");
  });

  test("cost tab projects monthly spend per service", async ({ page }) => {
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("reasoning-stream")).toBeVisible();
    await page.getByTestId("tab-cost").click();
    await expect(page.getByTestId("cost-total")).toContainText("410.90");
    await expect(page.getByTestId("cost-panel")).toContainText("Orders DB");
  });

  test("deploy unlocks once a run exists", async ({ page }) => {
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("deploy-btn")).toBeEnabled();
  });
});
