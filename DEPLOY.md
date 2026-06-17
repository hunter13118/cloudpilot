# Deploying CloudPilot

**Primary URL:** `https://hunterthemilkman.com/projects/cloudpilot`

CloudPilot ships **inside the portfolio Worker** (`milkman-webapp-portfolio`). The portfolio build runs `scripts/integrate-cloudpilot.mjs`, which builds this repo and copies the UI + edge handlers into the portfolio deploy.

**Clerk + operator setup:** see **[docs/CLERK_SETUP.md](docs/CLERK_SETUP.md)** (step-by-step from zero).

Standalone Cloudflare Pages deploy (this repo only) is still supported for experiments — see sections below.

## The two layers

| Layer | Question | Mechanism |
|---|---|---|
| **Access** | "Are you allowed through the door?" | Clerk gates `/projects/cloudpilot`. Unset → ungated demo. |
| **Capability** | "Can you do real work?" | `demo` (local) · `byok` (your key) · `operator` (shared key, role-gated) |

These are independent: a signed-in visitor still sees the demo until they bring a
key or you grant them the `operator` role.

## 1. Connect the repo (instant demo)

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
pick this repo and use:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/dist` |
| Root directory | `/` (repo root) |

The `/functions` directory at the repo root is auto-detected as Pages Functions.
That's it — the site deploys as a working placeholder demo.

## 2. Turn on login (Clerk)

1. Create a free app at clerk.com. Copy the **Publishable key**.
2. Cloudflare → Pages project → **Settings → Environment variables → Production**:
   add `VITE_CLERK_PUBLISHABLE_KEY = pk_live_…` and redeploy.
3. (Cross-domain) If the tool lives on `cloudpilot.hunterthemilkman.com` and your
   portfolio is `hunterthemilkman.com`, add the tool subdomain as a **satellite
   domain** in Clerk so the session is shared. Portfolio stays public; only this
   app reads the session.

Now `/projects/cloudpilot/` shows a sign-in screen; the rest of your portfolio is untouched.

## 3. Turn on real Gemini

**Operators (you + invited friends) — shared key, never exposed:**

1. Cloudflare → Pages → **Settings → Environment variables** (encrypted):
   - `GEMINI_API_KEY` — from aistudio.google.com (this stays server-side).
   - `CLERK_JWKS_URL` — `https://<your-app>.clerk.accounts.dev/.well-known/jwks.json`
   - `CLERK_ISSUER` *(optional)* — `https://<your-app>.clerk.accounts.dev`
2. In Clerk → **JWT Templates**, create one named **`cloudpilot`** with:
   ```json
   { "role": "{{user.public_metadata.role}}" }
   ```
3. Mark trusted users: Clerk → Users → (user) → **Public metadata** → `{ "role": "operator" }`.

Operators now get live synthesis automatically — the key is used only inside the
edge function after the role is verified, and never reaches the browser.

**Anyone — bring-your-own-key:** click **Connect Gemini** in the top bar and paste
a key. It lives in `sessionStorage` (gone on tab close), is sent as `X-Gemini-Key`
to the edge function, and is never persisted or bundled. When `CLERK_JWKS_URL` is
set on the edge, BYOK also requires a valid Clerk session (Bearer JWT) — the UI
sends both headers automatically after sign-in.

> ⚠️ **You set every secret yourself** in the Cloudflare/Clerk dashboards. Never
> commit a key or put it in `VITE_*` (those ship to the browser).

## What's real vs simulated

- **Real backend path:** `POST /api/v1/architect/generate` → Gemini (BYOK or operator).
- **Simulated client-side (every mode):** the Flight Deck deploy/diagnose/retry
  loop and the multimodal whiteboard import. These are portfolio theater; wiring
  them to live Cloud Build / Vertex is the documented self-host path (`/backend`).

## Local preview

```bash
cd frontend && npm install && npm run dev      # demo mode at :5173 (no edge fn)

# Full stack: Vite + Pages Functions (BYOK / Clerk / operator paths)
npm run dev:edge                               # from repo root; needs .dev.vars
```

`dev:edge` runs Vite behind `wrangler pages dev` so `/api/v1/*` hits the same
edge functions as production. Copy `.dev.vars.example` → `.dev.vars` and fill in
your Clerk JWKS URL + Gemini key for operator/BYOK testing.
