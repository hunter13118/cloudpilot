# Deploying CloudPilot to Cloudflare Pages

CloudPilot is built to land on the **Cloudflare Pages free plan** and *just work*
the moment you connect the repo — it boots as a fully interactive **demo** with
no backend, no keys, and no login. You then layer on auth and real Gemini calls
when you're ready.

## The two layers

| Layer | Question | Mechanism |
|---|---|---|
| **Access** | "Are you allowed through the door?" | Clerk gates `/project`. Unset → ungated demo. |
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

Now `/project` shows a sign-in screen; the rest of your portfolio is untouched.

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
to the edge function, and is never persisted or bundled.

> ⚠️ **You set every secret yourself** in the Cloudflare/Clerk dashboards. Never
> commit a key or put it in `VITE_*` (those ship to the browser).

## What's real vs simulated

- **Real backend path:** `POST /api/v1/architect/generate` → Gemini (BYOK or operator).
- **Simulated client-side (every mode):** the Flight Deck deploy/diagnose/retry
  loop and the multimodal whiteboard import. These are portfolio theater; wiring
  them to live Cloud Build / Vertex is the documented self-host path (`/backend`).

## Local preview

```bash
cd frontend && npm install && npm run dev      # demo mode at :5173
# real edge functions locally:
npx wrangler pages dev frontend/dist --compatibility-date=2026-06-01
```
