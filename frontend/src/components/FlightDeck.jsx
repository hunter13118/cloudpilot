import { CheckCircle2, ChevronDown, ChevronUp, CircleDashed, Loader2, Satellite, Stethoscope, XCircle } from "lucide-react";
import { useMission } from "../store.jsx";

const PHASES = ["PREFLIGHT", "IGNITION", "ASCENT", "ORBIT"];

const STEP_ICON = {
  pending: { C: CircleDashed, cls: "text-slate-600" },
  running: { C: Loader2, cls: "text-tele animate-spin" },
  success: { C: CheckCircle2, cls: "text-emerald-300" },
  failed: { C: XCircle, cls: "text-rose-400" },
};

/** Aviation-style progressive deployment tracker. */
export default function FlightDeck({ onDiagnose, onRetry }) {
  const [state, dispatch] = useMission();
  const dep = state.deployment;
  if (!dep) return null;

  const failedStep = dep.steps.find((s) => s.status === "failed");
  const inOrbit = dep.progress >= 100 && !failedStep;

  return (
    <section
      className={`panel shrink-0 transition-all ${state.deckOpen ? "max-h-72" : "max-h-12"} overflow-hidden`}
      data-testid="flight-deck"
    >
      {/* header strip */}
      <button
        className="w-full flex items-center gap-3 px-4 h-12"
        onClick={() => dispatch({ type: "DECK", payload: !state.deckOpen })}
        data-testid="deck-toggle"
      >
        <Satellite size={15} className={inOrbit ? "text-emerald-300" : failedStep ? "text-rose-400" : "text-tele"} />
        <span className="text-[10px] tracking-[0.25em] font-mono text-slate-400">FLIGHT DECK</span>

        <div className="flex items-center gap-2 ml-2">
          {PHASES.map((p, i) => {
            const active = dep.phase === p;
            const passed = PHASES.indexOf(dep.phase) > i || inOrbit;
            return (
              <span key={p} className="flex items-center gap-2">
                <span
                  data-testid={`phase-${p}`}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition ${
                    active && failedStep
                      ? "border-rose-400/60 text-rose-300 bg-rose-400/10"
                      : active
                        ? "border-tele/60 text-tele bg-tele/10 shadow-glow"
                        : passed
                          ? "border-emerald-400/40 text-emerald-300"
                          : "border-slate-600/40 text-slate-600"
                  }`}
                >
                  {p}
                </span>
                {i < PHASES.length - 1 && <span className="w-4 h-px bg-slate-700" />}
              </span>
            );
          })}
        </div>

        <div className="flex-1 mx-3 h-1.5 rounded-full bg-space-700 overflow-hidden">
          <div
            data-testid="deck-progress"
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dep.progress}%`,
              background: failedStep ? "#f87171" : "var(--gem-gradient)",
            }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 w-10 text-right">{dep.progress}%</span>
        {state.deckOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
      </button>

      {/* expanded: steps + telemetry */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-4">
        <ol className="space-y-1.5" data-testid="deck-steps">
          {dep.steps.map((s) => {
            const I = STEP_ICON[s.status];
            return (
              <li key={s.id} className="flex items-center gap-2 text-[11px] font-mono" data-testid={`step-${s.id}`} data-status={s.status}>
                <I.C size={13} className={I.cls} />
                <span className={s.status === "failed" ? "text-rose-300" : s.status === "pending" ? "text-slate-600" : "text-slate-300"}>
                  {s.name}
                </span>
                {s.duration_ms && <span className="text-slate-600 ml-auto">{(s.duration_ms / 1000).toFixed(1)}s</span>}
                {s.status === "failed" && (
                  <button
                    data-testid="diagnose-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDiagnose(s.id);
                    }}
                    className="ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-rose-400/50 text-rose-300 hover:bg-rose-400/10 transition animate-pulseRing"
                  >
                    <Stethoscope size={11} />
                    Diagnose with Gemini
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <div className="panel !rounded-xl p-3 overflow-y-auto max-h-48" data-testid="deck-log">
          <div className="text-[9px] tracking-[0.25em] font-mono text-slate-600 mb-2">TELEMETRY</div>
          {dep.log_tail.map((l, i) => (
            <div key={i} className="log-line text-slate-400">{l}</div>
          ))}
          {inOrbit && (
            <div className="log-line text-emerald-300 mt-1" data-testid="orbit-confirmed">
              ◉ ORBIT CONFIRMED — architecture live in {state.project.project_id}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
