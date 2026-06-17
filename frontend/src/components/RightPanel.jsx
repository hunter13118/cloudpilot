import { BadgeCheck, Coins, FileCode2, Sparkles } from "lucide-react";
import { useMission } from "../store.jsx";
import CopilotPanel from "./CopilotPanel.jsx";
import CompliancePanel from "./CompliancePanel.jsx";
import IacPanel from "./IacPanel.jsx";
import CostPanel from "./CostPanel.jsx";

const TABS = [
  { id: "copilot", label: "Copilot", icon: Sparkles },
  { id: "compliance", label: "Compliance", icon: BadgeCheck },
  { id: "iac", label: "IaC", icon: FileCode2 },
  { id: "cost", label: "Cost", icon: Coins },
];

export default function RightPanel() {
  const [state, dispatch] = useMission();

  return (
    <aside className="panel w-[380px] shrink-0 flex flex-col min-h-0" data-testid="right-panel">
      <nav className="flex p-1.5 gap-1 border-b border-indigo-300/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => dispatch({ type: "TAB", payload: t.id })}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl transition ${
              state.rightTab === t.id ? "bg-space-700 text-white shadow-glow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {state.rightTab === "copilot" && <CopilotPanel />}
        {state.rightTab === "compliance" && <CompliancePanel />}
        {state.rightTab === "iac" && <IacPanel />}
        {state.rightTab === "cost" && <CostPanel />}
      </div>
    </aside>
  );
}
