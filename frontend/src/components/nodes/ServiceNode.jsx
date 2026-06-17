import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import Icon from "../Icon.jsx";

/** Glassmorphism service card — the canvas building block. */
function ServiceNode({ data, selected }) {
  const s = data.service;
  return (
    <div
      data-testid={`node-${s.type}`}
      className={`panel !rounded-xl px-3 py-2.5 min-w-[148px] transition ${
        selected ? "shadow-glow border-tele/50" : "hover:border-indigo-300/30"
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-lg gem-ring grid place-items-center bg-space-900 shrink-0">
          <Icon name={s.icon} size={17} className="text-white" />
        </span>
        <div className="leading-tight min-w-0">
          <div className="text-xs font-bold truncate">{s.label}</div>
          <div className="text-[9px] font-mono text-slate-500 truncate">{s.type}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulseRing" />
        <span className="text-[9px] font-mono text-slate-500">standards-ready</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(ServiceNode);
