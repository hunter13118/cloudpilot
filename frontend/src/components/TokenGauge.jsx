// The 2M-token flex: a radial gauge showing how much of the enterprise
// Gemini ingested in a single pass. This is the "only Gemini can do this" widget.
export default function TokenGauge({ used, max, sources }) {
  const pct = Math.min(used / max, 1);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-4" data-testid="token-gauge">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(120,140,255,0.12)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="url(#gem-edge-gradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-mono font-bold text-lg leading-none">{(used / 1e6).toFixed(2)}M</div>
            <div className="text-[9px] font-mono text-slate-500 mt-1">of {(max / 1e6).toFixed(0)}M tokens</div>
          </div>
        </div>
      </div>

      <ul className="space-y-1.5 min-w-0 flex-1">
        {sources.map((s) => (
          <li key={s.name} className="text-[10px] font-mono flex justify-between gap-2">
            <span className="text-slate-400 truncate">{s.name}</span>
            <span className="text-tele shrink-0">{(s.tokens / 1000).toFixed(0)}k</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
