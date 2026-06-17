import { BookMarked, RefreshCcw, Stethoscope, X } from "lucide-react";
import { useMission } from "../store.jsx";

/** Gemini's incident room: root cause, evidence, and a ready-to-apply patch. */
export default function DiagnosisModal({ onRetry }) {
  const [state, dispatch] = useMission();
  if (!state.diagnosisOpen || !state.diagnosis) return null;
  const d = state.diagnosis;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-space-950/80 backdrop-blur-sm p-6" data-testid="diagnosis-modal">
      <div className="panel gem-ring w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-indigo-300/10">
          <span className="w-9 h-9 rounded-xl gem-ring grid place-items-center bg-space-900">
            <Stethoscope size={16} className="gem-text" />
          </span>
          <div>
            <h2 className="font-bold text-sm">Gemini Diagnosis</h2>
            <p className="text-[10px] font-mono text-slate-500">
              full build log + audit trail + standards corpus · one context window
            </p>
          </div>
          <span className="ml-auto text-[10px] font-mono px-2 py-1 rounded-full border border-violet-300/40 text-violet-300" data-testid="diagnosis-confidence">
            {Math.round(d.root_cause.confidence * 100)}% confidence
          </span>
          <button onClick={() => dispatch({ type: "DIAGNOSIS_CLOSE" })} className="text-slate-500 hover:text-white transition" data-testid="diagnosis-close">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* root cause */}
          <section className="panel !rounded-xl p-4 border-l-2 !border-l-rose-400">
            <h3 className="text-sm font-bold text-rose-300" data-testid="root-cause-title">{d.root_cause.title}</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{d.root_cause.detail}</p>
          </section>

          {/* evidence */}
          <section>
            <h4 className="text-[10px] tracking-[0.25em] font-mono text-slate-500 mb-2">EVIDENCE · BUILD LOG</h4>
            <div className="panel !rounded-xl p-3 bg-space-950/70" data-testid="log-excerpt">
              {d.root_cause.log_excerpt.map((l, i) => (
                <div key={i} className={`log-line ${l.includes("Error") ? "text-rose-300" : "text-slate-500"}`}>{l}</div>
              ))}
            </div>
          </section>

          {/* patch */}
          <section>
            <h4 className="text-[10px] tracking-[0.25em] font-mono text-slate-500 mb-2">
              PROPOSED PATCH · <span className="text-tele">{d.patch.file}</span>
            </h4>
            <div className="panel !rounded-xl overflow-hidden" data-testid="patch-diff">
              {d.patch.diff.map((h, i) => (
                <div key={i} className={`log-line px-3 ${h.type === "add" ? "diff-add" : h.type === "del" ? "diff-del" : "diff-ctx"}`}>
                  {h.type === "add" ? "+ " : h.type === "del" ? "− " : "  "}
                  {h.text}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{d.patch.explanation}</p>
          </section>

          {/* grounded references */}
          <section className="flex flex-wrap gap-2">
            {d.references.map((r) => (
              <span key={r.standard} className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full border border-indigo-300/20 text-slate-400">
                <BookMarked size={11} className="text-violet-300" />
                {r.standard} · {r.title}
              </span>
            ))}
          </section>
        </div>

        <footer className="px-5 py-4 border-t border-indigo-300/10 flex justify-end gap-3">
          <button onClick={() => dispatch({ type: "DIAGNOSIS_CLOSE" })} className="text-xs px-4 py-2 rounded-xl border border-indigo-300/10 text-slate-400 hover:text-white transition">
            Dismiss
          </button>
          <button onClick={onRetry} className="gem-btn flex items-center gap-2 text-xs px-4 py-2 rounded-xl shadow-glow" data-testid="apply-retry-btn">
            <RefreshCcw size={13} />
            Apply fix & retry
          </button>
        </footer>
      </div>
    </div>
  );
}
