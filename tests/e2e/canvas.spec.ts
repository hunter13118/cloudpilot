import { expect, test } from "@playwright/test";
import { mockApi } from "../mocks";

test.describe("visual-to-cloud canvas", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
  });

  test("click-to-add places a service node", async ({ page }) => {
    await page.getByTestId("palette-item-cloud_run").click();
    await expect(page.getByTestId("node-cloud_run")).toBeVisible();
    await expect(page.getByTestId("canvas-empty")).toHaveCount(0);
  });

  test("HTML5 drag-and-drop from palette to canvas", async ({ page }) => {
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    const source = page.getByTestId("palette-item-bigquery");
    const pane = page.locator(".react-flow__pane"); // drop must land on the flow pane itself

    await source.dispatchEvent("dragstart", { dataTransfer });
    await pane.dispatchEvent("dragover", { dataTransfer });
    await pane.dispatchEvent("drop", { dataTransfer, clientX: 700, clientY: 400 });

    await expect(page.getByTestId("node-bigquery")).toBeVisible();
  });

  test("multiple services build up an architecture", async ({ page }) => {
    for (const t of ["load_balancer", "cloud_run", "cloud_sql"]) {
      await page.getByTestId(`palette-item-${t}`).click();
    }
    await expect(page.locator('[data-testid^="node-"]')).toHaveCount(3);
  });

  test("nodes connect via handles to form edges", async ({ page }) => {
    await page.getByTestId("palette-item-cloud_run").click();
    await page.getByTestId("palette-item-cloud_sql").click();

    const sourceHandle = page.getByTestId("node-cloud_run").locator(".react-flow__handle.source");
    const targetHandle = page.getByTestId("node-cloud_sql").locator(".react-flow__handle.target");

    const s = await sourceHandle.boundingBox();
    const t = await targetHandle.boundingBox();
    test.skip(!s || !t, "handles not measurable in this environment");

    await page.mouse.move(s!.x + s!.width / 2, s!.y + s!.height / 2);
    await page.mouse.down();
    await page.mouse.move(t!.x + t!.width / 2, t!.y + t!.height / 2, { steps: 12 });
    await page.mouse.up();

    await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  });
});
