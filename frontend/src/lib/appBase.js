/** Vite `base` without trailing slash — e.g. "/projects/cloudpilot" or "" at root. */
export const appBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/** Post-auth redirect target — must be absolute for iOS Safari + Clerk. */
export function afterAuthUrl() {
  const path = import.meta.env.BASE_URL || "/";
  if (typeof window === "undefined") return path.endsWith("/") ? path : `${path}/`;
  return new URL(path, window.location.origin).href;
}

/** API prefix for the edge worker (Pages Functions or portfolio worker). */
export const apiBase = `${appBase}/api/v1`.replace(/\/{2,}/g, "/");
