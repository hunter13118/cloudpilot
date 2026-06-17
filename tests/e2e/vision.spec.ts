import { expect, test } from "@playwright/test";
import { VISION } from "../fixtures";
import { mockApi } from "../mocks";

test.describe("multimodal import — whiteboard photo → live canvas", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
  });

  test("gemini reconstructs the architecture from an image", async ({ page }) => {
    await page.getByTestId("vision-import").click();

    await expect(page.locator('[data-testid^="node-"]')).toHaveCount(VISION.graph.nodes.length);
    await expect(page.getByTestId("node-gemini")).toBeVisible();
    await expect(page.locator(".react-flow__edge")).toHaveCount(VISION.graph.edges.length);
  });

  test("import reports confidence via toast", async ({ page }) => {
    await page.getByTestId("vision-import").click();
    await expect(page.getByTestId("toast")).toContainText("7 services");
    await expect(page.getByTestId("toast")).toContainText("94% confidence");
  });

  test("imported graph is immediately generable", async ({ page }) => {
    await page.getByTestId("vision-import").click();
    await expect(page.getByTestId("node-cloud_sql")).toBeVisible();
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("reasoning-stream")).toBeVisible();
  });
});
