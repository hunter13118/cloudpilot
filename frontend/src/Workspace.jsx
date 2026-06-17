import { useCallback, useEffect, useRef, useState } from "react";
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react";

import TopBar from "./components/TopBar.jsx";
import Palette from "./components/Palette.jsx";
import FlowCanvas from "./components/FlowCanvas.jsx";
import RightPanel from "./components/RightPanel.jsx";
import FlightDeck from "./components/FlightDeck.jsx";
import DiagnosisModal from "./components/DiagnosisModal.jsx";
import KeyModal from "./components/KeyModal.jsx";
import Toast from "./components/Toast.jsx";
import { api, configureCapability } from "./services/api.js";
import { useMission } from "./store.jsx";

let nodeSeq = 0;
const nid = () => `n-${++nodeSeq}-${Date.now().toString(36)}`;

const SESSION_KEY = "cloudpilot.byok";

/**
 * The mission-control workspace. Receives identity from the auth gate:
 *   authConfigured — is Clerk wired? role — guest|operator. getToken — Clerk JWT.
 * Resolves capability (demo | byok | operator) and configures the API client.
 */
export default function Workspace({ authConfigured = false, role = "guest", getToken = async () => null, clerkGetToken = null }) {
  const [state, dispatch] = useMission();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [chaos, setChaos] = useState(false);
  const pollRef = useRef(null);

  const syncCapability = useCallback(
    (byokKeyOverride) => {
      const byokKey = byokKeyOverride !== undefined ? byokKeyOverride : sessionStorage.getItem(SESSION_KEY) || null;
      const mode = byokKey ? "byok" : role === "operator" ? "operator" : "demo";
      configureCapability({
        mode,
        getKey: () => sessionStorage.getItem(SESSION_KEY) || null,
        getToken,
      });
      dispatch({ type: "CAPABILITY", payload: { mode, role, authConfigured, byokKey } });
      return mode;
    },
    [role, authConfigured, getToken, dispatch]
  );

  // ---- resolve capability whenever identity changes ----
  useEffect(() => {
    syncCapability();
  }, [syncCapability]);

  // ---- operator sanity check: JWT template must carry role for the edge fn ----
  useEffect(() => {
    if (!authConfigured || role !== "operator" || !clerkGetToken) return;
    let cancelled = false;
    (async () => {
      try {
        const templateToken = await clerkGetToken({ template: "cloudpilot" });
        if (cancelled) return;
        if (!templateToken) {
          dispatch({
            type: "TOAST",
            payload: {
              kind: "warn",
              text: "Operator UI is on, but the Clerk JWT template “cloudpilot” is missing — live synthesis may fall back to demo until you add it (see DEPLOY.md).",
            },
          });
        }
      } catch {
        if (!cancelled) {
          dispatch({
            type: "TOAST",
            payload: {
              kind: "warn",
              text: "Create the Clerk JWT template “cloudpilot” with { \"role\": \"{{user.public_metadata.role}}\" } so operator mode works end-to-end.",
            },
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authConfigured, role, clerkGetToken, dispatch]);

  const setByokKey = useCallback(
    (key) => {
      if (key) sessionStorage.setItem(SESSION_KEY, key);
      else sessionStorage.removeItem(SESSION_KEY);
      dispatch({ type: "KEY_MODAL", payload: false });
      syncCapability(key || null);
      dispatch({
        type: "TOAST",
        payload: key
          ? { kind: "ok", text: "Gemini key stored for this session — real synthesis enabled." }
          : { kind: "warn", text: "Key cleared — back to demo mode." },
      });
    },
    [syncCapability, dispatch]
  );

  // ---- reasoning typewriter ----
  useEffect(() => {
    if (!state.run) return;
    if (state.reasoningCursor >= state.run.reasoning.length) return;
    const t = setTimeout(() => dispatch({ type: "REASONING_TICK" }), 320);
    return () => clearTimeout(t);
  }, [state.run, state.reasoningCursor, dispatch]);

  const addService = useCallback(
    (service, position) => {
      setNodes((nds) => [
        ...nds,
        {
          id: nid(),
          type: "service",
          position: position ?? { x: 160 + (nds.length % 4) * 240, y: 120 + Math.floor(nds.length / 4) * 160 },
          data: { service },
        },
      ]);
    },
    [setNodes]
  );

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const loadGraph = useCallback(
    (graph) => {
      setNodes(
        graph.nodes.map((n) => ({
          id: n.id,
          type: "service",
          position: n.position ?? { x: 100, y: 100 },
          data: { service: { type: n.type, label: n.label, icon: iconFor(n.type), blurb: "", tier: "" } },
        }))
      );
      setEdges(graph.edges.map((e) => ({ ...e, animated: true })));
    },
    [setNodes, setEdges]
  );

  const generate = useCallback(async () => {
    const graph = {
      nodes: nodes.map((n) => ({ id: n.id, type: n.data.service.type, label: n.data.service.label, position: n.position, config: {} })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label ?? null })),
    };
    if (!graph.nodes.length) {
      dispatch({ type: "TOAST", payload: { kind: "warn", text: "Drag services onto the canvas first." } });
      return;
    }
    dispatch({ type: "GENERATE_START" });
    try {
      const run = await api.generate(graph, state.project);
      dispatch({ type: "GENERATE_DONE", payload: run });
      if (run._authFailed) {
        dispatch({
          type: "TOAST",
          payload: {
            kind: "warn",
            text: "Live synthesis rejected your session — sign in again or check the Clerk JWT template / operator role.",
          },
        });
      } else if (run._fellBack) {
        dispatch({ type: "TOAST", payload: { kind: "warn", text: "Live Gemini call failed — showing a simulated result." } });
      }
    } catch {
      dispatch({ type: "GENERATE_FAIL", payload: "Gemini generation failed — check the API gateway." });
    }
  }, [nodes, edges, state.project, dispatch]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const poll = useCallback(
    (deploymentId) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const s = await api.deploymentStatus(deploymentId);
          dispatch({ type: "DEPLOY_STATE", payload: s });
          const failed = s.steps.some((st) => st.status === "failed");
          if (s.progress >= 100 || failed) stopPolling();
        } catch {
          stopPolling();
        }
      }, 700);
    },
    [dispatch, stopPolling]
  );

  const deploy = useCallback(async () => {
    if (!state.run) return;
    const s = await api.deploy(state.run.run_id, state.project, { chaos });
    dispatch({ type: "DEPLOY_STATE", payload: s });
    poll(s.deployment_id);
  }, [state.run, state.project, chaos, dispatch, poll]);

  const retry = useCallback(async () => {
    if (!state.deployment) return;
    dispatch({ type: "DIAGNOSIS_CLOSE" });
    const s = await api.retryDeployment(state.deployment.deployment_id);
    dispatch({ type: "DEPLOY_STATE", payload: s });
    poll(s.deployment_id);
  }, [state.deployment, dispatch, poll]);

  const diagnose = useCallback(
    async (stepId) => {
      const d = await api.diagnose(state.deployment.deployment_id, stepId);
      dispatch({ type: "DIAGNOSIS", payload: d });
    },
    [state.deployment, dispatch]
  );

  const visionImport = useCallback(
    async (file) => {
      const res = await api.visionImport(file);
      loadGraph(res.graph);
      dispatch({ type: "VISION", payload: res.narrative });
      dispatch({ type: "TOAST", payload: { kind: "ok", text: `Gemini parsed the whiteboard — ${res.graph.nodes.length} services reconstructed (${Math.round(res.confidence * 100)}% confidence).` } });
    },
    [loadGraph, dispatch]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  return (
    <div className="h-full flex flex-col gap-3 p-3" data-testid="app-shell">
      <TopBar onGenerate={generate} onDeploy={deploy} onVisionImport={visionImport} chaos={chaos} setChaos={setChaos} />
      <div className="flex-1 flex gap-3 min-h-0">
        <Palette onAdd={addService} />
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <FlowCanvas nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onAddService={addService} />
          <FlightDeck onDiagnose={diagnose} onRetry={retry} />
        </div>
        <RightPanel />
      </div>
      <DiagnosisModal onRetry={retry} />
      <KeyModal onSave={setByokKey} />
      <Toast />
    </div>
  );
}

function iconFor(type) {
  const m = {
    cloud_run: "container", gke: "boxes", cloud_functions: "zap", compute_engine: "server",
    cloud_sql: "database", bigquery: "bar-chart-3", firestore: "flame", gcs: "hard-drive",
    memorystore: "gauge", vertex_ai: "brain-circuit", gemini: "sparkles", discovery_engine: "search",
    load_balancer: "share-2", vpc: "network", cloud_armor: "shield", api_gateway: "door-open",
    pubsub: "radio", cloud_tasks: "list-checks", secret_manager: "key-round", kms: "lock",
  };
  return m[type] ?? "boxes";
}
