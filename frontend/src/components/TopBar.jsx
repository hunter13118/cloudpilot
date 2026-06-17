import { useRef } from "react";
import { Camera, FlaskConical, KeyRound, Rocket, Sparkles } from "lucide-react";
import { useMission } from "../store.jsx";
import UserChip from "./UserChip.jsx";

const MODE_BADGE = {
  demo: { label: "DEMO MODE", cls: "border-amber-400/40 text-amber-300 bg-amber-400/10" },
  byok: { label: "LIVE · YOUR KEY", cls: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10" },
  operator: { label: "LIVE · OPERATOR", cls: "border-tele/40 text-tele bg-tele/10" },
};

export default function TopBar({ onGenerate, onDeploy, onVisionImport, chaos, setChaos }) {
  const [state, dispatch] = useMission();
  const fileRef = useRef(null);
  const badge = MODE_BADGE[state.mode] ?? MODE_BADGE.demo;

  return (
    <header className="panel flex items-center gap-4 px-4 h-14 shrink-0" data-testid="topbar">
      {/* brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl gem-ring grid place-items-center bg-space-800">
          <svg viewBox="0 0 32 32" className="w-5 h-5">
            <defs>
              <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#4285F4" />
                <stop offset=".5" stopColor="#9B72CB" />
                <stop offset="1" stopColor="#D96570" />
              </linearGradient>
            </defs>
            <path d="M16 2l9 14-9 14L7 16z" fill="url(#logo-g)" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-[10px] tracking-[0.28em] text-slate-400 font-mono">MILKMAN ENTERPRISE</div>
          <div className="font-bold text-lg -mt-0.5">
            Cloud<span className="gem-text">Pilot</span>
          </div>
        </div>
      </div>

      {/* target project — bring-your-own-GCP */}
      <div className="ml-4 flex items-center gap-2 panel rounded-full px-3 py-1.5 text-xs font-mono text-slate-300" data-testid="project-pill">
        <span className="w-1.5 h-1.5 rounded-full bg-tele animate-pulseRing" />
        <input
          aria-label="GCP project id"
          className="bg-transparent outline-none w-48 text-slate-200"
          value={state.project.project_id}
          onChange={(e) => dispatch({ type: "PROJECT", payload: { project_id: e.target.value } })}
        />
        <span className="text-slate-500">{state.project.region}</span>
      </div>

      <button
        data-testid="mode-badge"
        onClick={() => dispatch({ type: "KEY_MODAL", payload: true })}
        title="Connect Gemini for live synthesis"
        className={`text-[10px] font-mono px-2 py-1 rounded-full border transition hover:brightness-125 ${badge.cls}`}
      >
        {badge.label}
      </button>

      <div className="flex-1" />

      {/* chaos toggle — failure-injection for the diagnosis showcase */}
      <button
        data-testid="chaos-toggle"
        onClick={() => setChaos(!chaos)}
        className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition ${
          chaos ? "border-rose-400/50 text-rose-300 bg-rose-400/10" : "border-indigo-300/10 text-slate-400 hover:text-slate-200"
        }`}
        title="Inject a failure into the next deployment (diagnosis demo)"
      >
        <FlaskConical size={13} />
        chaos {chaos ? "ON" : "off"}
      </button>

      {/* connect gemini (BYOK) */}
      {state.mode === "demo" && (
        <button
          data-testid="connect-gemini"
          onClick={() => dispatch({ type: "KEY_MODAL", payload: true })}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-indigo-300/10 hover:border-emerald-300/30 text-slate-300 transition"
          title="Paste your own Gemini API key for live synthesis"
        >
          <KeyRound size={14} className="text-emerald-300" />
          Connect Gemini
        </button>
      )}

      {/* multimodal import */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="vision-file"
        onChange={(e) => e.target.files?.[0] && onVisionImport(e.target.files[0])}
      />
      <button
        data-testid="vision-import"
        onClick={(e) => (e.shiftKey ? fileRef.current?.click() : onVisionImport(null))}
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-indigo-300/10 hover:border-indigo-300/30 text-slate-300 transition"
        title="Gemini reads a whiteboard photo and rebuilds it on the canvas"
      >
        <Camera size={14} className="text-tele" />
        Import whiteboard
      </button>

      <button
        data-testid="generate-btn"
        onClick={onGenerate}
        disabled={state.generating}
        className="gem-btn flex items-center gap-2 text-sm px-4 py-2 rounded-xl shadow-glow disabled:opacity-60"
      >
        <Sparkles size={15} className={state.generating ? "animate-spin" : ""} />
        {state.generating ? "Gemini thinking…" : "Generate with Gemini"}
      </button>

      <button
        data-testid="deploy-btn"
        onClick={onDeploy}
        disabled={!state.run}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-tele/40 text-tele hover:bg-tele/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <Rocket size={15} />
        Deploy
      </button>

      {state.authConfigured && <UserChip />}
    </header>
  );
}
