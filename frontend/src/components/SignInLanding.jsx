import { SignInButton } from "@clerk/clerk-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { afterAuthUrl } from "../lib/appBase.js";

/**
 * Shown when Clerk is configured and the visitor is signed out.
 * The portfolio itself is free; this is the gate in front of the /project tool.
 */
export default function SignInLanding() {
  return (
    <div className="h-full grid place-items-center p-6" data-testid="signin-landing">
      <div className="panel gem-ring max-w-lg w-full p-8 text-center animate-rise">
        <div className="w-14 h-14 mx-auto rounded-2xl gem-ring grid place-items-center bg-space-800 mb-5">
          <svg viewBox="0 0 32 32" className="w-8 h-8">
            <defs>
              <linearGradient id="land-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#4285F4" />
                <stop offset=".5" stopColor="#9B72CB" />
                <stop offset="1" stopColor="#D96570" />
              </linearGradient>
            </defs>
            <path d="M16 2l9 14-9 14L7 16z" fill="url(#land-g)" />
          </svg>
        </div>
        <div className="text-[10px] tracking-[0.28em] text-slate-400 font-mono">MILKMAN ENTERPRISE</div>
        <h1 className="text-2xl font-bold mt-1">
          Cloud<span className="gem-text">Pilot</span>
        </h1>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          Visual-to-Cloud mission control, powered by Gemini. The rest of the portfolio is open —
          this tool asks you to sign in first.
        </p>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          Sign in for the interactive demo. Paste your own Gemini key for live synthesis, or ask for operator access.
        </p>

        <SignInButton mode="redirect" forceRedirectUrl={afterAuthUrl()} signUpForceRedirectUrl={afterAuthUrl()}>
          <button className="gem-btn mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-glow" data-testid="signin-btn">
            <Sparkles size={15} />
            Sign in to enter
            <ArrowRight size={15} />
          </button>
        </SignInButton>

        <p className="text-[10px] text-slate-600 mt-5 font-mono">
          Just browsing the portfolio? You don't need an account for that — only the live tool is gated.
        </p>
      </div>
    </div>
  );
}
