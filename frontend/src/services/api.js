// ──────────────────────────────────────────────────────────────────────────
// Capability-aware API client.
//
// Three modes (set by the auth layer via configureCapability):
//   demo     → everything runs locally in demoEngine (no network, no creds).
//   byok     → caller pasted their own Gemini key; sent as X-Gemini-Key to the
//              Cloudflare Pages Function proxy.
//   operator → signed-in operator; Clerk session token sent as Bearer, the
//              Function uses the server-side shared key after verifying the role.
//
// Real mode only routes /architect/generate through the backend; the Flight
// Deck deploy/diagnose loop is a simulation and always runs in demoEngine.
// Any real-mode failure falls back to demoEngine so the UI never dead-ends.
// ──────────────────────────────────────────────────────────────────────────
import axios from "axios";
import * as demo from "./demoEngine.js";
import { apiBase } from "../lib/appBase.js";

const client = axios.create({ baseURL: apiBase, timeout: 30000 });

// module-level capability, updated by the auth layer
const capability = {
  mode: "demo", // demo | byok | operator
  getKey: () => null, // () => string | null   (BYOK)
  getToken: async () => null, // () => Promise<string|null>  (Clerk session JWT)
};

export function configureCapability(partial) {
  Object.assign(capability, partial);
}
export function currentMode() {
  return capability.mode;
}

async function authHeaders() {
  const headers = {};
  if (capability.mode === "byok") {
    const k = capability.getKey();
    if (!k) return null;
    headers["X-Gemini-Key"] = k;
  }
  if (capability.mode === "operator" || capability.mode === "byok") {
    const t = await capability.getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  if (capability.mode === "byok" && !headers["X-Gemini-Key"]) return null;
  if (capability.mode === "operator" && !headers.Authorization) return null;
  return Object.keys(headers).length ? headers : null;
}

export const api = {
  /** Catalog is static; serve from demo (also avoids a network hop on Pages). */
  catalog: async () => demo.CATALOG,

  health: async () => ({ mode: capability.mode, model: "gemini-2.5-pro", brand: "MilkMan Enterprise" }),

  /** Architecture synthesis — the one call with a real backend path. */
  generate: async (graph, project, constraints = []) => {
    if (capability.mode === "demo") return demo.generate(graph, project);
    const headers = await authHeaders();
    if (!headers) return demo.generate(graph, project); // no usable creds → demo
    try {
      const { data } = await client.post("/architect/generate", { graph, project, constraints }, { headers });
      return { ...data, _mode: capability.mode };
    } catch (e) {
      // graceful degradation: surface a flag the UI can toast, but keep working
      const res = demo.generate(graph, project);
      res._fellBack = true;
      const status = e?.response?.status;
      if (status === 401) res._authFailed = true;
      return res;
    }
  },

  // ---- Flight Deck (simulation; client-side in every mode) ----
  deploy: async (runId, _project, { chaos = false } = {}) => demo.startDeployment(runId, { chaos }),
  deploymentStatus: async (id) => demo.getDeployment(id),
  retryDeployment: async (id) => demo.retryDeployment(id),
  diagnose: async () => demo.diagnose(),

  // ---- Multimodal whiteboard import ----
  visionImport: async () => demo.visionImport(),
};
