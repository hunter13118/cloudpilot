import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useMission } from "../store.jsx";
import TokenGauge from "./TokenGauge.jsx";

const PHASE_COLOR = {
  INGEST: "text-tele border-tele/40",
  PARSE: "text-sky-300 border-sky-300/40",
  GROUND: "text-violet-300 border-violet-300/40",
  DESIGN: "text-fuchsia-300 border-fuchsia-300/40",
  VERIFY: "text-emerald-300 border-emerald-300/40",
  EMIT: "text-amber-300 border-amber-300/40",
};

export default function CopilotPanel() {
  const [state] = useMission();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.reasoningCursor]);

  if (!state.run && !state.generating) {
    return (
      <div className="h-full grid place-items-center p-6 text-center" data-testid="copilot-idle">
        <div>
          <Sparkles className="mx-auto mb-3 text-slate-600" size={28} />
          <p className="text-sm text-slate-400">Gemini is on standby.</p>
          <p className="text-xs text-slate-600 mt-1 font-mono">
            Draw an architecture, then Generate — the full standards corpus, org policies and live Terraform state ride along in one 2M-token pass.
          </p>
        </div>
      </div>
    );
  }

  if (state.generating) {
    return (
      <div className="h-full grid place-items-center" data-testid="copilot-loading">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full gem-ring grid place-items-center animate-pulse">
            <Sparkles size={18} className="gem-text" />
          </div>
          <p className="text-xs font-mono text-slate-400 mt-3 animate-pulse">streaming context to gemini-2.5-pro…</p>
        </div>
      </div>
    );
  }

  const { run } = state;
  const visible = run.reasoning.slice(0, state.reasoningCursor);

  return (
    <div className="p-4 space-y-4" data-testid="copilot-panel">
      <div>
        <h3 className="text-[10px] font-mono tracking-[0.25em] text-slate-500 mb-3">CONTEXT WINDOW · SINGLE PASS</h3>
        <TokenGauge used={run.context_window.used} max={run.context_window.max} sources={run.context_window.sources} />
      </div>

      <div>
        <h3 className="text-[10px] font-mono tracking-[0.25em] text-slate-500 mb-2">
          REASONING TRACE · <span className="gem-text">{run.model}</span>
        </h3>
        <ol className="space-y-2" data-testid="reasoning-stream">
          {visible.map((line, i) => (
            <li key={i} className="log-line flex gap-2 items-start">
              <span className={`shrink-0 text-[9px] border rounded px-1 mt-0.5 ${PHASE_COLOR[line.phase] ?? "text-slate-400 border-slate-500/40"}`}>
                {line.phase}
              </span>
              <span className="text-slate-300">{line.text}</span>
            </li>
          ))}
          {state.reasoningCursor < run.reasoning.length && (
            <li className="log-line text-slate-500 animate-pulse">▋</li>
          )}
        </ol>
        <div ref={endRef} />
      </div>

      {state.reasoningCursor >= run.reasoning.length && (
        <div className="panel !rounded-xl p-3 text-xs text-slate-300 border-l-2 !border-l-violet-400" data-testid="run-summary">
          {run.summary}
        </div>
      )}
    </div>
  );
}
