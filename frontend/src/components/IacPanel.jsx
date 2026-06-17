import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useMission } from "../store.jsx";
import CodeBlock from "./CodeBlock.jsx";

export default function IacPanel() {
  const [state] = useMission();
  const [copied, setCopied] = useState(false);

  if (!state.run) {
    return <p className="p-6 text-xs text-slate-500 font-mono" data-testid="iac-idle">Generated Terraform will land here, annotated and standards-compliant.</p>;
  }

  const file = state.run.iac.files[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full" data-testid="iac-panel">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-300/10">
        <span className="text-[11px] font-mono text-tele">{file.path}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white transition" data-testid="iac-copy">
          {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <CodeBlock code={file.content} data-testid="iac-code" />
      </div>
    </div>
  );
}
