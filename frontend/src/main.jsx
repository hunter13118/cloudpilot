import React from "react";
import ReactDOM from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { MissionProvider } from "./store.jsx";
import { afterAuthUrl } from "./lib/appBase.js";
import "@xyflow/react/dist/style.css";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const tree = (
  <MissionProvider>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </MissionProvider>
);

// Only mount ClerkProvider when a key is present, so the app still builds and
// runs (ungated demo) on a fresh Cloudflare deploy with no env configured.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl={afterAuthUrl}
        signInFallbackRedirectUrl={afterAuthUrl}
        signUpFallbackRedirectUrl={afterAuthUrl}
      >
        {tree}
      </ClerkProvider>
    ) : (
      tree
    )}
  </React.StrictMode>
);
