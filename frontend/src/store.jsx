// Mission state — one reducer drives the whole flight.
import { createContext, useContext, useReducer } from "react";

export const MissionContext = createContext(null);

export const initialState = {
  mode: "demo", // demo | byok | operator (capability)
  role: "guest", // guest | operator (from Clerk publicMetadata)
  authConfigured: false, // is Clerk wired up at all?
  byokKey: null, // bring-your-own Gemini key (sessionStorage)
  keyModalOpen: false,
  project: { project_id: "milkman-enterprise-prod", region: "us-central1" },
  generating: false,
  run: null, // GenerateResponse
  reasoningCursor: 0, // typewriter position into run.reasoning
  rightTab: "copilot", // copilot | compliance | iac | cost
  deployment: null, // DeploymentState
  deckOpen: false,
  diagnosis: null, // DiagnoseResponse
  diagnosisOpen: false,
  visionNarrative: null,
  toast: null,
};

export function reducer(state, action) {
  switch (action.type) {
    case "HEALTH":
      return { ...state, mode: action.payload.mode };
    case "CAPABILITY":
      return { ...state, ...action.payload };
    case "KEY_MODAL":
      return { ...state, keyModalOpen: action.payload };
    case "PROJECT":
      return { ...state, project: { ...state.project, ...action.payload } };
    case "GENERATE_START":
      return { ...state, generating: true, run: null, reasoningCursor: 0, rightTab: "copilot" };
    case "GENERATE_DONE":
      return { ...state, generating: false, run: action.payload };
    case "GENERATE_FAIL":
      return { ...state, generating: false, toast: { kind: "error", text: action.payload } };
    case "REASONING_TICK":
      return { ...state, reasoningCursor: Math.min(state.reasoningCursor + 1, state.run?.reasoning?.length ?? 0) };
    case "TAB":
      return { ...state, rightTab: action.payload };
    case "DEPLOY_STATE":
      return { ...state, deployment: action.payload, deckOpen: true };
    case "DECK":
      return { ...state, deckOpen: action.payload };
    case "DIAGNOSIS":
      return { ...state, diagnosis: action.payload, diagnosisOpen: true };
    case "DIAGNOSIS_CLOSE":
      return { ...state, diagnosisOpen: false };
    case "VISION":
      return { ...state, visionNarrative: action.payload };
    case "TOAST":
      return { ...state, toast: action.payload };
    default:
      return state;
  }
}

export function MissionProvider({ children }) {
  const value = useReducer(reducer, initialState);
  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission outside MissionProvider");
  return ctx;
}
