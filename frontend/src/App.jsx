// ──────────────────────────────────────────────────────────────────────────
// Access gate (Layer 1). Two orthogonal concerns live here vs Workspace:
//   • App decides "are you allowed through the door?" (Clerk auth)
//   • Workspace decides "can you do real work?" (capability: demo|byok|operator)
//
// If VITE_CLERK_PUBLISHABLE_KEY is unset, auth is disabled and the app runs
// ungated in demo mode — so a fresh Cloudflare deploy "just works" before you
// ever configure Clerk. Wire the key and it becomes a real login gate.
// ──────────────────────────────────────────────────────────────────────────
import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import { useCallback } from "react";
import SignInLanding from "./components/SignInLanding.jsx";
import Workspace from "./Workspace.jsx";

const AUTH_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function App() {
  if (!AUTH_ENABLED) {
    // No Clerk configured → open demo, no gate.
    return <Workspace authConfigured={false} role="guest" getToken={async () => null} />;
  }
  return (
    <>
      <SignedOut>
        <SignInLanding />
      </SignedOut>
      <SignedIn>
        <AuthedWorkspace />
      </SignedIn>
    </>
  );
}

function AuthedWorkspace() {
  const { user } = useUser();
  const { getToken: clerkGetToken } = useAuth();
  const role = user?.publicMetadata?.role === "operator" ? "operator" : "guest";
  // Prefer a custom "cloudpilot" JWT template (carries the role claim for the
  // Pages Function); fall back to the default session token.
  const getToken = useCallback(async () => {
    try {
      const t = await clerkGetToken({ template: "cloudpilot" });
      if (t) return t;
    } catch {
      /* template not configured yet */
    }
    return clerkGetToken();
  }, [clerkGetToken]);
  return <Workspace authConfigured role={role} getToken={getToken} clerkGetToken={clerkGetToken} />;
}
