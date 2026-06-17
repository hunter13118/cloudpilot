import { useEffect } from "react";
import { useMission } from "../store.jsx";

const KIND = {
  ok: "border-emerald-400/40 text-emerald-200",
  warn: "border-amber-400/40 text-amber-200",
  error: "border-rose-400/40 text-rose-200",
};

export default function Toast() {
  const [state, dispatch] = useMission();

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "TOAST", payload: null }), 5000);
    return () => clearTimeout(t);
  }, [state.toast, dispatch]);

  if (!state.toast) return null;
  return (
    <div
      data-testid="toast"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 panel px-4 py-2.5 text-xs animate-rise border ${KIND[state.toast.kind] ?? KIND.ok}`}
    >
      {state.toast.text}
    </div>
  );
}
