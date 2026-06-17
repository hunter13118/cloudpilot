/**
 * Network-layer mock of the CloudPilot backend + browser-context test hooks.
 *
 * Since the app is now demo-first (deploy/diagnose/vision run in the client-side
 * demoEngine), tests:
 *   • compress the Flight Deck timeline via window.__CLOUDPILOT_SPEED, and
 *   • for the generate spec, flip the app into BYOK mode (enableRealMode) so the
 *     synthesis call routes through /api/v1/architect/generate and hits the mock,
 *     keeping fixture-based assertions deterministic.
 */
import type { Page, Route } from "@playwright/test";
import { CATALOG, DIAGNOSIS, GENERATE_RUN, HEALTH, VISION, deploymentFrame } from "./fixtures";

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

export interface MockOptions {
  failAt?: string;
  pollsToOrbit?: number;
}

/** Compress demo timelines so deploy/diagnose specs run fast. */
export async function fastClock(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __CLOUDPILOT_SPEED: number }).__CLOUDPILOT_SPEED = 0.12;
  });
}

/** Put the app in BYOK mode so generate routes through the (mocked) edge fn. */
export async function enableRealMode(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("cloudpilot.byok", "e2e-test-key");
    } catch {
      /* sandboxed */
    }
  });
}

export async function mockApi(page: Page, opts: MockOptions = {}) {
  await fastClock(page);

  const state = { polls: 0, failAt: undefined as string | undefined };

  await page.route("**/api/v1/health", (r) => json(r, HEALTH));
  await page.route("**/api/v1/catalog", (r) => json(r, CATALOG));
  await page.route("**/api/v1/architect/generate", (r) => json(r, GENERATE_RUN));

  await page.route("**/api/v1/deployments?*", (route) => {
    const url = new URL(route.request().url());
    state.polls = 0;
    state.failAt = url.searchParams.get("chaos") === "true" ? (opts.failAt ?? "ascent-apply") : undefined;
    json(route, deploymentFrame("dep-e2e01", 0, {}));
  });
  await page.route("**/api/v1/deployments/dep-e2e01/retry", (route) => {
    state.failAt = undefined;
    state.polls = 4;
    json(route, deploymentFrame("dep-e2e01", 4, {}));
  });
  await page.route("**/api/v1/deployments/dep-e2e01", (route) => {
    state.polls += 1;
    const total = opts.pollsToOrbit ?? 7;
    const done = Math.min(state.polls, total);
    if (state.failAt && done >= 5) return json(route, deploymentFrame("dep-e2e01", 4, { failAt: state.failAt }));
    json(route, deploymentFrame("dep-e2e01", done, {}));
  });

  await page.route("**/api/v1/diagnose", (r) => json(r, DIAGNOSIS));
  await page.route("**/api/v1/vision/import", (r) => json(r, VISION));

  return state;
}

/** Build a canvas by clicking palette items (drag is covered separately). */
export async function buildStarterGraph(page: Page) {
  for (const t of ["load_balancer", "cloud_run", "cloud_sql", "pubsub"]) {
    await page.getByTestId(`palette-item-${t}`).click();
  }
}
