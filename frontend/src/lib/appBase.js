/** Vite `base` without trailing slash — e.g. "/projects/cloudpilot" or "" at root. */
export const appBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/** Post-auth redirect target (Clerk sign-out / fallback redirects). */
export const afterAuthUrl = appBase ? `${appBase}/` : "/";

/** API prefix for the edge worker (Pages Functions or portfolio worker). */
export const apiBase = `${appBase}/api/v1`.replace(/\/{2,}/g, "/");
