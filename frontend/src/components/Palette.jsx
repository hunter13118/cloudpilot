import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Icon from "./Icon.jsx";
import { api } from "../services/api.js";
import { FALLBACK_CATALOG } from "../data/fallbackCatalog.js";

const TIER_COLOR = {
  serverless: "text-tele border-tele/30",
  managed: "text-violet-300 border-violet-300/30",
  iaas: "text-amber-300 border-amber-300/30",
};

export default function Palette({ onAdd }) {
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.catalog().then(setCatalog).catch(() => {});
  }, []);

  const categories = useMemo(() => {
    if (!q) return catalog.categories;
    const needle = q.toLowerCase();
    return catalog.categories
      .map((c) => ({ ...c, services: c.services.filter((s) => s.label.toLowerCase().includes(needle)) }))
      .filter((c) => c.services.length);
  }, [catalog, q]);

  return (
    <aside className="panel w-60 shrink-0 flex flex-col min-h-0" data-testid="palette">
      <div className="p-3 border-b border-indigo-300/10">
        <div className="text-[10px] tracking-[0.25em] text-slate-400 font-mono mb-2">SERVICE CATALOG</div>
        <label className="flex items-center gap-2 bg-space-800 rounded-lg px-2.5 py-1.5 border border-indigo-300/10">
          <Search size={13} className="text-slate-500" />
          <input
            data-testid="palette-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search GCP services…"
            className="bg-transparent outline-none text-xs w-full placeholder:text-slate-600"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((cat) => (
          <section key={cat.id} data-testid={`palette-cat-${cat.id}`}>
            <h3 className="text-[10px] font-mono tracking-[0.2em] text-slate-500 mb-2">{cat.name.toUpperCase()}</h3>
            <div className="space-y-1.5">
              {cat.services.map((s) => (
                <button
                  key={s.type}
                  data-testid={`palette-item-${s.type}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/cloudpilot", JSON.stringify(s));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onAdd(s)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-indigo-300/10 bg-space-800/60 hover:border-indigo-300/30 hover:bg-space-700/70 hover:shadow-glow transition group text-left cursor-grab active:cursor-grabbing"
                  title={`${s.blurb} — click or drag to canvas`}
                >
                  <span className="w-7 h-7 rounded-lg gem-ring grid place-items-center bg-space-900 shrink-0">
                    <Icon name={s.icon} size={14} className="text-slate-200 group-hover:text-white" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold truncate">{s.label}</span>
                    <span className={`inline-block text-[9px] font-mono px-1 rounded border ${TIER_COLOR[s.tier] ?? "text-slate-400 border-slate-500/30"}`}>
                      {s.tier || "svc"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
