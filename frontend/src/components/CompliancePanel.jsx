import { AlertTriangle, CheckCircle2, ShieldAlert, Wand2 } from "lucide-react";
import { useMission } from "../store.jsx";

const SEV = {
  PASS: { icon: CheckCircle2, cls: "text-emerald-300", chip: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
  WARN: { icon: AlertTriangle, cls: "text-amber-300", chip: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  BLOCK: { icon: ShieldAlert, cls: "text-rose-300", chip: "border-rose-400/40 bg-rose-400/10 text-rose-300" },
};

export default function CompliancePanel() {
  const [state] = useMission();
  if (!state.run) {
    return <p className="p-6 text-xs text-slate-500 font-mono" data-testid="compliance-idle">Run a generation to audit the design against 147 enterprise standards.</p>;
  }
  const { compliance } = state.run;
  const ring = compliance.score >= 90 ? "text-emerald-300" : compliance.score >= 70 ? "text-amber-300" : "text-rose-300";

  return (
    <div className="p-4 space-y-3" data-testid="compliance-panel">
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-bold font-mono ${ring}`} data-testid="compliance-score">
          {compliance.score}
        </div>
        <div className="text-xs text-slate-400">
          <div className="font-semibold text-slate-200">Standards alignment</div>
          grounded via Discovery Engine · {compliance.findings.length} findings
        </div>
      </div>

      <ul className="space-y-2">
        {compliance.findings.map((f) => {
          const S = SEV[f.severity];
          return (
            <li key={f.id} className="panel !rounded-xl p-3" data-testid={`finding-${f.id}`}>
              <div className="flex items-center gap-2">
                <S.icon size={14} className={S.cls} />
                <span className="text-xs font-semibold flex-1">{f.title}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${S.chip}`}>{f.severity}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{f.detail}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-mono text-slate-600">{f.standard}</span>
                {f.autofix && (
                  <button className="flex items-center gap-1 text-[10px] font-mono text-violet-300 hover:text-white transition" data-testid={`autofix-${f.id}`}>
                    <Wand2 size={11} />
                    Gemini autofix
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
