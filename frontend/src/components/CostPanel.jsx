import { useMission } from "../store.jsx";

export default function CostPanel() {
  const [state] = useMission();
  if (!state.run) {
    return <p className="p-6 text-xs text-slate-500 font-mono" data-testid="cost-idle">Cost projections appear after generation.</p>;
  }
  const { cost_estimate } = state.run;
  const maxLine = Math.max(...cost_estimate.breakdown.map((b) => b.usd), 1);

  return (
    <div className="p-4 space-y-4" data-testid="cost-panel">
      <div>
        <div className="text-[10px] font-mono tracking-[0.25em] text-slate-500">PROJECTED MONTHLY</div>
        <div className="text-3xl font-bold font-mono mt-1" data-testid="cost-total">
          ${cost_estimate.monthly_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      <ul className="space-y-2">
        {cost_estimate.breakdown.map((b, i) => (
          <li key={i} className="text-[11px] font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">{b.service}</span>
              <span className="text-slate-400">${b.usd.toFixed(2)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-space-700 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(b.usd / maxLine) * 100}%`, background: "var(--gem-gradient)" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
