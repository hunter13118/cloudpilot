/**
 * Portfolio screenshot generator — `npm run screenshots`
 * Drives the real app through its braggable states at 1920×1080 @2x
 * and drops PNGs into ./screenshots/.
 */
import { expect, test } from "@playwright/test";
import { buildStarterGraph, mockApi } from "./mocks";

const shot = (name: string) => ({ path: `screenshots/${name}.png`, fullPage: false });

test("01 — mission control with a drawn architecture", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByTestId("vision-import").click(); // richest graph
  await expect(page.locator('[data-testid^="node-"]')).toHaveCount(7);
  await page.waitForTimeout(1200);
  await page.screenshot(shot("01-mission-control-canvas"));
});

test("02 — gemini reasoning stream + 2M-token gauge", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByTestId("vision-import").click();
  await page.getByTestId("generate-btn").click();
  await expect(page.getByTestId("run-summary")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600);
  await page.screenshot(shot("02-gemini-reasoning-2m-context"));
});

test("03 — standards compliance audit", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await buildStarterGraph(page);
  await page.getByTestId("generate-btn").click();
  await expect(page.getByTestId("reasoning-stream")).toBeVisible();
  await page.getByTestId("tab-compliance").click();
  await expect(page.getByTestId("compliance-score")).toBeVisible();
  await page.screenshot(shot("03-compliance-audit"));
});

test("04 — generated terraform", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await buildStarterGraph(page);
  await page.getByTestId("generate-btn").click();
  await expect(page.getByTestId("reasoning-stream")).toBeVisible();
  await page.getByTestId("tab-iac").click();
  await expect(page.getByTestId("iac-code")).toBeVisible();
  await page.screenshot(shot("04-generated-terraform"));
});

test("05 — flight deck in orbit", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByTestId("vision-import").click();
  await page.getByTestId("generate-btn").click();
  await expect(page.getByTestId("deploy-btn")).toBeEnabled();
  await page.getByTestId("deploy-btn").click();
  await expect(page.getByTestId("orbit-confirmed")).toBeVisible({ timeout: 20_000 });
  await page.screenshot(shot("05-flight-deck-orbit"));
});

test("06 — gemini diagnosis modal", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByTestId("vision-import").click();
  await page.getByTestId("generate-btn").click();
  await expect(page.getByTestId("deploy-btn")).toBeEnabled();
  await page.getByTestId("chaos-toggle").click();
  await page.getByTestId("deploy-btn").click();
  await expect(page.getByTestId("diagnose-btn")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("diagnose-btn").click();
  await expect(page.getByTestId("diagnosis-modal")).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot(shot("06-gemini-diagnosis"));
});
