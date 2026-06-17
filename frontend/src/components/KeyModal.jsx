import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, X } from "lucide-react";
import { useMission } from "../store.jsx";

/**
 * Bring-your-own-key entry. The key is held in sessionStorage only (cleared on
 * tab close) and sent as X-Gemini-Key to the Pages Function proxy — it is never
 * persisted long-term and never bundled in the app. Operators get a server-side
 * shared key automatically and don't need this.
 */
export default function KeyModal({ onSave }) {
  const [state, dispatch] = useMission();
  const [val, setVal] = useState("");
  const [show, setShow] = useState(false);
  if (!state.keyModalOpen) return null;

  const close = () => dispatch({ type: "KEY_MODAL", payload: false });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-space-950/80 backdrop-blur-sm p-6" data-testid="key-modal">
      <div className="panel gem-ring w-full max-w-md overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-indigo-300/10">
          <span className="w-9 h-9 rounded-xl gem-ring grid place-items-center bg-space-900">
            <KeyRound size={16} className="gem-text" />
          </span>
          <div>
            <h2 className="font-bold text-sm">Connect Gemini</h2>
            <p className="text-[10px] font-mono text-slate-500">paste your key for live synthesis this session</p>
          </div>
          <button onClick={close} className="ml-auto text-slate-500 hover:text-white transition" data-testid="key-close">
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {state.role === "operator" && (
            <div className="panel !rounded-xl p-3 text-[11px] text-emerald-300 border-l-2 !border-l-emerald-400 flex gap-2">
              <ShieldCheck size={14} className="shrink-0" />
              You have operator access — live synthesis already runs via the shared server key. A personal key is optional.
            </div>
          )}

          <label className="block">
            <span className="text-[10px] font-mono tracking-[0.2em] text-slate-500">GEMINI API KEY</span>
            <div className="mt-1.5 flex items-center gap-2 bg-space-800 rounded-lg px-3 py-2 border border-indigo-300/10">
              <input
                data-testid="key-input"
                type={show ? "text" : "password"}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="AIza…"
                className="bg-transparent outline-none text-sm w-full font-mono placeholder:text-slate-600"
                autoComplete="off"
              />
              <button onClick={() => setShow(!show)} className="text-slate-500 hover:text-slate-300">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            Stored in this browser tab only (sessionStorage), proxied through the CloudPilot edge function — never
            saved to the app or shared. Get a key at aistudio.google.com.
          </p>
        </div>

        <footer className="px-5 py-4 border-t border-indigo-300/10 flex justify-between gap-3">
          {state.byokKey ? (
            <button onClick={() => onSave(null)} className="text-xs px-4 py-2 rounded-xl border border-rose-400/30 text-rose-300 hover:bg-rose-400/10 transition" data-testid="key-clear">
              Clear key
            </button>
          ) : (
            <button onClick={close} className="text-xs px-4 py-2 rounded-xl border border-indigo-300/10 text-slate-400 hover:text-white transition">
              Stay in demo
            </button>
          )}
          <button
            onClick={() => val.trim() && onSave(val.trim())}
            disabled={!val.trim()}
            className="gem-btn flex items-center gap-2 text-xs px-4 py-2 rounded-xl shadow-glow disabled:opacity-50"
            data-testid="key-save"
          >
            <KeyRound size={13} />
            Use this key
          </button>
        </footer>
      </div>
    </div>
  );
}
