import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authRequired, isOperator } from "../../functions/_shared/clerk.js";

describe("isOperator", () => {
  it("accepts role on the root claim (cloudpilot JWT template)", () => {
    assert.equal(isOperator({ role: "operator" }), true);
    assert.equal(isOperator({ role: "guest" }), false);
  });

  it("accepts nested public_metadata / metadata shapes", () => {
    assert.equal(isOperator({ public_metadata: { role: "operator" } }), true);
    assert.equal(isOperator({ metadata: { role: "operator" } }), true);
  });

  it("rejects missing or null claims", () => {
    assert.equal(isOperator(null), false);
    assert.equal(isOperator({}), false);
  });
});

describe("authRequired", () => {
  it("is true when CLERK_JWKS_URL is set", () => {
    assert.equal(authRequired({ CLERK_JWKS_URL: "https://example/jwks.json" }), true);
  });

  it("is false when Clerk is not wired", () => {
    assert.equal(authRequired({}), false);
    assert.equal(authRequired(null), false);
  });
});
